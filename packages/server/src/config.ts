export interface ServerConfig {
  port: number;
  host: string;
  databaseUrl: string;
  redisUrl: string;
  clerkSecretKey: string;
  clerkPublishableKey: string;
  corsOrigin: string[];
}

export function loadConfig(): ServerConfig {
  return {
    port: parseInt(process.env.PORT ?? '3100', 10),
    host: process.env.HOST ?? '0.0.0.0',
    databaseUrl: process.env.DATABASE_URL ?? 'postgres://waggle:waggle_dev@localhost:5434/waggle',
    redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6381',
    clerkSecretKey: process.env.CLERK_SECRET_KEY ?? '',
    clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY ?? '',
    corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(','),
  };
}
