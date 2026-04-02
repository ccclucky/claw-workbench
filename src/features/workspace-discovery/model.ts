export type WorkspaceSource = 'default' | 'manual';

export interface WorkspaceKeyFile {
  relative_path: string;
  exists: boolean;
}

export interface WorkspaceSkillSummary {
  total_skills: number;
  total_files: number;
  skill_names: string[];
}

export interface WorkspaceSnapshot {
  resolved_path: string;
  source: WorkspaceSource;
  key_files: WorkspaceKeyFile[];
  skills: WorkspaceSkillSummary;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertPlainObject(value: unknown, context: string): asserts value is Record<string, unknown> {
  if (!isPlainObject(value)) {
    throw new Error(`${context} must be an object`);
  }
}

function assertString(value: unknown, context: string): asserts value is string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${context} must be a non-empty string`);
  }
}

function assertBoolean(value: unknown, context: string): asserts value is boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`${context} must be a boolean`);
  }
}

function assertWorkspaceSource(value: unknown): asserts value is WorkspaceSource {
  assertString(value, 'workspace.source');
  if (value !== 'default' && value !== 'manual') {
    throw new Error('workspace.source must be either default or manual');
  }
}

export function parseWorkspaceSnapshot(input: unknown): WorkspaceSnapshot {
  assertPlainObject(input, 'WorkspaceSnapshot');

  assertString(input.resolved_path, 'workspace.resolved_path');
  assertWorkspaceSource(input.source);

  if (!Array.isArray(input.key_files)) {
    throw new Error('workspace.key_files must be an array');
  }

  const key_files = input.key_files.map((entry, index) => {
    assertPlainObject(entry, `workspace.key_files[${index}]`);
    assertString(entry.relative_path, `workspace.key_files[${index}].relative_path`);
    assertBoolean(entry.exists, `workspace.key_files[${index}].exists`);
    return {
      relative_path: entry.relative_path,
      exists: entry.exists,
    };
  });

  assertPlainObject(input.skills, 'workspace.skills');
  if (typeof input.skills.total_skills !== 'number' || input.skills.total_skills < 0) {
    throw new Error('workspace.skills.total_skills must be a non-negative number');
  }
  if (typeof input.skills.total_files !== 'number' || input.skills.total_files < 0) {
    throw new Error('workspace.skills.total_files must be a non-negative number');
  }
  if (
    !Array.isArray(input.skills.skill_names)
    || input.skills.skill_names.some((name) => typeof name !== 'string' || name.length === 0)
  ) {
    throw new Error('workspace.skills.skill_names must be an array of non-empty strings');
  }

  return {
    resolved_path: input.resolved_path,
    source: input.source,
    key_files,
    skills: {
      total_skills: input.skills.total_skills,
      total_files: input.skills.total_files,
      skill_names: [...input.skills.skill_names],
    },
  };
}
