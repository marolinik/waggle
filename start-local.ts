import { startService } from './packages/server/src/local/service.js';

console.log('Starting Waggle service...');

startService({ skipLiteLLM: true })
  .then(({ server, litellm }) => {
    const addr = server.server.address();
    const port = typeof addr === 'object' && addr ? addr.port : '?';
    console.log(`Waggle service running on http://127.0.0.1:${port}`);
    console.log(`LiteLLM: ${litellm.status}`);
  })
  .catch((err) => {
    console.error('Failed to start:', err);
    process.exit(1);
  });
