// Services — types
export type {
  WaggleService,
  StreamEvent,
  Message,
  ToolUseEvent,
  Workspace,
  Session,
  Frame,
  AgentStatus,
  WaggleConfig,
} from './services/types.js';

// Services — adapters
export { LocalAdapter } from './services/local-adapter.js';
export type { LocalAdapterOptions } from './services/local-adapter.js';
