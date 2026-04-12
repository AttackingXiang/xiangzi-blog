---
title: 常用软件geoip-geosite的下载地址
order: 2
draft: true
---

## 通用地址格式

```
https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/sing/geo/geosite/{名称}.srs
https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/sing/geo/geoip/{名称}.srs
```

geosite 按域名匹配，geoip 按 IP 匹配。**通信类、流媒体类应用建议两个一起加**，只加 geosite 经常会漏掉直连 IP 的流量（Telegram 就是典型）。

## AI 类

| 应用               | geosite 名称    | 备注                               |
| ------------------ | --------------- | ---------------------------------- |
| OpenAI / ChatGPT   | `openai`        | 必加，覆盖 chatgpt.com、openai.com |
| Anthropic / Claude | `anthropic`     | claude.ai                          |
| Google Gemini      | `google-gemini` | 也可直接用 `google`                |
| Microsoft Copilot  | `copilot`       |                                    |
| Perplexity         | `perplexity`    |                                    |
| xAI / Grok         | `xai`           |                                    |
| Midjourney         | `midjourney`    |                                    |
| HuggingFace        | `huggingface`   |                                    |

AI 类一般没有独立 geoip（它们多数挂在 Cloudflare/Azure 后面），加 geosite 就够了。

## 流媒体类

| 应用                    | geosite                  | geoip       |
| ----------------------- | ------------------------ | ----------- |
| Netflix                 | `netflix`                | `netflix` ✅ |
| YouTube                 | `youtube`                | —           |
| Disney+                 | `disney`                 | —           |
| HBO Max / Max           | `hbo`                    | —           |
| Spotify                 | `spotify`                | —           |
| Hulu                    | `hulu`                   | —           |
| Amazon Prime Video      | `primevideo`             | —           |
| Apple TV+ / Apple Music | `apple` 或 `apple-music` | —           |
| Bahamut 巴哈姆特动画疯  | `bahamut`                | —           |
| Niconico                | `niconico`               | —           |
| Abema TV                | `abema`                  | —           |
| TikTok                  | `tiktok`                 | —           |
| Twitch                  | `twitch`                 | `twitch` ✅  |

**Netflix 强烈建议 geosite + geoip 都加**，它的 CDN IP 段经常被识别用于解锁判断。

## 通信社交类

| 应用                 | geosite                  | geoip        | 备注         |
| -------------------- | ------------------------ | ------------ | ------------ |
| Telegram             | `telegram`               | `telegram` ✅ | 必须两个都加 |
| WhatsApp             | `whatsapp`               | `whatsapp` ✅ | 同上         |
| Signal               | `signal`                 | —            |              |
| Discord              | `discord`                | —            |              |
| Twitter / X          | `twitter`                | `twitter` ✅  |              |
| Facebook / Instagram | `facebook` / `instagram` | `facebook` ✅ |              |
| Line                 | `line`                   | —            |              |
| Threads              | `threads`                | —            |              |
| Reddit               | `reddit`                 | —            |              |

## 开发 / 工具类

| 应用          | geosite      |
| ------------- | ------------ |
| GitHub        | `github`     |
| Google 全家桶 | `google`     |
| Microsoft     | `microsoft`  |
| Cloudflare    | `cloudflare` |
| Steam         | `steam`      |
| Epic Games    | `epicgames`  |
| PayPal        | `paypal`     |
| Stripe        | `stripe`     |

## 综合 / 兜底类（很有用）

| 名称               | 用途                                             |
| ------------------ | ------------------------------------------------ |
| `geolocation-!cn`  | "非中国大陆"的所有域名，做"国外走代理"的兜底规则 |
| `geolocation-cn`   | 中国大陆域名，做直连规则                         |
| `cn` (geoip)       | 中国大陆 IP 段，配合上面做直连                   |
| `private` (geoip)  | 内网 IP，必须直连                                |
| `category-ads-all` | 广告域名，可以扔到 block 出站                    |
| `category-porn`    | 成人内容（按需）                                 |
| `category-games`   | 游戏类汇总                                       |

## 在 s-ui 里的实际用法建议

不要每个应用都建一条独立路由规则，那样列表会臃肿。**推荐按"出站目的"分组**，一个出站对应一条规则，规则里的 rule_set 一次勾多个：

- **AI 专用出站**（比如美国 IP 的干净节点）→ 规则集勾 `openai` `anthropic` `google-gemini` `copilot` `perplexity`
- **流媒体出站**（解锁好的节点）→ 勾 `netflix` `disney` `hbo` `youtube` + 对应的 geoip
- **通信出站** → 勾 `telegram` `whatsapp` `signal` + 对应的 geoip
- **默认代理出站** → `geolocation-!cn` 兜底
- **直连** → `geolocation-cn` + `geoip-cn` + `geoip-private`

这样路由规则可能就 5 条，但覆盖了所有场景，维护也轻松。

## 怎么确认某个规则集名称是否存在

直接浏览器打开目录列表：

- geosite 列表：`https://github.com/MetaCubeX/meta-rules-dat/tree/sing/geo/geosite`
- geoip 列表：`https://github.com/MetaCubeX/meta-rules-dat/tree/sing/geo/geoip`