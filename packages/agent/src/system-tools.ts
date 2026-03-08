import * as fs from 'node:fs';
import * as path from 'node:path';
import { execFile } from 'node:child_process';
import { glob } from 'glob';
import type { ToolDefinition } from './tools.js';

/**
 * Resolve a relative path within a workspace, rejecting traversal outside it.
 * Returns the resolved absolute path or throws.
 */
function resolveSafe(workspace: string, filePath: string): string {
  const resolved = path.resolve(workspace, filePath);
  if (!resolved.startsWith(path.resolve(workspace))) {
    throw new Error(`Path resolves outside workspace: ${filePath}`);
  }
  return resolved;
}

export function createSystemTools(workspace: string): ToolDefinition[] {
  return [
    // 1. bash — Execute shell commands
    {
      name: 'bash',
      description: 'Execute a shell command in the workspace directory',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Shell command to execute' },
          timeout: { type: 'number', description: 'Timeout in milliseconds (default: 30000)' },
        },
        required: ['command'],
      },
      execute: async (args) => {
        const command = args.command as string;
        const timeout = (args.timeout as number) ?? 30_000;

        const isWindows = process.platform === 'win32';
        const shell = isWindows ? 'cmd.exe' : '/bin/sh';
        const shellArgs = isWindows ? ['/c', command] : ['-c', command];

        const ac = new AbortController();
        const timer = setTimeout(() => ac.abort(), timeout);

        return new Promise<string>((resolve) => {
          execFile(shell, shellArgs, {
            cwd: workspace,
            maxBuffer: 1024 * 1024,
            signal: ac.signal,
          }, (error, stdout, stderr) => {
            clearTimeout(timer);
            if (error) {
              if ((error as any).code === 'ABORT_ERR') {
                resolve(`Error: Command timeout after ${timeout}ms`);
                return;
              }
              // Return stderr + stdout on non-zero exit
              const output = (stderr || '') + (stdout || '');
              resolve(output || `Error: ${error.message}`);
              return;
            }
            resolve(stdout);
          });
        });
      },
    },

    // 2. read_file — Read file contents
    {
      name: 'read_file',
      description: 'Read the contents of a file (path relative to workspace)',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path relative to workspace' },
        },
        required: ['path'],
      },
      execute: async (args) => {
        try {
          const resolved = resolveSafe(workspace, args.path as string);
          return fs.readFileSync(resolved, 'utf-8');
        } catch (err: any) {
          return `Error: ${err.message}`;
        }
      },
    },

    // 3. write_file — Create/overwrite files
    {
      name: 'write_file',
      description: 'Write content to a file, creating parent directories if needed',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path relative to workspace' },
          content: { type: 'string', description: 'Content to write' },
        },
        required: ['path', 'content'],
      },
      execute: async (args) => {
        try {
          const resolved = resolveSafe(workspace, args.path as string);
          fs.mkdirSync(path.dirname(resolved), { recursive: true });
          fs.writeFileSync(resolved, args.content as string);
          return `Successfully wrote ${args.path}`;
        } catch (err: any) {
          return `Error: ${err.message}`;
        }
      },
    },

    // 4. edit_file — Exact string replacement
    {
      name: 'edit_file',
      description: 'Replace an exact string in a file. old_string must appear exactly once.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path relative to workspace' },
          old_string: { type: 'string', description: 'Exact string to find (must appear once)' },
          new_string: { type: 'string', description: 'Replacement string' },
        },
        required: ['path', 'old_string', 'new_string'],
      },
      execute: async (args) => {
        try {
          const resolved = resolveSafe(workspace, args.path as string);
          const oldStr = args.old_string as string;
          const newStr = args.new_string as string;

          const content = fs.readFileSync(resolved, 'utf-8');
          const occurrences = content.split(oldStr).length - 1;

          if (occurrences === 0) {
            return `Error: old_string not found in ${args.path}`;
          }
          if (occurrences > 1) {
            return `Error: old_string found multiple times (${occurrences}) in ${args.path}. Must appear exactly once.`;
          }

          const updated = content.replace(oldStr, newStr);
          fs.writeFileSync(resolved, updated);
          return `Successfully edited ${args.path}`;
        } catch (err: any) {
          return `Error: ${err.message}`;
        }
      },
    },

    // 5. search_files — Glob pattern matching
    {
      name: 'search_files',
      description: 'Search for files matching a glob pattern in the workspace',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Glob pattern (e.g., "**/*.ts")' },
        },
        required: ['pattern'],
      },
      execute: async (args) => {
        try {
          const matches = await glob(args.pattern as string, {
            cwd: workspace,
            ignore: ['node_modules/**', '.git/**'],
            nodir: true,
          });
          if (matches.length === 0) return 'No files found.';
          return matches.join('\n');
        } catch (err: any) {
          return `Error: ${err.message}`;
        }
      },
    },

    // 6. search_content — Regex search through file contents
    {
      name: 'search_content',
      description: 'Search file contents using a regex pattern. Returns file:line: match format.',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Regex pattern to search for' },
          glob: { type: 'string', description: 'Glob pattern to filter files (default: "**/*")' },
        },
        required: ['pattern'],
      },
      execute: async (args) => {
        try {
          const filePattern = (args.glob as string) ?? '**/*';
          const regex = new RegExp(args.pattern as string);

          const files = await glob(filePattern, {
            cwd: workspace,
            ignore: ['node_modules/**', '.git/**'],
            nodir: true,
          });

          const results: string[] = [];

          for (const file of files) {
            const absPath = path.join(workspace, file);
            try {
              const content = fs.readFileSync(absPath, 'utf-8');
              const lines = content.split('\n');
              for (let i = 0; i < lines.length; i++) {
                if (regex.test(lines[i])) {
                  results.push(`${file}:${i + 1}: ${lines[i]}`);
                }
              }
            } catch {
              // Skip binary/unreadable files
            }
          }

          if (results.length === 0) return 'No matches found.';
          return results.join('\n');
        } catch (err: any) {
          return `Error: ${err.message}`;
        }
      },
    },
  ];
}
