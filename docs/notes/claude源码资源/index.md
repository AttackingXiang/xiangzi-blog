# Claude Code 源码解析资源整理

> Claude Code 的 npm 包于 2026 年 3 月底意外泄露了 `.map` 文件，
> 暴露出完整的 51 万行 TypeScript 源码。
> 以下是目前最值得参考的源码解析资源。

---

## 📖 系统性源码解析网站

**claudecoding.dev**
🔗 https://claudecoding.dev

专门深入剖析 Claude Code 架构设计与实现原理的网站，内容覆盖：

- 如何获取源码（入口指引）
- 提示词解析（系统 Prompt 是如何拼装的）
- Agent Loop 核心实现细节
- 工具（Tools）机制与运行原理
- Task / Sub Agents 原理（隔离上下文的并发任务）
- 本地存储结构（为什么不用数据库，只用 JSON）

适合想系统性了解 Claude Code 工程架构的同学。

---

## 🛠️ GitHub 开源教学项目

**Claude Code 源码从 0 到 1 教学指南（中英双语）**
🔗 https://github.com/zhu1090093659/claude-code

亮点：

- 双语对照，中文友好
- 公开了作者与 Claude Code 的完整对话细节
- 重点讲解 **Spec-Driven Development** 的实际使用方式
- 可直接复现，适合边读边练

---

## 🔍 补充：源码镜像（社区备份）

**instructkr/claude-code**
🔗 https://github.com/instructkr/claude-code

泄露事件后社区第一时间备份的源码镜像，已获 2 万+ Star。
可以直接对照源码阅读上面两个资源的解析内容。

---

## 技术栈速览

| 模块     | 技术                                 |
| -------- | ------------------------------------ |
| UI 层    | React + Ink（终端 UI 框架）          |
| 运行时   | Bun                                  |
| 语言     | TypeScript（51 万行）                |
| 存储     | 本地 JSON 纯文本，无数据库           |
| 核心模式 | Agent Loop + AsyncGenerator 流式输出 |



