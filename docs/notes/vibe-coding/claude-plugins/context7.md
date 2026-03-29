---
title: context7
order: 3
---

# context7 — 实时文档注入

> **GitHub 源码**：[https://github.com/upstash/context7-mcp](https://github.com/upstash/context7-mcp)
>
> **安装量**：212.2K | **类型**：社区维护（Upstash）

---

## 插件简介

`context7` 通过 MCP 协议连接 Upstash 的 Context7 服务，将**最新版本的第三方库文档实时注入** Claude 的上下文。彻底解决 Claude 训练数据截止日期导致的 API 用法过时问题——不再收到已废弃 API 的代码建议。

**解决的核心痛点**：
- Claude 给出的代码基于旧版本文档，与当前库 API 不兼容
- 框架快速迭代（Next.js、React、Prisma 等），AI 难以跟上
- 调试过时 API 错误浪费大量时间

**技术原理**：底层运行 `npx -y @upstash/context7-mcp`，通过 MCP 服务器实时拉取目标库的最新文档并注入上下文。

---

## 安装

```bash
/plugin install context7@claude-plugins-official
/reload-plugins
```

**前置要求**：本机需安装 Node.js（用于运行 `npx` 命令）

---

## 使用方式

在提示中加上 `use context7` 即可触发文档查询：

```bash
# 框架文档
用 context7，告诉我 Next.js 15 的 App Router 路由配置方式

# 库的 API 用法
用 context7，查一下 Prisma v5 的 findMany 完整参数说明

# 迁移指南
用 context7，帮我把 React Query v4 代码迁移到 v5

# 最新特性
用 context7，介绍 Vite 6 有哪些新特性，并给出配置示例

# 错误排查
用 context7，我在用 Drizzle ORM，这个报错是什么意思：[粘贴错误]
```

**支持的热门库/框架**（部分示例）：

| 分类 | 支持库 |
|------|-------|
| 前端框架 | React、Vue、Angular、Svelte、SolidJS |
| 全栈框架 | Next.js、Nuxt、Remix、SvelteKit |
| 状态管理 | Zustand、Jotai、Pinia、Redux Toolkit |
| 数据库 ORM | Prisma、Drizzle、TypeORM、Mongoose |
| 构建工具 | Vite、Webpack、Turbopack、Rollup |
| 测试工具 | Vitest、Jest、Playwright、Cypress |
| UI 组件库 | shadcn/ui、Radix UI、Ant Design、MUI |
| 后端框架 | Hono、Fastify、NestJS、Express |

---

## 适合场景

- **使用更新频繁的框架**：Next.js、Prisma、tRPC 等每隔几个月就有大更新
- **版本升级**：从旧版本迁移到新版本时，获取准确的迁移指南
- **排查奇怪报错**：基于最新文档理解错误原因
- **学习新库**：快速获取当前版本的最佳实践

---

## 注意事项

- 需要**网络访问** Upstash 的 Context7 服务，离线环境无法使用
- 文档覆盖范围依赖 Context7 的索引，冷门库可能不在支持范围内
- **敏感代码不要使用**：查询时代码片段会发送到外部服务
- 首次查询可能稍慢（冷启动 MCP 服务器）
- Node.js 版本建议 18+，过低版本可能导致 `npx` 执行失败
