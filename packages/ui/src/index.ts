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

// Components — common
export {
  Sidebar,
  Tabs,
  StatusBar,
  Modal,
  ThemeProvider,
  ThemeContext,
  useTheme,
  getSavedTheme,
  toggleThemeValue,
  formatTokenCount,
  formatCost,
} from './components/common/index.js';
export type {
  SidebarProps,
  Tab,
  TabsProps,
  StatusBarProps,
  ModalProps,
  Theme,
  ThemeContextValue,
  ThemeProviderProps,
} from './components/common/index.js';

// Components — layout
export { AppShell } from './components/layout/index.js';
export type { AppShellProps } from './components/layout/index.js';

// Hooks
export { useChat, processStreamEvent } from './hooks/useChat.js';
export type { UseChatOptions, UseChatReturn } from './hooks/useChat.js';

export { useWorkspaces } from './hooks/useWorkspaces.js';
export type { UseWorkspacesOptions, UseWorkspacesReturn } from './hooks/useWorkspaces.js';
