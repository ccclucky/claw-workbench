# Behavior Profile Schema

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Define a strict, MVP-safe schema that converts user intent into a stable behavior profile for downstream BuildPlan generation and validation.

**Architecture:** The schema sits between user input and BuildPlan. It is not a freeform persona document. It is a constrained profile object with fixed dimensions, small enums, explicit support boundaries, and minimal free text. The object must be readable by humans, actionable for the plan engine, and comparable by the validation engine.

**Tech Stack:** JSON Schema, TypeScript types, SQLite JSON storage, LLM extraction with constrained output.

---

## 1. 文档目的

`Behavior Profile` 是 ClawWorkbench 的第一层核心结构，不是附属信息。

它负责回答一个问题：

> 用户到底想让这个龙虾变成什么样，以及这种“什么样”如何被稳定转成后续改动。

MVP 第一版采用`严格结构化`策略：

* 字段数量有限
* 枚举优先
* 自由文本最小化
* 允许“不确定”
* 先服务 BuildPlan 和 Validation，不服务表达欲

这意味着它不是一个完整的 persona DSL，也不是一个情绪化的人设卡。
它是一个可执行约束对象。

---

## 2. 设计原则

### 原则 1：先收敛，再表达

Schema 的首要目标不是“完整表达用户”，而是把 80% 高频需求压进有限字段。

### 原则 2：每个字段都必须有下游用途

如果某个字段不能明确影响以下任一环节，就不进 MVP：

* BuildPlan 生成
* 风险提示
* 文件改动建议
* skill 推荐
* validation 对比

### 原则 3：允许信息缺失

第一版不要求用户把每个维度都说清楚。未知值应允许为 `unknown`，而不是逼模型乱猜。

### 原则 4：避免字段重叠

“风格”“习惯”“边界”“终点”必须严格区分，避免一个需求被多个字段重复承载。

### 原则 5：必须可比较

Validation 阶段需要比较“目标画像”和“当前结果画像”的接近程度，所以字段必须可对齐、可评分、可解释。

---

## 3. 推荐结构

第一版 `BehaviorProfile` 顶层建议如下：

```json
{
  "profile_id": "bp_001",
  "version": "v1",
  "source_mode": "chat",
  "support_level": "supported",
  "primary_template": "coding",
  "role_focus": "executor",
  "communication_style": "concise",
  "reasoning_style": "rigorous",
  "workflow_style": "verify_first",
  "risk_posture": "conservative",
  "boundary_mode": "strict",
  "goal_orientation": "outcome_driven",
  "user_preference_notes": "Prefer short direct updates and strong verification before claiming success.",
  "success_definition": "Acts like a disciplined coding partner who validates changes before completion.",
  "unsupported_expectations": [],
  "confidence": 0.84
}
```

这个结构故意很短。
MVP 第一版不追求复杂画像树，而追求：

* 让用户能读懂
* 让模型能稳定产出
* 让系统能稳定消费

---

## 4. 字段定义

### `profile_id`

类型：`string`

规则：

* 系统生成
* 不由用户输入
* 用于 revision、template、validation 关联

### `version`

类型：`"v1"`

规则：

* 当前固定为 `v1`
* 后续 schema 升级再扩展

### `source_mode`

类型：`"chat" | "form" | "template"`

作用：

* 标记画像来源
* 便于分析不同输入路径的稳定性

### `support_level`

类型：`"supported" | "partial" | "unsupported"`

作用：

* 明确当前目标是否处于产品边界内
* 决定是否允许继续生成 BuildPlan

规则：

* `unsupported` 时禁止直接进入 apply 流程
* `partial` 时必须展示缺失项和风险说明

### `primary_template`

类型：`"coding" | "research" | "content" | "custom_light"`

作用：

* 决定初始模板骨架
* 决定默认 smoke test 和 validation rubric

这是 MVP 最关键的路由字段之一。

### `role_focus`

类型：`"executor" | "reviewer" | "planner" | "explorer"`

作用：

* 定义龙虾在任务中的主要角色倾向
* 影响 bootstrap 文案、技能选择、输出结构

枚举解释：

* `executor`: 偏执行、落地、修改、交付
* `reviewer`: 偏检查、找问题、控风险
* `planner`: 偏拆解、组织、决策路径
* `explorer`: 偏研究、收集、打开思路

### `communication_style`

类型：`"concise" | "balanced" | "detailed"`

作用：

* 影响输出长度、说明粒度、用户更新节奏

第一版不再细拆语气、幽默感、修辞风格。
这些太贵，不适合 MVP。

### `reasoning_style`

类型：`"pragmatic" | "rigorous" | "creative"`

作用：

* 影响决策偏好和回应方式

枚举解释：

* `pragmatic`: 快速判断，优先可行性
* `rigorous`: 强验证，强调论证完整性
* `creative`: 更开放，允许发散方案

### `workflow_style`

类型：`"act_first" | "review_then_act" | "verify_first"`

作用：

* 影响任务执行顺序
* 直接驱动部分 workflow 规则和 validation 重点

枚举解释：

* `act_first`: 先快速推进，再补检查
* `review_then_act`: 先收集上下文，再执行
* `verify_first`: 先定义验证标准，再改动

### `risk_posture`

类型：`"aggressive" | "balanced" | "conservative"`

作用：

* 决定默认风险容忍度
* 影响是否建议自动应用、是否要求双重确认、是否倾向保守变更

### `boundary_mode`

类型：`"flexible" | "guarded" | "strict"`

作用：

* 决定龙虾面对越界诉求时的默认处理方式
* 影响拒绝、引导、升级确认的倾向

枚举解释：

* `flexible`: 尽量帮用户靠近目标
* `guarded`: 能做则做，风险高时先提示
* `strict`: 边界不清就拒绝或要求确认

### `goal_orientation`

类型：`"process_driven" | "outcome_driven" | "learning_driven"`

作用：

* 区分用户更在乎过程规范、结果交付还是探索理解
* 影响任务优先级与 validation 文案

### `user_preference_notes`

类型：`string`

规则：

* 可为空
* 限制长度，建议 280 字以内
* 仅承载无法被枚举覆盖的高价值偏好

允许内容示例：

* 偏好短句
* 不喜欢空话
* 更像资深工程师

不允许作为万能垃圾桶。

### `success_definition`

类型：`string`

规则：

* 必填
* 用一句到两句描述“什么叫更接近目标终点”
* 是 validation 解释层的重要输入

### `unsupported_expectations`

类型：`string[]`

作用：

* 显示用户提出但当前产品不支持的部分
* 防止系统假装自己懂了全部目标

### `confidence`

类型：`number`

范围：

* `0` 到 `1`

作用：

* 表示系统对当前画像抽取结果的把握程度
* 低于阈值时应触发补充确认

---

## 5. 字段到下游能力的映射

每个字段都必须有明确去向。

| 字段 | BuildPlan | Validation | UI 解释 | 风险控制 |
| --- | --- | --- | --- | --- |
| `primary_template` | 决定模板骨架 | 决定测试集 | 首页摘要 | 中 |
| `role_focus` | 决定规则和 skill 倾向 | 检查角色一致性 | 高 | 低 |
| `communication_style` | 决定文案和输出样式 | 检查输出长度与密度 | 高 | 低 |
| `reasoning_style` | 决定指导原则 | 检查论证方式 | 中 | 中 |
| `workflow_style` | 决定执行顺序规则 | 检查行为顺序 | 高 | 高 |
| `risk_posture` | 决定改动保守程度 | 检查风险行为 | 中 | 高 |
| `boundary_mode` | 决定拒绝/引导策略 | 检查边界一致性 | 中 | 高 |
| `goal_orientation` | 决定优先级取舍 | 检查是否靠近终点 | 高 | 中 |

这张表的意义是防止 schema 失控膨胀。

---

## 6. MVP 不纳入的字段

以下字段现在不要进 schema：

* 情绪人格标签
* MBTI 式人格分类
* 复杂语气控制
* 多语言细粒度风格参数
* 行业垂直术语包
* 长段 persona 背景故事
* 多层目标树
* 多 agent 协作画像

原因很简单：

* 不稳定
* 难验证
* 很容易污染 BuildPlan
* 对 MVP 价值验证帮助有限

---

## 7. 抽取规则

LLM 从用户输入抽取画像时，必须遵守以下规则：

### 规则 1：优先映射到枚举

只有明确无法归入枚举时，才写入 `user_preference_notes`。

### 规则 2：不猜隐含诉求

没有明确证据时，字段填 `unknown` 的等价默认值策略，或降低 `confidence`。

说明：

MVP 第一版为了简化实现，可以不在 JSON 中显式出现 `unknown`，但抽取器内部必须允许“不确定”，不能硬猜。

### 规则 3：先判边界，再抽画像

如果用户目标本身越界，先标 `support_level`，不要假装画像完整可用。

### 规则 4：`success_definition` 必须可验证

坏例子：

* “变得更厉害”
* “变成神”

好例子：

* “更像一个会先验证再动手的 coding partner”
* “输出更简洁，少铺垫，结论更稳”

### 规则 5：notes 不得替代结构字段

如果用户说“更严谨、更少废话、先检查再修改”，就应优先落到：

* `reasoning_style = rigorous`
* `communication_style = concise`
* `workflow_style = review_then_act` 或 `verify_first`

而不是全塞进 notes。

---

## 8. 输出约束

推荐第一版 JSON Schema 约束如下：

* 顶层字段固定，不允许额外字段
* 必填字段：
  * `version`
  * `source_mode`
  * `support_level`
  * `primary_template`
  * `role_focus`
  * `communication_style`
  * `reasoning_style`
  * `workflow_style`
  * `risk_posture`
  * `boundary_mode`
  * `goal_orientation`
  * `success_definition`
  * `confidence`
* 可选字段：
  * `profile_id`
  * `user_preference_notes`
  * `unsupported_expectations`

这样做的原因是：

* 保证 BuildPlan 总有稳定输入
* 保证 validation 总有可比维度
* 保证 UI 摘要总有可展示内容

---

## 9. 三个示例

### 示例 A：Coding 龙虾

```json
{
  "version": "v1",
  "source_mode": "chat",
  "support_level": "supported",
  "primary_template": "coding",
  "role_focus": "executor",
  "communication_style": "concise",
  "reasoning_style": "rigorous",
  "workflow_style": "verify_first",
  "risk_posture": "conservative",
  "boundary_mode": "strict",
  "goal_orientation": "outcome_driven",
  "user_preference_notes": "Prefer direct updates and strong test evidence before claiming completion.",
  "success_definition": "Behaves like a disciplined coding partner who inspects context, verifies changes, and avoids fluffy explanations.",
  "unsupported_expectations": [],
  "confidence": 0.91
}
```

### 示例 B：Research 龙虾

```json
{
  "version": "v1",
  "source_mode": "form",
  "support_level": "supported",
  "primary_template": "research",
  "role_focus": "explorer",
  "communication_style": "balanced",
  "reasoning_style": "rigorous",
  "workflow_style": "review_then_act",
  "risk_posture": "balanced",
  "boundary_mode": "guarded",
  "goal_orientation": "learning_driven",
  "user_preference_notes": "Prefer comparison across sources before conclusions.",
  "success_definition": "Acts like a careful research assistant who gathers context broadly and states uncertainty clearly.",
  "unsupported_expectations": [],
  "confidence": 0.86
}
```

### 示例 C：Content 龙虾

```json
{
  "version": "v1",
  "source_mode": "chat",
  "support_level": "partial",
  "primary_template": "content",
  "role_focus": "planner",
  "communication_style": "concise",
  "reasoning_style": "pragmatic",
  "workflow_style": "review_then_act",
  "risk_posture": "balanced",
  "boundary_mode": "guarded",
  "goal_orientation": "outcome_driven",
  "user_preference_notes": "Prefer a sharper tone and stronger audience orientation.",
  "success_definition": "Produces content that stays close to the target voice and serves a defined conversion or communication goal.",
  "unsupported_expectations": [
    "Automatically operate external publishing platforms"
  ],
  "confidence": 0.78
}
```

---

## 10. 下一步接口关系

这份 schema 完成后，后续文档必须直接依赖它：

1. `BuildPlan JSON Schema`
   需要定义每个画像字段如何影响改动建议。

2. `Validation Rubric`
   需要定义每个画像字段如何被验证。

3. UI Builder Flow
   需要定义用户如何确认、修正、接受画像。

如果后续文档不显式引用这份 schema，整个系统会重新滑回“LLM 看心情生成”。

