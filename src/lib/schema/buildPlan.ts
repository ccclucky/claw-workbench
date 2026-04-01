export const buildPlanVersions = ['v1'] as const;
export const buildPlanIntentTypes = ['create_new', 'refine_existing', 'repair_existing', 'template_apply'] as const;
export const buildPlanSupportLevels = ['supported', 'partial', 'unsupported'] as const;
export const buildPlanRiskLevels = ['low', 'medium', 'high'] as const;
export const buildPlanChangeTypes = ['create_file', 'update_file', 'create_folder', 'install_skill'] as const;
export const buildPlanFileKinds = ['bootstrap', 'config', 'template_asset', 'workspace_doc'] as const;
export const buildPlanUpdateModes = ['replace_full', 'replace_section', 'append_section'] as const;
export const buildPlanFolderKinds = ['skills', 'templates', 'workspace_support'] as const;
export const buildPlanSkillSources = ['workspace_local', 'managed_catalog', 'bundled'] as const;
export const buildPlanInstallTargets = ['workspace', 'managed'] as const;
export const buildPlanWarningLevels = ['low', 'medium', 'high'] as const;
export const buildPlanWarningCodes = [
  'partial_support',
  'restart_may_be_required',
  'existing_file_will_be_modified',
  'skill_compatibility_needs_review',
  'target_outside_mvp_scope',
] as const;
export const buildPlanCheckTypes = ['self_check', 'structure_check', 'skill_check', 'caveat_check', 'smoke_test'] as const;
export const buildPlanChangeRiskLevels = ['low', 'medium', 'high'] as const;

export type BuildPlanVersion = (typeof buildPlanVersions)[number];
export type BuildPlanIntentType = (typeof buildPlanIntentTypes)[number];
export type BuildPlanSupportLevel = (typeof buildPlanSupportLevels)[number];
export type BuildPlanRiskLevel = (typeof buildPlanRiskLevels)[number];
export type BuildPlanChangeType = (typeof buildPlanChangeTypes)[number];
export type BuildPlanFileKind = (typeof buildPlanFileKinds)[number];
export type BuildPlanUpdateMode = (typeof buildPlanUpdateModes)[number];
export type BuildPlanFolderKind = (typeof buildPlanFolderKinds)[number];
export type BuildPlanSkillSource = (typeof buildPlanSkillSources)[number];
export type BuildPlanInstallTarget = (typeof buildPlanInstallTargets)[number];
export type BuildPlanWarningLevel = (typeof buildPlanWarningLevels)[number];
export type BuildPlanWarningCode = (typeof buildPlanWarningCodes)[number];
export type BuildPlanCheckType = (typeof buildPlanCheckTypes)[number];

export interface BuildPlanWarning {
  warning_id: string;
  level: BuildPlanWarningLevel;
  code: BuildPlanWarningCode | string;
  message: string;
}

export interface PostApplyCheck {
  check_id: string;
  type: BuildPlanCheckType;
  title: string;
  success_criteria: string;
  blocking: boolean;
}

export interface BuildPlanChangeBase {
  change_id: string;
  type: BuildPlanChangeType;
  title: string;
  reason: string;
  target_path: string;
  risk_level: BuildPlanRiskLevel;
  profile_links: string[];
  validation_links: string[];
  requires_confirmation: boolean;
}

export interface CreateFileChange extends BuildPlanChangeBase {
  type: 'create_file';
  payload: {
    file_kind: BuildPlanFileKind;
    content: string;
    overwrite_if_exists?: boolean;
  };
}

export interface UpdateFileChange extends BuildPlanChangeBase {
  type: 'update_file';
  payload: {
    file_kind: BuildPlanFileKind;
    update_mode: BuildPlanUpdateMode;
    before_summary: string;
    after_summary: string;
    proposed_content: string;
    diff_hint: string;
  };
}

export interface CreateFolderChange extends BuildPlanChangeBase {
  type: 'create_folder';
  payload: {
    folder_kind: BuildPlanFolderKind;
    must_be_empty: boolean;
  };
}

export interface InstallSkillChange extends BuildPlanChangeBase {
  type: 'install_skill';
  payload: {
    skill_source: BuildPlanSkillSource;
    skill_name: string;
    install_target: BuildPlanInstallTarget;
    source_ref: string;
    compatibility_note: string;
  };
}

export type BuildPlanChange = CreateFileChange | UpdateFileChange | CreateFolderChange | InstallSkillChange;

export interface BuildPlan {
  plan_id: string;
  version: BuildPlanVersion;
  title: string;
  summary: string;
  target_workspace: string;
  source_profile_id: string;
  intent_type: BuildPlanIntentType;
  support_level: BuildPlanSupportLevel;
  risk_level: BuildPlanRiskLevel;
  changes: BuildPlanChange[];
  warnings: BuildPlanWarning[];
  post_apply_checks: PostApplyCheck[];
  template_tags: string[];
  requires_user_confirmation: boolean;
}

class SchemaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SchemaValidationError';
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertPlainObject(value: unknown, context: string): asserts value is Record<string, unknown> {
  if (!isPlainObject(value)) {
    throw new SchemaValidationError(`${context} must be an object`);
  }
}

function assertNoUnexpectedKeys(
  value: Record<string, unknown>,
  allowedKeys: readonly string[],
  context: string,
) {
  for (const key of Object.keys(value)) {
    if (!allowedKeys.includes(key)) {
      throw new SchemaValidationError(`${context} has unexpected field: ${key}`);
    }
  }
}

function assertString(value: unknown, context: string): asserts value is string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new SchemaValidationError(`${context} must be a non-empty string`);
  }
}

function assertBoolean(value: unknown, context: string): asserts value is boolean {
  if (typeof value !== 'boolean') {
    throw new SchemaValidationError(`${context} must be a boolean`);
  }
}

function assertEnumValue<T extends readonly string[]>(
  value: unknown,
  values: T,
  context: string,
): asserts value is T[number] {
  assertString(value, context);
  if (!values.includes(value as T[number])) {
    throw new SchemaValidationError(`${context} must be one of: ${values.join(', ')}`);
  }
}

function assertStringArray(value: unknown, context: string) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || item.length === 0)) {
    throw new SchemaValidationError(`${context} must be an array of non-empty strings`);
  }
}

function assertOptionalBoolean(value: unknown, context: string) {
  if (value !== undefined) {
    assertBoolean(value, context);
  }
}

function validateWarning(value: unknown): BuildPlanWarning {
  assertPlainObject(value, 'warning');
  assertNoUnexpectedKeys(value, ['warning_id', 'level', 'code', 'message'], 'warning');
  assertString(value.warning_id, 'warning_id');
  assertEnumValue(value.level, buildPlanWarningLevels, 'warning.level');
  assertString(value.code, 'warning.code');
  assertString(value.message, 'warning.message');
  return value as BuildPlanWarning;
}

function validatePostApplyCheck(value: unknown): PostApplyCheck {
  assertPlainObject(value, 'post_apply_check');
  assertNoUnexpectedKeys(value, ['check_id', 'type', 'title', 'success_criteria', 'blocking'], 'post_apply_check');
  assertString(value.check_id, 'check_id');
  assertEnumValue(value.type, buildPlanCheckTypes, 'check.type');
  assertString(value.title, 'check.title');
  assertString(value.success_criteria, 'check.success_criteria');
  assertBoolean(value.blocking, 'check.blocking');
  return value as PostApplyCheck;
}

function validateCreateFileChange(value: Record<string, unknown>): CreateFileChange {
  assertNoUnexpectedKeys(value.payload as Record<string, unknown>, ['file_kind', 'content', 'overwrite_if_exists'], 'change.payload');
  const payload = value.payload as Record<string, unknown>;
  assertEnumValue(payload.file_kind, buildPlanFileKinds, 'payload.file_kind');
  assertString(payload.content, 'payload.content');
  assertOptionalBoolean(payload.overwrite_if_exists, 'payload.overwrite_if_exists');
  if (payload.overwrite_if_exists === true) {
    throw new SchemaValidationError('create_file payload.overwrite_if_exists must not be true in MVP');
  }
  return value as CreateFileChange;
}

function validateUpdateFileChange(value: Record<string, unknown>): UpdateFileChange {
  const payload = value.payload as Record<string, unknown>;
  assertNoUnexpectedKeys(
    payload,
    ['file_kind', 'update_mode', 'before_summary', 'after_summary', 'proposed_content', 'diff_hint'],
    'change.payload',
  );
  assertEnumValue(payload.file_kind, buildPlanFileKinds, 'payload.file_kind');
  assertEnumValue(payload.update_mode, buildPlanUpdateModes, 'payload.update_mode');
  assertString(payload.before_summary, 'payload.before_summary');
  assertString(payload.after_summary, 'payload.after_summary');
  assertString(payload.proposed_content, 'payload.proposed_content');
  assertString(payload.diff_hint, 'payload.diff_hint');
  return value as UpdateFileChange;
}

function validateCreateFolderChange(value: Record<string, unknown>): CreateFolderChange {
  const payload = value.payload as Record<string, unknown>;
  assertNoUnexpectedKeys(payload, ['folder_kind', 'must_be_empty'], 'change.payload');
  assertEnumValue(payload.folder_kind, buildPlanFolderKinds, 'payload.folder_kind');
  assertBoolean(payload.must_be_empty, 'payload.must_be_empty');
  return value as CreateFolderChange;
}

function validateInstallSkillChange(value: Record<string, unknown>): InstallSkillChange {
  const payload = value.payload as Record<string, unknown>;
  assertNoUnexpectedKeys(
    payload,
    ['skill_source', 'skill_name', 'install_target', 'source_ref', 'compatibility_note'],
    'change.payload',
  );
  assertEnumValue(payload.skill_source, buildPlanSkillSources, 'payload.skill_source');
  assertString(payload.skill_name, 'payload.skill_name');
  assertEnumValue(payload.install_target, buildPlanInstallTargets, 'payload.install_target');
  assertString(payload.source_ref, 'payload.source_ref');
  assertString(payload.compatibility_note, 'payload.compatibility_note');
  return value as InstallSkillChange;
}

function validateChange(value: unknown): BuildPlanChange {
  assertPlainObject(value, 'change');
  assertNoUnexpectedKeys(
    value,
    [
      'change_id',
      'type',
      'title',
      'reason',
      'target_path',
      'risk_level',
      'profile_links',
      'validation_links',
      'requires_confirmation',
      'payload',
    ],
    'change',
  );

  assertString(value.change_id, 'change_id');
  assertEnumValue(value.type, buildPlanChangeTypes, 'change.type');
  assertString(value.title, 'change.title');
  assertString(value.reason, 'change.reason');
  assertString(value.target_path, 'change.target_path');
  assertEnumValue(value.risk_level, buildPlanRiskLevels, 'change.risk_level');
  assertStringArray(value.profile_links, 'change.profile_links');
  assertStringArray(value.validation_links, 'change.validation_links');
  if (value.validation_links.length === 0) {
    throw new SchemaValidationError('change.validation_links must not be empty');
  }
  assertBoolean(value.requires_confirmation, 'change.requires_confirmation');
  assertPlainObject(value.payload, 'change.payload');

  switch (value.type) {
    case 'create_file':
      return validateCreateFileChange(value);
    case 'update_file':
      return validateUpdateFileChange(value);
    case 'create_folder':
      return validateCreateFolderChange(value);
    case 'install_skill':
      return validateInstallSkillChange(value);
  }
}

function riskValue(level: BuildPlanRiskLevel) {
  return buildPlanRiskLevels.indexOf(level);
}

function highestRisk(changes: BuildPlanChange[]): BuildPlanRiskLevel {
  return changes.reduce<BuildPlanRiskLevel>((current, change) => {
    return riskValue(change.risk_level) > riskValue(current) ? change.risk_level : current;
  }, 'low');
}

export function parseBuildPlan(input: unknown): BuildPlan {
  assertPlainObject(input, 'BuildPlan');

  const allowedKeys = [
    'plan_id',
    'version',
    'title',
    'summary',
    'target_workspace',
    'source_profile_id',
    'intent_type',
    'support_level',
    'risk_level',
    'changes',
    'warnings',
    'post_apply_checks',
    'template_tags',
    'requires_user_confirmation',
  ] as const;

  assertNoUnexpectedKeys(input, allowedKeys, 'BuildPlan');

  assertString(input.plan_id, 'plan_id');
  assertEnumValue(input.version, buildPlanVersions, 'version');
  assertString(input.title, 'title');
  assertString(input.summary, 'summary');
  assertString(input.target_workspace, 'target_workspace');
  assertString(input.source_profile_id, 'source_profile_id');
  assertEnumValue(input.intent_type, buildPlanIntentTypes, 'intent_type');
  assertEnumValue(input.support_level, buildPlanSupportLevels, 'support_level');
  assertEnumValue(input.risk_level, buildPlanRiskLevels, 'risk_level');
  assertBoolean(input.requires_user_confirmation, 'requires_user_confirmation');
  if (input.requires_user_confirmation !== true) {
    throw new SchemaValidationError('requires_user_confirmation must be true in MVP');
  }
  if (!Array.isArray(input.changes)) {
    throw new SchemaValidationError('changes must be an array');
  }
  if (!Array.isArray(input.warnings)) {
    throw new SchemaValidationError('warnings must be an array');
  }
  if (!Array.isArray(input.post_apply_checks)) {
    throw new SchemaValidationError('post_apply_checks must be an array');
  }
  if (!Array.isArray(input.template_tags)) {
    throw new SchemaValidationError('template_tags must be an array');
  }

  const warnings = input.warnings.map(validateWarning);
  const changes = input.changes.map(validateChange);
  const postApplyChecks = input.post_apply_checks.map(validatePostApplyCheck);

  if (input.support_level === 'unsupported') {
    if (changes.length > 0) {
      throw new SchemaValidationError('unsupported BuildPlan must not contain changes');
    }
  } else {
    if (changes.length === 0) {
      throw new SchemaValidationError('BuildPlan must contain at least one change');
    }
  }

  for (const change of changes) {
    if (change.requires_confirmation === false && change.risk_level === 'high') {
      throw new SchemaValidationError('high-risk changes require confirmation');
    }
  }

  if (input.support_level !== 'unsupported') {
    const structureChecks = postApplyChecks.filter((check) => check.type === 'structure_check');
    const smokeTests = postApplyChecks.filter((check) => check.type === 'smoke_test');

    if (postApplyChecks.length === 0) {
      throw new SchemaValidationError('post_apply_checks must not be empty for supported plans');
    }
    if (structureChecks.length === 0) {
      throw new SchemaValidationError('post_apply_checks must include at least one structure_check');
    }
    if (smokeTests.length === 0) {
      throw new SchemaValidationError('post_apply_checks must include at least one smoke_test');
    }
  }

  if (changes.length > 0 && riskValue(input.risk_level) < riskValue(highestRisk(changes))) {
    throw new SchemaValidationError('risk_level must not be lower than the highest change risk');
  }

  if (input.support_level === 'unsupported' && input.requires_user_confirmation !== true) {
    throw new SchemaValidationError('unsupported BuildPlan must require user confirmation');
  }

  return {
    plan_id: input.plan_id,
    version: input.version,
    title: input.title,
    summary: input.summary,
    target_workspace: input.target_workspace,
    source_profile_id: input.source_profile_id,
    intent_type: input.intent_type,
    support_level: input.support_level,
    risk_level: input.risk_level,
    changes,
    warnings,
    post_apply_checks: postApplyChecks,
    template_tags: input.template_tags.map((tag) => {
      assertString(tag, 'template_tags item');
      return tag;
    }),
    requires_user_confirmation: input.requires_user_confirmation,
  };
}

export function isBuildPlan(value: unknown): value is BuildPlan {
  try {
    parseBuildPlan(value);
    return true;
  } catch {
    return false;
  }
}
