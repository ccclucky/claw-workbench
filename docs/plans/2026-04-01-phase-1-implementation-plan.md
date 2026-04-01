# Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the first credible ClawWorkbench application that can discover a workspace, derive a behavior profile, generate a constrained BuildPlan, preview/apply changes, and run validation.

**Architecture:** Implement a local-first Tauri app with a React frontend and a Rust-backed local adapter boundary. Keep domain logic in shared TypeScript modules so schemas, planning, review, and validation stay testable without the desktop shell. Treat filesystem access, revision storage, and apply operations as explicit services behind narrow interfaces.

**Tech Stack:** Tauri 2, React, TypeScript, Vite, Rust, SQLite, Zod or JSON Schema validators, Vitest, Playwright or component-level smoke tests.

---

## Implementation Notes

Assume the repo is still at planning stage. This plan includes project bootstrap tasks because the current workspace does not yet contain application code.

Prefer this directory layout:

* `src/` for frontend app code
* `src/features/behavior-profile/`
* `src/features/build-plan/`
* `src/features/review-apply/`
* `src/features/validation/`
* `src/lib/schema/`
* `src/lib/state/`
* `src/lib/api/`
* `src-tauri/` for desktop backend
* `tests/` for non-UI integration tests

Use the existing planning docs as source of truth:

* [MVP 路线图](/Users/cclucky/developer/personal/claw-workbench/docs/plans/2026-04-01-clawworkbench-mvp-roadmap.md)
* [Behavior Profile Schema](/Users/cclucky/developer/personal/claw-workbench/docs/plans/2026-04-01-behavior-profile-schema.md)
* [BuildPlan JSON Schema](/Users/cclucky/developer/personal/claw-workbench/docs/plans/2026-04-01-buildplan-json-schema.md)
* [Validation Rubric](/Users/cclucky/developer/personal/claw-workbench/docs/plans/2026-04-01-validation-rubric.md)
* [Prompt Contract](/Users/cclucky/developer/personal/claw-workbench/docs/plans/2026-04-01-buildplan-generation-prompt-contract.md)

---

### Task 1: Bootstrap Project Shell

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `src-tauri/Cargo.toml`
- Create: `src-tauri/src/main.rs`
- Create: `src-tauri/tauri.conf.json`

**Step 1: Write the failing shell smoke test**

Create `tests/app-shell.test.ts` with a basic assertion that the app exports a root component and route shell.

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/app-shell.test.ts`
Expected: FAIL because project files and test runner are not configured yet.

**Step 3: Add minimal frontend and Tauri shell**

Create the minimal Vite React app and Tauri shell so the app boots to a placeholder home page.

**Step 4: Configure test runner**

Add Vitest config and npm scripts so the shell smoke test can run.

**Step 5: Run test to verify it passes**

Run: `npm test -- tests/app-shell.test.ts`
Expected: PASS.

**Step 6: Commit**

```bash
git add package.json tsconfig.json vite.config.ts index.html src/main.tsx src/App.tsx src/styles.css src-tauri/Cargo.toml src-tauri/src/main.rs src-tauri/tauri.conf.json tests/app-shell.test.ts
git commit -m "feat: bootstrap tauri react app shell"
```

---

### Task 2: Implement Domain Schemas

**Files:**
- Create: `src/lib/schema/behaviorProfile.ts`
- Create: `src/lib/schema/buildPlan.ts`
- Create: `src/lib/schema/validationResult.ts`
- Create: `tests/schema/behavior-profile.test.ts`
- Create: `tests/schema/build-plan.test.ts`

**Step 1: Write failing schema tests**

Cover:

* valid coding profile parses
* invalid enum is rejected
* unsupported BuildPlan with changes is rejected
* BuildPlan change without validation link is rejected

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/schema/behavior-profile.test.ts tests/schema/build-plan.test.ts`
Expected: FAIL because schema modules do not exist.

**Step 3: Implement strict schemas**

Use Zod or equivalent to encode the documented schema constraints, including:

* no extra fields
* enum restrictions
* conditional BuildPlan rules

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/schema/behavior-profile.test.ts tests/schema/build-plan.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/lib/schema/behaviorProfile.ts src/lib/schema/buildPlan.ts src/lib/schema/validationResult.ts tests/schema/behavior-profile.test.ts tests/schema/build-plan.test.ts
git commit -m "feat: add core planning schemas"
```

---

### Task 3: Add Workspace Discovery Service

**Files:**
- Create: `src-tauri/src/workspace.rs`
- Create: `src/lib/api/workspace.ts`
- Create: `src/features/workspace-discovery/model.ts`
- Create: `tests/workspace/workspace-discovery.test.ts`

**Step 1: Write failing discovery tests**

Cover:

* detects default workspace path when present
* supports manual path fallback
* returns key file and skill summary

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/workspace/workspace-discovery.test.ts`
Expected: FAIL because discovery service does not exist.

**Step 3: Implement backend command and frontend adapter**

Add a Tauri command that:

* checks default workspace path
* accepts manual path
* returns a normalized workspace snapshot object

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/workspace/workspace-discovery.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src-tauri/src/workspace.rs src/lib/api/workspace.ts src/features/workspace-discovery/model.ts tests/workspace/workspace-discovery.test.ts
git commit -m "feat: add workspace discovery service"
```

---

### Task 4: Build Behavior Profile Generator

**Files:**
- Create: `src/features/behavior-profile/extractor.ts`
- Create: `src/features/behavior-profile/prompt.ts`
- Create: `src/features/behavior-profile/types.ts`
- Create: `tests/behavior-profile/extractor.test.ts`

**Step 1: Write failing extraction tests**

Cover:

* coding-style user request maps to strict coding profile
* partial support request produces `support_level = partial`
* ambiguous request lowers confidence instead of overfitting

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/behavior-profile/extractor.test.ts`
Expected: FAIL because extractor does not exist.

**Step 3: Implement generator boundary**

Implement a service that:

* accepts raw intent plus mode
* calls an LLM adapter or stub
* validates result against `BehaviorProfile` schema
* returns safe fallback error states

Use stubbed generation in tests.

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/behavior-profile/extractor.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/features/behavior-profile/extractor.ts src/features/behavior-profile/prompt.ts src/features/behavior-profile/types.ts tests/behavior-profile/extractor.test.ts
git commit -m "feat: add behavior profile generator"
```

---

### Task 5: Build BuildPlan Generator

**Files:**
- Create: `src/features/build-plan/generator.ts`
- Create: `src/features/build-plan/prompt.ts`
- Create: `src/features/build-plan/ruleMapping.ts`
- Create: `tests/build-plan/generator.test.ts`

**Step 1: Write failing generator tests**

Cover:

* valid coding profile produces only allowed change types
* high-risk changes require confirmation
* unsupported request yields zero changes
* every change includes validation links

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/build-plan/generator.test.ts`
Expected: FAIL because generator does not exist.

**Step 3: Implement prompt contract and schema gate**

Implement a service that:

* assembles prompt input from profile, workspace snapshot, rule registry
* parses JSON-only output
* validates against BuildPlan schema
* rejects forbidden operations with explicit errors

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/build-plan/generator.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/features/build-plan/generator.ts src/features/build-plan/prompt.ts src/features/build-plan/ruleMapping.ts tests/build-plan/generator.test.ts
git commit -m "feat: add constrained build plan generator"
```

---

### Task 6: Implement Review UI

**Files:**
- Create: `src/features/review-apply/ReviewPage.tsx`
- Create: `src/features/review-apply/ChangeList.tsx`
- Create: `src/features/review-apply/WarningPanel.tsx`
- Create: `src/features/review-apply/PlanSummary.tsx`
- Create: `tests/review/review-page.test.tsx`

**Step 1: Write failing review page tests**

Cover:

* renders plan summary
* shows warnings
* allows selecting and deselecting individual changes

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/review/review-page.test.tsx`
Expected: FAIL because review UI does not exist.

**Step 3: Implement minimal Review screen**

Build a single page that:

* shows plan title and summary
* lists changes with reasons and risk
* allows checkbox selection per change

Do not build full design system first.

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/review/review-page.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/features/review-apply/ReviewPage.tsx src/features/review-apply/ChangeList.tsx src/features/review-apply/WarningPanel.tsx src/features/review-apply/PlanSummary.tsx tests/review/review-page.test.tsx
git commit -m "feat: add build plan review ui"
```

---

### Task 7: Implement Diff and Apply Pipeline

**Files:**
- Create: `src-tauri/src/apply.rs`
- Create: `src/lib/api/apply.ts`
- Create: `src/features/review-apply/applyModel.ts`
- Create: `src/features/review-apply/DiffPreview.tsx`
- Create: `tests/apply/apply-pipeline.test.ts`

**Step 1: Write failing apply tests**

Cover:

* selected changes only are applied
* revision is created after apply
* file updates are reversible

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/apply/apply-pipeline.test.ts`
Expected: FAIL because apply service does not exist.

**Step 3: Implement Apply Engine**

Implement backend logic that:

* receives selected BuildPlan changes
* writes files in controlled paths
* records revision metadata and snapshots
* returns diff/apply result summary

**Step 4: Implement diff preview component**

Render a minimal side-by-side or inline diff based on generated before/after content.

**Step 5: Run tests to verify they pass**

Run: `npm test -- tests/apply/apply-pipeline.test.ts`
Expected: PASS.

**Step 6: Commit**

```bash
git add src-tauri/src/apply.rs src/lib/api/apply.ts src/features/review-apply/applyModel.ts src/features/review-apply/DiffPreview.tsx tests/apply/apply-pipeline.test.ts
git commit -m "feat: add diff and apply pipeline"
```

---

### Task 8: Add Revision and Rollback

**Files:**
- Create: `src-tauri/src/revisions.rs`
- Create: `src/lib/api/revisions.ts`
- Create: `src/features/revisions/RevisionsPage.tsx`
- Create: `tests/revisions/rollback.test.ts`

**Step 1: Write failing rollback tests**

Cover:

* revision history is listed newest first
* rollback restores prior file state
* rollback re-runs validation placeholder

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/revisions/rollback.test.ts`
Expected: FAIL because revisions service does not exist.

**Step 3: Implement revision storage and rollback**

Use SQLite metadata plus stored snapshots or deterministic rollback payloads.

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/revisions/rollback.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src-tauri/src/revisions.rs src/lib/api/revisions.ts src/features/revisions/RevisionsPage.tsx tests/revisions/rollback.test.ts
git commit -m "feat: add revision history and rollback"
```

---

### Task 9: Implement Validation Pipeline

**Files:**
- Create: `src/features/validation/runner.ts`
- Create: `src/features/validation/scoring.ts`
- Create: `src/features/validation/defaultSmokeTests.ts`
- Create: `src/features/validation/ValidationPage.tsx`
- Create: `tests/validation/runner.test.ts`

**Step 1: Write failing validation tests**

Cover:

* structure failures block overall pass
* runtime warnings downgrade status
* behavior score aggregates six dimensions
* coding smoke tests generate findings when workflow is too loose

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/validation/runner.test.ts`
Expected: FAIL because validation runner does not exist.

**Step 3: Implement validation runner**

Implement:

* structure checks
* runtime/caveat checks
* behavior dimension scoring
* user-facing findings and next actions

**Step 4: Build minimal validation page**

Render:

* overall status
* score
* findings
* behavior deltas

**Step 5: Run tests to verify they pass**

Run: `npm test -- tests/validation/runner.test.ts`
Expected: PASS.

**Step 6: Commit**

```bash
git add src/features/validation/runner.ts src/features/validation/scoring.ts src/features/validation/defaultSmokeTests.ts src/features/validation/ValidationPage.tsx tests/validation/runner.test.ts
git commit -m "feat: add validation pipeline"
```

---

### Task 10: Add Local Persistence and Settings

**Files:**
- Create: `src-tauri/src/db.rs`
- Create: `src-tauri/src/settings.rs`
- Create: `src/lib/api/settings.ts`
- Create: `src/features/settings/SettingsPage.tsx`
- Create: `tests/settings/settings-store.test.ts`

**Step 1: Write failing settings tests**

Cover:

* persists workspace path
* persists provider/baseURL/model values
* restores last-used workspace on app load

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/settings/settings-store.test.ts`
Expected: FAIL because settings store does not exist.

**Step 3: Implement local persistence**

Store:

* settings
* workspaces
* revisions metadata
* templates metadata

Do not over-model templates yet.

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/settings/settings-store.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src-tauri/src/db.rs src-tauri/src/settings.rs src/lib/api/settings.ts src/features/settings/SettingsPage.tsx tests/settings/settings-store.test.ts
git commit -m "feat: add local settings persistence"
```

---

### Task 11: Integrate Happy Path Navigation

**Files:**
- Modify: `src/App.tsx`
- Create: `src/lib/state/appState.ts`
- Create: `src/features/home/HomePage.tsx`
- Create: `tests/flow/happy-path.test.tsx`

**Step 1: Write failing flow test**

Cover the core path:

* discover workspace
* confirm behavior profile
* review BuildPlan
* apply selected changes
* view validation result

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/flow/happy-path.test.tsx`
Expected: FAIL because pages are not connected.

**Step 3: Implement minimal app state and route flow**

Use one simple state container. Avoid premature global architecture.

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/flow/happy-path.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/App.tsx src/lib/state/appState.ts src/features/home/HomePage.tsx tests/flow/happy-path.test.tsx
git commit -m "feat: connect phase 1 happy path"
```

---

### Task 12: Add Template Save and Reuse

**Files:**
- Create: `src/features/templates/templateService.ts`
- Create: `src/features/templates/TemplatesPage.tsx`
- Create: `tests/templates/template-reuse.test.ts`

**Step 1: Write failing template tests**

Cover:

* saves template from revision
* stores template tags
* reopens template as new plan seed

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/templates/template-reuse.test.ts`
Expected: FAIL because template service does not exist.

**Step 3: Implement minimal template layer**

Reuse revision data where possible. Do not build a full market or sharing model.

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/templates/template-reuse.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/features/templates/templateService.ts src/features/templates/TemplatesPage.tsx tests/templates/template-reuse.test.ts
git commit -m "feat: add template save and reuse"
```

---

### Task 13: Final Verification

**Files:**
- Modify: `README.md`
- Create: `tests/flow/phase1-regression.test.ts`

**Step 1: Write a regression checklist test**

Cover the main invariants:

* no unsupported BuildPlan can be applied
* all changes have validation links
* rollback remains available after apply

**Step 2: Run targeted test suite**

Run:

```bash
npm test -- tests/schema tests/workspace tests/behavior-profile tests/build-plan tests/review tests/apply tests/revisions tests/validation tests/settings tests/flow tests/templates
```

Expected: PASS.

**Step 3: Run app build verification**

Run:

```bash
npm run build
cargo test --manifest-path src-tauri/Cargo.toml
```

Expected: PASS.

**Step 4: Update README**

Document:

* what Phase 1 does
* how to run the app
* where local data is stored
* current non-goals

**Step 5: Commit**

```bash
git add README.md tests/flow/phase1-regression.test.ts
git commit -m "docs: finalize phase 1 implementation and verification"
```

