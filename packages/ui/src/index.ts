// Services — types
export type {
  WaggleService,
  StreamEvent,
  Message,
  ToolUseEvent,
  ToolStatus,
  Workspace,
  WorkspaceContext,
  Session,
  SessionSearchResult,
  FileRegistryEntry,
  Frame,
  AgentStatus,
  WaggleConfig,
  TeamConnection,
  TeamMember,
  ProgressItem,
} from './services/types.js';

// Services — adapters
export { LocalAdapter } from './services/local-adapter.js';
export type { LocalAdapterOptions } from './services/local-adapter.js';

// Components — chat
export {
  ChatArea,
  ChatMessage,
  ChatInput,
  CLIENT_COMMANDS,
  BUILTIN_COMMANDS,
  ToolCard,
  ToolResultRenderer,
  ApprovalGate,
  getToolStatusColor,
  formatDuration,
  FileDropZone,
  categorizeFile,
  isSupported,
  validateFileSize,
  formatDropSummary,
  getDropMessage,
  parseCsvLine,
  parseCsvPreview,
  SUPPORTED_EXTENSIONS,
  MAX_FILE_SIZE,
} from './components/chat/index.js';
export type {
  ChatAreaProps,
  ChatMessageProps,
  ChatInputProps,
  SlashCommand,
  ToolCardProps,
  ToolResultRendererProps,
  ApprovalGateProps,
  FileDropZoneProps,
  DroppedFile,
  FileCategory,
} from './components/chat/index.js';

// Components — workspace
export {
  WorkspaceTree,
  WorkspaceCard,
  GroupHeader,
  CreateWorkspaceDialog,
  TeamPresence,
  getInitials,
  groupWorkspacesByGroup,
  validateWorkspaceForm,
  sortGroups,
  GROUP_ORDER,
  TaskBoard,
  getTaskStatusColor,
  groupTasksByStatus,
  TeamMessages,
  formatRelativeTime,
  MESSAGE_TYPE_COLORS,
} from './components/workspace/index.js';
export type {
  WorkspaceTreeProps,
  WorkspaceCardProps,
  GroupHeaderProps,
  CreateWorkspaceDialogProps,
  TeamPresenceProps,
  TeamInfo,
  TaskBoardProps,
  TeamTask,
  TeamMessagesProps,
  TeamMessage,
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
  KEYBOARD_SHORTCUTS,
  matchesShortcut,
  formatShortcut,
  matchesNamedShortcut,
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
  KeyCombo,
  ShortcutName,
  KeyEventLike,
} from './components/common/index.js';

// Components — settings
export {
  SettingsPanel,
  ApiKeySection,
  ModelSection,
  PermissionSection,
  ThemeSection,
  AdvancedSection,
  SkillsSection,
  maskApiKey,
  getProviderDisplayName,
  getProviderKeyPrefix,
  getCostTier,
  getSpeedTier,
  validateProviderConfig,
  mergeGates,
  SUPPORTED_PROVIDERS,
  SETTINGS_TABS,
  InstallCenter,
} from './components/settings/index.js';
export type {
  SettingsPanelProps,
  ApiKeySectionProps,
  ModelSectionProps,
  PermissionSectionProps,
  ThemeSectionProps,
  AdvancedSectionProps,
  SkillsSectionProps,
  SkillInfo,
  PluginInfo,
  MindFileInfo,
  ProviderConfig,
  SettingsTab,
  InstallCenterProps,
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
  SplashScreen,
  STARTUP_PHASES,
  getPhaseMessage,
  getPhaseProgress,
  isStartupComplete,
  formatProgress,
} from './components/onboarding/index.js';
export type {
  OnboardingWizardProps,
  NameStepProps,
  ApiKeyStepProps,
  WorkspaceStepProps,
  ReadyStepProps,
  OnboardingData,
  OnboardingStepConfig,
  SplashScreenProps,
  StartupPhaseConfig,
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

// Components — events
export {
  EventStream,
  StepCard,
  getStepIcon,
  getStepColor,
  getStepTypeColor,
  formatStepDuration,
  formatStepTimestamp,
  categorizeStep,
  mergeStep,
  STEP_ICONS,
  STEP_COLORS,
  STEP_TYPE_COLORS,
  filterSteps,
  ActivityFeed,
  formatActivityTime,
} from './components/events/index.js';
export type {
  EventStreamProps,
  StepCardProps,
  AgentStep,
  StepFilter,
  ActivityFeedProps,
  ActivityItem,
} from './components/events/index.js';

// Components — sessions
export {
  SessionList,
  SessionCard,
  groupSessionsByTime,
  getTimeGroup,
  TIME_GROUPS,
  formatLastActive,
  generateSessionTitle,
  sortSessions,
  filterSessionsByWorkspace,
} from './components/sessions/index.js';
export type {
  SessionListProps,
  SessionCardProps,
} from './components/sessions/index.js';

// Components — tabs
export {
  createTab,
  reorderTabs,
  MAX_VISIBLE_TABS,
  canAddTab,
  findTabBySession,
  removeTab,
  getNextActiveTab,
  updateTabState,
} from './components/tabs/index.js';
export type { ConversationTab } from './components/tabs/index.js';

// Components — layout
export {
  AppShell,
  BREAKPOINTS,
  getLayoutMode,
  shouldShowSidebar,
  shouldCollapseSidebar,
  getContentMaxWidth,
  getSidebarWidth,
} from './components/layout/index.js';
export type { AppShellProps, LayoutMode } from './components/layout/index.js';

// Components — files
export {
  FilePreview,
  CodePreview,
  DiffViewer,
  ImagePreview,
  getFileIcon,
  getLanguageFromExtension,
  isImageFile,
  isCodeFile,
  computeUnifiedDiff,
  truncateFilePath,
  getFileExtension,
  formatFileSize,
  FILE_ICONS,
  CODE_EXTENSIONS,
  IMAGE_EXTENSIONS,
} from './components/files/index.js';
export type {
  FilePreviewProps,
  CodePreviewProps,
  DiffViewerProps,
  ImagePreviewProps,
  FileEntry,
  DiffEntry,
  DiffViewMode,
  DiffLine,
} from './components/files/index.js';

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

export { useEvents } from './hooks/useEvents.js';
export type { UseEventsOptions, UseEventsReturn } from './hooks/useEvents.js';

export { useSessions } from './hooks/useSessions.js';
export type { UseSessionsOptions, UseSessionsReturn } from './hooks/useSessions.js';

export { useTabs } from './hooks/useTabs.js';
export type { UseTabsOptions, UseTabsReturn } from './hooks/useTabs.js';

export { useTeamPresence } from './hooks/useTeamPresence.js';
export type { UseTeamPresenceOptions, UseTeamPresenceReturn } from './hooks/useTeamPresence.js';

export { useTeamActivity } from './hooks/useTeamActivity.js';
export type { UseTeamActivityOptions, UseTeamActivityReturn } from './hooks/useTeamActivity.js';

export { useNotifications } from './hooks/useNotifications.js';
export type { NotificationEvent, UseNotificationsResult } from './hooks/useNotifications.js';

// Components — notifications
export { ToastContainer } from './components/ToastContainer.js';
export type { Toast } from './components/ToastContainer.js';
