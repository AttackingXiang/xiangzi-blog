# Hermes Agent 使用说明

> 版本：v0.10.0 | 安装路径：`/root/.hermes/` | 服务器：192.168.10.200

---

## 一、配置文件位置

| 文件     | 路径                    | 用途                       |
| -------- | ----------------------- | -------------------------- |
| 主配置   | `~/.hermes/config.yaml` | 模型、provider、工具开关等 |
| 密钥配置 | `~/.hermes/.env`        | API Keys                   |
| 会话记录 | `~/.hermes/sessions/`   | 历史对话                   |
| 记忆数据 | `~/.hermes/memories/`   | 长期记忆                   |
| Skills   | `~/.hermes/skills/`     | 技能插件                   |
| 日志     | `~/.hermes/logs/`       | 运行日志                   |

---

## 二、当前配置

```yaml
# ~/.hermes/config.yaml
model:
  default: "MiniMax-M2.5"
  provider: "minimax-cn"
  base_url: "https://api.minimaxi.com/v1"
```

```bash
# ~/.hermes/.env
MINIMAX_CN_API_KEY=sk-cp-xxxxxx
```

---

## 三、常用命令

```bash
# 启动交互聊天（经典 REPL 模式）
hermes

# 启动现代 TUI 界面
hermes --tui

# 单次查询（非交互，适合脚本）
hermes chat -q "你好"

# 继续上次会话
hermes -c

# 继续指定名称的会话
hermes -c "项目名称"

# 通过 ID 恢复指定会话
hermes --resume <session_id>

# 查看诊断信息
hermes doctor

# 自动修复可修复的问题
hermes doctor --fix

# 查看历史会话列表
hermes sessions list

# 交互式会话选择器
hermes sessions browse

# 查看用量统计
hermes insights

# 实时跟踪日志
hermes logs -f

# 查看最近错误
hermes logs errors

# 查看最近 1 小时日志
hermes logs --since 1h

# 更新到最新版
hermes update

# 查看版本
hermes version
```

---

## 四、切换模型 / Provider

### 方法一：命令行交互选择

```bash
hermes model
```

### 方法二：直接编辑配置文件

```bash
vi ~/.hermes/config.yaml
```

修改以下字段：

```yaml
model:
  default: "模型名称"
  provider: "provider名称"
  base_url: "接口地址"    # 云端 provider 通常不需要填，私有部署必填
```

---

## 五、支持的 Provider 列表

### 云端服务

| Provider 值    | 说明              | 需要的 Key           |
| -------------- | ----------------- | -------------------- |
| `anthropic`    | Anthropic 直连    | `ANTHROPIC_API_KEY`  |
| `openrouter`   | OpenRouter 聚合   | `OPENROUTER_API_KEY` |
| `minimax-cn`   | MiniMax 中国      | `MINIMAX_CN_API_KEY` |
| `minimax`      | MiniMax 全球      | `MINIMAX_API_KEY`    |
| `gemini`       | Google AI Studio  | `GOOGLE_API_KEY`     |
| `nous`         | Nous Portal OAuth | `hermes login`       |
| `nous-api`     | Nous Portal API   | `NOUS_API_KEY`       |
| `copilot`      | GitHub Copilot    | `GITHUB_TOKEN`       |
| `zai`          | ZhipuAI GLM       | `GLM_API_KEY`        |
| `kimi-coding`  | Kimi / Moonshot   | `KIMI_API_KEY`       |
| `huggingface`  | HuggingFace       | `HF_TOKEN`           |
| `nvidia`       | NVIDIA NIM        | `NVIDIA_API_KEY`     |
| `ollama-cloud` | Ollama Cloud      | `OLLAMA_API_KEY`     |

### 本地 / 私有服务（OpenAI 兼容接口）

| Provider 值 | 说明                 |
| ----------- | -------------------- |
| `custom`    | 通用 OpenAI 兼容接口 |
| `ollama`    | Ollama 本地服务      |
| `lmstudio`  | LM Studio            |
| `vllm`      | vLLM 部署            |
| `llamacpp`  | llama.cpp server     |

---

## 六、切换为私有模型（自建服务）

适用于 Ollama、vLLM、LM Studio、llama.cpp 等本地/私有部署。

### 第一步：修改 `~/.hermes/config.yaml`

```yaml
model:
  default: "qwen2.5:72b"                   # 填写你的模型名
  provider: "ollama"                        # 或 vllm / lmstudio / custom
  base_url: "http://127.0.0.1:11434/v1"    # 你的服务地址
```

### 第二步：API Key（可选）

私有服务通常无需 Key，若需要在 `~/.hermes/.env` 中添加：

```bash
OPENAI_API_KEY=any-string
```

### 第三步：验证

```bash
hermes chat -q "你好"
```

### 常见私有部署示例

**Ollama（本机）**

```yaml
model:
  default: "qwen2.5:72b"
  provider: "ollama"
  base_url: "http://127.0.0.1:11434/v1"
```

**vLLM（远程服务器）**

```yaml
model:
  default: "Qwen/Qwen2.5-72B-Instruct"
  provider: "vllm"
  base_url: "http://192.168.10.x:8000/v1"
```

**任意 OpenAI 兼容接口**

```yaml
model:
  default: "your-model-name"
  provider: "custom"
  base_url: "http://your-server:port/v1"
  # api_key: "your-key"   # 取消注释填写 Key
```

---

## 七、Skills 技能管理

```bash
# 列出已安装的 skills
hermes skills list

# 搜索可用 skills
hermes skills search "关键词"

# 安装 skill
hermes skills install <skill-name>

# 启动时加载指定 skill
hermes -s skill-name1,skill-name2
```

---

## 八、会话管理

```bash
# 列出历史会话
hermes sessions list

# 交互式选择会话
hermes sessions browse

# 重命名会话
hermes sessions rename <session_id> "新名称"

# 导出会话
hermes sessions export <session_id>

# 清理旧会话
hermes sessions prune
```

---

## 九、环境变量优先级

配置优先级从高到低：

```
命令行参数 --model / --provider
  > 环境变量 HERMES_INFERENCE_PROVIDER
    > ~/.hermes/.env
      > ~/.hermes/config.yaml
```

---

## 十、常见问题

**Q：401 Missing Authentication header？**
检查 `base_url` 是否填写了错误的地址（如 OpenRouter 地址）。每个 provider 都有自己的接口地址：

- MiniMax China：`https://api.minimaxi.com/v1`
- MiniMax Global：`https://api.minimax.io/v1`
- Anthropic：无需填 base_url

**Q：启动报 YAML 警告怎么办？**
检查 `~/.hermes/config.yaml` 的缩进，确保同级字段缩进一致。可用 `hermes config` 查看当前生效配置。

**Q：如何查看当前使用的模型和 provider？**

```bash
hermes version
hermes config
```

**Q：私有模型没有响应？**

```bash
# 检查服务是否可达
curl http://your-server:port/v1/models

# 查看 hermes 日志
hermes logs -f
```

**Q：如何完全重新配置？**

```bash
hermes setup
```
