import { describe, expect, it } from 'vitest';
import { parseBehaviorProfile } from '../../src/lib/schema/behaviorProfile';

describe('parseBehaviorProfile', () => {
  it('parses a valid strict coding profile', () => {
    const profile = parseBehaviorProfile({
      version: 'v1',
      source_mode: 'chat',
      support_level: 'supported',
      primary_template: 'coding',
      role_focus: 'executor',
      communication_style: 'concise',
      reasoning_style: 'rigorous',
      workflow_style: 'verify_first',
      risk_posture: 'conservative',
      boundary_mode: 'strict',
      goal_orientation: 'outcome_driven',
      user_preference_notes: 'Prefer short direct updates.',
      success_definition: 'Validate changes before completion.',
      unsupported_expectations: [],
      confidence: 0.91,
    });

    expect(profile.primary_template).toBe('coding');
    expect(profile.confidence).toBe(0.91);
  });

  it('rejects unexpected fields', () => {
    expect(() =>
      parseBehaviorProfile({
        version: 'v1',
        source_mode: 'chat',
        support_level: 'supported',
        primary_template: 'coding',
        role_focus: 'executor',
        communication_style: 'concise',
        reasoning_style: 'rigorous',
        workflow_style: 'verify_first',
        risk_posture: 'conservative',
        boundary_mode: 'strict',
        goal_orientation: 'outcome_driven',
        success_definition: 'Validate changes before completion.',
        confidence: 0.91,
        extra_field: true,
      }),
    ).toThrow(/unexpected field/i);
  });

  it('rejects invalid enum values', () => {
    expect(() =>
      parseBehaviorProfile({
        version: 'v1',
        source_mode: 'phone',
        support_level: 'supported',
        primary_template: 'coding',
        role_focus: 'executor',
        communication_style: 'concise',
        reasoning_style: 'rigorous',
        workflow_style: 'verify_first',
        risk_posture: 'conservative',
        boundary_mode: 'strict',
        goal_orientation: 'outcome_driven',
        success_definition: 'Validate changes before completion.',
        confidence: 0.91,
      }),
    ).toThrow(/source_mode/i);
  });

  it('rejects confidence outside the expected range', () => {
    expect(() =>
      parseBehaviorProfile({
        version: 'v1',
        source_mode: 'chat',
        support_level: 'supported',
        primary_template: 'coding',
        role_focus: 'executor',
        communication_style: 'concise',
        reasoning_style: 'rigorous',
        workflow_style: 'verify_first',
        risk_posture: 'conservative',
        boundary_mode: 'strict',
        goal_orientation: 'outcome_driven',
        success_definition: 'Validate changes before completion.',
        confidence: 1.3,
      }),
    ).toThrow(/confidence/i);
  });
});
