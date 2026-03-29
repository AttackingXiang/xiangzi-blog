---
title: superpowers
order: 2
---

# superpowers — 超能力模式

> **GitHub 源码**：[https://github.com/anthropics/claude-plugins-official/tree/main/plugins/superpowers](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/superpowers)
>
> **安装量**：294.8K | **类型**：官方插件

---

## 插件简介

`superpowers` 开启 Claude 的「超能力模式」，允许 Claude 在处理复杂任务时使用**头脑风暴、子代理协作、多步骤规划**等高级能力。适合那些单轮对话无法完成、需要系统性思考和拆解的复杂任务。

**核心能力**：
- **多步骤规划**：将大任务自动拆解为可执行的子任务，逐步推进
- **子代理协作**：并行启动多个专注子任务的 Agent，提升效率
- **头脑风暴模式**：发散思维，生成多个候选方案再收敛
- **自我反思**：每步完成后评估输出质量，必要时自我修正

---

## 安装

```bash
/plugin install superpowers@claude-plugins-official
/reload-plugins
```

---

## 使用方式

```bash
# 触发超能力模式
/superpowers <你的任务>
```

或者在提示中明确说明使用 superpowers：

```
用 superpowers 帮我规划一个 AI 聊天机器人项目的架构

用 superpowers 分析这个代码库的技术债务并给出重构路线图

用 superpowers 为我的 SaaS 产品设计完整的用户认证系统，包括前后端方案
```

**典型工作流示例**：

```
我需要把我们的单体应用拆分为微服务架构，用 superpowers 帮我：
1. 分析现有架构的耦合点
2. 设计服务边界
3. 制定迁移路线图（不停机）
4. 列出潜在风险和应对方案
```

---

## 适合场景

- **复杂项目规划**：从零开始设计系统架构、技术选型
- **技术决策**：对比多个方案，权衡利弊后给出推荐
- **大型重构**：分析代码库、制定分阶段重构计划
- **问题调试**：多角度分析疑难 bug 的可能根因
- **创意发散**：产品功能头脑风暴、需求分析
- **知识整合**：将多个领域信息综合，生成完整解决方案

---

## 注意事项

- 超能力模式会生成**较长的思考链**，响应时间比普通模式慢
- 复杂任务可能消耗更多 Token，注意 context 窗口限制
- 建议在提示中**明确目标与约束条件**，避免 Claude 发散过度
- 对于简单的单步任务，不必使用此插件，普通对话更高效
- 子代理并行时，各 Agent 输出可能需要人工整合和验证
