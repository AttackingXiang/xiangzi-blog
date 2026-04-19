### SSH 密钥登录

Proxmox 默认允许 root 密码 SSH 登录,安全性差。建议配置 SSH 密钥。

**在 Windows 电脑上生成密钥对**(如果没有的话):

powershell

```powershell
# Windows PowerShell
ssh-keygen -t ed25519 -C "pve-key"
# 一路回车,密钥生成在 C:\Users\你的用户名\.ssh\ 下
```

**把公钥传到 Proxmox**:

powershell

```powershell
# Windows PowerShell,IP 换成你的
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh root@192.168.10.200 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

**然后在 Proxmox Shell 里改 SSH 配置禁用密码登录**:

bash

```bash
sed -i 's/#PermitRootLogin yes/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh
```

> ⚠️ 改之前**先测试密钥能登录成功**(`ssh root@192.168.10.4`,不用输密码直接进去),否则改完密码登录就进不去了。







```
# 允许 root 用密码/密钥登录
sed -i 's/^#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config

# 重启 SSH 服务
systemctl restart sshd
```

