# BuildPlan Generation Prompt Contract

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Define the exact input contract, output contract, allowed reasoning scope, and forbidden behaviors for the LLM that generates BuildPlans from a Behavior Profile plus local OpenClaw context.

**Architecture:** The contract sits between the UI/Plan Engine and the LLM. It specifies what context must be provided, how that context is framed, what the LLM is responsible for, what it is explicitly not allowed to do, and how failures are handled. The LLM is treated as a constrained planner, not an autonomous editor.

**Tech Stack:** Structured prompt assembly, JSON-only output mode, JSON Schema validation, prompt templates, local rule registry injection.

---

## 1. 文档目的

前面三份文档已经定义了：

* 用户要什么：`Behavior Profile`
* 计划长什么样：`BuildPlan JSON Schema`
* 如何证明更像了：`Validation Rubric`

但如果没有生成层 contract，实际运行时仍然会出现一个典型问题：

> 模型看起来知道 schema，但在具体生成时还是会自由发挥。

这份 contract 的目的就是解决这个问题。

它不负责描述产品价值，而负责定义：

* 模型拿到什么输入
* 模型允许做什么推断
* 模型必须输出什么
* 模型绝不能输出什么
* 模型不确定时该如何降级

换句话说，它把 LLM 从“聪明的建议器”降格为“受控的计划生成器”。

---

## 2. 模型角色定义

在 BuildPlan 生成阶段，LLM 的角色必须固定为：

> 一个受控的本地工作区变更规划器，根据目标画像和规则基线，生成可预览、可筛选、可回滚、可验证的改动提案。

它不是：

* 代码执行器
* 文件系统操作者
* 任意目录编辑器
* shell 指令生成器
* 自动安装器
* 黑盒 agent

模型的责任只有两个：

1. 根据输入上下文推导最小必要改动
2. 用严格 JSON 产出 schema 合法的 BuildPlan

---

## 3. 输入契约

每次调用 BuildPlan 生成模型时，输入上下文必须包含且只应包含以下几类信息。

### 输入 A：用户原始意图

内容：

* chat 输入或 form 输入的原文
* 当前输入模式
* 用户是否已确认行为画像

作用：

* 保留用户原始意图
* 用于必要时解释 `partial` 或 `unsupported`

注意：

* 不应让模型再次从头做人设理解
* 画像已经确认时，原始意图只作为辅助参考

### 输入 B：Behavior Profile

内容：

* 完整的 schema 合法画像对象

作用：

* 作为生成 BuildPlan 的主输入

规则：

* 模型必须优先相信画像对象，而不是原始自由文本
* 若两者冲突，以画像为准，并在 warning 中提示

### 输入 C：Workspace Snapshot

内容建议：

* workspace 根路径
* 受控文件清单
* 关键文件存在性摘要
* 当前 skills 摘要
* 最近 revision 摘要

作用：

* 让模型知道当前是新建还是微调
* 避免重复创建已有文件

规则：

* 提供摘要，不要塞整仓库全文
* 只给和改动决策直接相关的高信号上下文

### 输入 D：Rule Registry

内容：

* injected files
* optional files
* first-run only files
* skill search paths
* precedence rules
* unsupported operations
* known runtime caveats

作用：

* 告诉模型“什么理论上能做”“什么当前版本不该做”

规则：

* 规则层优先于模型偏好
* 模型必须引用这些规则来决定 change 类型和 warning

### 输入 E：BuildPlan Schema Contract

内容：

* 顶层字段定义
* `changes[]` 允许类型
* `warnings[]` 结构
* `post_apply_checks[]` 结构

作用：

* 告诉模型输出对象长什么样

### 输入 F：Validation Hints

内容：

* 对应模板默认 smoke tests
* 画像字段与 validation 维度的映射摘要

作用：

* 让模型生成的每个 change 都带着验证目标

---

## 4. 模型允许的推断范围

模型可以做的推断必须限制在以下范围内。

### 允许 1：最小必要改动推断

模型可以根据画像和当前 workspace 状态，判断：

* 哪些文件最值得改
* 是否需要安装 skill
* 是否需要创建支持目录

但必须坚持最小改动原则。

### 允许 2：风险等级推断

模型可以根据：

* 文件覆盖程度
* 路径敏感性
* skill 来源
* caveat 命中情况

推断 `low / medium / high` 风险。

### 允许 3：验证动作推断

模型可以为每项 change 绑定合理的 `post_apply_checks`。

### 允许 4：部分支持判定

当用户目标超出 MVP 边界时，模型可以输出：

* `support_level = partial`
* `warnings[]`
* `unsupported_expectations` 对应说明

### 允许 5：模板倾向推断

若用户输入模糊但画像已固定，模型可依据 `primary_template` 推导改动骨架。

---

## 5. 模型禁止的行为

以下行为必须明确禁止。

### 禁止 1：输出非 JSON 说明文

模型最终输出必须是单一 schema 合法 JSON。
不得夹带解释、markdown、注释、前言、后记。

### 禁止 2：输出未授权 change 类型

不得生成：

* `delete_file`
* `delete_folder`
* `run_script`
* `execute_command`
* `download_remote_asset`
* `modify_arbitrary_path`
* `edit_system_config`

### 禁止 3：假设自己拥有执行权限

模型不得输出：

* shell 命令
* patch 命令
* “直接运行以下命令”
* “请执行以下脚本”

它只能描述 `BuildPlan`。

### 禁止 4：越过规则包

如果 Rule Registry 标明某能力不支持或高风险，模型不得“为了达成目标”偷偷生成对应 change。

### 禁止 5：用自由文本代替结构字段

模型不得把关键约束藏进：

* `summary`
* `reason`
* `warnings`

而遗漏本该出现的结构字段。

### 禁止 6：过度改动

模型不得因为想“做得更完整”而额外生成不必要 change。
MVP 目标是最小可信闭环，不是一次性最优配置。

### 禁止 7：伪装支持

当目标本质越界时，模型不得装作理解并输出完整计划。
应明确输出 `partial` 或 `unsupported`。

---

## 6. 输出契约

模型的最终输出必须满足以下条件：

### 条件 1：单对象 JSON

输出必须是一个且仅一个 `BuildPlan` JSON 对象。

### 条件 2：严格符合 schema

必须通过：

* 顶层字段校验
* change 子结构校验
* 枚举值校验
* `additionalProperties = false`

### 条件 3：所有 change 都有验证链接

每个 `change` 必须至少绑定一个 `validation_link`。

### 条件 4：所有高风险 change 都需要确认

若 `risk_level = high`，则：

* `requires_confirmation = true`

### 条件 5：支持等级与改动数量一致

* `support_level = unsupported` 时，不应输出实际变更
* `support_level = partial` 时，必须包含 warning

### 条件 6：摘要必须解释行为变化

`summary` 必须回答：

* 这份计划想把龙虾变得更像什么

而不是简单说“更新文件并安装技能”。

---

## 7. Prompt 组装建议

推荐把实际 prompt 组装为五段。

### 段 1：系统角色

固定声明模型是受控 BuildPlan 规划器，不是执行器。

### 段 2：规则边界

注入：

* 允许的 change 类型
* 禁止的操作
* workspace 边界
* rule registry 摘要

### 段 3：目标输入

注入：

* Behavior Profile
* 用户原始补充说明
* workspace snapshot

### 段 4：输出要求

明确要求：

* 仅输出合法 JSON
* 不要解释
* 不要 markdown
* 不要命令

### 段 5：失败降级要求

明确要求：

* 信息不足时保守
* 越界时降级为 `partial` 或 `unsupported`
* 不确定时减少改动数量，提高 warning 密度

---

## 8. 失败降级策略

模型在不确定时必须采用保守降级，而不是幻想补全。

### 情况 A：画像清晰，workspace 信息不足

处理：

* 允许生成少量低风险 change
* 增加 warning：`insufficient_workspace_context`
* 避免覆盖类 `update_file`

### 情况 B：画像部分越界

处理：

* `support_level = partial`
* 抽出可支持子目标
* 不支持部分进入 `warnings[]`

### 情况 C：规则层与用户目标冲突

处理：

* 规则优先
* 输出 `partial` 或 `unsupported`
* 明确说明受哪条规则限制

### 情况 D：模型对字段映射把握很低

处理：

* 减少 changes 数量
* 提高 `requires_user_confirmation`
* 把不确定性显式写入 warning

---

## 9. 质量门槛

一份 BuildPlan 只有同时满足以下条件才应被接受：

1. JSON 结构合法
2. 无禁止 change 类型
3. 所有路径在受控范围内
4. 所有 change 可解释
5. 所有 change 可验证
6. `support_level` 没有伪装
7. 风险标记与内容一致

任何一项不满足，都应回退到：

* 重新生成
* 或提示用户补充信息

---

## 10. 推荐错误码

为了便于工程落地，建议为生成阶段定义统一错误码：

* `GEN_SCHEMA_INVALID`
* `GEN_UNSUPPORTED_CHANGE_TYPE`
* `GEN_UNCONTROLLED_PATH`
* `GEN_MISSING_VALIDATION_LINK`
* `GEN_SUPPORT_LEVEL_MISMATCH`
* `GEN_OVERREACHING_PLAN`
* `GEN_RULE_CONFLICT`

这些错误码不一定直接展示给用户，但应进入 operation logs。

---

## 11. 示例：正确输出与错误输出

### 正确输出特征

* JSON 唯一
* change 数量克制
* `reason` 明确链接画像字段
* `warnings` 明确指出 caveat 或不足
* `post_apply_checks` 与 changes 对齐

### 错误输出特征

* 先说一大段解释，再给 JSON
* 用自然语言建议“顺手再改一下别的文件”
* 输出 shell 命令或 patch
* 使用未定义的 change 类型
* 明明越界却假装 `supported`

---

## 12. 与其他文档的依赖关系

这份 contract 不是独立存在的。
它必须显式依赖：

* [Behavior Profile Schema](/Users/cclucky/developer/personal/claw-workbench/docs/plans/2026-04-01-behavior-profile-schema.md)
* [BuildPlan JSON Schema](/Users/cclucky/developer/personal/claw-workbench/docs/plans/2026-04-01-buildplan-json-schema.md)
* [Validation Rubric](/Users/cclucky/developer/personal/claw-workbench/docs/plans/2026-04-01-validation-rubric.md)
* [MVP Roadmap](/Users/cclucky/developer/personal/claw-workbench/docs/plans/2026-04-01-clawworkbench-mvp-roadmap.md)

若未来这些文档升级版本，Prompt Contract 必须同步版本号和字段映射。

---

## 13. 下一步建议

到这里，MVP 的产品规范主干已经够用了。
如果继续推进，接下来最值得做的不是继续写概念文档，而是二选一：

1. 写 `Phase 1 信息架构与页面流`
   把 Builder、Review、Validation、Revisions 这些页面的状态流定下来。

2. 写 `Phase 1 技术实施计划`
   把 Tauri、前端、schema 校验、SQLite、文件系统 adapter 的开发步骤拆出来。

如果目标是尽快进入开发，我建议先写第 2 个。

