---
title: ralph-loop
order: 9
---

# ralph-loop — 自主迭代闭环

> **GitHub 源码**：[https://github.com/anthropics/claude-plugins-official/tree/main/plugins/ralph-loop](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/ralph-loop)
>
> **安装量**：120.6K | **类型**：官方插件

---

## 插件简介

`ralph-loop` 让 Claude 在单个会话内**持续循环执行任务**，每轮读取上一轮的输出和验证结果，自动修正直到满足你定义的完成条件。相当于一个不需要人工干预的**自动化开发循环**。

**技术原理**：使用 Stop Hook 拦截 Claude 的退出行为，将同一任务重新喂入并保留文件和 Git 历史，形成闭环迭代。

**最适合的任务类型**：有**客观验证标准**的任务（测试通过、lint 无报错、构建成功等），不适合需要主观判断的任务。

---

## 安装

```bash
/plugin install ralph-loop@claude-plugins-official
/reload-plugins
```

---

## 使用方式

```bash
/ralph-loop "<任务描述>" --completion-promise "<完成条件>" [--max-iterations N]
```

**关键参数**：

| 参数 | 说明 | 示例 |
|------|------|------|
| `--completion-promise` | 定义完成条件，Claude 据此判断是否继续 | `"所有单元测试通过"` |
| `--max-iterations` | 最大循环次数，防止无限循环 | `--max-iterations 5` |
| `--on-failure` | 失败处理策略（stop/continue/report） | `--on-failure stop` |

**示例用法**：

```bash
# 补充单元测试
/ralph-loop "为所有 API 端点补充单元测试" \
  --completion-promise "所有测试通过且代码覆盖率 > 80%" \
  --max-iterations 8

# 消除 lint 错误
/ralph-loop "修复所有 ESLint 错误和警告" \
  --completion-promise "npm run lint 无任何报错" \
  --max-iterations 5

# 性能优化
/ralph-loop "优化首页加载性能" \
  --completion-promise "Lighthouse 性能分数 > 90" \
  --max-iterations 6

# TypeScript 类型修复
/ralph-loop "修复所有 TypeScript 类型错误" \
  --completion-promise "tsc --noEmit 零错误" \
  --max-iterations 10
```

**写好提示的要点**：

```
✅ 好的 completion-promise：
  - "所有测试通过"（可自动验证）
  - "npm run build 成功，无 warning"
  - "lint 错误数量为 0"

❌ 不好的 completion-promise：
  - "代码看起来更好"（无法客观判断）
  - "用户满意"（需要人工确认）
```

---

## 适合场景

- **补充测试覆盖**：目标覆盖率 X%，循环直到达标
- **消除静态分析警告**：ESLint / TypeScript 零错误
- **算法优化**：循环迭代直到满足性能基准
- **自动化修复**：依赖升级后修复所有兼容性问题
- **代码生成**：重复生成直到所有用例通过

---

## 注意事项

- **必须设置 `--max-iterations`**，防止循环失控消耗大量 Token
- 建议加入逃生出口：`"如果连续 2 次失败则停止并报告原因"`
- 任务拆分为渐进式小目标，而非一次性巨型任务
- **Windows 用户**：可能需要在 hooks.json 中手动指定 Git Bash 路径，避免 WSL 路径解析冲突
- 不适合生产环境调试或需要人工判断的场景
- 每次迭代都会修改文件，建议在干净的 Git 分支上操作，方便回滚
