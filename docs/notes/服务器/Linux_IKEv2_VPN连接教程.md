# Linux 连接公司 IKEv2/IPSec VPN 教程

> 适用环境：Debian/Ubuntu 系列，strongSwan 6.x，认证方式：EAP-MSCHAPv2（用户名+密码）

---

## 一、安装软件包

```bash
sudo apt update
sudo apt install strongswan libcharon-extra-plugins libcharon-extauth-plugins
```

> strongSwan 6.x 使用 `swanctl` 命令，不再使用旧版的 `ipsec` 命令。

---

## 二、导入服务器证书（自签名/企业CA）

### 从 Windows 导出证书

1. 按 `Win + R`，输入 `certmgr.msc` 打开证书管理器
2. 点击 **受信任的根证书颁发机构 → 证书**
3. 找到对应的 CA 证书（如 `UCA Global G2 Root`）
4. 右键 → **所有任务 → 导出**
5. 格式选 **Base-64 编码 X.509 (.CER)**，保存为 `xxx.cer`
6. 将文件传输到 Linux（U盘、scp 等方式）

### 导入证书到 Linux

```bash
# 确认文件格式（应看到 -----BEGIN CERTIFICATE-----）
head -c 50 ~/xxx.cer

# 如果是 PEM 格式（以 -----BEGIN 开头），直接复制
sudo cp ~/xxx.cer /etc/swanctl/x509ca/ca.pem

# 如果是 DER 格式（乱码），需转换
openssl x509 -inform DER -in ~/xxx.cer -out /tmp/ca.pem
sudo cp /tmp/ca.pem /etc/swanctl/x509ca/ca.pem
```

---

## 三、创建 VPN 配置文件

```bash
sudo mkdir -p /etc/swanctl/conf.d
sudo nano /etc/swanctl/conf.d/ikev2-vpn.conf
```

填入以下内容（替换 `←` 标注的部分）：

```conf
connections {
    ikev2-vpn {
        remote_addrs = 你的VPN服务器地址        # ← 改成实际地址或域名

        vips = 0.0.0.0

        local {
            auth = eap-mschapv2
            eap_id = 你的用户名                 # ← 改成你的账号
        }
        remote {
            auth = pubkey
            id = 你的VPN服务器地址              # ← 和 remote_addrs 一样
        }
        children {
            ikev2-vpn {
                remote_ts = 0.0.0.0/0
                esp_proposals = aes256-sha256,aes128-sha256
            }
        }
        proposals = aes256-sha256-modp2048,aes128-sha256-modp2048
        version = 2
        fragmentation = yes
    }
}

secrets {
    eap-vpn {
        id = 你的用户名                          # ← 改成你的账号
        secret = "你的密码"                      # ← 改成你的密码
    }
}
```

保存：`Ctrl+O` → 回车 → `Ctrl+X`

---

## 四、启动服务

```bash
sudo systemctl start strongswan
sudo systemctl status strongswan
```

正常运行时会显示 `Active: active (running)`。

---

## 五、连接 VPN

```bash
# 加载配置
sudo swanctl --load-all

# 发起连接
sudo swanctl --initiate --child ikev2-vpn
```

---

## 六、验证连接状态

```bash
# 查看连接状态
sudo swanctl --list-sas

# 查看当前公网 IP（成功后应变为 VPN 的 IP）
curl ifconfig.me
```

---

## 七、断开 VPN

```bash
sudo swanctl --terminate --ike ikev2-vpn
```

---

## 八、常见报错与解决方法

| 报错信息 | 原因 | 解决方法 |
|---------|------|---------|
| `certificate verification failed` | 证书未导入或不受信任 | 按第二步导入服务器 CA 证书 |
| `no issuer certificate found` | 缺少中间证书或根证书 | 从 Windows 导出并导入对应的根证书 |
| `no trusted RSA public key found` | 证书链不完整 | 确认导入的是根 CA 证书，不是服务器证书 |
| `authentication failed` | 用户名或密码错误 | 检查 `secrets` 段的账号密码 |
| `peer not responding` | 服务器地址错误或端口被封 | 检查服务器地址，确认 UDP 500/4500 端口可达 |
| `no proposal chosen` | 加密算法不匹配 | 调整 `proposals` 和 `esp_proposals` 字段 |

---

## 九、查看日志（排错用）

```bash
sudo journalctl -u strongswan -f
```

---

## 附：从 .pbk 文件解读 VPN 信息

Windows 的 VPN 配置文件（`.pbk`）中的关键字段含义：

| 字段 | 含义 |
|-----|------|
| `PhoneNumber` | VPN 服务器地址 |
| `PreferredDevice=WAN Miniport (IKEv2)` | 使用 IKEv2 协议 |
| `CustomAuthKey=26` | EAP-MSCHAPv2 认证 |
| `VpnStrategy=7` | 自动尝试多种协议 |
| `PreSharedKey=` | 空表示使用证书认证 |
