export const validationStatuses = ['pass', 'pass_with_warnings', 'fail'] as const;
export const validationLayers = ['structure', 'runtime', 'behavior'] as const;
export const validationSeverities = ['low', 'medium', 'high'] as const;

export type ValidationStatus = (typeof validationStatuses)[number];
export type ValidationLayer = (typeof validationLayers)[number];
export type ValidationSeverity = (typeof validationSeverities)[number];

export interface ValidationFinding {
  finding_id: string;
  layer: ValidationLayer;
  severity: ValidationSeverity;
  title: string;
  detail: string;
  linked_profile_fields: string[];
  linked_change_ids: string[];
}

export interface BehaviorDelta {
  dimension: string;
  target: string;
  observed: string;
  score: number;
  comment: string;
}

export interface ValidationResult {
  validation_id: string;
  plan_id: string;
  profile_id: string;
  overall_status: ValidationStatus;
  overall_score: number;
  structure_status: ValidationStatus;
  runtime_status: ValidationStatus;
  behavior_status: ValidationStatus;
  findings: ValidationFinding[];
  behavior_deltas: BehaviorDelta[];
  next_actions: string[];
}

