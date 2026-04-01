import { describe, expect, it } from 'vitest';
import { parseBuildPlan } from '../../src/lib/schema/buildPlan';

const baseChange = {
  change_id: 'chg_001',
  type: 'update_file' as const,
  title: 'Strengthen bootstrap guidance',
  reason: 'The profile prefers rigorous verification before completion.',
  target_path: 'workspace/AGENTS.md',
  risk_level: 'medium' as const,
  profile_links: ['workflow_style', 'reasoning_style'],
  validation_links: ['check_bootstrap_exists'],
  requires_confirmation: true,
  payload: {
    file_kind: 'bootstrap' as const,
    update_mode: 'replace_section' as const,
    before_summary: 'Current instructions are too loose.',
    after_summary: 'Updated instructions require verification first.',
    proposed_content: 'Updated content',
    diff_hint: 'Add verification instructions.',
  },
};

describe('parseBuildPlan', () => {
  it('parses a valid plan with allowed changes', () => {
    const plan = parseBuildPlan({
      plan_id: 'plan_001',
      version: 'v1',
      title: 'Tighten coding workflow',
      summary: 'Make the assistant verify before completion claims.',
      target_workspace: '~/.openclaw/workspace',
      source_profile_id: 'bp_001',
      intent_type: 'refine_existing',
      support_level: 'supported',
      risk_level: 'medium',
      changes: [baseChange],
      warnings: [],
      post_apply_checks: [
        {
          check_id: 'check_bootstrap_exists',
          type: 'structure_check',
          title: 'Ensure bootstrap file exists',
          success_criteria: 'Target file exists.',
          blocking: true,
        },
        {
          check_id: 'smoke_coding_verify_first',
          type: 'smoke_test',
          title: 'Verify the assistant prefers validation before completion',
          success_criteria: 'Output should mention verification before completion claims.',
          blocking: true,
        },
      ],
      template_tags: ['coding', 'verification'],
      requires_user_confirmation: true,
    });

    expect(plan.plan_id).toBe('plan_001');
    expect(plan.changes).toHaveLength(1);
  });

  it('rejects unsupported plans that still contain changes', () => {
    expect(() =>
      parseBuildPlan({
        plan_id: 'plan_002',
        version: 'v1',
        title: 'Unsupported plan',
        summary: 'Should not apply.',
        target_workspace: '~/.openclaw/workspace',
        source_profile_id: 'bp_001',
        intent_type: 'refine_existing',
        support_level: 'unsupported',
        risk_level: 'low',
        changes: [baseChange],
        warnings: [],
        post_apply_checks: [],
        template_tags: [],
        requires_user_confirmation: true,
      }),
    ).toThrow(/unsupported/i);
  });

  it('rejects changes without validation links', () => {
    expect(() =>
      parseBuildPlan({
        plan_id: 'plan_003',
        version: 'v1',
        title: 'Missing validation link',
        summary: 'Should fail.',
        target_workspace: '~/.openclaw/workspace',
        source_profile_id: 'bp_001',
        intent_type: 'refine_existing',
        support_level: 'supported',
        risk_level: 'medium',
        changes: [
          {
            ...baseChange,
            validation_links: [],
          },
        ],
        warnings: [],
        post_apply_checks: [],
        template_tags: [],
        requires_user_confirmation: true,
      }),
    ).toThrow(/validation_links/i);
  });

  it('rejects high-risk changes when confirmation is false', () => {
    expect(() =>
      parseBuildPlan({
        plan_id: 'plan_004',
        version: 'v1',
        title: 'High risk plan',
        summary: 'Should fail.',
        target_workspace: '~/.openclaw/workspace',
        source_profile_id: 'bp_001',
        intent_type: 'refine_existing',
        support_level: 'supported',
        risk_level: 'high',
        changes: [
          {
            ...baseChange,
            risk_level: 'high',
            requires_confirmation: false,
          },
        ],
        warnings: [],
        post_apply_checks: [],
        template_tags: [],
        requires_user_confirmation: true,
      }),
    ).toThrow(/confirmation/i);
  });

  it('rejects unexpected top-level fields', () => {
    expect(() =>
      parseBuildPlan({
        plan_id: 'plan_005',
        version: 'v1',
        title: 'Unexpected fields',
        summary: 'Should fail.',
        target_workspace: '~/.openclaw/workspace',
        source_profile_id: 'bp_001',
        intent_type: 'refine_existing',
        support_level: 'supported',
        risk_level: 'medium',
        changes: [baseChange],
        warnings: [],
        post_apply_checks: [],
        template_tags: [],
        requires_user_confirmation: true,
        extra_field: 'nope',
      }),
    ).toThrow(/unexpected field/i);
  });
});
