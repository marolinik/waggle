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
  ToolResultRenderer,
  ApprovalGate,
  getToolStatusColor,
  formatDuration,
} from './components/chat/index.js';
export type {
  ChatAreaProps,
  ChatMessageProps,
  ChatInputProps,
  ToolCardProps,
  ToolResultRendererProps,
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

// Components — settings
export {
  SettingsPanel,
  ApiKeySection,
  ModelSection,
  PermissionSection,
  ThemeSection,
  AdvancedSection,
  maskApiKey,
  getProviderDisplayName,
  getProviderKeyPrefix,
  getCostTier,
  getSpeedTier,
  validateProviderConfig,
  mergeGates,
  SUPPORTED_PROVIDERS,
  SETTINGS_TABS,
} from './components/settings/index.js';
export type {
  SettingsPanelProps,
  ApiKeySectionProps,
  ModelSectionProps,
  PermissionSectionProps,
  ThemeSectionProps,
  AdvancedSectionProps,
  MindFileInfo,
  ProviderConfig,
  SettingsTab,
} from './components/settings/index.js';

// Components — onboarding
export {
  OnboardingWizard,
  NameStep,
  ApiKeyStep,
  WorkspaceStep,
  ReadyStep,
  validateName,
  getProviderSignupUrl,
  ONBOARDING_STEPS,
  isStepComplete,
  getNextStep,
  getPrevStep,
  buildConfigFromOnboarding,
} from './components/onboarding/index.js';
export type {
  OnboardingWizardProps,
  NameStepProps,
  ApiKeyStepProps,
  WorkspaceStepProps,
  ReadyStepProps,
  OnboardingData,
  OnboardingStepConfig,
} from './components/onboarding/index.js';

// Components — memory
export {
  MemoryBrowser,
  FrameTimeline,
  FrameDetail,
  MemorySearch,
  getFrameTypeIcon,
  getFrameTypeLabel,
  getImportanceBadge,
  truncateContent,
  formatTimestamp,
  FRAME_TYPES,
  filterFrames,
  sortFrames,
  KGViewer,
  getNodeColor,
  getNodeSize,
  filterGraph,
  getNeighborhood,
  getNodeTypes,
  getEdgeTypes,
  getNodeDetail,
  layoutForceSimple,
} from './components/memory/index.js';
export type {
  MemoryBrowserProps,
  FrameTimelineProps,
  FrameDetailProps,
  MemorySearchProps,
  FrameFilters,
  MemoryStats,
  FrameTypeOption,
  KGViewerProps,
  KGNode,
  KGEdge,
  KGData,
  KGFilters,
  KGNodeDetail,
} from './components/memory/index.js';

// Components — layout
export { AppShell } from './components/layout/index.js';
export type { AppShellProps } from './components/layout/index.js';

// Hooks
export { useChat, processStreamEvent } from './hooks/useChat.js';
export type { UseChatOptions, UseChatReturn } from './hooks/useChat.js';

export { useWorkspaces } from './hooks/useWorkspaces.js';
export type { UseWorkspacesOptions, UseWorkspacesReturn } from './hooks/useWorkspaces.js';

export { useActiveWorkspace } from './hooks/useActiveWorkspace.js';
export type { UseActiveWorkspaceOptions, UseActiveWorkspaceReturn } from './hooks/useActiveWorkspace.js';

export { useApprovalGate, isExternalMutation } from './hooks/useApprovalGate.js';
export type { UseApprovalGateOptions, UseApprovalGateReturn } from './hooks/useApprovalGate.js';

export { useOnboardingSetup } from './hooks/useOnboardingSetup.js';
export type { UseOnboardingSetupOptions, UseOnboardingSetupReturn } from './hooks/useOnboardingSetup.js';

export { useMemory, executeMemorySearch } from './hooks/useMemory.js';
export type { UseMemoryOptions, UseMemoryReturn, MemorySearchResult, MemorySearchError } from './hooks/useMemory.js';

export { useKnowledgeGraph } from './hooks/useKnowledgeGraph.js';
export type { UseKnowledgeGraphOptions, UseKnowledgeGraphReturn } from './hooks/useKnowledgeGraph.js';
