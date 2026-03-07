import { eq } from 'drizzle-orm';
import { users } from '../db/schema.js';
import type { Db } from '../db/connection.js';

export class UserService {
  constructor(private db: Db) {}

  async getByClerkId(clerkId: string) {
    const [user] = await this.db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
    return user ?? null;
  }

  async getById(id: string) {
    const [user] = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return user ?? null;
  }
}
