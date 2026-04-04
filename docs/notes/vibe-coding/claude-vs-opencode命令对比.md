---
title: Claude Code vs OpenCode 命令对比
order: 2
---

# Claude Code vs OpenCode 命令对比

> Claude Code 最常用的 20 个命令，与 OpenCode 对应功能的横向比较。OpenCode 默认 Leader 键为 `Ctrl+X`，快捷键需先按 Leader 键再按第二个键。

---

## 对比总览

| # | Claude Code 命令 | 作用 | OpenCode 对应 |
|---|-----------------|------|--------------|
| 1 | `/clear` | 清空对话历史，开启新会话 | `/new` 或 `<leader> n` |
| 2 | `/model` | 切换 AI 模型 | `/models` 或 `<leader> m` 或 `F2` |
| 3 | `/compact` | 智能压缩上下文，节省 Token | `/compact`（别名 `/summarize`）或 `<leader> c` |
| 4 | `/cost` | 查看 Token 用量与费用 | `opencode stats`（CLI 命令） |
| 5 | `/resume` | 恢复历史会话 | `/sessions` 或 `<leader> l` |
| 6 | `/diff` | 内置交互式代码变更查看器 | ❌ 无，依赖 Git 的 undo/redo |
| 7 | `/plan` | 进入只分析不执行的规划模式 | ❌ 无 |
| 8 | `/rewind` | 检查点回滚，撤销 AI 改动 | `/undo` / `/redo` 或 `<leader> u/r` |
| 9 | `/memory` / `/init` | 持久化项目记忆（CLAUDE.md） | `/init`（生成 AGENTS.md） |
| 10 | `/help` | 查看所有可用命令 | `/help` 或 `<leader> h` |
| 11 | `/effort` | 调整模型思考深度等级 | ❌ 无 |
| 12 | `/config` | 打开设置界面调整偏好 | `opencode.json` 配置文件 |
| 13 | `/btw` | 提一个不计入历史的临时问题 | ❌ 无 |
| 14 | `/security-review` | 扫描待提交变更中的安全漏洞 | ❌ 无 |
| 15 | `/rename` | 为当前会话命名 | ❌ 无 |
| 16 | `/branch` | 创建对话分支，探索不同方向 | `<leader> Right/Left`（子会话导航） |
| 17 | `/export` | 将对话导出为文本文件 | `/export`（导出为 Markdown） |
| 18 | `/mcp` | 管理 MCP 服务器连接 | `opencode mcp`（CLI 命令） |
| 19 | `/doctor` | 诊断安装和配置是否正常 | ❌ 无 |
| 20 | `/pr-comments` | 拉取并展示 GitHub PR 评论 | `opencode github`（CLI，GitHub 自动化 Agent） |

---

## 详细说明

### 1. `/clear` — 清空对话历史，开启新会话

**Claude Code**
```
/clear
```
清空当前会话的对话历史，释放上下文窗口。保留 Session ID，可通过 `/resume` 恢复。

**OpenCode**
```
/new
```
或快捷键 `<leader> n`，开始一个全新会话。

> 功能等价。Claude Code 的 `/clear` 保留 Session ID 可恢复历史，OpenCode 的 `/new` 同样会保存旧会话，可通过 `/sessions` 找回。

---

### 2. `/model` — 切换 AI 模型

**Claude Code**
```
/model opus
/model sonnet
/model claude-sonnet-4-6
```
立即切换模型，支持短名称或完整模型 ID。

**OpenCode**
```
/models
```
打开可视化模型列表，也可用 `<leader> m` 或 `F2` / `Shift+F2` 在模型间循环切换。

> 功能等价。OpenCode 额外支持 `Tab` / `Shift+Tab` 切换 Agent，Claude Code 支持箭头键调整 effort 等级。

---

### 3. `/compact` — 智能压缩上下文，节省 Token

**Claude Code**
```
/compact
/compact "保留认证逻辑相关内容"
```
AI 自动将长对话历史总结压缩，可附加保留重点的指令，节省 Token 同时维持上下文连贯性。

**OpenCode**
```
/compact
/summarize
```
或快捷键 `<leader> c`，功能相同：将当前会话历史压缩摘要以减少 Token 占用。

> 两者均支持上下文压缩。Claude Code 支持附加保留指令（如「保留认证逻辑」），OpenCode 目前为无参数压缩。

---

### 4. `/cost` — 查看 Token 用量与费用

**Claude Code**
```
/cost
```
实时显示本次会话的输入/输出 Token 数、缓存命中情况及累计美元费用。

**OpenCode**
```bash
opencode stats   # CLI 命令，在 TUI 外运行
```
查看 Token 用量和费用统计，但需在终端以 CLI 子命令调用，不能在 TUI 对话中直接使用。

> Claude Code 可在会话中随时查询，OpenCode 需退出 TUI 或另开终端运行。

---

### 5. `/resume` — 恢复历史会话

**Claude Code**
```
/resume
/resume auth-refactor
claude --resume abc123   # CLI 启动时
```
列出所有历史会话并恢复，支持按名称或 ID 精确恢复。

**OpenCode**
```
/sessions
```
或快捷键 `<leader> l`，打开历史会话列表，选择后继续。CLI 也支持 `opencode run -s <id>` 恢复指定会话。

> 功能等价。

---

### 6. `/diff` — 内置交互式代码变更查看器

**Claude Code**
```
/diff
```
内置 diff 查看器，展示 Claude 本次会话中的所有代码改动。左右箭头切换「git diff」与「单轮 diff」，上下箭头浏览文件列表。

**OpenCode**
- ❌ 无内置 diff 查看器。需在终端手动运行 `git diff` 查看变更。
- 但 OpenCode 支持 `/undo` 撤销最近一次修改（含文件变更），需项目为 Git 仓库。

> Review AI 全部改动时 Claude Code 更直观；OpenCode 的 `/undo` 适合快速撤单次操作。

---

### 7. `/plan` — 进入只分析不执行的规划模式

**Claude Code**
```
/plan 修复认证 bug
/plan 重构用户模块
```
进入「只分析不动手」模式，Claude 先输出完整方案和步骤，等待用户确认后再执行，全程不修改任何文件。

**OpenCode**
- ❌ 无专用规划模式。可通过自然语言要求「先给我方案，不要改代码」实现类似效果，但无系统级强制保障。

> 大规模重构或高风险操作前，`/plan` 是避免灾难性误操作的安全阀。

---

### 8. `/rewind` — 检查点回滚，撤销 AI 改动

**Claude Code**
```
/rewind
```
打开检查点列表，将对话和代码一键回滚到任意历史节点，也可用 `Esc+Esc` 触发。

**OpenCode**
```
/undo      # 撤销最近一条消息及其文件改动
/redo      # 恢复被撤销的操作
```
或快捷键 `<leader> u` / `<leader> r`。Undo/Redo 作用于消息和文件变更，需项目为 Git 仓库。

> Claude Code 支持任意历史节点回滚；OpenCode 的 Undo/Redo 是线性的，无法跳跃到任意检查点。

---

### 9. `/memory` / `/init` — 持久化项目记忆

**Claude Code**
```
/init        # 生成 CLAUDE.md
/memory      # 编辑记忆文件
```
`CLAUDE.md` 记录项目约定、编码规范、常用命令等，Claude 每次会话启动时自动读取，实现跨会话持久记忆。

**OpenCode**
```
/init
```
或 `<leader> i`，为项目创建或更新 `AGENTS.md`，作用与 `CLAUDE.md` 相同：让 AI 了解项目背景和规范。

> 两者机制等价，文件名不同（CLAUDE.md vs AGENTS.md）。Claude Code 还额外提供 `/memory` 命令用于管理自动记忆条目。

---

### 10. `/help` — 查看所有可用命令

**Claude Code**
```
/help
```
显示所有可用命令列表，含简短说明，输入 `/` 后按 Tab 可自动补全。

**OpenCode**
```
/help
```
或 `<leader> h`，打开帮助对话框，显示命令和快捷键参考。

> 两者均支持 `/help`，功能等价。

---

### 11. `/effort` — 调整模型思考深度

**Claude Code**
```
/effort low      # 快速响应
/effort high     # 深度思考
/effort max      # 最大算力（仅 Opus 4.6，当前会话有效）
```
动态控制模型在每次响应上投入的思考深度，用速度换精度，或为复杂问题分配更多算力。

**OpenCode**
- ❌ 无等价命令。可通过切换支持 Extended Thinking 的模型，并用 `/thinking` 命令切换是否显示思考过程，但无法动态调整思考深度等级。

> 简单任务用 `low` 提速省钱，复杂架构设计用 `max` 保质量。

---

### 12. `/config` — 打开设置界面

**Claude Code**
```
/config
```
打开交互式设置菜单，调整主题、模型、输出格式、权限等全局偏好。

**OpenCode**
- 直接编辑 `opencode.json`（项目级）或 `~/.config/opencode/config.json`（全局）配置文件
- `/themes` 命令或 `<leader> t` 可切换主题

> Claude Code 提供 TUI 引导式配置，OpenCode 以配置文件为主。

---

### 13. `/btw` — 不计入历史的临时问题

**Claude Code**
```
/btw 那个配置文件叫什么名字？
/btw 这个函数的时间复杂度是多少？
```
提一个不写入对话历史的一次性问题，复用缓存费用低，不影响主线上下文，没有工具访问权限。

**OpenCode**
- ❌ 无等价功能。所有问答都会计入会话历史并消耗上下文。

> 确认细节、问侧面小问题时极好用，避免因一个小问题让上下文膨胀。

---

### 14. `/security-review` — 安全漏洞扫描

**Claude Code**
```
/security-review
```
扫描当前分支的待提交变更，检测注入漏洞、认证问题、数据暴露等安全风险，输出详细报告。

**OpenCode**
- ❌ 无内置安全审查命令，需要手动提示 AI 检查安全问题。

> 提交前一键安全扫描，是生产环境代码质量的最后一道防线。

---

### 15. `/rename` — 为当前会话命名

**Claude Code**
```
/rename auth-refactor
/rename    # 自动从历史生成名称
```
给当前会话贴上语义化标签，便于后续通过 `/resume` 精确找回。

**OpenCode**
- ❌ 会话以时间戳或自动 ID 标识，无法手动命名。

> 多项目并行时，命名会话能大幅提升管理效率。

---

### 16. `/branch` — 创建对话分支

**Claude Code**
```
/branch alternative-approach
```
在当前对话节点创建分支，在新分支中探索不同方向，不影响原有对话线。

**OpenCode**
- `<leader> Right` / `<leader> Left` 在子会话间导航
- `<leader> Up` 返回父会话
- OpenCode 的子会话机制与 Claude Code 的 `/branch` 类似，支持从当前节点派生

> 两者均支持分支式对话结构，OpenCode 以快捷键导航为主，Claude Code 以命名分支为主。

---

### 17. `/export` — 导出对话记录

**Claude Code**
```
/export
/export my-session.txt
```
将当前会话的完整对话历史导出为纯文本文件。

**OpenCode**
```
/export
```
或 `<leader> x`，将当前对话导出为 Markdown 文件并在 `$EDITOR` 中打开。CLI 也支持 `opencode export` 导出为 JSON。

> 功能等价，OpenCode 默认导出 Markdown，Claude Code 导出纯文本。

---

### 18. `/mcp` — 管理 MCP 服务器连接

**Claude Code**
```
/mcp
```
打开 MCP 管理界面，运行时动态连接、断开、认证外部工具和数据源。

**OpenCode**
```bash
opencode mcp   # CLI 命令，配置 MCP 服务器
```
在 `opencode.json` 的 `mcp` 字段中配置，重启后生效；也可用 CLI 命令管理。

> Claude Code 支持运行时动态管理；OpenCode 需修改配置文件，更改后重启生效。

---

### 19. `/doctor` — 诊断安装与配置

**Claude Code**
```
/doctor
```
自动检查安装完整性、认证状态、网络连通性和配置有效性，输出诊断报告。

**OpenCode**
- ❌ 无内置诊断命令。可用 `opencode auth` 检查认证状态，`opencode models` 验证模型连通性。

> 环境出问题时第一个运行的命令，快速定位是认证、网络还是配置的问题。

---

### 20. `/pr-comments` — 拉取 GitHub PR 评论

**Claude Code**
```
/pr-comments 123
/pr-comments https://github.com/owner/repo/pull/123
```
直接从 GitHub 拉取指定 PR 的所有评论并展示，Claude 可据此逐条回应修改意见（需已安装并认证 `gh` CLI）。

**OpenCode**
```bash
opencode github   # CLI 命令，设置 GitHub 自动化 Agent
```
提供 GitHub 自动化 Agent，但侧重于自动化任务，而非在 TUI 会话中直接读取 PR 评论。

> Claude Code 的 `/pr-comments` 更适合在会话中即时处理 Code Review 反馈。

---

## 一句话总结

**OpenCode** 核心斜杠命令覆盖了大多数基础场景（新建、恢复、压缩、导出、撤销），加上丰富的键盘快捷键，操作流畅高效。

**Claude Code** 在工程化深度上更进一步：规划模式（`/plan`）、多节点检查点回滚（`/rewind`）、会话内 diff 查看（`/diff`）、动态思考深度（`/effort`）、安全扫描（`/security-review`）等，构成了一套面向复杂长周期项目的完整 AI 编程体系。

---

> 参考：[Claude Code 命令指南](./命令指南.md) · [OpenCode 官方文档](https://opencode.ai/docs/)
