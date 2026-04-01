<div align="center">

![ClawWorkbench Banner](docs/assets/banner.png)

### 塑造龙虾的行为，而不只是改配置。

[![Version](https://img.shields.io/badge/version-0.1.0-blue?style=flat-square)](https://github.com/ccclucky/claw-workbench)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![Tauri](https://img.shields.io/badge/Tauri-2.x-FFC131?style=flat-square&logo=tauri&logoColor=white)](https://tauri.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)

[**English**](README.md) · [**中文**](README.zh-CN.md)

</div>

---

## ✨ ClawWorkbench 是什么？

**ClawWorkbench** 是一个本地优先的桌面应用，用于在 [OpenClaw](https://github.com/anthropics/openclaw) 工作区中塑造 AI Agent 的行为。你不需要手动编辑分散的配置文件和规则——只需描述你想要的工作风格、习惯和边界，ClawWorkbench 会将你的意图转化为受控的、可审查的、可回滚的工作区变更。

> **核心理念：** 用户要的不是配置参数——而是塑造行为。ClawWorkbench 打通了从 *意图* 到 *可验证行为变更* 的完整闭环。

## 🧠 为什么选择 ClawWorkbench？

| 痛点 | ClawWorkbench 的解决方案 |
|---|---|
| 手动编辑配置文件容易出错 | 引导式行为画像构建器 |
| 改完之后不知道是否真的生效 | 内置验证与行为有效性简报 |
| 没有安全的实验方式 | 完整的修订历史与一键回滚 |
| 偏好设置在会话间丢失 | 模板系统支持可复用的画像 |
| 看不清改了什么 | 每次应用前展示 Diff 预览 |

## 🚀 核心闭环

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  发现工作区  │────▶│  塑造行为画像     │────▶│  生成构建计划│
│             │     │                  │     │             │
└─────────────┘     └──────────────────┘     └──────┬──────┘
                                                     │
┌─────────────┐     ┌──────────────────┐     ┌──────▼──────┐
│  验证结果    │◀────│  安全应用         │◀────│  审查 Diff   │
│             │     │ （支持回滚）       │     │             │
└─────────────┘     └──────────────────┘     └─────────────┘
```

1. **发现工作区** — 自动检测并扫描你的 OpenClaw 工作区
2. **塑造行为画像** — 通过对话或结构化表单描述你的意图
3. **生成构建计划** — 受约束的方案，包含文件变更、风险标记和应用后检查
4. **审查 Diff** — 文件级别的 Diff 预览，支持逐项选择
5. **安全应用** — 原子化应用，自动记录修订历史，支持回滚
6. **验证结果** — 结构检查、冒烟测试和行为有效性简报

## 🏗️ 技术架构

```
┌──────────────────────────────────────────────────┐
│                 Tauri 2 外壳                     │
│  ┌────────────────────────────────────────────┐  │
│  │          React 19 + TypeScript             │  │
│  │  ┌──────────┐ ┌────────────┐ ┌──────────┐  │  │
│  │  │  工作区   │ │   行为     │ │ 构建计划  │  │  │
│  │  │  浏览器   │ │  画像器    │ │   引擎   │  │  │
│  │  └──────────┘ └────────────┘ └──────────┘  │  │
│  │  ┌──────────┐ ┌────────────┐ ┌──────────┐  │  │
│  │  │  Diff    │ │   修订     │ │  验证    │  │  │
│  │  │  查看器   │ │  管理器    │ │  中心    │  │  │
│  │  └──────────┘ └────────────┘ └──────────┘  │  │
│  └────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────┐  │
│  │             Rust 后端                      │  │
│  │    文件系统 · SQLite · Schema 验证          │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

| 层级 | 技术 | 用途 |
|---|---|---|
| 桌面外壳 | Tauri 2 | 原生窗口、文件系统访问、安全沙箱 |
| 前端 | React 19 + TypeScript | UI 组件、状态管理、Diff 渲染 |
| 构建系统 | Vite 7 | 快速 HMR、打包、开发服务器 |
| 后端 | Rust | 文件 I/O、SQLite、Schema 验证、计划执行 |
| 测试 | Vitest + Testing Library | 单元测试 & 集成测试 |

## 📦 快速开始

### 环境要求

| 依赖 | 版本 | 用途 |
|---|---|---|
| [Node.js](https://nodejs.org/) | ≥ 20.x | 前端工具链 |
| [Rust](https://rustup.rs/) | ≥ 1.75 | Tauri 后端 |
| [Tauri CLI](https://tauri.app/start/) | ≥ 2.x | 构建与开发命令 |

### 安装

```bash
# 克隆仓库
git clone https://github.com/ccclucky/claw-workbench.git
cd claw-workbench

# 安装依赖
npm install

# 启动开发服务器（仅前端）
npm run dev

# 使用 Tauri 启动（完整桌面应用）
cargo tauri dev
```

### 生产构建

```bash
# 构建前端
npm run build

# 构建桌面应用
cargo tauri build
```

## 🧪 测试

```bash
# 运行全部测试
npm test

# 监听模式运行测试
npx vitest

# 生成覆盖率报告
npx vitest --coverage
```

## 📂 项目结构

```
claw-workbench/
├── src/                    # 前端源码 (React + TypeScript)
│   ├── App.tsx             # 根应用组件
│   ├── main.tsx            # 入口文件
│   ├── styles.css          # 全局样式
│   └── lib/
│       └── schema/         # TypeScript 类型定义
│           ├── behaviorProfile.ts   # 行为画像类型
│           ├── buildPlan.ts         # 构建计划类型 & 验证
│           └── validationResult.ts  # 验证结果类型
├── src-tauri/              # Tauri 后端 (Rust)
│   ├── Cargo.toml          # Rust 依赖
│   ├── tauri.conf.json     # Tauri 配置
│   └── src/                # Rust 源代码
├── tests/                  # 测试文件
│   ├── app-shell.test.ts   # 应用外壳测试
│   └── schema/             # Schema 验证测试
├── docs/                   # 文档
│   └── plans/              # 路线图 & 规划文档
├── index.html              # HTML 入口
├── vite.config.ts          # Vite 配置
├── tsconfig.json           # TypeScript 配置
└── package.json            # Node.js 依赖
```

## 🎯 支持的场景（第一阶段）

| 场景 | 描述 | 关键特征 |
|---|---|---|
| 🖥️ **编程** | 工程导向的 Agent | 严格、重验证、少废话 |
| 🔬 **研究** | 研究导向的 Agent | 循证分析、对比观点、谨慎下结论 |
| ✍️ **内容** | 内容创作 Agent | 匹配语气、风格稳定、围绕目标组织 |
| ⚙️ **自定义（轻量）** | 自定义轻量画像 | 在受限 Schema 内自定义维度 |

## 🗺️ 路线图

| 阶段 | 状态 | 目标 |
|---|---|---|
| **Phase 0** — 认知验证 | ✅ 已完成 | 验证行为画像方法论是否匹配真实用户需求 |
| **Phase 1** — 可信闭环 MVP | 🔨 进行中 | 完整的「意图 → 应用 → 验证」闭环 |
| **Phase 2** — 规则增强 | 📋 计划中 | 更强的规则注册表、版本化 Caveat、应用后验证 |
| **Phase 3** — 资产沉淀 | 📋 计划中 | 模板管理、演化历史、可复用风格资产 |

## 🤝 参与贡献

欢迎贡献！请按照以下步骤操作：

1. **Fork** 本仓库
2. **创建**功能分支（`git checkout -b feat/amazing-feature`）
3. **提交**你的修改（`git commit -m 'feat: add amazing feature'`）
4. **推送**到分支（`git push origin feat/amazing-feature`）
5. **发起** Pull Request

### 提交规范

本项目遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

| 前缀 | 用途 |
|---|---|
| `feat:` | 新功能 |
| `fix:` | 修复 Bug |
| `docs:` | 仅文档变更 |
| `refactor:` | 代码重构 |
| `test:` | 添加或更新测试 |
| `chore:` | 构建流程或工具变更 |

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE) 开源。

---

<div align="center">

**为 OpenClaw 社区而生 🦞**

[反馈 Bug](https://github.com/ccclucky/claw-workbench/issues) · [功能请求](https://github.com/ccclucky/claw-workbench/issues) · [社区讨论](https://github.com/ccclucky/claw-workbench/discussions)

</div>

