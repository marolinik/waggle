import type { FastifyInstance } from 'fastify';
import { queueJobSchema } from '@waggle/shared';

export async function jobRoutes(fastify: FastifyInstance) {
  // POST /api/jobs - queue a new job
  fastify.post('/api/jobs', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const parsed = queueJobSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const job = await fastify.jobService.createJob(
      parsed.data.teamId ?? '',
      request.userId,
      parsed.data.jobType,
      parsed.data.input,
    );
    return reply.code(202).send({ jobId: job.id, status: job.status });
  });

  // GET /api/jobs/:id - get job status
  fastify.get('/api/jobs/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const job = await fastify.jobService.getJob(id);
    if (!job) return reply.code(404).send({ error: 'Job not found' });
    return job;
  });
}
