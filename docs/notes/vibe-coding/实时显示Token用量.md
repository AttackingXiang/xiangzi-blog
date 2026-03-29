---
title: Claude Code Token用量监控
order: 4
---

# Claude HUD 插件安装指南（中文）

> 插件地址：https://github.com/jarrodwatts/claude-hud
>
> 作用：在 Claude Code 界面底部显示实时 Token 用量与状态 HUD

## 效果图

![image-20260329200424137](%E5%AE%9E%E6%97%B6%E6%98%BE%E7%A4%BAToken%E7%94%A8%E9%87%8F.assets/image-20260329200424137.png)

## 步骤 1：添加插件市场

在 Claude Code 实例中执行以下命令：

```
/plugin marketplace add jarrodwatts/claude-hud
```

------

## 步骤 2：安装插件

执行安装命令：

```
/plugin install claude-hud
```

> ⚠️ **Linux 用户注意**：点击提示中的链接完成前置配置后，再执行安装命令。

安装成功后，系统会提示：`Installed claude-hud. Run /reload-plugins to apply.`

------

## 步骤 3：重载插件并配置状态栏

1. 重载插件

   （使新安装的插件生效）：

   ```
/reload-plugins
   ```

2. 配置状态栏：

   ```
   /claude-hud:setup
   ```

   > ⚠️ **Windows 用户注意**：如果 setup 提示「未找到 JavaScript 运行时」，需先安装 Node.js LTS：
   >
   > bash
   >
   > 运行
   >
   > ```
   > winget install OpenJS.NodeJS.LTS
   > ```
   >
   > 安装完成后重启终端，再次执行 `/claude-hud:setup`。

------

## 完成

- 重启 Claude Code 客户端，加载新的状态栏配置。
- 重启后，底部 HUD 面板将自动显示，可实时查看 Token 使用量等信息。

> 💡 Windows 用户需执行**完整重启**，确保状态栏配置生效。
