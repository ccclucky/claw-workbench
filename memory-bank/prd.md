# ClawWorkbench 最终产品方案文档

## 1. 文档定位

本文档用于统一以下角色的认知与执行：

* 产品经理
* 设计师
* 前端/后端/桌面端开发
* AI coding agent
* 测试人员
* 未来的模板/规则维护者

本文档目标不是“讲清楚想法”，而是定义一个**可以被直接实现、测试、迭代和验收**的产品。

---

## 2. 产品定义

### 2.1 产品名称

**ClawWorkbench**

### 2.2 一句话定义

一个**本地优先的 OpenClaw 行为定制与工作流塑形工作台**：用户通过对话或表单描述目标、偏好、习惯与期望终点，系统基于 OpenClaw 官方规范、固定版本源码规则与本地约束机制，生成结构化方案，对 workspace 文件、skills、规则与模板做**可预览、可应用、可回滚、可验证**的修改。

### 2.3 产品本质

它不是新的 Agent runtime。
它不是 OpenClaw 替代品。
它不是“聊天帮你写几份 md 文件”的壳子。
它也不是“把官方 config 页面化”的设置器。

它本质上是一个：

> **OpenClaw Behavior Shaping Workbench / Workspace Configuration OS**

它将 OpenClaw 定制从“手工折腾文件、零散改参数”升级为一个有规则、有版本、有验证、有回滚的受控行为塑形工作流。

---

## 3. 为什么做这个产品

OpenClaw 已经把 workspace、bootstrap files、skills、memory、配置等做成了核心能力。官方文档明确说明：

* 默认工作区是 `~/.openclaw/workspace`
* OpenClaw 会把固定的一组 workspace 文件注入上下文
* skills 有固定的发现路径和优先级
* onboarding 会初始化 workspace、skills 和 gateway 配置
* memory search、skills、sandbox、channel 等都有独立配置层级 ([OpenClaw][1])

这带来一个事实：

> OpenClaw 的强大，不只是来自模型，而是来自 workspace + prompt files + skills + memory + config 的组合。

但现状问题也很明确：

1. 用户知道“养龙虾”重要，但不知道该改什么。
2. 用户会改文件，但不会设计一个稳定、可复用的工作区结构。
3. 用户缺少 diff、版本、回滚和生效验证机制。
4. 文档定义的“规范行为”和运行时的“真实行为”并不总是一致，当前仓库已有关于 bootstrap 缓存失效、workspace skills 路径解析、subagent 读取主 workspace bootstrap 等问题的公开 issue。([GitHub][2])

更重要的是，用户真正想要的并不是“把模型、channel、gateway 配好”这么简单。用户想要的是：

* 让龙虾更符合自己的品味
* 让龙虾更贴近自己的工作习惯
* 让龙虾在特定任务里呈现稳定的做事方式
* 让龙虾更持续地朝自己希望的目标终点收敛

因此，这个产品的存在价值不是“帮用户写配置”，而是：

> **把 OpenClaw 定制变成一个可控、可信、可验证的本地产品能力。**

进一步说，它要解决的不是“有没有设置项”，而是：

> **如何把用户想要的行为风格、工作流习惯与目标终点，稳定地注入到 OpenClaw 的实际运行方式里。**

---

## 4. 最终产品形态

### 4.1 形态结论

**本地优先桌面应用**。

### 4.2 不采用的形态

不做以下形态作为 MVP 主形态：

* 不做纯网页 SaaS
* 不做浏览器插件
* 不做 OpenClaw 内部 skill
* 不做 CLI-only 工具
* 不做“让 OpenClaw 自己配置自己”的 agent

### 4.3 为什么必须是桌面应用

因为该产品的核心对象全都在本地：

* 本地 workspace
* 本地 skills 目录
* 本地配置文件
* 本地 revision 备份
* 本地日志
* 本地生效验证
* 本地版本感知

而官方 onboarding 与 dashboard 也说明 OpenClaw 的主工作方式本来就是本地 gateway + 本地 workspace 的模式。([OpenClaw][3])

### 4.4 推荐技术形态

首选：

* **Tauri 2**：桌面壳
* **React + TypeScript + Vite**：前端
* **SQLite**：本地元数据与 revision 存储
* **本地文件系统访问**：由 Tauri 后端执行
* **OpenAI-compatible LLM provider 配置**：可插拔
* **Diff viewer**：前端可视化差异组件

如果桌面壳开发成本过高，可退一步用 Electron，但默认优先 Tauri。

---

## 5. 目标用户

### 5.1 核心用户

1. **OpenClaw 新手**
   已经安装 OpenClaw，但不会设计 workspace

2. **OpenClaw 中度用户**
   会手改文件，但缺少结构化定制、版本与验证能力

3. **OpenClaw 重度玩家**
   维护多个 persona / template / skills 组合，希望把经验产品化

### 5.2 典型任务

* 生成 coding / research / content 等工作区
* 对现有 workspace 做安全迭代
* 安装、替换、管理 skills
* 保存模板并复用
* 验证配置是否真正生效

---

## 6. 产品目标与非目标

## 6.1 产品目标

MVP 只做三件大事：

### 目标 A：结构化定制

让用户从“描述目标、偏好、习惯与终点”到“拿到结构化方案”形成闭环。

### 目标 B：受控落地

让所有改动都可预览、可应用、可回滚。

### 目标 C：验证有效性

不是只改文件，而是验证“目标工作区是否真的更接近目标角色、行为风格、工作流习惯与目标终点”。

---

## 6.2 非目标

MVP 明确不做：

* 新的 Agent runtime
* OpenClaw 会话接管
* 公众号自动化执行器
* 通用系统文件管理器
* 模板社区 / 市场 / 团队协作
* 云同步与账号体系
* 任意代码自动执行
* 对业务结果做承诺，例如“自动赚钱”“自动运营成功”

---

## 7. 资源依赖与信息源路径

这一部分是本产品的关键。
因为这个产品不是“凭想象生成”，而是要建立在多层可信信息源之上。

## 7.1 资源分层模型

### 第一层：规范层（Source of Truth）

用于定义“理论上应该如何工作”。

必须依赖的官方资料方向：

* **Agent Workspace**
  定义 workspace 是什么、默认路径、sandbox 对 workspace 的影响、skipBootstrap 等。([OpenClaw][1])
* **Context**
  定义哪些文件会被注入、注入方式、截断规则、skills 只注入元数据而非全文。([OpenClaw][4])
* **Agent Runtime**
  定义 workspace、bootstrap files、skills 三层路径优先级、session 存放位置等。([OpenClaw][5])
* **Configuration Reference**
  定义配置键的层级与含义。([OpenClaw][6])
* **Memory Config / Memory Overview**
  用于识别 memory search 能力和参数层级。([OpenClaw][7])
* **Onboarding / CLI Setup / Dashboard**
  用于识别官方初始化路径与推荐使用方式。([OpenClaw][3])
* **Skills / Creating Skills / ClawHub**
  用于识别 skills 规范、注册表与安装机制。([OpenClaw][8])

### 第二层：实现层（Version-Pinned Runtime Map）

用于定义“当前固定版本实际上如何工作”。

必须依赖的资源方向：

* **固定 tag / commit 的 OpenClaw 仓库源码**
* **仓库中的默认模板和核心实现**
* **与 workspace / bootstrap / skills / config / cache / session 相关的模块**

仓库主页和默认模板页可作为入口，但真正实现应分析固定版本源码，而不是直接依赖 main 分支。官方仓库 README 也明确展示了 workspace root、prompt files 与 workspace skills 路径。([GitHub][9])

### 第三层：异常层（Known Runtime Caveats）

用于定义“哪里可能与规范不一致”。

必须持续跟踪的资源方向：

* GitHub issues 中与以下主题相关的公开问题：

  * bootstrap cache stale
  * workspace skills path resolution
  * subagent workspace inheritance
  * session refresh / restart sensitivity

当前公开 issue 已表明这一层是必要的，而不是可选优化。([GitHub][2])

### 第四层：生态层（Optional External Ecosystem）

用于增强模板与技能选择，但不作为规范来源。

资源方向：

* **ClawHub**
  官方公共技能与插件注册表。([OpenClaw][10])
* **OpenClaw skills guide / 社区技能清单**
  可作为发现入口，但不能替代规范。([GitHub][11])

---

## 7.2 产品内部如何消费这些资源

### 资源消费规则

1. **官方文档优先定义规则**
2. **固定版本源码用于抽取真实实现**
3. **issue 用于生成 caveat registry**
4. **生态资源只用于候选 skill/模板发现**
5. **任何非官方社区文章不得直接成为规则来源**

---

## 8. 核心问题定义

这个产品不是为了解决“用户不会写 markdown”。
它解决的是四类问题：

### 8.1 规则认知问题

用户不知道哪些文件会生效、何时生效、如何生效。

### 8.2 方案设计问题

用户不知道如何把 persona、boundary、memory、skills 组合成一个稳定工作区。

### 8.2.1 行为塑形问题

用户真正需要的不是零散修改参数，而是让龙虾在语气、判断方式、执行习惯、边界控制和目标偏好上更贴近自己。

这意味着产品必须支持把以下内容转成可落地方案：

* 风格偏好
* 工作习惯
* 决策边界
* 任务优先级倾向
* 结果导向方式

### 8.3 风险控制问题

用户担心改坏 workspace，且无法可靠回退。

### 8.4 生效可信问题

用户不知道改完到底有没有真正生效，尤其在存在缓存、路径和会话层差异的情况下。([GitHub][2])

---

## 9. 产品核心机制

这是整份文档最关键的一部分。

### 9.1 核心机制总览

产品不是“Chat -> 直接写文件”。

而是：

> **规则基线 -> 目标行为画像 -> BuildPlan -> 预览与筛选 -> 受控应用 -> 生效验证 -> 版本沉淀**

### 9.2 四层引擎

#### A. Rule Baseline Engine

负责持有当前 OpenClaw 版本的规则基线，包括：

* 被注入的文件集合
* first-run only 文件
* 可选文件
* skills 搜索路径与优先级
* 是否需要重启 / 新 session 才稳定生效
* 已知 caveats

#### B. Plan Engine

把用户输入先转为严格定义的目标行为画像，再转为 BuildPlan，而不是自由文本。

#### C. Apply Engine

按照 BuildPlan 执行文件新增/修改、skills 安装、revision 记录与失败回退。

#### D. Validation Engine

执行结构校验、场景测试、已知 caveat 检查与 post-apply 生效验证。

---

## 10. 有效性保证机制

这一部分是产品成立的核心。

### 10.1 为什么必须单独设计“有效性”

如果没有有效性保证，产品会退化成：

* 会说漂亮话的配置生成器
* 能改文件但不能证明更好用
* 用户试两次就失去信任的聊天玩具

所以必须把“有效性”拆成四层。

### 10.2 四层有效性

#### 1）结构有效性

保证生成结果结构正确、可写入、可回滚、不破坏用户环境。

实现方式：

* BuildPlan schema 校验
* 受控 change type
* 默认禁删
* apply 前 diff
* apply 后 revision
* rollback 必须可用

#### 2）场景有效性

保证改完后更像目标角色，而不是仅仅改了文件。

实现方式：

* 每类模板绑定 3~5 条 smoke test
* 每条测试有 rubric
* 产出得分和最低通过标准

#### 2.5）行为有效性

保证改完后不仅“能工作”，而且工作方式更接近用户想要的品味、习惯与目标终点。

实现方式：

* 为不同 persona / template 维护行为画像维度
* 用 rubric 评估输出风格、任务边界、执行顺序和结果导向
* 对比改动前后是否更接近目标画像

#### 3）目标有效性

保证产品只对可支持目标输出方案，对超出边界的诉求明确引导或拒绝。

实现方式：

* 用户意图三分类：

  * 可直接支持
  * 可部分支持
  * 明确拒绝

#### 4）产品有效性

保证产品本身真的节省时间、提高成功率，而不是平添复杂度。

实现方式：

* 追踪首次成功定制率
* 首次可用率
* 模板复用率
* 回滚率
* 从输入需求到拿到可用 workspace 的中位时间

---

## 11. 最终边界定义

## 11.1 能做什么

MVP 必须支持：

* 发现或手动指定 OpenClaw workspace
* 读取当前 workspace 状态
* 基于 chat / form / template 生成目标行为画像与 BuildPlan
* 文件级 diff
* 单项勾选变更
* 受控应用
* revision 记录
* rollback
* self-check
* smoke test
* template 保存与复用
* 受控 skills 管理

## 11.2 应该做什么

产品应始终优先保证：

* 透明
* 受控
* 可解释
* 可验证
* 可回滚
* 本地优先
* 让用户能塑造而不只是设置

## 11.3 拒绝做什么

以下诉求必须引导而不是硬做：

* 构建公众号自动化执行系统
* 管理任意系统目录
* 黑盒执行高风险脚本
* 对外部业务结果做承诺
* 把 OpenClaw 变成远程托管服务

---

## 12. 用户超范围诉求时的引导策略

### 诉求：帮我做公众号自动化运营 agent

引导：
本产品只负责定制 OpenClaw 的工作区、persona、memory 与 skills，不负责外部平台自动化执行链路。你可以先创建“内容运营型工作区模板”。

### 诉求：帮我管理电脑里其他任意目录

引导：
本产品只管理 OpenClaw 相关的 workspace 与 skills 目录，不管理无关系统目录。

### 诉求：帮我直接执行一堆安装脚本

引导：
当前只支持受控、可预览、可确认的安装与配置操作。

### 诉求：帮我生成一个能直接赚钱的龙虾

引导：
本产品负责生成配置方案和行为约束，不承诺业务结果。

---

## 13. 核心对象模型

产品围绕以下对象构建：

* Workspace
* Bootstrap Files
* Optional Context Files
* Skills
* BuildPlan
* Revision
* Template
* Rule Registry
* Caveat Registry
* Validation Profile
* Smoke Test Suite

---

## 14. BuildPlan 机制

### 14.1 原则

LLM 不能直接改文件。
LLM 不能只停留在“参数建议”。
LLM 必须先生成目标行为画像，再生成**严格结构化的 BuildPlan**。
本地引擎才可以执行。

### 14.1.1 目标行为画像

在 BuildPlan 之前，产品应先形成一个可解释的目标行为画像，至少包含：

* 目标角色
* 风格倾向
* 工作习惯
* 风险偏好
* 边界要求
* 目标终点

它的意义不是做心理测评，而是把“我想让龙虾更像什么”转成可执行约束。

### 14.2 BuildPlan 必须包含

* plan_id
* title
* summary
* target_workspace
* intent_type
* changes[]
* warnings[]
* post_apply_checks[]
* template_tags[]

### 14.3 change 类型

MVP 仅允许：

* create_file
* update_file
* create_folder
* install_skill

默认不支持 delete。
删除能力仅预留接口，不在 MVP 放开。

---

## 15. 规则基线与版本化验证机制

这是区别于普通配置工具的关键能力。

### 15.1 为什么需要这一层

官方文档定义了规范行为，但公开 issue 说明部分运行时行为存在缓存和路径相关差异。产品若不做版本化规则层，就无法判断“改了是否真生效”。([OpenClaw][4])

### 15.2 规则基线结构

产品内部维护 `Rule Registry`，至少包含：

* openclaw_version
* repo_commit
* injected_files
* optional_files
* first_run_only_files
* skill_search_paths
* precedence_order
* requires_restart_on_change
* known_runtime_caveats
* unsupported_operations

### 15.3 规则来源

* 官方文档定义规范
* 固定版本源码定义当前实现
* issue 生成 caveat 列表

### 15.4 使用方式

流程必须是：

**Rule Registry -> BuildPlan 生成 -> Apply -> Validation**

而不能是：

**用户需求 -> LLM 自由发挥 -> 写文件**

---

## 16. 核心流程

## 16.1 流程 A：首次接入

1. 打开应用
2. 自动检测默认 workspace
3. 如失败则让用户手动指定
4. 扫描 workspace 树、核心文件存在性、skills 状态
5. 识别当前 OpenClaw 版本 / 规则包版本
6. 进入 Home

## 16.2 流程 B：创建新方案

1. 用户选择 chat 或 form
2. 输入目标
3. 系统做意图范围判断
4. 调用 Plan Engine 生成 BuildPlan
5. 本地 schema 校验
6. 用户进入 Review

## 16.3 流程 C：预览与应用

1. 展示变更清单
2. 展示每项变更原因
3. 展示风险等级
4. 展示 diff
5. 用户勾选要应用的项
6. Apply Engine 执行
7. 生成 revision

## 16.4 流程 D：生效验证

1. 结构校验
2. skill 安装校验
3. caveat 检查
4. 场景 smoke test
5. 输出 pass/fail 与改进建议

## 16.5 流程 E：回滚

1. 进入 revisions
2. 选择 revision
3. 查看摘要
4. rollback
5. 重跑 validation

## 16.6 流程 F：模板化

1. 从某次 revision 保存为 template
2. 模板记录适用场景、测试集、最低有效标准
3. 后续基于 template 再生成方案

---

## 17. 核心功能

## 17.1 Workspace Discovery

* 自动检测默认路径
* 手动设置路径
* 显示当前工作区健康状态

## 17.2 Workspace Explorer

* 只浏览受控目录
* 显示核心文件存在性
* 查看文件内容与摘要

## 17.3 Builder

* Chat 模式
* Form 模式
* Template 模式
* 输出结构化 BuildPlan

## 17.4 Review

* 变更列表
* 风险提示
* 逐项选择
* 进入 diff

## 17.5 Diff & Apply

* 文件级前后对比
* 部分应用
* apply 日志
* apply 成功后自动生成 revision

## 17.6 Revision Manager

* revision 列表
* 摘要
* rollback
* 当前版本标记

## 17.7 Template Manager

* 保存模板
* 模板命名
* 模板标签
* 模板复用

## 17.8 Skill Manager

* 发现 workspace / managed / bundled skills
* 展示来源与优先级
* 安装/卸载受控 skill
* 显示安装日志

官方文档明确技能存在三层来源，workspace 同名优先于 managed/local，再优先于 bundled。([OpenClaw][5])

## 17.9 Validation Center

* self-check
* caveat check
* smoke tests
* 结果评分
* 修复建议

---

## 18. 页面结构

一级页面建议如下：

### Home

显示：

* 当前 workspace
* 最近 revisions
* 最近 templates
* 快速入口

### Builder

显示：

* 会话/表单输入
* 结构化需求摘要
* BuildPlan 摘要

### Review

显示：

* 文件变更清单
* skill 清单
* 风险说明
* 勾选控制

### Diff & Apply

显示：

* diff
* apply 进度
* apply 结果

### Revisions & Templates

显示：

* version history
* rollback
* template 管理

### Settings

显示：

* workspace 路径
* provider/baseURL/model/apiKey
* skills 路径
* 安全策略
* 规则包版本
* 日志

---

## 19. 实现的核心逻辑

这一部分回答“这个产品到底是怎么工作的”。

### 19.1 实现总逻辑

不是让 AI 直接创造结果。
而是让 AI 在一个受控系统里工作。

这个系统交付的也不是单纯设置项，而是：

* 行为风格塑形
* 工作流习惯固化
* 目标导向约束落地

### 19.2 分工原则

#### 模板系统

提供少量高质量基线模板：

* coding
* research
* content
* custom-light

#### 规则系统

决定哪些文件会生效、哪些改动允许做、哪些改动有 caveat。

#### LLM

只负责理解用户目标、抽取行为画像、生成 BuildPlan 中的增量内容。

#### Apply Engine

执行实际落地。

#### Validation Engine

判断结果是否达到最低有效标准。

### 19.3 核心架构原则

* 规则优先于生成
* 模板优先于自由发挥
* 预览先于应用
* revision 先于覆盖
* 验证先于宣称有效

---

## 20. 数据模型

本地 SQLite 至少需要以下表：

* settings
* workspaces
* rule_registry
* caveat_registry
* build_plans
* revisions
* templates
* validation_profiles
* smoke_tests
* operation_logs
* llm_profiles

---

## 21. 安全与风险控制

### 21.1 风险点

* 覆盖用户已有 workspace
* 安装恶意或不兼容 skill
* 因缓存/会话机制导致“改了但不生效”
* 用户误认为产品能完成外部系统自动化

### 21.2 控制手段

* 默认禁删
* 默认高风险二次确认
* 明确 skill 来源
* 强制 diff
* 强制 revision
* 生效后 validation
* 已知 caveat 提示
* 超范围诉求明确引导

---

## 22. 验收标准

只有同时满足以下条件，MVP 才算成立：

1. 用户能检测或设置 OpenClaw workspace
2. 用户能通过 chat / form / template 生成目标行为画像与 BuildPlan
3. BuildPlan 是结构化 JSON，不是纯文本
4. 用户能查看文件级 diff
5. 用户能部分选择变更
6. 用户能成功应用 create/update/install_skill 类型变更
7. 每次 apply 都会生成 revision
8. 用户能从 revision 成功 rollback
9. 用户能保存 template 并复用
10. 用户能看到 self-check、smoke test 与行为有效性结果
11. 产品能识别并提示当前 OpenClaw 版本 caveat
12. 产品对越界诉求有明确引导，而不是假装自己能做

---

## 23. 指标体系

### 北极星指标

**成功 apply 且通过最低有效标准的方案次数**

### 关键指标

* 首次成功定制率
* 首次可用率
* 回滚率
* 模板复用率
* 平均生成耗时
* 从需求输入到拿到可用 workspace 的中位时间
* Validation 通过率
* Caveat 命中率

---

## 24. 迭代路线

### Phase 1：可信 MVP

目标：

* 从需求到可用 workspace 的闭环

包含：

* workspace 检测
* BuildPlan
* diff/apply
* revision
* rollback
* self-check
* smoke test
* template

### Phase 2：规则增强

目标：

* 更强的版本化适配与 caveat 管理

包含：

* rule registry 自动更新
* 更多场景模板
* 更强 validation

### Phase 3：生态能力

目标：

* 从工具走向平台入口

包含：

* 模板分享
* 团队策略
* 更细的 skill 供应链安全检查

---

## 25. 最终结论

ClawWorkbench 的核心不是“帮用户写 OpenClaw 配置”。
它真正要做的是：

> **把 OpenClaw 的 workspace 定制，升级为一个有规范基线、有固定版本实现映射、有有效性验证、有回滚与模板沉淀的本地行为塑形工作台。**

这个产品成立的关键，不在于大模型多聪明，而在于你是否把以下四层做扎实：

* 规范层
* 实现层
* 异常层
* 验证层

同时要始终坚持一个原则：

> **用户要的不是“多几个设置项”，而是“让龙虾更像自己，并更稳定地朝目标终点工作”。**

只有这样，它才不是一个“聊天改 md 文件工具”，而是一个真正**可信、可复用、可扩展**的 OpenClaw 定制产品。
