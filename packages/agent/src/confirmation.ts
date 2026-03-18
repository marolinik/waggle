/**
 * Smart confirmation gates — only block truly destructive operations.
 *
 * Philosophy: read-only and informational commands should flow freely.
 * Only commands that modify state need user approval.
 */

// Tools that ALWAYS need confirmation (they modify state)
const ALWAYS_CONFIRM = new Set(['write_file', 'edit_file', 'git_commit', 'install_capability']);

// Connector action name patterns that indicate write operations
const CONNECTOR_WRITE_PATTERNS = /_(create|update|delete|send|post|transition|remove|add|set|put)_/;

// Bash command patterns that are safe (read-only / informational)
const SAFE_BASH_PATTERNS = [
  /^(date|whoami|hostname|pwd|echo|printenv|env|uname|id|uptime)\b/,
  /^(ls|dir|cat|head|tail|wc|find|which|where|type)\b/,
  /^(git\s+(status|log|diff|branch|remote|show|tag))\b/,
  /^(node|python|python3|npm|npx|pip)\s+--version/,
  /^(curl|wget)\s+.*--head/,
  /^(df|du|free|top|ps|netstat|lsof)\b/,
];

// Bash command patterns that are destructive (always confirm)
const DESTRUCTIVE_BASH_PATTERNS = [
  /\brm\s+-[rf]/,
  /\brmdir\b/,
  /\bdel\s+\/[sfq]/i,
  /\bformat\b/,
  /\bmkfs\b/,
  /\bdd\s+if=/,
  />\s*\//,  // redirect overwriting root paths
  /\bkill\s+-9/,
  /\btaskkill\b/,
  /\bgit\s+(push|reset|rebase|cherry-pick|merge)\b/,
  /\bnpm\s+(publish|unpublish)\b/,
  /\bchmod\b/,
  /\bchown\b/,
  /\bsudo\b/,
];

export function needsConfirmation(toolName: string, args?: Record<string, unknown>): boolean {
  // Connector tools: check for write/mutating action patterns or risk metadata
  if (toolName.startsWith('connector_')) {
    // Check if _connectorMeta indicates medium or high risk
    const meta = (args as any)?._connectorMeta;
    if (meta?.riskLevel === 'high' || meta?.riskLevel === 'medium') return true;
    // Fall back to action name pattern matching
    return CONNECTOR_WRITE_PATTERNS.test(toolName);
  }

  // Non-bash tools: simple set check
  if (toolName !== 'bash') {
    return ALWAYS_CONFIRM.has(toolName);
  }

  // Bash: analyze the command
  const command = String(args?.command ?? '').trim();
  if (!command) return true; // empty command — suspicious, confirm

  // Check if it matches a safe pattern
  for (const pattern of SAFE_BASH_PATTERNS) {
    if (pattern.test(command)) return false;
  }

  // Check if it matches a destructive pattern
  for (const pattern of DESTRUCTIVE_BASH_PATTERNS) {
    if (pattern.test(command)) return true;
  }

  // Default: confirm unknown bash commands (safe by default)
  return true;
}

/**
 * Get the approval class for a tool call based on trust metadata.
 * Returns 'standard' for non-install tools. For install_capability,
 * inspects the args for trust metadata to determine the class.
 */
export type ApprovalClass = 'standard' | 'elevated' | 'critical';

export function getApprovalClass(toolName: string, args?: Record<string, unknown>): ApprovalClass {
  // Connector tools: derive approval class from risk metadata
  if (toolName.startsWith('connector_')) {
    const meta = (args as any)?._connectorMeta;
    if (meta?.riskLevel === 'high') return 'critical';
    if (meta?.riskLevel === 'medium') return 'elevated';
    return 'standard';
  }

  if (toolName !== 'install_capability') return 'standard';

  // If trust metadata is passed in args (from the proposal flow), use it
  const riskLevel = args?._riskLevel as string | undefined;
  if (riskLevel === 'high') return 'critical';
  if (riskLevel === 'medium') return 'elevated';
  return 'standard';
}

export interface ConfirmationGateConfig {
  interactive?: boolean;
  autoApprove?: string[];
  promptFn?: (toolName: string, args: Record<string, unknown>) => Promise<boolean>;
}

export class ConfirmationGate {
  private interactive: boolean;
  private autoApprove: Set<string>;
  private promptFn?: (toolName: string, args: Record<string, unknown>) => Promise<boolean>;

  constructor(config: ConfirmationGateConfig = {}) {
    this.interactive = config.interactive ?? true;
    this.autoApprove = new Set(config.autoApprove ?? []);
    this.promptFn = config.promptFn;
  }

  async confirm(toolName: string, args: Record<string, unknown>): Promise<boolean> {
    if (!this.interactive) return true;
    if (!needsConfirmation(toolName, args)) return true;
    if (this.autoApprove.has(toolName)) return true;
    if (this.promptFn) return this.promptFn(toolName, args);
    return true; // no promptFn = auto-approve
  }
}
