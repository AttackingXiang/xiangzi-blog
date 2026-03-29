---
title: typescript-lsp
order: 10
---

# typescript-lsp — TypeScript 语言服务器

> **GitHub 源码**：[https://github.com/anthropics/claude-plugins-official/tree/main/plugins/typescript-lsp](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/typescript-lsp)
>
> **安装量**：116.5K | **类型**：官方插件

---

## 插件简介

`typescript-lsp` 为 Claude 接入 TypeScript Language Server Protocol（LSP），让 Claude 能够像 IDE 一样理解 TypeScript/JavaScript 代码——类型检查、符号跳转、引用查找、错误诊断，提供更精准的代码修改建议。

**核心能力**：
- **类型检查**：实时检测类型错误，理解复杂泛型
- **代码补全**：基于类型推断提供精准补全建议
- **定义跳转**：理解符号定义位置，分析代码引用链
- **错误诊断**：提供与 VS Code 完全一致的错误提示
- **重构支持**：安全重命名变量、函数、类型

---

## 安装

```bash
/plugin install typescript-lsp@claude-plugins-official
/reload-plugins
```

**前置要求**：
- Node.js 18+
- 项目中有 `tsconfig.json`（TypeScript 项目）
- 安装了项目依赖（`npm install` / `pnpm install`）

---

## 使用方式

安装后无需手动触发，Claude 在处理 `.ts`、`.tsx`、`.js`、`.jsx` 文件时自动使用 LSP 能力。

**类型错误修复**：

```
修复这段 TypeScript 代码的所有类型错误：
[粘贴代码或文件路径]
```

**复杂泛型理解**：

```
解释这个泛型工具类型的作用，并给出使用示例：
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] }
```

**重构分析**：

```
我要把 UserService 中的 getUserById 方法重命名为 findUserById，
帮我找出所有调用这个方法的地方，给出完整的修改清单
```

**类型定义补全**：

```
为以下 API 响应数据补充完整的 TypeScript 类型定义：
[粘贴 JSON 数据]
```

**常见错误修复场景**：

```typescript
// TS2345: 类型不兼容
// TS2339: 属性不存在
// TS2304: 找不到名称
// TS7006: 隐式 any 类型
// TS2531: 对象可能为 null
```

---

## 适合场景

- **大型 TypeScript 项目**：依赖复杂，类型推断层级深
- **类型错误调试**：`tsc` 报出大量错误，难以理解根因
- **类型重构**：安全修改接口定义，追踪所有影响范围
- **学习高级 TypeScript**：理解复杂类型、条件类型、映射类型
- **严格模式迁移**：从宽松 TS 配置逐步迁移到 `strict: true`

---

## 注意事项

- 项目必须有 `tsconfig.json`，LSP 依赖它理解项目结构
- 缺少 `node_modules` 时类型推断不完整，务必先 `npm install`
- **大型 monorepo** 可能占用较多内存（TypeScript LSP 本身内存消耗较高）
- 对于 `.js` 文件，建议在 tsconfig 中开启 `"allowJs": true` 和 `"checkJs": true`
- 修改类型定义时，可能引起大范围的类型错误级联，注意分批处理
