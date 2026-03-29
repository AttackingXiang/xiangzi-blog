---
title: skill-creator
order: 12
---

# skill-creator — 自定义技能创建

> **GitHub 源码**：[https://github.com/anthropics/claude-plugins-official/tree/main/plugins/skill-creator](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/skill-creator)
>
> **安装量**：105.9K | **类型**：官方插件

---

## 插件简介

`skill-creator` 帮助你创建和优化 Claude Code 的自定义技能（Skills）。技能是可复用的提示模板，通过 `/skill-name` 命令触发，让重复性任务一键执行，团队共享统一工作流。

**技能 vs 插件的区别**：
- **插件**：扩展 Claude 的基础能力（MCP 服务器、新工具等）
- **技能（Skill）**：封装提示词模板，定义特定工作流的执行逻辑

**核心能力**：
- 定义技能触发条件和执行步骤
- 自动测试技能在不同场景下的表现
- 度量技能的效果和一致性
- 迭代优化技能提示词

---

## 安装

```bash
/plugin install skill-creator@claude-plugins-official
/reload-plugins
```

---

## 使用方式

```bash
/skill-creator <技能需求描述>
```

**创建新技能**：

```
用 skill-creator 创建一个"数据库查询优化"技能：
- 触发命令：/optimize-query
- 功能：分析 SQL 查询，添加索引建议，给出优化后的查询
- 输入：SQL 语句
- 输出：优化分析报告 + 优化后的 SQL

用 skill-creator 创建一个"提交信息生成"技能：
- 触发命令：/gen-commit
- 功能：根据 git diff 自动生成符合 Conventional Commits 规范的提交信息
- 包含：type(scope): description 格式

用 skill-creator 创建一个"API 文档生成"技能：
- 触发命令：/gen-api-docs
- 功能：扫描代码中的路由定义，自动生成 OpenAPI/Swagger 文档
```

**技能文件结构**（生成后保存在 `.claude/skills/`）：

```markdown
---
name: optimize-query
description: 分析并优化 SQL 查询语句，提供索引建议
trigger: /optimize-query
---

# SQL 查询优化分析

请对以下 SQL 查询进行深度分析：

## 分析步骤
1. 识别性能瓶颈（全表扫描、多表 JOIN、子查询等）
2. 分析索引使用情况
3. 给出具体优化建议（添加哪些索引、如何改写查询）
4. 提供优化后的 SQL 版本
5. 估计优化后的性能提升幅度

## 输出格式
...
```

**测试和迭代技能**：

```
测试这个技能在以下场景是否表现良好：
- 简单 SELECT 查询
- 复杂多表 JOIN
- 子查询嵌套
- 聚合函数

优化这个技能的提示词，让它的输出更结构化
```

---

## 适合场景

- **团队共享工作流**：将团队约定的开发规范封装成技能，一键执行
- **重复性任务自动化**：提交信息生成、API 文档、测试用例模板
- **项目特有流程**：针对项目需求定制 Claude 的行为模式
- **个人效率提升**：把自己常用的复杂提示词保存为技能

---

## 注意事项

- 技能文件存储在项目的 `.claude/skills/` 目录，可以提交到 Git 与团队共享
- 技能定义越清晰（输入/输出格式明确），实际执行效果越稳定
- 复杂技能建议**多轮测试**，覆盖边界情况
- 技能与代码库高度相关时，建议在 CLAUDE.md 中补充背景，避免技能执行时缺乏上下文
- 不要在技能中硬编码敏感信息（API Key、密码等）
