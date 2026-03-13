import type { ToolDefinition } from './tools.js';
import { SubagentOrchestrator, type OrchestratorConfig } from './subagent-orchestrator.js';
import { WORKFLOW_TEMPLATES, listWorkflowTemplates } from './workflow-templates.js';
import type { HookRegistry } from './hooks.js';

export interface WorkflowToolsConfig extends OrchestratorConfig {
  hooks?: HookRegistry;
}

export function createWorkflowTools(config: WorkflowToolsConfig): ToolDefinition[] {
  return [
    {
      name: 'orchestrate_workflow',
      description: `Run a multi-agent workflow. Available templates: ${listWorkflowTemplates().join(', ')}. Each template coordinates multiple specialist sub-agents working together on a task.`,
      parameters: {
        type: 'object',
        properties: {
          template: {
            type: 'string',
            description: `Workflow template name: ${listWorkflowTemplates().join(', ')}`,
          },
          task: {
            type: 'string',
            description: 'The task description for the workflow to execute',
          },
        },
        required: ['template', 'task'],
      },
      execute: async (args) => {
        const templateName = args.template as string;
        const task = args.task as string;

        const factory = WORKFLOW_TEMPLATES[templateName];
        if (!factory) {
          return `Unknown workflow template "${templateName}". Available: ${listWorkflowTemplates().join(', ')}`;
        }

        const template = factory(task);
        const orchestrator = new SubagentOrchestrator(config);

        // Fire workflow:start hook
        if (config.hooks) {
          const hookResult = await config.hooks.fire('workflow:start', {
            toolName: 'orchestrate_workflow',
            workflowName: templateName,
            workflowTask: task,
          });
          if (hookResult.cancelled) {
            return `[BLOCKED] Workflow blocked: ${hookResult.reason ?? 'No reason given'}`;
          }
        }

        // Emit progress updates
        orchestrator.on('worker:status', (_event) => {
          // Status tracking is internal — the tool result will contain the summary
        });

        const { results, aggregated } = await orchestrator.runWorkflow(template);

        // Fire workflow:end hook
        if (config.hooks) {
          await config.hooks.fire('workflow:end', {
            toolName: 'orchestrate_workflow',
            workflowName: templateName,
            workflowTask: task,
          });
        }

        // Build summary
        const workers = Array.from(results.values());
        const totalTokens = workers.reduce((sum, w) => sum + w.usage.inputTokens + w.usage.outputTokens, 0);
        const totalDuration = workers.reduce((sum, w) => {
          if (w.startedAt && w.completedAt) return sum + (w.completedAt - w.startedAt);
          return sum;
        }, 0);
        const failedCount = workers.filter(w => w.status === 'failed').length;

        let output = `## Workflow: ${template.name}\n`;
        output += `**Steps:** ${workers.length} | **Tokens:** ${totalTokens} | **Duration:** ${(totalDuration / 1000).toFixed(1)}s`;
        if (failedCount > 0) output += ` | **Failed:** ${failedCount}`;
        output += '\n\n';

        // Worker summary
        output += '### Workers\n';
        for (const w of workers) {
          const status = w.status === 'done' ? '\u2713' : w.status === 'failed' ? '\u2717' : '\u2026';
          const dur = w.startedAt && w.completedAt ? `${((w.completedAt - w.startedAt) / 1000).toFixed(1)}s` : '-';
          output += `- ${status} **${w.name}** (${w.role}) \u2014 ${dur}, ${w.usage.inputTokens + w.usage.outputTokens} tokens\n`;
          if (w.error) output += `  Error: ${w.error}\n`;
        }
        output += '\n---\n\n';
        output += aggregated;

        return output;
      },
    },
  ];
}
