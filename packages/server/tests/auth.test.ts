import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { buildServer } from '../src/index.js';
import { users } from '../src/db/schema.js';
import { sql } from 'drizzle-orm';

describe('Clerk webhook', () => {
  let server: Awaited<ReturnType<typeof buildServer>>;

  beforeAll(async () => {
    server = await buildServer();
  });

  afterAll(async () => {
    await server.db.execute(sql`DELETE FROM users WHERE clerk_id LIKE 'test_%'`);
    await server.close();
  });

  it('creates user on user.created webhook', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/webhooks/clerk',
      payload: {
        type: 'user.created',
        data: {
          id: 'test_clerk_001',
          first_name: 'Marko',
          last_name: 'Markovic',
          email_addresses: [{ email_address: 'marko@test.com' }],
          image_url: 'https://example.com/avatar.jpg',
        },
      },
    });
    expect(response.statusCode).toBe(200);

    const [user] = await server.db.select().from(users).where(sql`clerk_id = 'test_clerk_001'`);
    expect(user).toBeDefined();
    expect(user.displayName).toBe('Marko Markovic');
    expect(user.email).toBe('marko@test.com');
  });

  it('updates user on user.updated webhook', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/webhooks/clerk',
      payload: {
        type: 'user.updated',
        data: {
          id: 'test_clerk_001',
          first_name: 'Marko',
          last_name: 'Updated',
          email_addresses: [{ email_address: 'marko@test.com' }],
          image_url: null,
        },
      },
    });
    expect(response.statusCode).toBe(200);

    const [user] = await server.db.select().from(users).where(sql`clerk_id = 'test_clerk_001'`);
    expect(user.displayName).toBe('Marko Updated');
  });

  it('deletes user on user.deleted webhook', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/webhooks/clerk',
      payload: {
        type: 'user.deleted',
        data: {
          id: 'test_clerk_001',
        },
      },
    });
    expect(response.statusCode).toBe(200);

    const result = await server.db.select().from(users).where(sql`clerk_id = 'test_clerk_001'`);
    expect(result).toHaveLength(0);
  });
});
