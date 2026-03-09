const SENSITIVE_TOOLS = new Set(['bash', 'write_file', 'edit_file', 'git_commit']);

export function needsConfirmation(toolName: string, _args?: Record<string, unknown>): boolean {
  return SENSITIVE_TOOLS.has(toolName);
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
    if (!needsConfirmation(toolName)) return true;
    if (this.autoApprove.has(toolName)) return true;
    if (this.promptFn) return this.promptFn(toolName, args);
    return true; // no promptFn = auto-approve
  }
}
