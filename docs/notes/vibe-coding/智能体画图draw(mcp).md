> 使用 draw.io MCP 智能体在 AI 编程工具中绘制流程图。

## 🛠️ Step 1 · 准备环境

确保系统已安装 **Node.js**（建议 v18+）：

```bash
node -v
npm -v
```

✅ 环境检查完成

---

## 📦 Step 2 · 全局安装 draw.io MCP

使用 `-g` 参数全局安装，方便任何项目调用：

```bash
npm install -g @drawio/mcp
```

::: tip 权限提示
如果在 macOS 或 Linux 上遇到权限问题，可能需要在命令前加 `sudo`。
:::

验证安装：

```bash
npx @drawio/mcp --version
```

![安装验证](%E6%99%BA%E8%83%BD%E4%BD%93%E7%94%BB%E5%9B%BEdraw(mcp).assets/image-20260404220328162.png)

✅ 安装完成

---

## ⚙️ Step 3 · 配置 MCP 客户端

### 3.1 OpenCode 配置

**配置文件路径**：  
`C:\Users\用户名\.config\opencode\opencode.json`

在 `mcpServers` 对象中添加：

```json
"drawio": {
  "type": "local",
  "command": ["npx", "-y", "@drawio/mcp"],
  "enabled": true
}
```

![OpenCode 配置](%E6%99%BA%E8%83%BD%E4%BD%93%E7%94%BB%E5%9B%BEdraw(mcp).assets/image-20260404220204873.png)

### 3.2 Claude Code 配置

**方式一：命令行配置（推荐）**

```bash
claude mcp add drawio --transport stdio -- npx -y @drawio/mcp
```

**方式二：手动编辑配置**

**文件路径**：`~/.claude.json`（用户根目录下的隐藏文件）

```json
"mcpServers": {
  "drawio": {
    "command": "npx",
    "args": ["-y", "@drawio/mcp"]
  }
}
```

::: warning 注意
配置内容参数与 OpenCode 不完全相同。如果在 Claude 中配置过，OpenCode 即使不配置也可能生效（共享配置）。
:::

![Claude Code 配置](%E6%99%BA%E8%83%BD%E4%BD%93%E7%94%BB%E5%9B%BEdraw(mcp).assets/image-20260404221459990.png)

### 3.3 Claude Desktop 配置

**配置文件路径**：

| 操作系统 | 路径 |
|:--------|:-----|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

```json
{
  "mcpServers": {
    "drawio": {
      "command": "npx",
      "args": ["-y", "@drawio/mcp"]
    }
  }
}
```

![Claude Desktop 配置](%E6%99%BA%E8%83%BD%E4%BD%93%E7%94%BB%E5%9B%BEdraw(mcp).assets/image-20260404221306134.png)

✅ 配置完成

---

## 🔄 Step 4 · 重启验证

重启应用后，输入 `/mcp` 命令，确认显示 `drawio connected` 即表示配置成功。

![MCP 连接成功](%E6%99%BA%E8%83%BD%E4%BD%93%E7%94%BB%E5%9B%BEdraw(mcp).assets/image-20260404220423786.png)

![MCP 状态确认](%E6%99%BA%E8%83%BD%E4%BD%93%E7%94%BB%E5%9B%BEdraw(mcp).assets/image-20260404220428034.png)

✅ 验证通过

---

## ✏️ Step 5 · 使用 draw.io MCP

### 5.1 调用智能体

直接在对话中让 AI 帮你绘制图表：

“@引用的代码 帮我梳理这些代码的逻辑的逻辑，梳理成流程图，输出一个drawio 的文件”

### 5.2 常见报错处理

如果 AI 默认生成 URL 快捷方式，可能在 Windows 上因 URL 过长导致缓冲区错误：

![缓冲区错误](%E6%99%BA%E8%83%BD%E4%BD%93%E7%94%BB%E5%9B%BEdraw(mcp).assets/image-20260404220514090.png)

::: tip 解决方式
明确要求 AI 生成 `.drawio` 格式文件：`你直接生成 draw 格式的文件到指定目录下`
:::

![生成 draw 文件](%E6%99%BA%E8%83%BD%E4%BD%93%E7%94%BB%E5%9B%BEdraw(mcp).assets/image-20260404220652476.png)

生成成功后，文件可直接编辑。

### 5.3 打开 draw.io 文件

| 方式 | 说明 | 链接 |
|:-----|:-----|:-----|
| 桌面客户端 | 下载安装 draw.io Desktop | [GitHub Releases](https://github.com/jgraph/drawio-desktop/releases) |
| 在线编辑 | 浏览器直接打开，拖入文件 | [app.diagrams.net](https://app.diagrams.net/) |

✅ 使用完成

---

## 
