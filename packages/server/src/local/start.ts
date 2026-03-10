import { startService } from './service.js';

const skipLiteLLM = process.argv.includes('--skip-litellm') || process.env.WAGGLE_SKIP_LITELLM === '1';

console.log('Starting Waggle service...', { skipLiteLLM });

startService({ skipLiteLLM })
  .then(({ server, litellm }) => {
    const addr = server.server.address();
    const port = typeof addr === 'object' && addr ? addr.port : '?';
    console.log(`Waggle service running on http://127.0.0.1:${port}`);
    console.log(`LiteLLM: ${litellm.status} (port ${litellm.port})`);
  })
  .catch((err) => {
    console.error('Failed to start Waggle service:', err);
    process.exit(1);
  });
