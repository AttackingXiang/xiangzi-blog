### 修改配置文件

bash

```bash
sudo nano /etc/swanctl/conf.d/ikev2-vpn.conf
```

找到 `children` 段，把 `remote_ts = 0.0.0.0/0` 改成你想走 VPN 的 IP：

conf

```conf
children {
    ikev2-vpn {
        remote_ts = 192.168.1.0/24, 10.0.0.1/32, 172.16.0.0/16
        #           ↑ 多个IP/网段用逗号分隔，/32 表示单个IP
        esp_proposals = aes256-sha256,aes128-sha256
    }
}
```

------

### 重新加载并重连

bash

```bash
# 先断开
sudo swanctl --terminate --ike ikev2-vpn

# 重新加载配置
sudo swanctl --load-all

# 重新连接
sudo swanctl --initiate --child ikev2-vpn
```

------

### 验证路由是否生效

bash

```bash
# 查看路由表，应该能看到你指定的 IP 段走了 VPN 网卡
ip route show
```