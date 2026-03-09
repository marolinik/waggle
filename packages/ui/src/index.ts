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

// Components — chat
export {
  ChatArea,
  ChatMessage,
  ChatInput,
  ToolCard,
  ApprovalGate,
  getToolStatusColor,
  formatDuration,
} from './components/chat/index.js';
export type {
  ChatAreaProps,
  ChatMessageProps,
  ChatInputProps,
  ToolCardProps,
  ApprovalGateProps,
} from './components/chat/index.js';

// Components — workspace
export {
  WorkspaceTree,
  WorkspaceCard,
  GroupHeader,
  CreateWorkspaceDialog,
  groupWorkspacesByGroup,
  validateWorkspaceForm,
  sortGroups,
  GROUP_ORDER,
} from './components/workspace/index.js';
export type {
  WorkspaceTreeProps,
  WorkspaceCardProps,
  GroupHeaderProps,
  CreateWorkspaceDialogProps,
} from './components/workspace/index.js';

// Hooks
export { useChat, processStreamEvent } from './hooks/useChat.js';
export type { UseChatOptions, UseChatReturn } from './hooks/useChat.js';

export { useWorkspaces } from './hooks/useWorkspaces.js';
export type { UseWorkspacesOptions, UseWorkspacesReturn } from './hooks/useWorkspaces.js';
