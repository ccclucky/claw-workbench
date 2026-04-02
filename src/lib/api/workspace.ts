import { access, readdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { invoke } from '@tauri-apps/api/core';
import {
  parseWorkspaceSnapshot,
  type WorkspaceSnapshot,
  type WorkspaceSource,
} from '../../features/workspace-discovery/model';

export interface DiscoverWorkspaceInput {
  cwd?: string;
  homeDir?: string;
  manualPath?: string;
}

const REQUIRED_KEY_FILES = ['AGENTS.md', 'memory-bank/prd.md', 'package.json', 'src-tauri/tauri.conf.json'] as const;

async function pathExists(value: string): Promise<boolean> {
  try {
    await access(value, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function defaultWorkspaceCandidates(cwd?: string, homeDir?: string): string[] {
  const candidates: string[] = [];
  if (cwd) {
    candidates.push(cwd);
  }
  if (homeDir) {
    candidates.push(path.join(homeDir, '.claw-workbench', 'workspace'));
    candidates.push(path.join(homeDir, '.openclaw', 'workspace'));
  }
  return candidates;
}

async function summarizeSkills(resolvedPath: string) {
  const skillsRoot = path.join(resolvedPath, 'skills');
  if (!(await pathExists(skillsRoot))) {
    return { total_skills: 0, total_files: 0, skill_names: [] as string[] };
  }

  const skillEntries = await readdir(skillsRoot, { withFileTypes: true });
  const directories = skillEntries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();

  let totalFiles = 0;
  for (const skillName of directories) {
    const skillFolder = path.join(skillsRoot, skillName);
    const files = await readdir(skillFolder, { withFileTypes: true });
    totalFiles += files.filter((entry) => entry.isFile()).length;
  }

  return {
    total_skills: directories.length,
    total_files: totalFiles,
    skill_names: directories,
  };
}

export async function discoverWorkspaceFromFilesystem(input: DiscoverWorkspaceInput = {}): Promise<WorkspaceSnapshot> {
  const candidates = defaultWorkspaceCandidates(input.cwd, input.homeDir);

  let resolvedPath: string | undefined;
  let source: WorkspaceSource = 'default';

  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      resolvedPath = candidate;
      source = 'default';
      break;
    }
  }

  if (!resolvedPath && input.manualPath && (await pathExists(input.manualPath))) {
    resolvedPath = input.manualPath;
    source = 'manual';
  }

  if (!resolvedPath) {
    throw new Error('No workspace found from default candidates or manual fallback path');
  }

  const key_files = await Promise.all(
    REQUIRED_KEY_FILES.map(async (relativePath) => ({
      relative_path: relativePath,
      exists: await pathExists(path.join(resolvedPath, relativePath)),
    })),
  );

  const skills = await summarizeSkills(resolvedPath);

  return parseWorkspaceSnapshot({
    resolved_path: resolvedPath,
    source,
    key_files,
    skills,
  });
}

export async function discoverWorkspaceViaTauri(input: DiscoverWorkspaceInput = {}): Promise<WorkspaceSnapshot> {
  const response = await invoke('discover_workspace', {
    manualPath: input.manualPath ?? null,
    cwd: input.cwd ?? null,
    homeDir: input.homeDir ?? null,
  });
  return parseWorkspaceSnapshot(response);
}
