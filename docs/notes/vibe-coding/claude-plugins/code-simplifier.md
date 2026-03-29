---
title: code-simplifier
order: 5
---

# code-simplifier — 代码简化与重构

> **GitHub 源码**：[https://github.com/anthropics/claude-plugins-official/tree/main/plugins/code-simplifier](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/code-simplifier)
>
> **安装量**：159.9K | **类型**：官方插件

---

## 插件简介

`code-simplifier` 对代码进行**自动简化、重构和优化**，在不改变任何原有功能的前提下，提升代码可读性、减少冗余、统一风格。专注于代码质量而非功能变更。

**核心能力**：
- 消除重复代码（DRY 原则）
- 简化复杂的条件判断和嵌套结构
- 提取可复用的函数/组件
- 统一命名风格和代码规范
- 删除无用代码和死代码
- 现代化语法升级（如 ES5 → ES2023）

---

## 安装

```bash
/plugin install code-simplifier@claude-plugins-official
/reload-plugins
```

---

## 使用方式

```bash
/code-simplifier <文件路径或代码片段>
```

**按文件/目录**：

```bash
# 简化单个文件
/code-simplifier src/utils/helpers.ts

# 简化整个目录
/code-simplifier src/components/

# 简化并指定风格
/code-simplifier src/api/ --style functional
```

**内联使用**（在对话中直接触发）：

```
简化这段代码，提升可读性：
[粘贴代码]

重构这个函数，消除重复逻辑：
[粘贴代码]

把这段 callback 风格的代码改成 async/await：
[粘贴代码]
```

**典型简化案例**：

```javascript
// 简化前：嵌套地狱
function processUser(user) {
  if (user) {
    if (user.isActive) {
      if (user.role === 'admin') {
        if (user.permissions.includes('write')) {
          return doSomething(user);
        }
      }
    }
  }
  return null;
}

// 简化后：提前返回
function processUser(user) {
  if (!user?.isActive) return null;
  if (user.role !== 'admin') return null;
  if (!user.permissions.includes('write')) return null;
  return doSomething(user);
}
```

---

## 适合场景

- **清理技术债务**：老旧代码库中积累的冗余和不规范代码
- **接手遗留项目**：快速理解并整理前任留下的代码
- **代码 Review 前**：提交前先自动美化，减少低级审查意见
- **团队代码风格统一**：新旧风格混杂的代码库统一化
- **学习最佳实践**：通过对比简化前后，理解更好的写法

---

## 注意事项

- **极度复杂的业务逻辑**需人工验证简化前后行为一致
- 简化过程可能删除一些「看似冗余」的注释，重要注释请提前告知保留
- 建议先在开发分支操作，简化后运行完整测试套件验证
- 对于有副作用的代码（如全局状态修改），简化结果要仔细检查
- 不会主动添加新功能或改变接口签名
