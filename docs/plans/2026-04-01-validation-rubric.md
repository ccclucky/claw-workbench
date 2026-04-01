# Validation Rubric

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Define the MVP validation system that determines whether an applied BuildPlan made the OpenClaw workspace meaningfully closer to the target behavior profile, not just structurally changed files.

**Architecture:** Validation runs after Apply and before ClawWorkbench declares success. It combines hard checks, scenario smoke tests, and behavior-fit scoring. The rubric must be lightweight enough for MVP but strict enough to preserve user trust. It must explain both success and failure in human terms.

**Tech Stack:** Local filesystem inspection, structured check runner, prompt-based smoke tests, rubric scoring, SQLite result storage.

---

## 1. 文档目的

`Validation Rubric` 负责定义：

> 我们凭什么说“这个龙虾现在更像用户想要的样子了”。

如果没有这层，ClawWorkbench 最终只会变成：

* 一个会改文件的工具
* 一个会展示 diff 的工具
* 一个让用户自己猜“到底有没有更好”的工具

MVP 的 validation 不需要完美，但必须回答四个问题：

1. 改动有没有正确落地
2. 改动有没有真正生效
3. 输出是否更接近目标行为画像
4. 还差什么没有达到

---

## 2. 设计原则

### 原则 1：先验证结构，再验证行为

如果文件没落地、skill 没装好、路径不对，那就不应该进入行为判断。

### 原则 2：行为判断必须绑定画像字段

Validation 不是主观评论“感觉更好了”，而是对照 `Behavior Profile` 字段做有限维度判断。

### 原则 3：Rubric 要能解释失败

失败时不能只给 `FAIL`。
必须指出：

* 哪一层失败
* 为什么失败
* 是结构问题、规则问题还是行为偏差

### 原则 4：MVP 只做粗粒度高信号判断

不做复杂 benchmark，不做统计学评估，不做长周期埋点推断。
第一版只做足够稳定的“可信验证”。

### 原则 5：Validation 结果必须能驱动下一步

结果应该天然成为后续 refinement 的输入，而不是只做一次性报告。

---

## 3. 三层验证结构

MVP 推荐采用三层结构：

### 第一层：结构有效性

回答：

* 改动是否按计划落地
* revision 是否完整
* skill 是否在正确位置

### 第二层：运行/生效有效性

回答：

* 这些改动在当前 OpenClaw 环境下是否有机会真正生效
* 是否存在 restart、cache、path precedence 等 caveat

### 第三层：行为有效性

回答：

* 现在的龙虾是否更像目标画像
* 更像在哪些方面
* 不像在哪些方面

只有三层都过，才应显示为完整成功。

---

## 4. 结果模型

建议第一版输出统一的 `ValidationResult`：

```json
{
  "validation_id": "val_001",
  "plan_id": "plan_001",
  "profile_id": "bp_001",
  "overall_status": "pass_with_warnings",
  "overall_score": 0.78,
  "structure_status": "pass",
  "runtime_status": "pass_with_warnings",
  "behavior_status": "pass",
  "findings": [],
  "behavior_deltas": [],
  "next_actions": []
}
```

### 状态枚举

顶层和分层状态统一用：

* `pass`
* `pass_with_warnings`
* `fail`

### `overall_score`

范围：

* `0` 到 `1`

作用：

* 给用户一个粗粒度总体接近度参考
* 不应用作唯一结论

---

## 5. 第一层：结构有效性 Rubric

### 目标

证明 BuildPlan 的改动确实按预期落地。

### 必检项

#### Check S1：目标路径存在性

检查内容：

* 所有 `create_file` 的目标文件存在
* 所有 `create_folder` 的目标目录存在
* 所有 `update_file` 的目标文件仍可读取

失败条件：

* 任一目标路径不存在

#### Check S2：Revision 完整性

检查内容：

* apply 后生成 revision
* revision 包含变更摘要、时间戳、关联 plan id

失败条件：

* revision 未生成或信息不完整

#### Check S3：内容一致性

检查内容：

* 最终文件内容与 apply 结果一致
* content hash 或等价校验通过

失败条件：

* 文件实际内容与 revision 记录不一致

#### Check S4：Skill 安装一致性

检查内容：

* 所有 `install_skill` 项在预期位置可发现
* 来源元数据存在

失败条件：

* skill 未安装成功
* skill 来源不可追踪

### 第一层判定规则

* 任一 blocking check 失败：`fail`
* 全部通过但有非阻断问题：`pass_with_warnings`
* 全部通过：`pass`

---

## 6. 第二层：运行/生效有效性 Rubric

### 目标

证明这些改动不仅“写进去了”，而且在当前 OpenClaw 运行上下文中有较高概率真正生效。

### 必检项

#### Check R1：路径优先级合理性

检查内容：

* 修改的文件位于受控 workspace 或受控 skills 搜索路径内
* 没有被更高优先级路径遮蔽

失败条件：

* 改动对象存在但实际上不会被当前运行时优先读取

#### Check R2：规则包匹配

检查内容：

* 当前 OpenClaw 版本与 rule registry 匹配
* 计划使用的文件/技能路径未脱离当前规则包假设

失败条件：

* 版本不匹配导致计划结论不可信

#### Check R3：Caveat 命中检查

检查内容：

* 检查当前版本已知 caveat
* 识别是否需要 restart/new session
* 识别 workspace bootstrap、subagent 继承等风险

结果分类：

* 明确阻断：`fail`
* 可继续但需提示：warning

#### Check R4：Apply 后会话提示

检查内容：

* 若变更类型需要新 session 才稳定生效，明确提示

失败条件：

* 明知需要重启却未提示

### 第二层判定规则

* 存在明确阻断 caveat：`fail`
* 存在 restart/refresh 类 caveat：`pass_with_warnings`
* 无关键 caveat：`pass`

---

## 7. 第三层：行为有效性 Rubric

### 目标

证明现在的工作方式更接近 `Behavior Profile`。

### 方法

MVP 第一版采用：

* 固定场景 smoke test
* 画像字段对齐评分
* 简短解释摘要

不做复杂长期行为跟踪。

### 评分维度

行为层建议固定为 6 个维度，每个维度 `0 / 0.5 / 1` 评分。

#### B1：角色一致性

检查：

* 输出和行为是否更符合 `role_focus`

示例：

* `executor` 应更偏执行和交付
* `reviewer` 应优先指出风险和问题

#### B2：表达一致性

检查：

* 输出是否符合 `communication_style`

示例：

* `concise` 应更短、更直接、少铺垫
* `detailed` 应更充分解释来龙去脉

#### B3：推理一致性

检查：

* 输出是否符合 `reasoning_style`

示例：

* `rigorous` 应更强调依据、验证和边界
* `pragmatic` 应更强调可行性和推进速度

#### B4：工作流一致性

检查：

* 行为是否符合 `workflow_style`

示例：

* `verify_first` 是否先提出验证或验收思路
* `review_then_act` 是否先收集上下文再动手

#### B5：风险与边界一致性

检查：

* 是否符合 `risk_posture` 和 `boundary_mode`

示例：

* `conservative + strict` 应更谨慎、更少越界尝试
* `balanced + guarded` 应适度推进但先提示风险

#### B6：目标导向一致性

检查：

* 是否符合 `goal_orientation`
* 是否朝 `success_definition` 靠拢

示例：

* `outcome_driven` 更快收束到结果
* `learning_driven` 更强调理解与探索

### 第三层得分计算

* 每维最高 `1`
* 总分除以 `6`
* 输出 `behavior_score`

### 第三层判定规则

* `>= 0.75`: `pass`
* `>= 0.5` 且 `< 0.75`: `pass_with_warnings`
* `< 0.5`: `fail`

---

## 8. 模板级 smoke tests

每种 `primary_template` 至少定义 3 条 smoke tests。
MVP 先覆盖：

* coding
* research
* content

### 8.1 Coding 模板

#### Smoke C1：验证优先

目标：

* 检查是否在宣称完成前先提出检查、测试或验证

重点字段：

* `workflow_style`
* `reasoning_style`
* `risk_posture`

#### Smoke C2：工程化表达

目标：

* 检查是否输出清晰、直接、面向执行

重点字段：

* `role_focus`
* `communication_style`

#### Smoke C3：边界控制

目标：

* 检查是否对高风险改动给出合理提示或停手

重点字段：

* `boundary_mode`
* `risk_posture`

### 8.2 Research 模板

#### Smoke R1：先收集再判断

目标：

* 检查是否先补上下文、再给结论

重点字段：

* `workflow_style`
* `reasoning_style`

#### Smoke R2：不确定性表达

目标：

* 检查是否明确区分事实、推断与未知项

重点字段：

* `reasoning_style`
* `boundary_mode`

#### Smoke R3：观点对比

目标：

* 检查是否能呈现至少两个角度或来源倾向

重点字段：

* `role_focus`
* `goal_orientation`

### 8.3 Content 模板

#### Smoke T1：语气贴近

目标：

* 检查是否更贴近目标风格，且不过度跑题

重点字段：

* `communication_style`
* `user_preference_notes`

#### Smoke T2：围绕终点组织

目标：

* 检查是否围绕明确目标终点组织内容，而不是泛泛写作

重点字段：

* `goal_orientation`
* `success_definition`

#### Smoke T3：结构稳定

目标：

* 检查输出结构是否有一致的组织方式

重点字段：

* `role_focus`
* `workflow_style`

---

## 9. Findings 结构

Validation 结果中的 `findings[]` 建议统一结构：

```json
{
  "finding_id": "finding_001",
  "layer": "behavior",
  "severity": "medium",
  "title": "Workflow still acts before verification",
  "detail": "The updated workspace is more concise, but smoke tests still show completion claims before verification steps are mentioned.",
  "linked_profile_fields": ["workflow_style", "reasoning_style"],
  "linked_change_ids": ["chg_001"]
}
```

字段定义：

* `finding_id`: `string`
* `layer`: `"structure" | "runtime" | "behavior"`
* `severity`: `"low" | "medium" | "high"`
* `title`: `string`
* `detail`: `string`
* `linked_profile_fields`: `string[]`
* `linked_change_ids`: `string[]`

---

## 10. Behavior Deltas 结构

为了让用户理解“更像了多少”，建议额外输出 `behavior_deltas[]`：

```json
{
  "dimension": "workflow_style",
  "target": "verify_first",
  "observed": "review_then_act",
  "score": 0.5,
  "comment": "The system now gathers context first, but still does not consistently define verification before execution."
}
```

这个结构是 ClawWorkbench 相比普通 diff 工具的核心价值之一。

---

## 11. Overall Score 建议

MVP 第一版建议采用加权粗算法：

* 结构层：30%
* 运行层：20%
* 行为层：50%

原因：

* 没有结构正确性，一切免谈
* 运行层重要，但第一版受 runtime caveat 影响较大
* 用户最在乎的是行为是否更像

### 计算建议

* `structure_score`: blocking checks 全过为 `1`，有 warning 为 `0.8`
* `runtime_score`: 无 warning 为 `1`，有 caveat warning 为 `0.7`
* `behavior_score`: 直接取行为层 6 维平均

最后：

`overall_score = structure_score * 0.3 + runtime_score * 0.2 + behavior_score * 0.5`

注意：

* 若结构层 `fail`，直接整体 `fail`
* 若运行层存在阻断 caveat，直接整体 `fail`

---

## 12. 用户可见结论格式

MVP 第一版的 validation 输出不应只是分数。
建议固定输出三段：

### 1. 结论

示例：

* “当前工作区已更接近目标 coding 画像，但仍存在一项生效风险提示。”

### 2. 更接近的地方

示例：

* “表达更简洁了”
* “更倾向先检查再执行”
* “对高风险改动更谨慎”

### 3. 仍未达到的地方

示例：

* “仍会过早宣称完成”
* “边界提示还不够明确”
* “研究场景下对不确定性的表达仍偏弱”

这三段比原始分数更能建立信任。

---

## 13. MVP 明确不做的验证能力

第一版不要做：

* 长周期真实使用行为追踪
* 自动化 A/B 实验
* 复杂统计建模
* 多轮对话完整人格评估
* 用户全量历史对比学习
* 自动判定“商业价值”或“业务效果”

这些都太贵，而且容易制造伪精确。

---

## 14. 下一步建议

这份 rubric 完成后，下一步最合理的是补一份：

`BuildPlan Generation Prompt Contract`

它要明确：

* 画像输入格式
* Rule Registry 如何注入
* LLM 允许输出什么
* 绝对禁止输出什么

如果没有这份 contract，虽然 schema 和 rubric 已经齐了，但生成阶段仍然会漂。

