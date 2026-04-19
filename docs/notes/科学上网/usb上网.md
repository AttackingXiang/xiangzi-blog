## 手机 USB 共享网络给路由器

### 第一步：安装驱动（离线安装）

路由器现在没网，需要先在电脑上下载驱动包，SCP 传到路由器安装。

ImmortalWrt 24.10 需要的包：`kmod-usb-net-rndis`

到 ImmortalWrt 镜像站下载：

- 南京大学镜像：https://mirror.nju.edu.cn/immortalwrt/releases/24.10.0/targets/mediatek/filogic/packages/

在电脑上搜索下载 `kmod-usb-net-rndis` 相关的 ipk 文件，然后传到路由器：

bash

```bash
scp kmod-usb-net-rndis*.ipk root@192.168.1.1:/tmp/
```

路由器上安装：

bash

```bash
cd /tmp
opkg install kmod-usb-net-rndis*.ipk
```

如果提示缺少依赖 `kmod-usb-net`，也一起下载传过去装上。

### 第二步：连接手机

1. 用 USB 数据线把**安卓手机**插到路由器的 USB 口
2. 手机上打开 **设置 → 热点和网络共享 → USB 网络共享**

### 第三步：确认识别

SSH 到路由器检查：

bash

```bash
ifconfig usb0
```

如果能看到 `usb0` 接口，说明识别成功了。

### 第四步：配置接口

进入 LuCI 管理界面，打开「网络」→「接口」，点击 WAN 口的编辑按钮，将「设备」改为 `usb0`，保存并应用。 [Iyzm](https://iyzm.net/openwrt/775.html)

或者用命令行：



bash

```bash
uci set network.wan.device='usb0'
uci set network.wan.proto='dhcp'
uci commit network
/etc/init.d/network restart
```

这时路由器就能通过手机上网了。

### 第五步：验证



bash

```bash
ping -c 3 baidu.com
```