import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { discoverWorkspaceFromFilesystem } from '../../src/lib/api/workspace';

const tempDirs: string[] = [];

async function createTempDir(prefix: string): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0, tempDirs.length).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('discoverWorkspaceFromFilesystem', () => {
  it('detects default workspace path when present', async () => {
    const homeDir = await createTempDir('cw-home-');
    const defaultWorkspace = path.join(homeDir, '.claw-workbench', 'workspace');
    await mkdir(defaultWorkspace, { recursive: true });
    await writeFile(path.join(defaultWorkspace, 'package.json'), '{"name":"workspace"}');

    const result = await discoverWorkspaceFromFilesystem({ homeDir });

    expect(result.resolved_path).toBe(defaultWorkspace);
    expect(result.source).toBe('default');
  });

  it('supports manual path fallback when defaults are missing', async () => {
    const homeDir = await createTempDir('cw-home-fallback-');
    const manualPath = await createTempDir('cw-manual-');

    const result = await discoverWorkspaceFromFilesystem({ homeDir, manualPath });

    expect(result.resolved_path).toBe(manualPath);
    expect(result.source).toBe('manual');
  });

  it('returns key file and skill summary', async () => {
    const workspace = await createTempDir('cw-summary-');
    await mkdir(path.join(workspace, 'memory-bank'), { recursive: true });
    await mkdir(path.join(workspace, 'skills', 'planner'), { recursive: true });
    await mkdir(path.join(workspace, 'skills', 'coder'), { recursive: true });

    await writeFile(path.join(workspace, 'memory-bank', 'prd.md'), '# PRD');
    await writeFile(path.join(workspace, 'skills', 'planner', 'SKILL.md'), '# planner');
    await writeFile(path.join(workspace, 'skills', 'coder', 'SKILL.md'), '# coder');

    const result = await discoverWorkspaceFromFilesystem({ manualPath: workspace });

    const prdFile = result.key_files.find((file) => file.relative_path === 'memory-bank/prd.md');
    expect(prdFile?.exists).toBe(true);

    expect(result.skills.total_skills).toBe(2);
    expect(result.skills.total_files).toBe(2);
    expect(result.skills.skill_names).toEqual(['coder', 'planner']);
  });
});
