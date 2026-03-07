import type { FastifyInstance } from 'fastify';
import type { WsClientEvent, WsServerEvent } from '@waggle/shared';
import { ConnectionManager } from './connection-manager.js';
import { teams, messages } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export const connectionManager = new ConnectionManager();

export async function wsGateway(fastify: FastifyInstance) {
  fastify.get('/ws', { websocket: true }, (socket, request) => {
    let userId: string | null = null;
    let teamId: string | null = null;

    socket.on('message', async (raw: Buffer | string) => {
      try {
        const event = JSON.parse(raw.toString()) as WsClientEvent;

        switch (event.type) {
          case 'authenticate': {
            // Simplified auth for pilot: token IS the userId
            // In production: verify Clerk JWT, look up user
            userId = event.token;
            socket.send(JSON.stringify({ type: 'authenticated', userId }));
            break;
          }

          case 'join_team': {
            if (!userId) {
              socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
              return;
            }

            const [team] = await fastify.db
              .select()
              .from(teams)
              .where(eq(teams.slug, event.teamSlug));

            if (!team) {
              socket.send(JSON.stringify({ type: 'error', message: 'Team not found' }));
              return;
            }

            // Leave previous team if any
            if (teamId && userId) {
              connectionManager.remove(teamId, userId);
            }

            teamId = team.id;
            connectionManager.add(teamId, userId, socket);

            // Subscribe to Redis channel for this team
            const channel = `team:${teamId}:waggle`;
            const existingChannels = await fastify.redisSub.call('PUBSUB', 'CHANNELS', channel) as string[];
            // Only subscribe if not already subscribed (redisSub is shared)
            if (!existingChannels || !existingChannels.includes(channel)) {
              await fastify.redisSub.subscribe(channel);
            }

            socket.send(JSON.stringify({ type: 'joined_team', teamSlug: event.teamSlug }));
            break;
          }

          case 'send_message': {
            if (!userId || !teamId) {
              socket.send(JSON.stringify({ type: 'error', message: 'Not in a team' }));
              return;
            }

            // Persist message
            const [msg] = await fastify.db
              .insert(messages)
              .values({
                teamId,
                senderId: userId,
                type: event.messageType,
                subtype: event.subtype,
                content: event.content,
              })
              .returning();

            // Publish to Redis for cross-process delivery
            await fastify.redis.publish(
              `team:${teamId}:waggle`,
              JSON.stringify(msg),
            );
            break;
          }
        }
      } catch {
        socket.send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
      }
    });

    socket.on('close', () => {
      if (teamId && userId) {
        connectionManager.remove(teamId, userId);
      }
    });
  });

  // Forward Redis pub/sub messages to WebSocket clients
  fastify.redisSub.on('message', (channel: string, data: string) => {
    const match = channel.match(/^team:(.+):waggle$/);
    if (!match) return;
    const tId = match[1];
    try {
      const event: WsServerEvent = { type: 'waggle_message', message: JSON.parse(data) };
      connectionManager.broadcast(tId, event);
    } catch {
      // Ignore malformed messages from Redis
    }
  });
}
