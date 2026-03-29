---
title: frontend-design
order: 1
---

# frontend-design — 前端设计增强

> **GitHub 源码**：[https://github.com/anthropics/claude-plugins-official/tree/main/plugins/frontend-design](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/frontend-design)
>
> **安装量**：413.6K | **类型**：官方插件

---

## 插件简介

`frontend-design` 让 Claude 在生成前端代码时自动应用更精致的设计规范——大胆的配色方案、有辨识度的字体排版、流畅的过渡动效，告别千篇一律的 AI 灰白风格，直接输出接近产品级的界面。

**核心能力**：
- 自动应用视觉设计原则（留白、对比度、层次感）
- 生成符合现代审美的色彩方案
- 添加适当的微交互和动效
- 适配 React / Vue / Angular / 原生 HTML+CSS

---

## 安装

```bash
/plugin install frontend-design@claude-plugins-official
/reload-plugins
```

安装后无需额外配置，Claude 在处理前端任务时**自动激活**设计增强能力。

---

## 使用方式

安装后直接描述你的需求，无需额外命令触发：

```
# 仪表盘类
设计一个现代 SaaS 后台仪表盘，使用 React + Tailwind，包含数据统计卡片和折线图

# 落地页
为一款 AI 写作工具创建落地页，风格简洁现代，突出产品特色

# 组件
设计一个带动画的加载骨架屏组件，适配暗色/亮色主题

# 音乐/媒体类
做一个音乐播放器 UI，风格参考 Spotify，深色主题

# 电商类
设计产品详情页，包含图片轮播、规格选择、加入购物车交互
```

**进阶用法**：如果希望指定设计风格，可以在提示中明确：

```
用 neumorphism 风格设计一个登录表单
用玻璃拟态（glassmorphism）做一个数据卡片组件
参考 Linear 的设计语言，做一个任务看板
```

---

## 适合场景

- **对视觉要求高的界面**：音乐播放器、数据看板、落地页、营销页
- **原型→产品**：希望跳过设计稿，直接输出可用界面
- **个人项目 / 作品集**：需要有设计感但没有专职设计师
- **快速原型验证**：向客户或团队展示界面方向

---

## 注意事项

- 生成的代码更关注视觉效果，**复杂业务交互逻辑**需要额外补充
- 涉及响应式断点时，建议在提示中明确说明目标设备（移动优先 / 桌面优先）
- 颜色方案基于 AI 判断，实际项目建议与品牌设计规范对齐
- 动效代码可能增加 bundle 体积，生产环境注意评估
- 与 `context7` 搭配使用效果更佳，可获取最新框架 API
