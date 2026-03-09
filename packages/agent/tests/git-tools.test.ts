import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { ToolDefinition } from '../src/tools.js';
import { createGitTools } from '../src/git-tools.js';

let tmpDir: string;
let tools: ToolDefinition[];

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'waggle-git-'));
  execFileSync('git', ['init'], { cwd: tmpDir });
  execFileSync('git', ['config', 'user.email', 'test@test.com'], { cwd: tmpDir });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: tmpDir });
  tools = createGitTools(tmpDir);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('createGitTools', () => {
  it('returns 4 tools: git_status, git_diff, git_log, git_commit', () => {
    const names = tools.map(t => t.name);
    expect(names).toEqual(['git_status', 'git_diff', 'git_log', 'git_commit']);
  });

  it('git_status shows clean on fresh repo', async () => {
    const status = tools.find(t => t.name === 'git_status')!;
    const result = await status.execute({});
    // Fresh repo with no commits — status should indicate clean/empty
    expect(result).toContain('Clean');
  });

  it('git_status shows modified files after creating a file', async () => {
    fs.writeFileSync(path.join(tmpDir, 'hello.txt'), 'hello world');
    const status = tools.find(t => t.name === 'git_status')!;
    const result = await status.execute({});
    expect(result).toContain('hello.txt');
  });

  it('git_diff shows changes for modified file', async () => {
    // Create initial commit so diff works
    fs.writeFileSync(path.join(tmpDir, 'file.txt'), 'original');
    execFileSync('git', ['add', '.'], { cwd: tmpDir });
    execFileSync('git', ['commit', '-m', 'initial'], { cwd: tmpDir });

    // Modify the file
    fs.writeFileSync(path.join(tmpDir, 'file.txt'), 'modified');

    const diff = tools.find(t => t.name === 'git_diff')!;
    const result = await diff.execute({});
    expect(result).toContain('modified');
    expect(result).toContain('original');
  });

  it('git_log shows commits after committing', async () => {
    fs.writeFileSync(path.join(tmpDir, 'a.txt'), 'content');
    execFileSync('git', ['add', '.'], { cwd: tmpDir });
    execFileSync('git', ['commit', '-m', 'first commit'], { cwd: tmpDir });

    const log = tools.find(t => t.name === 'git_log')!;
    const result = await log.execute({});
    expect(result).toContain('first commit');
  });

  it('git_commit does atomic add+commit with specified message', async () => {
    fs.writeFileSync(path.join(tmpDir, 'new.txt'), 'new file content');

    const commit = tools.find(t => t.name === 'git_commit')!;
    const result = await commit.execute({ message: 'add new file' });
    expect(result).toContain('add new file');

    // Verify commit is in log
    const logOutput = execFileSync('git', ['log', '--oneline'], { cwd: tmpDir, encoding: 'utf-8' });
    expect(logOutput).toContain('add new file');
  });
});
