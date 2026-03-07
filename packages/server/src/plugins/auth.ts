import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createClerkClient } from '@clerk/fastify';

declare module 'fastify' {
  interface FastifyRequest {
    userId: string; // our internal user UUID
    clerkId: string;
  }
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(async function authPlugin(fastify: FastifyInstance) {
  const clerk = createClerkClient({ secretKey: fastify.config.clerkSecretKey });

  fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return reply.code(401).send({ error: 'Missing authorization token' });
    }

    try {
      const payload = await clerk.verifyToken(token);
      request.clerkId = payload.sub;

      // Look up internal user
      const { users } = await import('../db/schema.js');
      const { eq } = await import('drizzle-orm');
      const [user] = await fastify.db.select().from(users).where(eq(users.clerkId, payload.sub)).limit(1);

      if (!user) {
        return reply.code(401).send({ error: 'User not found. Please complete onboarding.' });
      }

      request.userId = user.id;
    } catch {
      return reply.code(401).send({ error: 'Invalid token' });
    }
  });
});
