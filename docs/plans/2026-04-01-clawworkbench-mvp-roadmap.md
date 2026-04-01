# ClawWorkbench MVP Roadmap

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the smallest credible version of ClawWorkbench that proves users want behavior shaping and workflow sculpting, not just a better config editor.

**Architecture:** Start from a local-first desktop shell that can inspect a real OpenClaw workspace, derive a target behavior profile from user intent, generate a constrained BuildPlan, preview diffs, apply revisions safely, and validate whether the result is closer to the intended working style. The MVP wins only if it closes the loop from intent to verified behavior change.

**Tech Stack:** Tauri 2, React, TypeScript, Vite, SQLite, local filesystem access, JSON schema validation, diff viewer, pluggable LLM provider.

---

## 1. MVP 的真正目标

MVP 不是为了证明“我们能做一个 OpenClaw 设置页”。
MVP 要证明的是三件事：

1. 用户愿意先描述自己想要的龙虾风格、习惯和终点，而不是直接改配置。
2. 系统能把这种目标稳定翻译成可应用、可回滚、可解释的工作区改动。
3. 改动后能通过验证，让用户相信龙虾确实更接近目标，而不是碰巧生成了一堆文件。

因此，MVP 的北极星不是配置覆盖率，而是：

> 用户是否能从“我想让龙虾更像这样”走到“它现在确实更像这样了”。

---

## 2. MVP 核心假设

MVP 只验证四个核心假设。

### 假设 A：用户要的是行为塑形，不是设置项堆叠

如果用户只想改模型、channel、gateway，那么官方 config 已经够了。
ClawWorkbench 只有在用户明显希望定义风格、习惯、边界、任务偏好时才成立。

### 假设 B：目标行为画像可以被结构化

用户的抽象偏好必须能被系统收敛成有限维度，例如：

* 目标角色
* 风格倾向
* 工作习惯
* 风险偏好
* 边界要求
* 目标终点

如果这一步无法稳定结构化，后面的 BuildPlan 就会继续漂。

### 假设 C：受控改动比自由生成更值得信任

用户必须能理解改动原因、看到 diff、选择应用范围、回滚失败结果。
否则它仍然只是一个“更能说的聊天工具”。

### 假设 D：行为有效性可以被粗粒度验证

MVP 不需要完美评测体系，但至少要能回答：

* 改完后更像什么
* 为什么说它更像
* 哪些方面仍然不像

---

## 3. MVP 第一阶段必须包含什么

第一阶段只做闭环，不做大而全。

### 模块 1：Workspace Discovery

必须支持：

* 自动发现默认 OpenClaw workspace
* 手动指定 workspace
* 扫描关键文件与 skills 状态
* 标记当前规则包版本和 OpenClaw 版本

这一步的价值不是“浏览文件”，而是建立真实运行环境的基线。

### 模块 2：Intent to Behavior Profile

这是 MVP 和普通配置器的第一道分水岭。

必须支持：

* chat 或 form 输入目标
* 输出目标行为画像摘要
* 明确哪些目标可支持、部分支持、不可支持
* 让用户确认画像后再进入 BuildPlan

建议第一版画像字段固定，不做开放式无限扩展。

### 模块 3：Behavior Profile to BuildPlan

必须支持：

* 基于固定 schema 生成 BuildPlan
* BuildPlan 包含文件变更、skill 变更、风险提示、post-apply checks
* 默认只允许 create_file、update_file、create_folder、install_skill
* 禁止 delete 和黑盒脚本执行

这一步的核心是收束能力边界，而不是追求“什么都能配”。

### 模块 4：Review, Diff, Apply

必须支持：

* 变更原因说明
* 文件级 diff
* 逐项勾选应用
* apply 日志
* revision 自动记录
* rollback

这是用户信任建立的核心，不可砍。

### 模块 5：Validation Center

这是 MVP 和“AI 改文件工具”拉开差距的第二道分水岭。

必须支持：

* 结构有效性检查
* skill 安装检查
* caveat 提示
* 每类模板最少 3 条 smoke tests
* 一份行为有效性简报

行为有效性简报不追求学术严谨，但必须给出：

* 当前更接近的行为画像
* 尚未满足的目标项
* 建议下一步怎么继续调

### 模块 6：Template and Revision Memory

必须支持：

* 从 revision 保存为 template
* template 带标签和适用场景
* 从 template 再次生成方案

没有模板沉淀，这个产品就无法从一次性操作变成长期工具。

---

## 4. MVP 第一阶段明确不做什么

这些能力看起来诱人，但会直接拖慢验证速度。

### 不做 1：全量 config 覆盖

不以“支持所有 OpenClaw 配置项”为目标。
基础配置项只支持会影响行为塑形闭环的必要部分。

### 不做 2：模板市场和社区

MVP 只允许本地模板保存与复用，不做分享、下载、评分、社区。

### 不做 3：云同步和账号体系

这不是价值验证期该碰的复杂度。

### 不做 4：自动执行外部业务链路

不碰公众号、自动发帖、自动部署业务闭环。
那会污染产品边界。

### 不做 5：复杂的多 workspace 编排

第一版只围绕单一 workspace 闭环，不做团队级策略分发。

### 不做 6：高度自由的“万能 agent 定制”

第一版只支持少量高价值模板：

* coding
* research
* content
* custom-light

YAGNI。先证明用户真的会反复调这几类。

---

## 5. 推荐的 MVP 路线

### Phase 0：认知验证

目标：

* 验证用户是否真的会用“目标行为画像”思路来表达需求

交付：

* 画像字段定义
* 3 到 5 个高频用户画像样本
* 每类模板的 smoke test 草案
* 行为有效性 rubric 草案

完成标准：

* 能把至少 80% 的早期用户需求归入有限画像字段

### Phase 1：可信闭环 MVP

目标：

* 从目标输入到受控改动到验证结果，形成第一个完整闭环

交付：

* workspace discovery
* behavior profile builder
* constrained BuildPlan
* review/diff/apply
* revision/rollback
* self-check + smoke test + behavior brief

完成标准：

* 用户能完成一次从目标描述到验证通过的完整流程
* 用户能理解系统为什么这样改
* 用户能在不满意时安全回滚

### Phase 2：规则增强

目标：

* 减少“改了但没真正生效”的不确定性

交付：

* 更完善的 rule registry
* 版本化 caveat registry
* 更强的 post-apply validation
* 更多模板的行为画像维度

完成标准：

* 版本差异和 caveat 不再依赖人工记忆

### Phase 3：资产沉淀

目标：

* 让用户开始积累自己可复用的龙虾风格资产

交付：

* template 管理增强
* template diff
* template evolution history
* 更稳定的 skill 来源标注

完成标准：

* 用户开始复用旧模板而不是每次从头描述

---

## 6. MVP 成功与失败的判断标准

### 成功信号

* 用户描述目标时，更多在说“我想让它怎么做事”，而不是“我要改哪个参数”
* 用户会反复查看行为画像摘要并微调
* 用户愿意保留 revision 和 template
* 用户会使用验证结果来继续迭代

### 失败信号

* 用户直接跳过画像，只想找设置页
* BuildPlan 经常看起来合理，但 apply 后没有明显行为改善
* validation 无法给出可信解释
* template 保存率很低，说明没有形成长期价值

---

## 7. 第一批最值得做的用户场景

不要一开始追求全面。先打穿三个场景。

### 场景 1：Coding 龙虾

目标：

* 更严格
* 更工程化
* 更重验证
* 少废话

这是最容易验证行为塑形价值的场景。

### 场景 2：Research 龙虾

目标：

* 更会收集资料
* 更会对比观点
* 更谨慎地下结论

这个场景适合验证风格和边界塑形。

### 场景 3：Content 龙虾

目标：

* 更贴近用户语气
* 更稳定输出固定风格
* 更能围绕既定终点组织内容

这个场景适合验证“符合品味和习惯”是否成立。

---

## 8. 第一版产品叙事

MVP 对外不要讲“我们能配置 OpenClaw”。
这句话没有吸引力，而且会把自己拉进官方设置页比较。

第一版应该讲：

> ClawWorkbench 让你不是在设置一个 Agent，而是在塑造一个更像你的龙虾。

或者更具体一点：

> 你定义目标、风格和习惯；ClawWorkbench 把它变成可应用、可验证、可回滚的 OpenClaw 工作方式。

---

## 9. 下一步建议

在真正进入实现前，先产出三个补充文档：

1. `Behavior Profile Schema`
   定义画像字段、枚举值、自由输入范围。

2. `BuildPlan JSON Schema`
   定义允许的变更类型、风险等级和 post-apply checks。

3. `Validation Rubric`
   定义 coding / research / content 三类模板的最小验证标准。

没有这三份文档，开发很容易重新滑回“让 LLM 自由发挥”。

