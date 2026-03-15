import type { FastifyInstance } from 'fastify';

export interface NotificationEvent {
  type: 'notification';
  title: string;
  body: string;
  category: 'cron' | 'approval' | 'task' | 'message' | 'agent';
  timestamp: string;
  actionUrl?: string;
}

export function emitNotification(fastify: FastifyInstance, event: Omit<NotificationEvent, 'type' | 'timestamp'>) {
  const full: NotificationEvent = {
    type: 'notification',
    timestamp: new Date().toISOString(),
    ...event,
  };
  (fastify as any).eventBus?.emit('notification', full);
}

export async function notificationRoutes(fastify: FastifyInstance) {
  fastify.get('/api/notifications/stream', async (request, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    reply.raw.write('data: {"type":"connected"}\n\n');

    const handler = (data: NotificationEvent) => {
      try {
        reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch { /* Client disconnected */ }
    };

    const eventBus = (fastify as any).eventBus;
    if (eventBus) {
      eventBus.on('notification', handler);
    }

    const heartbeat = setInterval(() => {
      try { reply.raw.write(': heartbeat\n\n'); }
      catch { clearInterval(heartbeat); }
    }, 30000);

    request.raw.on('close', () => {
      clearInterval(heartbeat);
      if (eventBus) eventBus.removeListener('notification', handler);
    });
  });
}
