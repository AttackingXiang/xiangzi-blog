---
title: code-review
order: 4
---

# code-review — 多 Agent 并行代码审查

> **GitHub 源码**：[https://github.com/anthropics/claude-plugins-official/tree/main/plugins/code-review](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/code-review)
>
> **安装量**：191.9K | **类型**：官方插件

---

## 插件简介

`code-review` 同时启动**四个独立 Agent** 对代码或 Pull Request 进行全维度审查。每个 Agent 专注特定维度，并行运行互不干扰，最终汇总报告。每个问题附带**置信度评分（0–100）**，默认只显示评分 ≥ 80 的高置信度问题，过滤噪音。

**四个并行 Agent**：

| Agent | 审查维度 | 说明 |
|-------|---------|------|
| Agent 1 & 2 | 规范合规性 | 对照 `CLAUDE.md` 检查代码是否符合项目规范 |
| Agent 3 | 正确性 & Bug | 扫描明显逻辑错误、边界条件、空指针等 |
| Agent 4 | Git 历史上下文 | 结合提交历史，从演进角度发现潜在问题 |

---

## 安装

```bash
/plugin install code-review@claude-plugins-official
/reload-plugins
```

---

## 使用方式

```bash
# 在含有待审 PR 的仓库目录下执行
/code-review
```

**自动跳过**以下情况：
- 已关闭的 PR
- 草稿状态的 PR（Draft PR）
- 无实质代码变更的提交
- 已被本插件审查过的 PR

**指定文件范围**：

```bash
# 审查特定文件
/code-review src/auth/

# 审查指定 PR
/code-review --pr 123

# 调整置信度阈值（默认 80）
/code-review --confidence 90
```

**报告格式示例**：

```
## 代码审查报告

### 高优先级问题（置信度 ≥ 80）

**[安全] SQL 注入风险** | 置信度: 95
文件: src/db/queries.ts:47
问题: 用户输入直接拼接到 SQL 字符串
建议: 使用参数化查询或 ORM

**[正确性] 异步函数未处理错误** | 置信度: 88
文件: src/api/users.ts:23
问题: await 调用缺少 try-catch，可能导致未捕获的 Promise 异常
建议: 添加错误处理或使用 Result 类型
```

---

## 最佳实践

维护一份详细的 `CLAUDE.md` 是发挥此插件最大价值的关键：

```markdown
# CLAUDE.md 示例规范

## 代码规范
- 所有异步函数必须有错误处理
- 禁止在组件中直接调用 API，必须通过 service 层
- SQL 查询必须使用参数化语句

## 安全要求
- 用户输入必须经过 validation 后才能使用
- 密码必须使用 bcrypt 加密，禁止 MD5/SHA1
```

规范越具体，审查结果越精准。

---

## 适合场景

- **人工 Review 前的自动初筛**：快速过滤明显问题，节省 Reviewer 时间
- **小团队无专职 Code Reviewer**：借助 AI 补充审查能力
- **安全敏感项目**：API、支付、认证等模块的额外安全扫描
- **新人 PR 把关**：帮助新成员了解项目规范
- **开源项目维护**：处理大量外部贡献的 PR

---

## 注意事项

- **审查结果需人工复核**，特别是业务逻辑复杂的部分
- 置信度评分反映 AI 的确信程度，不等同于问题严重性
- 复杂业务逻辑可能产生误报，上下文理解有限
- 不能替代安全专家的渗透测试，安全审查仅供参考
- `CLAUDE.md` 为空时，合规检查维度会大幅削弱
