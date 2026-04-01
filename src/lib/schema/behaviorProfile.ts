export const behaviorProfileVersions = ['v1'] as const;
export const behaviorProfileSourceModes = ['chat', 'form', 'template'] as const;
export const behaviorProfileSupportLevels = ['supported', 'partial', 'unsupported'] as const;
export const behaviorProfileTemplates = ['coding', 'research', 'content', 'custom_light'] as const;
export const behaviorProfileRoleFocuses = ['executor', 'reviewer', 'planner', 'explorer'] as const;
export const behaviorProfileCommunicationStyles = ['concise', 'balanced', 'detailed'] as const;
export const behaviorProfileReasoningStyles = ['pragmatic', 'rigorous', 'creative'] as const;
export const behaviorProfileWorkflowStyles = ['act_first', 'review_then_act', 'verify_first'] as const;
export const behaviorProfileRiskPostures = ['aggressive', 'balanced', 'conservative'] as const;
export const behaviorProfileBoundaryModes = ['flexible', 'guarded', 'strict'] as const;
export const behaviorProfileGoalOrientations = ['process_driven', 'outcome_driven', 'learning_driven'] as const;

export type BehaviorProfileVersion = (typeof behaviorProfileVersions)[number];
export type BehaviorProfileSourceMode = (typeof behaviorProfileSourceModes)[number];
export type BehaviorProfileSupportLevel = (typeof behaviorProfileSupportLevels)[number];
export type BehaviorProfileTemplate = (typeof behaviorProfileTemplates)[number];
export type BehaviorProfileRoleFocus = (typeof behaviorProfileRoleFocuses)[number];
export type BehaviorProfileCommunicationStyle = (typeof behaviorProfileCommunicationStyles)[number];
export type BehaviorProfileReasoningStyle = (typeof behaviorProfileReasoningStyles)[number];
export type BehaviorProfileWorkflowStyle = (typeof behaviorProfileWorkflowStyles)[number];
export type BehaviorProfileRiskPosture = (typeof behaviorProfileRiskPostures)[number];
export type BehaviorProfileBoundaryMode = (typeof behaviorProfileBoundaryModes)[number];
export type BehaviorProfileGoalOrientation = (typeof behaviorProfileGoalOrientations)[number];

export interface BehaviorProfile {
  profile_id?: string;
  version: BehaviorProfileVersion;
  source_mode: BehaviorProfileSourceMode;
  support_level: BehaviorProfileSupportLevel;
  primary_template: BehaviorProfileTemplate;
  role_focus: BehaviorProfileRoleFocus;
  communication_style: BehaviorProfileCommunicationStyle;
  reasoning_style: BehaviorProfileReasoningStyle;
  workflow_style: BehaviorProfileWorkflowStyle;
  risk_posture: BehaviorProfileRiskPosture;
  boundary_mode: BehaviorProfileBoundaryMode;
  goal_orientation: BehaviorProfileGoalOrientation;
  user_preference_notes?: string;
  success_definition: string;
  unsupported_expectations?: string[];
  confidence: number;
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

function assertOptionalString(value: unknown, context: string) {
  if (value !== undefined) {
    assertString(value, context);
  }
}

function assertOptionalStringArray(value: unknown, context: string) {
  if (value === undefined) {
    return;
  }

  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new SchemaValidationError(`${context} must be an array of strings`);
  }
}

function assertConfidence(value: unknown) {
  if (typeof value !== 'number' || Number.isNaN(value) || value < 0 || value > 1) {
    throw new SchemaValidationError('confidence must be a number between 0 and 1');
  }
}

export function parseBehaviorProfile(input: unknown): BehaviorProfile {
  assertPlainObject(input, 'BehaviorProfile');

  const allowedKeys = [
    'profile_id',
    'version',
    'source_mode',
    'support_level',
    'primary_template',
    'role_focus',
    'communication_style',
    'reasoning_style',
    'workflow_style',
    'risk_posture',
    'boundary_mode',
    'goal_orientation',
    'user_preference_notes',
    'success_definition',
    'unsupported_expectations',
    'confidence',
  ] as const;

  assertNoUnexpectedKeys(input, allowedKeys, 'BehaviorProfile');

  if (input.profile_id !== undefined) {
    assertString(input.profile_id, 'profile_id');
  }
  assertEnumValue(input.version, behaviorProfileVersions, 'version');
  assertEnumValue(input.source_mode, behaviorProfileSourceModes, 'source_mode');
  assertEnumValue(input.support_level, behaviorProfileSupportLevels, 'support_level');
  assertEnumValue(input.primary_template, behaviorProfileTemplates, 'primary_template');
  assertEnumValue(input.role_focus, behaviorProfileRoleFocuses, 'role_focus');
  assertEnumValue(input.communication_style, behaviorProfileCommunicationStyles, 'communication_style');
  assertEnumValue(input.reasoning_style, behaviorProfileReasoningStyles, 'reasoning_style');
  assertEnumValue(input.workflow_style, behaviorProfileWorkflowStyles, 'workflow_style');
  assertEnumValue(input.risk_posture, behaviorProfileRiskPostures, 'risk_posture');
  assertEnumValue(input.boundary_mode, behaviorProfileBoundaryModes, 'boundary_mode');
  assertEnumValue(input.goal_orientation, behaviorProfileGoalOrientations, 'goal_orientation');
  assertOptionalString(input.user_preference_notes, 'user_preference_notes');
  assertString(input.success_definition, 'success_definition');
  assertOptionalStringArray(input.unsupported_expectations, 'unsupported_expectations');
  assertConfidence(input.confidence);

  if (input.user_preference_notes !== undefined && input.user_preference_notes.length > 280) {
    throw new SchemaValidationError('user_preference_notes must be 280 characters or fewer');
  }

  return input as BehaviorProfile;
}

export function isBehaviorProfile(value: unknown): value is BehaviorProfile {
  try {
    parseBehaviorProfile(value);
    return true;
  } catch {
    return false;
  }
}

