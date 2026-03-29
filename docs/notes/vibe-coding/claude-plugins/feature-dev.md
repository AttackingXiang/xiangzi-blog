---
title: feature-dev
order: 7
---

# feature-dev — 七阶段功能开发工作流

> **GitHub 源码**：[https://github.com/anthropics/claude-plugins-official/tree/main/plugins/feature-dev](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/feature-dev)
>
> **安装量**：143.9K | **类型**：官方插件

---

## 插件简介

`feature-dev` 为 Claude 提供一套结构化的功能开发工作流，先深入理解代码库再动手，避免盲目修改。整个流程分为**七个阶段**，由**三个专属 Agent** 协同完成，覆盖从需求分析到文档编写的全流程。

**解决的核心痛点**：
- Claude 不了解代码库就直接生成代码，导致与现有架构冲突
- 缺乏架构思考，只会「堆功能」而不考虑可维护性
- 遗漏边界情况和错误处理
- 没有测试和文档

---

## 七个开发阶段

| 阶段 | 名称 | 内容 |
|------|------|------|
| 1 | **Discovery** | 明确需求，识别约束条件，理解业务目标 |
| 2 | **Codebase Exploration** | 并行启动多 Agent 分析现有架构、代码规律、依赖关系 |
| 3 | **Clarifying Questions** | 列出需确认的模糊点，等待人工确认后再推进 |
| 4 | **Architecture Design** | 提出 2-3 个实现方案，分析各自优劣和权衡 |
| 5 | **Implementation** | 按选定方案实现功能，遵循现有代码风格 |
| 6 | **Quality Review** | 专属 Agent 检查 Bug、代码质量、规范合规 |
| 7 | **Summary** | 总结完成内容，列出后续建议和潜在改进点 |

---

## 三个专属 Agent

| Agent | 职责 |
|-------|------|
| `code-explorer` | 追踪执行路径，定位关键文件和依赖，绘制代码地图 |
| `code-architect` | 基于现有模式设计实现蓝图，确保与架构一致 |
| `code-reviewer` | 置信度评分过滤，只上报高置信度问题（≥ 80） |

---

## 安装

```bash
/plugin install feature-dev@claude-plugins-official
/reload-plugins
```

---

## 使用方式

```bash
/feature-dev <需求描述>
```

**示例**：

```bash
# 新增功能
/feature-dev 添加用户 OAuth 登录功能，支持 Google 和 GitHub

# 功能重构
/feature-dev 重构订单模块以支持多币种，保持现有 API 不变

# 跨模块功能
/feature-dev 实现实时通知系统，包含 WebSocket 推送和通知中心 UI

# 集成第三方服务
/feature-dev 集成 Stripe 支付，支持订阅制和一次性付款
```

**带约束条件的用法**：

```
/feature-dev 实现文件上传功能
约束：
- 不引入新的第三方依赖
- 单文件不超过 50MB
- 支持断点续传
- 前端用现有的 React Query 处理状态
```

---

## 适合场景

- **改动跨多个文件**的复杂功能（需要架构决策）
- **不熟悉的代码库**：让 Claude 先探索再动手，避免踩坑
- **需要架构选型**的功能：有多个实现路径，需要权衡
- **全栈功能开发**：前端 + 后端 + 数据库同时涉及
- **复杂业务逻辑**：需要系统性思考而非直接写代码

---

## 注意事项

- **不适合紧急 hotfix**：七阶段流程较完整，时间成本相对较高
- 阶段 3（Clarifying Questions）需要人工响应，准备好回答问题
- 建议在提示中**明确边界**：不改变哪些、必须兼容什么
- 代码库越大，阶段 2 分析耗时越长，可以通过 `CLAUDE.md` 提供关键信息加速
- 生成的代码仍需运行测试验证，AI 不保证零 Bug
