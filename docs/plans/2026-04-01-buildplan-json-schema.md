# BuildPlan JSON Schema

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Define a constrained BuildPlan schema that turns a Behavior Profile into reviewable, selectable, reversible workspace changes without allowing the LLM to improvise dangerous operations.

**Architecture:** The BuildPlan sits between Behavior Profile extraction and Apply Engine execution. It is the only object the LLM may output for proposed changes. The Apply Engine must consume only schema-valid BuildPlans. Every change item must carry intent, scope, risk, validation linkage, and a deterministic execution path.

**Tech Stack:** JSON Schema, TypeScript types, SQLite JSON storage, file diff engine, local filesystem adapter, validation pipeline.

---

## 1. 文档目的

`BuildPlan` 是 ClawWorkbench 的第二层核心结构。

如果说 `Behavior Profile` 负责定义“用户想让龙虾变成什么样”，那么 `BuildPlan` 负责定义：

> 为了让龙虾更接近这个目标，系统准备做哪些受控改动。

它必须同时满足四个条件：

1. 人能读懂
2. 系统能校验
3. 用户能筛选
4. Apply Engine 能确定执行

MVP 第一版必须把 `BuildPlan` 当成`唯一合法改动载体`。
不能允许 LLM 直接输出“建议改这个文件”然后绕过 schema。

---

## 2. 设计原则

### 原则 1：LLM 只能提案，不能直接执行

`BuildPlan` 是提案对象，不是执行结果。
Apply Engine 必须在 schema 校验、路径校验、风险校验后才可落地。

### 原则 2：所有 change 都必须可解释

每个 change 都必须回答：

* 改什么
* 为什么改
* 影响什么画像字段
* 有什么风险
* 应用后怎么验证

### 原则 3：默认支持最少 change 类型

MVP 只允许以下类型：

* `create_file`
* `update_file`
* `create_folder`
* `install_skill`

其他能力一律不进第一版。

### 原则 4：选择权在用户

用户必须能逐项查看、逐项勾选、逐项拒绝。
这要求每个 change 自身必须完整，而不是依赖上下文猜测。

### 原则 5：每个 change 必须可回滚

如果无法安全记录和反向恢复，该 change 不应进入 MVP。

---

## 3. 顶层结构

推荐第一版 `BuildPlan` 顶层如下：

```json
{
  "plan_id": "plan_001",
  "version": "v1",
  "title": "Tighten coding workflow for disciplined execution",
  "summary": "Adjust workspace files and install skills so the assistant verifies changes before claiming completion.",
  "target_workspace": "~/.openclaw/workspace",
  "source_profile_id": "bp_001",
  "intent_type": "refine_existing",
  "support_level": "supported",
  "risk_level": "medium",
  "changes": [],
  "warnings": [],
  "post_apply_checks": [],
  "template_tags": ["coding", "strict", "verification"],
  "requires_user_confirmation": true
}
```

顶层对象必须短、清晰、可直接展示在 Review 页。

---

## 4. 顶层字段定义

### `plan_id`

类型：`string`

规则：

* 系统生成
* revision、logs、rollback 关联主键

### `version`

类型：`"v1"`

规则：

* 当前固定为 `v1`

### `title`

类型：`string`

规则：

* 一句话概括计划目标
* 适合直接显示在 Review 页面标题

### `summary`

类型：`string`

规则：

* 1 到 3 句
* 解释这份 BuildPlan 想实现什么行为变化

### `target_workspace`

类型：`string`

规则：

* 必须指向已识别 workspace 根目录
* 不允许任意系统目录

### `source_profile_id`

类型：`string`

作用：

* 关联输入画像
* 用于 validation 对比

### `intent_type`

类型：`"create_new" | "refine_existing" | "repair_existing" | "template_apply"`

作用：

* 区分这次计划是在新建、微调、修复还是套模板

### `support_level`

类型：`"supported" | "partial" | "unsupported"`

规则：

* 必须与画像层一致或更保守
* `unsupported` 时禁止进入 Apply Engine

### `risk_level`

类型：`"low" | "medium" | "high"`

规则：

* 由 change 集合聚合得出
* 用于 Review 页和确认策略

### `changes`

类型：`BuildPlanChange[]`

规则：

* 至少 1 项
* 每项必须独立可解释

### `warnings`

类型：`BuildPlanWarning[]`

作用：

* 显示 caveat、超范围、信息不足、需用户确认的事项

### `post_apply_checks`

类型：`PostApplyCheck[]`

作用：

* 定义 apply 后必须执行的验证动作

### `template_tags`

类型：`string[]`

作用：

* 帮助 revision 和 template 保存时分类

### `requires_user_confirmation`

类型：`boolean`

规则：

* MVP 默认建议始终为 `true`
* 高风险计划必须为 `true`

---

## 5. `changes[]` 通用结构

所有 change 项都必须共享一层统一字段：

```json
{
  "change_id": "chg_001",
  "type": "update_file",
  "title": "Strengthen coding instructions in bootstrap file",
  "reason": "The target profile prefers rigorous verification before completion.",
  "target_path": "workspace/AGENTS.md",
  "risk_level": "medium",
  "profile_links": ["reasoning_style", "workflow_style", "risk_posture"],
  "validation_links": ["check_bootstrap_exists", "smoke_coding_verify_first"],
  "requires_confirmation": true,
  "payload": {}
}
```

### 通用字段定义

#### `change_id`

类型：`string`

作用：

* 用于 UI 勾选、日志、apply 结果映射

#### `type`

类型：

* `"create_file"`
* `"update_file"`
* `"create_folder"`
* `"install_skill"`

#### `title`

类型：`string`

规则：

* 一眼能看懂这项改动是干什么的

#### `reason`

类型：`string`

规则：

* 必须明确指出与目标画像的关系
* 禁止空泛文案，例如“为了更好地帮助用户”

#### `target_path`

类型：`string`

规则：

* 必须位于受控 workspace 或受控 skills 范围内
* 不能指向任意系统路径

#### `risk_level`

类型：`"low" | "medium" | "high"`

作用：

* 单项风险标记

#### `profile_links`

类型：`string[]`

规则：

* 只能引用已知 `Behavior Profile` 字段
* 用于说明这项改动服务于哪些画像维度

#### `validation_links`

类型：`string[]`

规则：

* 引用 `post_apply_checks` 中的 check id
* 让每项改动都能找到对应验证

#### `requires_confirmation`

类型：`boolean`

规则：

* 高风险或覆盖现有文件时必须为 `true`

#### `payload`

类型：`object`

规则：

* 按 `type` 不同采用不同子结构

---

## 6. 各 change 类型子结构

### 6.1 `create_file`

用于创建不存在的新文件。

```json
{
  "type": "create_file",
  "payload": {
    "file_kind": "bootstrap",
    "content": "...",
    "overwrite_if_exists": false
  }
}
```

#### `payload` 字段

* `file_kind`: `"bootstrap" | "config" | "template_asset" | "workspace_doc"`
* `content`: `string`
* `overwrite_if_exists`: `boolean`

规则：

* MVP 默认 `overwrite_if_exists = false`
* 若文件已存在，应转为 `update_file`，不能伪装成创建

### 6.2 `update_file`

用于修改已有文件。

```json
{
  "type": "update_file",
  "payload": {
    "file_kind": "bootstrap",
    "update_mode": "replace_section",
    "before_summary": "Current file is too generic and lacks verification rules.",
    "after_summary": "Updated file emphasizes verification-first workflow and strict completion claims.",
    "proposed_content": "...",
    "diff_hint": "Add explicit testing and verification instructions."
  }
}
```

#### `payload` 字段

* `file_kind`: `"bootstrap" | "config" | "template_asset" | "workspace_doc"`
* `update_mode`: `"replace_full" | "replace_section" | "append_section"`
* `before_summary`: `string`
* `after_summary`: `string`
* `proposed_content`: `string`
* `diff_hint`: `string`

规则：

* Apply Engine 负责真正生成 diff
* LLM 不得输出 patch 命令
* `replace_full` 仅用于小文件或明确可安全覆盖的文件

### 6.3 `create_folder`

用于创建受控目录。

```json
{
  "type": "create_folder",
  "payload": {
    "folder_kind": "skills",
    "must_be_empty": false
  }
}
```

#### `payload` 字段

* `folder_kind`: `"skills" | "templates" | "workspace_support"`
* `must_be_empty`: `boolean`

规则：

* 仅允许创建白名单目录

### 6.4 `install_skill`

用于安装或注册受控 skill。

```json
{
  "type": "install_skill",
  "payload": {
    "skill_source": "managed_catalog",
    "skill_name": "verification-before-completion",
    "install_target": "workspace",
    "source_ref": "catalog://verification-before-completion",
    "compatibility_note": "Fits coding profile with verify-first workflow."
  }
}
```

#### `payload` 字段

* `skill_source`: `"workspace_local" | "managed_catalog" | "bundled"`
* `skill_name`: `string`
* `install_target`: `"workspace" | "managed"`
* `source_ref`: `string`
* `compatibility_note`: `string`

规则：

* 必须记录来源
* 不允许匿名远程下载
* 高风险第三方 skill 不进入 MVP

---

## 7. `warnings[]` 结构

推荐结构：

```json
{
  "warning_id": "warn_001",
  "level": "medium",
  "code": "restart_may_be_required",
  "message": "This workspace may require a new OpenClaw session before bootstrap changes fully take effect."
}
```

字段定义：

* `warning_id`: `string`
* `level`: `"low" | "medium" | "high"`
* `code`: `string`
* `message`: `string`

典型 warning code：

* `partial_support`
* `restart_may_be_required`
* `existing_file_will_be_modified`
* `skill_compatibility_needs_review`
* `target_outside_mvp_scope`

---

## 8. `post_apply_checks[]` 结构

推荐结构：

```json
{
  "check_id": "smoke_coding_verify_first",
  "type": "smoke_test",
  "title": "Verify coding assistant favors validation before completion claims",
  "success_criteria": "Output should mention inspection or verification before declaring success.",
  "blocking": true
}
```

字段定义：

* `check_id`: `string`
* `type`: `"self_check" | "structure_check" | "skill_check" | "caveat_check" | "smoke_test"`
* `title`: `string`
* `success_criteria`: `string`
* `blocking`: `boolean`

规则：

* 每个 BuildPlan 至少包含 1 个 `structure_check`
* 每个 BuildPlan 至少包含 1 个 `smoke_test`
* 任何 `install_skill` change 必须关联 1 个 `skill_check`

---

## 9. 顶层字段到下游的映射

| 字段 | Review UI | Apply Engine | Validation | Revision |
| --- | --- | --- | --- | --- |
| `title` | 高 | 低 | 低 | 高 |
| `summary` | 高 | 低 | 中 | 高 |
| `support_level` | 高 | 高 | 中 | 中 |
| `risk_level` | 高 | 高 | 中 | 中 |
| `changes` | 高 | 高 | 高 | 高 |
| `warnings` | 高 | 中 | 高 | 中 |
| `post_apply_checks` | 中 | 中 | 高 | 中 |
| `template_tags` | 中 | 低 | 低 | 高 |

这个映射的意义是约束 BuildPlan 不要长成“大杂烩状态包”。

---

## 10. MVP 明确禁止的能力

BuildPlan 第一版不得包含以下 change 类型：

* `delete_file`
* `delete_folder`
* `run_script`
* `execute_command`
* `modify_arbitrary_path`
* `download_remote_asset`
* `edit_system_config`
* `apply_without_review`

原因：

* 风险过高
* 用户难以信任
* 回滚复杂
* 会让产品边界失控

---

## 11. 推荐 JSON Schema 约束

第一版推荐增加这些硬约束：

* 顶层 `additionalProperties = false`
* 所有 change 项 `additionalProperties = false`
* `changes.length >= 1`
* `warnings.length >= 0`
* `post_apply_checks.length >= 1`
* `risk_level` 必须由 change 集合聚合，不允许与子项矛盾
* `support_level = unsupported` 时：
  * `changes.length = 0`
  * `requires_user_confirmation = true`
* 任何 `high` 风险 change：
  * `requires_confirmation = true`

---

## 12. 三个示例

### 示例 A：Coding 场景

```json
{
  "plan_id": "plan_coding_001",
  "version": "v1",
  "title": "Tighten coding workflow for rigorous delivery",
  "summary": "Update workspace instructions and install verification-oriented skills so the assistant validates before claiming completion.",
  "target_workspace": "~/.openclaw/workspace",
  "source_profile_id": "bp_coding_001",
  "intent_type": "refine_existing",
  "support_level": "supported",
  "risk_level": "medium",
  "changes": [
    {
      "change_id": "chg_001",
      "type": "update_file",
      "title": "Strengthen workspace bootstrap rules",
      "reason": "The target profile asks for rigorous reasoning and verification-first workflow.",
      "target_path": "workspace/AGENTS.md",
      "risk_level": "medium",
      "profile_links": ["reasoning_style", "workflow_style", "risk_posture"],
      "validation_links": ["check_bootstrap_exists", "smoke_coding_verify_first"],
      "requires_confirmation": true,
      "payload": {
        "file_kind": "bootstrap",
        "update_mode": "replace_section",
        "before_summary": "Current instructions are broad and do not force verification before completion.",
        "after_summary": "Instructions explicitly require inspection and verification before completion claims.",
        "proposed_content": "Updated bootstrap content here",
        "diff_hint": "Add explicit verification and testing requirements."
      }
    },
    {
      "change_id": "chg_002",
      "type": "install_skill",
      "title": "Install verification-oriented skill",
      "reason": "The target profile benefits from stronger completion verification discipline.",
      "target_path": "workspace/skills/verification-before-completion",
      "risk_level": "low",
      "profile_links": ["workflow_style", "reasoning_style"],
      "validation_links": ["check_skill_installed", "smoke_coding_verify_first"],
      "requires_confirmation": false,
      "payload": {
        "skill_source": "managed_catalog",
        "skill_name": "verification-before-completion",
        "install_target": "workspace",
        "source_ref": "catalog://verification-before-completion",
        "compatibility_note": "Matches coding profile that prioritizes verification."
      }
    }
  ],
  "warnings": [
    {
      "warning_id": "warn_001",
      "level": "medium",
      "code": "restart_may_be_required",
      "message": "A new OpenClaw session may be required for bootstrap changes to fully take effect."
    }
  ],
  "post_apply_checks": [
    {
      "check_id": "check_bootstrap_exists",
      "type": "structure_check",
      "title": "Ensure bootstrap file exists and is readable",
      "success_criteria": "Target file exists and content hash matches applied revision.",
      "blocking": true
    },
    {
      "check_id": "check_skill_installed",
      "type": "skill_check",
      "title": "Ensure verification skill is installed",
      "success_criteria": "Skill appears in the expected workspace skill path.",
      "blocking": true
    },
    {
      "check_id": "smoke_coding_verify_first",
      "type": "smoke_test",
      "title": "Verify the assistant prefers validation before claiming completion",
      "success_criteria": "Smoke test output explicitly checks or references verification before final completion.",
      "blocking": true
    }
  ],
  "template_tags": ["coding", "verification", "strict"],
  "requires_user_confirmation": true
}
```

### 示例 B：Research 场景

重点特征：

* 更偏 `update_file`
* 更少技能安装
* 更重 `review_then_act`
* smoke test 更关注信息收集和不确定性表达

### 示例 C：Content 场景

重点特征：

* 更偏语气和结构模板调整
* 更关注目标终点一致性
* 可包含 `partial_support` warning

---

## 13. 与 Behavior Profile 的关系

BuildPlan 不是独立生成的，它必须显式依赖画像字段。

最低要求如下：

* `primary_template` 决定计划骨架
* `workflow_style` 决定 change 的顺序与 validation 重点
* `risk_posture` 决定风险等级和确认要求
* `boundary_mode` 决定 warning 和 support_level 表达
* `goal_orientation` 决定 summary、reason 和 smoke test 的倾向

如果一个 BuildPlan 看不出这些映射关系，那它就仍然是“LLM 自由发挥”。

---

## 14. 下一步建议

这份文档完成后，应立即补两样东西：

1. `Validation Rubric`
   让 `post_apply_checks` 有明确评分依据。

2. `BuildPlan Generation Prompt Contract`
   明确 LLM 生成 BuildPlan 时的输入、输出和禁止行为。

否则 schema 只是形式正确，不能保证行为稳定。

