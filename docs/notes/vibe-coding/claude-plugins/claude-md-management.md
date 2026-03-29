---
title: claude-md-management
order: 11
---

# claude-md-management — CLAUDE.md 文档管理

> **GitHub 源码**：[https://github.com/anthropics/claude-plugins-official/tree/main/plugins/claude-md-management](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/claude-md-management)
>
> **安装量**：110.2K | **类型**：官方插件

---

## 插件简介

`claude-md-management` 专门用于维护和优化项目中的 `CLAUDE.md` 文件——这是 Claude Code 读取项目上下文的核心配置文件。插件帮助你持续审计文档质量、发现过时内容、与代码库保持同步。

**CLAUDE.md 是什么**：
- Claude Code 在每次会话开始时自动读取的项目指南
- 告诉 Claude 项目架构、编码规范、禁止事项等
- 质量越高，Claude 给出的建议越贴合实际项目

**核心能力**：
- 审计 `CLAUDE.md` 质量，发现模糊、过时、缺失的内容
- 对比代码库现状，找出文档与代码的不一致
- 生成更新建议，自动补充缺少的关键信息
- 检测是否有代码规范未被记录在文档中

---

## 安装

```bash
/plugin install claude-md-management@claude-plugins-official
/reload-plugins
```

---

## 使用方式

```bash
# 审计并优化 CLAUDE.md
/revise-claude-md

# 或者完整命令
cc /revise-claude-md
```

**常见操作**：

```
检查并优化项目中的 CLAUDE.md 文件，重点关注：
1. 是否有过时的架构描述
2. 是否缺少新增模块的说明
3. 代码规范部分是否完整

分析这个项目，自动生成一份高质量的 CLAUDE.md
```

**一份好的 CLAUDE.md 应该包含**：

```markdown
# CLAUDE.md 模板

## 项目概述
[一句话描述项目是什么、做什么]

## 技术栈
- 前端：React 18 + TypeScript + Vite
- 后端：Node.js + Fastify + Prisma
- 数据库：PostgreSQL

## 项目结构
src/
  api/          # API 路由层
  services/     # 业务逻辑层
  db/           # 数据库模型和查询
  components/   # React 组件

## 开发规范
- 所有异步函数必须有错误处理
- 禁止直接在组件中调用 API，必须通过 service 层
- 新增功能必须补充单元测试

## 禁止事项
- 不要修改 `db/migrations/` 中已提交的迁移文件
- 不要在 `config/` 目录硬编码密钥

## 常用命令
- `npm run dev` — 启动开发服务器
- `npm run test` — 运行测试
- `npm run build` — 构建生产版本
```

---

## 适合场景

- **项目初期**：自动扫描代码库，生成初始 `CLAUDE.md`
- **重构后**：代码架构发生变化，文档需要同步更新
- **团队协作**：确保所有成员的 Claude 工作在一致的上下文下
- **定期维护**：每隔几周审计一次，保持文档新鲜度

---

## 注意事项

- 仅作用于 `CLAUDE.md` 文件，不会修改其他文档
- 文档修改需要**提交版本控制**，让团队共享最新规范
- 建议每次大功能开发后运行一次，保持文档与代码同步
- 生成的内容需要人工审核，AI 可能遗漏某些隐性规范
- `CLAUDE.md` 过长会消耗大量 context，保持简洁精准（建议 < 500 行）
