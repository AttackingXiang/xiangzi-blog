# Debian 13 纯净系统安装 Hermes Agent 保姆级教程

> 适用对象：刚装完 Debian 13（Trixie）最小化系统，没有任何开发环境
> 目标：跑起来 `hermes` 命令行，可以和 AI 对话
> 预计耗时：10–20 分钟（视网络情况）

---

## 零、先搞清楚你在装什么

**Hermes Agent** 是 Nous Research 开源的自主 AI Agent 框架（MIT 协议），核心特点：

- 单 Agent + 学习闭环，会自动从经验里生成可复用的 Skill
- 持久化记忆，跨会话不丢
- 支持 Telegram / Discord / Slack / WhatsApp / CLI 等多平台接入
- 本体只是一个调用 LLM API 的 Python 客户端，**不吃 GPU**，普通 VPS 就能跑

**它不是什么**：不是本地大模型，不自带模型权重，你必须自己提供 API Key（OpenRouter、OpenAI、Anthropic、z.ai/GLM、Kimi 等任选）。

---

## 一、系统准备（纯净 Debian 13）

### 1.1 确认系统版本

```bash
cat /etc/os-release
# 应该看到 VERSION="13 (trixie)"
uname -m
# x86_64 或 aarch64 都支持
```

### 1.2 切换到普通用户（重要）

Hermes 官方脚本**要求不要用 root 安装**，所有数据会放在 `~/.hermes`，用 root 装了之后权限会很麻烦。

如果你现在是 root，先创建一个普通用户：

```bash
# 以 root 身份执行
adduser hermes
usermod -aG sudo hermes
su - hermes
```

后面所有命令都在这个普通用户下执行。

### 1.3 安装最小依赖

纯净 Debian 13 连 `curl` 和 `git` 都没有，必须先装：

```bash
sudo apt update
sudo apt install -y curl git ca-certificates
```

官方说安装脚本会自动处理 Python、Node.js、ripgrep、ffmpeg 等依赖（基于 `uv`），但在 Debian 13 上提前装几个常用工具会减少踩坑概率：

```bash
sudo apt install -y build-essential python3-dev python3-venv ripgrep ffmpeg
```

> 为什么装 `build-essential`：某些 Python 包（如加密库、数据库驱动）需要从源码编译，缺了会报 `gcc not found`。

### 1.4 检查时区和时间（Cron 功能依赖）

Hermes 有一个基于自然语言的定时任务调度器，时间不对会触发诡异 bug：

```bash
timedatectl
# 如果时区不对：
sudo timedatectl set-timezone Asia/Shanghai
```

---

## 二、安装 Hermes Agent

### 2.1 方案 A：能直连 GitHub（海外 VPS / 科学上网）

一行命令搞定：

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

脚本会做这些事：

1. 安装 `uv`（Astral 出的 Python 包管理器）
2. 拉取 Python 3.11
3. 克隆 `NousResearch/hermes-agent` 仓库到 `~/.hermes/repo`
4. 创建虚拟环境，安装依赖
5. 在 `~/.local/bin` 放一个 `hermes` 启动脚本
6. 修改 `~/.bashrc` 把 `~/.local/bin` 加入 PATH

### 2.2 方案 B：国内服务器（GitHub 连不上）

用 `ghfast.top` 做镜像加速：

```bash
curl -fsSL https://ghfast.top/https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

**安全提示**：镜像站相当于中间人。如果你在意供应链安全，建议方案 C。

### 2.3 方案 C：手动安装（推荐，可审计）

这个方法最干净，步骤清楚，脚本每一步你都能看见。

```bash
# 1. 装 uv
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.bashrc

# 2. 克隆仓库（国内用 ghfast.top 前缀）
mkdir -p ~/.hermes && cd ~/.hermes
git clone https://github.com/NousResearch/hermes-agent.git repo
# 国内：git clone https://ghfast.top/https://github.com/NousResearch/hermes-agent.git repo

cd repo

# 3. 初始化子模块（mini-swe-agent 是必需的终端后端）
git submodule update --init mini-swe-agent

# 4. 创建虚拟环境
uv venv .venv --python 3.11
source .venv/bin/activate

# 5. 安装依赖
uv pip install -e ".[all]"
uv pip install -e "./mini-swe-agent"

# 6. 把 hermes 命令加到 PATH
mkdir -p ~/.local/bin
ln -s ~/.hermes/repo/hermes ~/.local/bin/hermes
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### 2.4 验证安装

```bash
which hermes
hermes --version
hermes doctor   # 官方诊断命令，会告诉你缺什么
```

如果 `hermes` 找不到，手动执行 `source ~/.bashrc` 重新加载一下。

---

## 三、首次配置

### 3.1 启动配置向导

```bash
hermes setup
```

向导会依次问你：

**第一步：选模型提供商**

常见选项：

| 选项 | 适用场景 | 备注 |
|---|---|---|
| Nous Portal | 官方推荐，OAuth 登录 | 需要海外网络 |
| OpenRouter | 一个 Key 调 200+ 模型 | 性价比高，国内可访问 |
| OpenAI | GPT 系列 | 需代理 |
| Anthropic | Claude 系列 | 需代理，支持 Pro 订阅额度 |
| z.ai / GLM | 智谱 | 国内直连 |
| Kimi / Moonshot | 月之暗面 | 国内直连 |
| Custom endpoint | 自己的中转站 / 本地 vLLM | 填 base_url |

**国内用户没有科学上网**：直接选 GLM 或 Kimi，或者用 Custom endpoint 填自己的 OpenAI 兼容中转。

**第二步：填 API Key**

粘贴进去就行。Key 会存在 `~/.hermes/config.yaml`（明文），这点后面讲安全加固。

**第三步：选默认模型**

比如 OpenRouter 的话：`anthropic/claude-sonnet-4.6`、`openai/gpt-5`、`deepseek/deepseek-chat` 等。

**第四步：是否启用 Messaging Gateway**

第一次装先跳过（选 No），等 CLI 跑通再回来配 Telegram。

### 3.2 启动 CLI

```bash
hermes
```

看到交互式界面就成功了。试着问一句："你好，介绍一下你自己"，能正常流式输出就说明通了。

退出用 `Ctrl+D` 或输入 `/exit`。

---

## 四、常用命令速查

```bash
hermes                 # 进入对话
hermes model           # 切换模型
hermes tools           # 配置启用哪些工具
hermes config set      # 改单个配置项
hermes gateway         # 启动消息网关
hermes claw migrate    # 从 OpenClaw 迁移数据
hermes update          # 升级
hermes doctor          # 诊断问题
```

对话中的 slash 命令：

```
/new 或 /reset         新开对话
/model                 切换模型
/skills                查看已学技能
/compress              压缩上下文
/usage                 查看 Token 使用
/retry                 重试上一轮
/undo                  撤销上一轮
```

---

## 五、安全加固（重要，别跳过）

你之前调研过 Hermes 的安全问题——YOLO 模式、持久化 prompt injection、LiteLLM 供应链等。在公网/多人环境下默认配置**不安全**。下面这些加固步骤针对 Debian 13 环境做一遍：

### 5.1 限制命令自动批准

Hermes 默认对部分命令直接执行不问。在 `~/.hermes/config.yaml` 里调严：

```yaml
security:
  require_approval: true      # 所有写操作都问
  approval_allowlist: []      # 清空默认白名单
  yolo_mode: false            # 明确关掉 YOLO
```

### 5.2 用 Docker 后端隔离

Hermes 支持 6 种终端后端（local / Docker / SSH / Daytona / Singularity / Modal）。**别用 local**，改用 Docker 隔离：

```bash
# 装 Docker
sudo apt install -y docker.io
sudo usermod -aG docker $USER
newgrp docker
```

在 `~/.hermes/config.yaml`：

```yaml
terminal:
  backend: docker
  docker:
    image: debian:13-slim
    network: none        # 需要联网的任务再改成 bridge
    readonly_root: true
```

这样 Agent 在容器里跑，即使被 prompt injection 让它执行 `rm -rf /` 也只是删掉容器里的东西。

### 5.3 API Key 迁出明文配置

默认 `config.yaml` 明文存 Key。改用环境变量 + systemd：

```bash
# 建一个受限文件
mkdir -p ~/.config/hermes
cat > ~/.config/hermes/secrets.env <<'EOF'
OPENROUTER_API_KEY=sk-or-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
EOF
chmod 600 ~/.config/hermes/secrets.env
```

启动时加载：

```bash
set -a; source ~/.config/hermes/secrets.env; set +a
hermes
```

然后把 `config.yaml` 里的 `api_key` 字段删掉或改成 `${OPENROUTER_API_KEY}`。

### 5.4 防持久化 prompt injection

这是你之前专门提过的点——Hermes 会把"学到的东西"写进 `~/.hermes/skills/` 和 `~/.hermes/memory/`，一旦里面被注入恶意指令，之后每次对话都会被污染。

加固做法：

```bash
# 定期审查新生成的 skill
ls -lt ~/.hermes/skills/ | head -20
cat ~/.hermes/skills/<新生成的skill>/SKILL.md

# 高危环境：禁用自动生成技能
hermes config set skills.auto_create false
hermes config set memory.auto_nudge false
```

处理不信任来源的内容（网页、邮件、外部文档）时，起一个隔离会话：

```bash
hermes --no-memory --no-skills
```

### 5.5 网关最小暴露

如果要接 Telegram/Discord，**不要**直接暴露 Hermes 端口到公网。用 systemd 跑在本地，外部通过 Cloudflare Tunnel 或 WireGuard 接入。

Telegram 的 `allowed_users` 务必配置：

```yaml
gateway:
  telegram:
    allowed_users: [123456789]   # 只有你的 Telegram ID 能调用
    dm_pairing: true             # 首次配对要验证码
```

### 5.6 依赖锁定（防供应链）

LiteLLM 之前出过后门事件，Hermes 依赖链也不短。建议：

```bash
cd ~/.hermes/repo
# 用 uv 的 lockfile（已经有 uv.lock）固定版本
uv pip sync uv.lock
# 不要轻易执行 hermes update，先看 changelog
```

---

## 六、运行为后台服务

用 systemd 管理，开机自启：

```bash
mkdir -p ~/.config/systemd/user

cat > ~/.config/systemd/user/hermes-gateway.service <<'EOF'
[Unit]
Description=Hermes Agent Gateway
After=network-online.target

[Service]
Type=simple
EnvironmentFile=%h/.config/hermes/secrets.env
ExecStart=%h/.local/bin/hermes gateway start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=default.target
EOF

systemctl --user daemon-reload
systemctl --user enable --now hermes-gateway
systemctl --user status hermes-gateway
```

让 user service 在登出后继续跑：

```bash
sudo loginctl enable-linger $USER
```

查日志：

```bash
journalctl --user -u hermes-gateway -f
```

---

## 七、踩坑排查

| 问题 | 原因 / 解法 |
|---|---|
| `hermes: command not found` | `source ~/.bashrc`；或检查 `~/.local/bin` 是否在 PATH |
| `uv: command not found` | 重开终端，或 `source ~/.bashrc` |
| Git clone 卡住 | 国内用 `https://ghfast.top/` 前缀 |
| `Python 3.11 not found` | 让 uv 装：`uv python install 3.11` |
| 依赖编译失败 | 缺 `build-essential python3-dev`，回去补装 |
| API 调用 401 | Key 填错 / 过期 / 账户无额度 |
| API 调用超时 | 国内直连海外 API 不通，换国内模型或配代理 |
| 启动后卡在 "Loading memory..." | `~/.hermes` 权限问题，检查 `ls -la ~/.hermes` |

诊断利器：

```bash
hermes doctor
```

---

## 八、卸载

```bash
systemctl --user disable --now hermes-gateway 2>/dev/null
rm ~/.config/systemd/user/hermes-gateway.service
rm ~/.local/bin/hermes
rm -rf ~/.hermes
rm -rf ~/.config/hermes
# uv 不想留也可以删
rm -rf ~/.local/share/uv ~/.cache/uv
```

---

## 九、下一步能玩什么

装好只是起点，按这个顺序探索：

1. **切模型**：`hermes model` 试几家 API 对比效果和速度
2. **工具配置**：`hermes tools` 看有哪些内置工具，按需开关
3. **Skills**：用一段时间让它自己生成，或从 [agentskills.io](https://agentskills.io) 装
4. **Cron**：告诉它"每天早上 9 点给我发 HN 上关于 AI 的新闻摘要"
5. **Messaging Gateway**：接 Telegram，手机上随时召唤
6. **Sub-agents**：让它自己派生子 Agent 并行处理任务

官方文档：<https://hermes-agent.nousresearch.com/docs/>

---

## 附：和 OpenClaw 的一句话对比

- **OpenClaw**：像个强大的 AI 工作台，功能多、插件全，但记忆容易断
- **Hermes**：会自己学习、会成长，记忆和技能持久化；安全默认更激进（坑也更多）

如果你之前有 OpenClaw 数据，装完 Hermes 后执行：

```bash
hermes claw migrate --dry-run   # 先看看会迁移什么
hermes claw migrate             # 确认没问题再正式迁移
```
