---
title: playwright
order: 8
---

# playwright — 浏览器自动化与 E2E 测试

> **GitHub 源码**：[https://github.com/microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp)
>
> **安装量**：134.6K | **类型**：官方插件（Microsoft Playwright 官方）

---

## 插件简介

`playwright` 集成了 Microsoft Playwright 的 MCP 服务器，让 Claude 可以**直接控制浏览器**进行自动化操作和 E2E 测试。支持生成 Playwright 测试脚本、执行浏览器操作、截图录制等。

**核心能力**：
- 生成高质量的 Playwright 测试脚本
- 实时运行浏览器自动化任务
- 截图、录制视频、捕获网络请求
- 支持 Chromium、Firefox、Safari（WebKit）
- 支持有头（headed）和无头（headless）模式

---

## 安装

```bash
/plugin install playwright@claude-plugins-official
/reload-plugins
```

**前置要求**：

```bash
# 安装 Playwright（如尚未安装）
npm init playwright@latest

# 或者仅安装浏览器
npx playwright install
```

---

## 使用方式

**生成 E2E 测试用例**：

```
为登录页面生成完整的 E2E 测试，覆盖：
- 正确账号密码登录成功
- 错误密码显示错误提示
- 空表单提交的验证
- 记住密码功能

URL：http://localhost:3000/login
```

**执行自动化操作**：

```
用 Playwright 完成以下操作：
1. 打开 https://example.com
2. 点击"注册"按钮
3. 填写注册表单（邮箱：test@example.com，密码：Test1234）
4. 提交并截图结果页面
```

**UI 回归测试**：

```
为首页生成视觉回归测试脚本，在 1920x1080 和 375x812（iPhone）分辨率下截图对比
```

**API + UI 联动测试**：

```typescript
// 生成带 API mock 的测试示例
test('购物车添加商品', async ({ page }) => {
  // mock API 响应
  await page.route('/api/cart', route => route.fulfill({
    body: JSON.stringify({ items: [], total: 0 })
  }));

  await page.goto('/shop');
  await page.click('[data-testid="add-to-cart"]');
  await expect(page.locator('.cart-count')).toHaveText('1');
});
```

**常用测试模式**：

```bash
# 运行所有测试
npx playwright test

# 运行特定文件
npx playwright test tests/login.spec.ts

# 有头模式（可见浏览器）
npx playwright test --headed

# 生成测试报告
npx playwright show-report
```

---

## 适合场景

- **关键业务流程 E2E 测试**：登录、注册、支付、结账等
- **UI 回归测试**：发布前检查页面是否有样式破坏
- **跨浏览器兼容性**：同时测试 Chrome / Firefox / Safari
- **爬虫 / 数据采集**：自动化网页操作（注意合规性）
- **CI/CD 集成**：PR 合并前自动运行 E2E 测试

---

## 注意事项

- 需安装 Playwright 浏览器二进制文件（约 200-400MB，首次安装较慢）
- 测试用例依赖页面的 DOM 结构，**页面改版后需及时更新**
- 网络延迟会影响测试稳定性，复杂页面建议增加等待时间（`waitForSelector`）
- CI 环境需要安装系统依赖（Linux 下尤其注意），参考官方文档
- 有头模式在服务器上无法运行，CI 必须使用 headless 模式
- 测试文件建议放在 `e2e/` 或 `tests/` 目录，与单元测试分开管理
