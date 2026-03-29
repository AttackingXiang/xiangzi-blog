---
title: github
order: 6
---

# github — GitHub 官方 MCP 服务器

> **GitHub 源码**：[https://github.com/github/github-mcp-server](https://github.com/github/github-mcp-server)
>
> **安装量**：158.3K | **类型**：官方插件（GitHub 官方维护）

---

## 插件简介

`github` 插件集成了 GitHub 官方维护的 MCP 服务器，让 Claude 可以直接操作 GitHub 上的仓库、Pull Request、Issue、代码内容等，无需离开对话窗口即可完成日常 GitHub 操作。

**核心能力**：
- 仓库内容读取和浏览
- 创建/更新/关闭 Issue 和 PR
- 查看/发表评论
- 管理分支和标签
- 查看 CI/CD 状态（Actions）
- 搜索代码、仓库、用户

---

## 安装

```bash
/plugin install github@claude-plugins-official
/reload-plugins
```

---

## 配置

使用前需配置 GitHub Token（Personal Access Token）：

```bash
# 在环境变量中设置
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxx
```

或者在 Claude Code 配置中设置（推荐，避免每次手动导出）。

**Token 所需权限**（按需选择）：
- `repo` — 操作私有仓库（完整权限）
- `public_repo` — 仅操作公开仓库
- `read:org` — 读取组织信息
- `workflow` — 管理 GitHub Actions

> 在 [GitHub Settings → Developer Settings → Personal access tokens](https://github.com/settings/tokens) 创建 Token

---

## 使用方式

**Issue 操作**：

```
在 owner/repo 仓库创建一个 Issue，标题为"登录页面在 Safari 上样式错乱"，标签为 bug

查看 owner/repo 仓库中所有 open 的 Issue，过滤标签为 enhancement

把 Issue #42 指派给 username
```

**PR 操作**：

```
列出 owner/repo 中待我 Review 的 PR

查看 PR #88 的变更内容和讨论

在 PR #88 上发表评论："LGTM，请修复 line 47 的拼写错误"

把 PR #88 合并（squash merge）
```

**仓库浏览**：

```
读取 owner/repo 的 src/auth/login.ts 文件内容

列出 owner/repo 最近 10 次提交记录

搜索 owner/repo 中所有包含 "TODO" 的文件
```

**CI/Actions 状态**：

```
查看 owner/repo 最新一次 CI 运行的状态和日志

列出 owner/repo 中失败的 Workflow 运行记录
```

---

## 适合场景

- **日常仓库管理**：不用切换浏览器，直接在 Claude 中操作 GitHub
- **Issue 批量处理**：批量分类、标记、关闭过期 Issue
- **PR Review 辅助**：结合 `code-review` 插件，一站式完成审查和评论
- **开源项目维护**：快速响应 Issues 和 PR
- **仓库分析**：让 Claude 分析仓库结构、贡献者、热点文件

---

## 注意事项

- **敏感/私有仓库**需要有相应权限的 Token，谨慎授权
- **破坏性操作**（关闭 Issue、合并 PR、删除分支）建议在 Claude 执行前二次确认
- Token 具有全局权限，泄露风险较高，建议使用**最小权限**原则
- API 频率限制：GitHub API 有 Rate Limit（认证用户 5000 次/小时），批量操作注意频率
- 部分企业 GitHub（GitHub Enterprise Server）可能需要额外配置 API 地址
