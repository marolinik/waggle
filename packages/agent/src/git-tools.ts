import { execFileSync } from 'node:child_process';
import type { ToolDefinition } from './tools.js';

function runGit(cwd: string, args: string[]): string {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf-8', timeout: 10_000 }).trim();
  } catch (err: any) {
    return err.stderr?.trim() || err.message;
  }
}

export function createGitTools(workspace: string): ToolDefinition[] {
  return [
    {
      name: 'git_status',
      description: 'Show git status (modified/untracked files and current branch)',
      offlineCapable: true,
      parameters: { type: 'object', properties: {} },
      execute: async () => {
        const branch = runGit(workspace, ['branch', '--show-current']);
        const status = runGit(workspace, ['status', '--short']);
        return `Branch: ${branch || '(no branch)'}\n${status || 'Clean'}`;
      },
    },
    {
      name: 'git_diff',
      description: 'Show git diff (unstaged changes, or --staged)',
      offlineCapable: true,
      parameters: {
        type: 'object',
        properties: {
          staged: { type: 'boolean', description: 'Show staged changes (default: false)' },
          file: { type: 'string', description: 'Specific file to diff (optional)' },
        },
      },
      execute: async (args) => {
        const gitArgs = ['diff'];
        if (args.staged) gitArgs.push('--staged');
        if (args.file) gitArgs.push(args.file as string);
        const diff = runGit(workspace, gitArgs);
        return diff || 'No changes.';
      },
    },
    {
      name: 'git_log',
      description: 'Show recent git log',
      offlineCapable: true,
      parameters: {
        type: 'object',
        properties: {
          count: { type: 'number', description: 'Number of commits to show (default: 10)' },
        },
      },
      execute: async (args) => {
        const count = (args.count as number) ?? 10;
        const log = runGit(workspace, ['log', '--oneline', `-${count}`]);
        return log || 'No commits yet.';
      },
    },
    {
      name: 'git_commit',
      description: 'Stage files and create an atomic git commit',
      offlineCapable: true,
      parameters: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'Commit message' },
          files: {
            type: 'array',
            items: { type: 'string' },
            description: 'Files to stage (default: all)',
          },
        },
        required: ['message'],
      },
      execute: async (args) => {
        const files = (args.files as string[]) ?? ['.'];
        runGit(workspace, ['add', ...files]);
        const result = runGit(workspace, ['commit', '-m', args.message as string]);
        return result;
      },
    },
  ];
}
