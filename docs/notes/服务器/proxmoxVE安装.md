# Proxmox VE 9.1 保姆级安装教程(Mac mini Late 2014)

## 第零步:你需要准备的东西清单

照这个清单一样样备齐,后面不用来回折腾:

- ✅ 一个 **8GB 或更大的 U 盘**(里面的东西会被清空)
- ✅ 一个 **USB 有线键盘**(装机阶段蓝牙键盘和触控板不识别)
- ✅ 一根 **网线**,一端插 Mac mini,一端插路由器(无线装机阶段用不了)
- ✅ **显示器 + HDMI 线**(Mac mini Late 2014 有 HDMI 口,直接插)
- ✅ **Mac mini 电源线**
- ✅ 你的 **Windows 10 电脑**(用来做 U 盘和之后管理 Proxmox)

**数据备份提醒:\**Mac mini 硬盘上的 macOS 和所有数据会被\**完全擦除**,提前备份。

------

## 第一步:在 Windows 10 上下载 Proxmox VE 9.1 ISO

1. 打开浏览器,访问:`https://www.proxmox.com/en/downloads`
2. 找到 **Proxmox Virtual Environment** 板块
3. 点 **Proxmox VE 9.1 ISO Installer**
4. 页面上点 **Download** 按钮开始下载

**文件信息**(对照一下下载对不对):

- 版本:9.1-1
- 文件大小:约 1.83 GB
- 发布日期:2025 年 11 月 19 日
- 文件名类似:`proxmox-ve_9.1-1.iso`

**(可选)校验文件完整性:**

如果想确认下载的 ISO 没损坏,在 Windows PowerShell 里运行:



powershell

```powershell
Get-FileHash -Algorithm SHA256 "你的ISO文件路径"
```

对比输出值和官网的 SHA256:`6d8f5afc78c0c66812d7272cde7c8b98be7eb54401ceb045400db05eb5ae6d22`,一致就 OK。

------

## 第二步:在 Windows 10 上下载 Rufus 并制作启动 U 盘

**下载 Rufus:**

1. 访问:`https://rufus.ie/`
2. 下载 **Rufus 4.x Portable**(便携版,不用安装)
3. 双击打开(需要管理员权限,点"是")

**制作 U 盘(一步一步跟着操作):**

1. **插入你的 U 盘**到 Windows 电脑的 USB 口

2. Rufus 界面上:

   - **设备 (Device)**: 下拉选你的 U 盘(认准容量,别选错)
   - **引导类型选择 (Boot selection)**: 点右边的 "选择 (SELECT)",选中刚下载的 `proxmox-ve_9.1-1.iso`
   - **分区类型 (Partition scheme)**: 选 **GPT**
   - **目标系统类型 (Target system)**: 选 **UEFI (非 CSM)**
   - **卷标 (Volume label)**: 保持默认就行
   - **文件系统 (File system)**: 保持默认

3. 点 **开始 (START)**

4. 关键一步

   :会弹出对话框问你选哪种模式

   - 选 **"以 DD 镜像模式写入 (Write in DD Image mode)"** ← 必须选这个!
   - 点 OK

5. 再弹出警告"U 盘数据会被清空",点 OK

6. 等待进度条跑完(大概 3-5 分钟),显示"准备就绪 (READY)"就做好了

7. 安全弹出 U 盘

> **为什么必须 DD 模式**:Proxmox 的 ISO 是专门的混合启动镜像,只能用 DD 模式(把 ISO 原样复制到 U 盘)写入。用普通 ISO 模式会导致 Mac mini 的 EFI 无法识别启动盘。

------

## 第三步:从 U 盘启动 Mac mini

1. **确认 Mac mini 已关机**(完全关机,不是睡眠)
2. 把以下东西全部接好:
   - ✅ U 盘插到 Mac mini 后面的 USB 3.0 口
   - ✅ USB 有线键盘插另一个 USB 口
   - ✅ 网线插网口
   - ✅ HDMI 显示器连好
   - ✅ 电源线插好
3. **按电源键开机**,立即按住键盘上的 **Option 键(也叫 Alt 键)** 不要松
4. 听到"当"的开机声后,继续按住,直到屏幕出现启动盘选择界面
5. 屏幕上会看到几个图标(通常 2-3 个):
   - 一个是原来的 macOS 启动盘
   - 一个是橙色的 **"EFI Boot"** 图标(U 盘)
6. 用键盘方向键选中 **EFI Boot**(橙色那个),按 **回车**

> **Option 键按不出界面怎么办?** 第三方 USB 键盘上,Option 键通常就是 Alt 键(`⌥` 符号)。如果还不行:断电→拔掉键盘→重新插好→再开机按 Option。某些键盘需要先按一次 FN 键。

------

## 第四步:Proxmox VE 9.1 安装向导(重点!)

进入 U 盘启动后,看到 Proxmox 的紫色安装界面。

### 4.1 引导菜单

- 看到菜单有几个选项,选 **"Install Proxmox VE (Graphical)"**
- 回车

> 如果图形界面卡住或显示异常,重启再来,选 "Install Proxmox VE (Terminal UI)" 用文本界面装,流程一样。

### 4.2 许可协议

- 出现许可证界面,看完(或直接)点右下角 **I agree**

### 4.3 选择目标硬盘

这步非常重要,**会清空你选中的硬盘**。

- **Target Harddisk**: 下拉选你 Mac mini 的内置硬盘(通常是唯一一个可选项,大小 500GB 左右)

- 点 Options 按钮

  (右边),弹出高级选项:

  - **Filesystem**: 选 **ext4**(8GB 内存别选 ZFS,ZFS 至少吃 2GB 内存,你这台吃不起)
  - 其他保持默认
  - 点 **OK** 关闭 Options

- 点 **Next**

### 4.4 位置和时区

- **Country**: 输入 `China`,自动补全选中
- **Time zone**: 自动变成 `Asia/Shanghai`
- **Keyboard Layout**: 选 **U.S. English**(国内键盘都是美式布局,不用改)
- 点 **Next**

### 4.5 管理员账户设置

- **Password**: 设一个**强密码**,至少 12 位,包含大小写+数字+符号。这是 root 密码,一定记牢
- **Confirm**: 再输一次
- **Email**: 填一个能收到的邮箱(Proxmox 会发系统告警到这里;不想收告警就随便填比如 `admin@example.com`,以后能改)
- 点 **Next**

### 4.6 网络配置(最关键的一步,配错了登不进去)

装完以后你要通过浏览器访问这个 IP 来管理 Proxmox,所以必须配对。

**先搞清楚你家网络情况:**

1. 在你的 Windows 电脑上,按 `Win + R`,输入 `cmd`,回车
2. 输入 `ipconfig`,回车
3. 找到你的网卡信息,记下:
   - **IPv4 地址**(比如 `192.168.1.50`)→ 这个告诉你网段是 `192.168.1.x`
   - **默认网关**(比如 `192.168.1.1`)→ 这个是路由器 IP
   - **子网掩码**(一般是 `255.255.255.0`,对应 CIDR `/24`)

**然后在 Proxmox 安装界面填:**

| 字段                 | 填什么                                                       |
| -------------------- | ------------------------------------------------------------ |
| Management Interface | 保持默认(通常是 `enp3s0` 或类似,Mac mini 的有线网卡)         |
| Hostname (FQDN)      | `pve.lan` 或 `mac-mini.lan`(必须带个点,所以一定要有 `.lan` 或 `.local` 后缀) |
| IP Address (CIDR)    | 选一个**没被占用**的 IP,比如 `192.168.10.4/24`(网段和你电脑一样,最后一位改成 100-250 之间不常用的数字) |
| Gateway              | 填你的**路由器 IP**,就是上面查到的默认网关,比如 `192.168.1.1` |
| DNS Server           | 填 `223.5.5.5`(阿里 DNS,国内速度快)或 `192.168.1.1`(用路由器做 DNS) |

- 点 **Next**

> **选 IP 小提示**:装完以后**去路由器管理后台**,给 Mac mini 的 MAC 地址做一个**静态 IP 绑定**到 `192.168.10.4`,这样即使你改用 DHCP 或者其他原因,IP 也不会变。

### 4.7 确认摘要

- 看一眼所有配置是不是对的
- **勾选 "Automatically reboot after successful installation"**(装完自动重启)
- 点 **Install**

### 4.8 等待安装

- 进度条开始跑,大概 **5-10 分钟**
- 完成后会自动重启
- **重启开始时,立刻拔掉 U 盘**(不然可能又从 U 盘启动了)

------

## 第五步:第一次登录 Proxmox 网页后台

### 5.1 重启后的黑屏界面

重启完成后,Mac mini 显示器上会看到类似这样的黑底文字:



```
Welcome to the Proxmox Virtual Environment. Please use your web browser to
configure this server - connect to:

  https://192.168.10.4:8006/

pve login: _
```

**这个界面正常的,不用在这里操作,Proxmox 是通过网页管理的。**

### 5.2 浏览器登录

1. 回到你的 **Windows 10 电脑**,打开浏览器(Chrome/Edge 都行)

2. 地址栏输入:

   ```
   https://192.168.10.4:8006
   ```

   (把 IP 换成你自己设的)

   - ⚠️ 必须是 **https**,不是 http
   - ⚠️ 必须带端口 `:8006`

3. 浏览器报"您的连接不是专用连接"/"证书无效"——

   这是正常的

   (Proxmox 用的是自签证书)

   - 点 **高级** → **继续前往 192.168.10.4 (不安全)**

4. 看到 Proxmox 紫色登录界面:

   - **User name**: `root`
   - **Password**: 你在 4.5 步设的密码
   - **Realm**: 选 **Linux PAM standard authentication**
   - **Language**: 可以选 **Chinese (Simplified)** 中文界面
   - 点 **Login**

5. 登录成功后弹窗:"没有有效订阅 (No valid subscription)"

   - 这是因为企业版才有订阅,个人用户免费版会一直弹这个
   - 点 **OK** 关掉,**不影响任何功能**

进入主界面就算成功装好了 🎉

------

## 第六步:装完后必做的基础配置

这些配置**必须做**,不然日常使用会踩坑。

在 Proxmox 网页上,左边树形菜单点你的节点名(比如 `pve`)→ 右边找 **Shell** 按钮点开,这是网页版命令行,所有命令在这里执行。

### 6.1 切换到免费社区源(否则 apt 更新会报错)



bash

```bash
# 禁用企业源(付费的)
echo "Enabled: no" >> /etc/apt/sources.list.d/pve-enterprise.sources
echo "Enabled: no" >> /etc/apt/sources.list.d/ceph.sources

# 添加免费的社区源(注意 9.x 用的是 trixie 不是 bookworm!)
echo "deb http://download.proxmox.com/debian/pve trixie pve-no-subscription" > /etc/apt/sources.list.d/pve-no-subscription.list

# 更新系统
apt update && apt dist-upgrade -y
```

> **重要**:Proxmox 9.x 基于 Debian 13 Trixie,源里必须写 `trixie`。如果你看到别的教程写 `bookworm`(那是 8.x 的),**不要用**。

### 6.2 国内加速源(可选但强烈推荐)

如果你在国内,官方源下载慢,换清华镜像:



bash

```bash
# 备份原有 Debian 源
cp /etc/apt/sources.list /etc/apt/sources.list.bak

# 用清华镜像
cat > /etc/apt/sources.list <<'EOF'
deb https://mirrors.tuna.tsinghua.edu.cn/debian/ trixie main contrib non-free non-free-firmware
deb https://mirrors.tuna.tsinghua.edu.cn/debian/ trixie-updates main contrib non-free non-free-firmware
deb https://mirrors.tuna.tsinghua.edu.cn/debian-security trixie-security main contrib non-free non-free-firmware
EOF

# Proxmox 源也换成清华
echo "deb https://mirrors.tuna.tsinghua.edu.cn/proxmox/debian/pve trixie pve-no-subscription" > /etc/apt/sources.list.d/pve-no-subscription.list

# 更新测试
apt update
```

### 6.3 去除"无有效订阅"弹窗(可选,但登录清爽很多)



bash

```bash
sed -i.bak "s/data.status\.toLowerCase() !== 'active'/false/g" /usr/share/javascript/proxmox-widget-toolkit/proxmoxlib.js
systemctl restart pveproxy
```

执行完 **Ctrl+F5** 强制刷新浏览器,以后登录就没弹窗了。

### 6.4 Mac mini 风扇控制(重要!不做风扇会狂转)



bash

```bash
apt install -y lm-sensors mbpfan
sensors-detect --auto
systemctl enable --now mbpfan
```

做完这一步,风扇会根据温度智能调速,不会一直飙到最高转速。

### 6.5 检查硬盘健康状态

你这台 Mac mini 是 2014 年的,硬盘用了 10 年了,先看看还健康不:



bash

```bash
apt install -y smartmontools
smartctl -a /dev/sda | grep -E "Reallocated|Pending|Uncorrect|Power_On_Hours|Percentage_Used"
```

**怎么看结果:**

- `Reallocated_Sector_Ct` 数值不为 0 → 硬盘有坏道,建议换盘
- `Power_On_Hours` 超过 40000 小时(约 4.5 年通电时间)→ 老盘,注意备份
- `Percentage_Used`(SSD 才有)超过 80% → SSD 寿命快到了

如果盘有问题,强烈建议先换一块新 SSD 再部署服务,不然数据迁移很麻烦。

### 6.6 SSH 密钥登录(强烈推荐)

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
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh root@192.168.10.4 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

**然后在 Proxmox Shell 里改 SSH 配置禁用密码登录**:



bash

```bash
sed -i 's/#PermitRootLogin yes/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh
```

> ⚠️ 改之前**先测试密钥能登录成功**(`ssh root@192.168.10.4`,不用输密码直接进去),否则改完密码登录就进不去了。

------

## 第七步:准备创建第一个 LXC 容器(实战预热)

验证 Proxmox 装好了可以用,我们先建一个 Debian 容器练手。

### 7.1 下载 LXC 模板

1. 网页左侧树形图点 `pve` 节点 → **local (pve)** 存储
2. 右边点 **CT Templates** 标签
3. 点上面的 **Templates** 按钮
4. 弹窗里找到 **debian-13-standard**(Trixie),点它一下,点 **Download**
5. 等进度条跑完(大概几百 MB),关闭弹窗

### 7.2 创建容器

1. 右上角点 **Create CT**(创建容器)

2. General

    标签:

   - Node: 默认
   - CT ID: 默认 `100`
   - Hostname: 随便起,比如 `test-debian`
   - Password: 设一个容器内的 root 密码
   - 点 Next

3. Template

    标签:

   - Storage: local
   - Template: 选刚下好的 `debian-13-standard...`
   - 点 Next

4. Disks

    标签:

   - Disk size: 8 GB 就够
   - 点 Next

5. **CPU**: 1 核,Next

6. **Memory**: 512 MB / Swap 512,Next

7. Network

   :

   - Bridge: `vmbr0`(默认)
   - IPv4: 选 DHCP 最省事(路由器自动分配 IP)
   - IPv6: 选 DHCP 或 none
   - 点 Next

8. **DNS**: 保持默认,Next

9. Confirm

   :

   - **勾选 "Start after created"**(创建后自动启动)
   - 点 Finish

10. 看着下方任务窗口跑完,容器就建好了

### 7.3 进入容器

左侧树形图会出现 `100 (test-debian)`,点它 → 点 **Console**,就进容器的 Linux 终端了。

输入 `root` 和刚设的密码,登录进去,就是一个全新的独立 Debian 13,可以随便折腾,不会影响宿主机。试完不要的话,关机 → 右键删掉,干净利落。

------

## 常见问题速查

**Q: Option 键按了没反应,进不了启动盘选择?**

A: 检查键盘是不是 USB 有线的(蓝牙不行)。某些键盘的 Alt 就是 Option,某些需要先按 FN。实在不行借一个 Apple 键盘。

**Q: 装完重启黑屏,没进 Proxmox?**

A: 大概率是 U 盘没拔,又从 U 盘启动了但这次是安装模式。关机拔 U 盘再开机就好。

**Q: 浏览器打不开 `https://IP:8006`?**

A: 三步排查:

1. Windows 电脑 `ping 192.168.10.4`(你的 IP)能通吗?不通说明网络/IP 配置错了
2. 是不是忘了写 `https://` 或端口 `:8006`?
3. 浏览器的"高级"→"继续前往"点了吗?

**Q: 安装时 "No network interface found"?**

A: 网线没插好/没插路由器。Mac mini 的有线网卡在 Proxmox 下是标准支持的,不会有驱动问题。

**Q: 8GB 内存够用吗?**

A: 宿主机占 1GB,剩下 7GB 跑 4-5 个轻量 LXC 完全够(代理/反代/小数据库/监控这种)。要跑重的(比如 Home Assistant + Nextcloud 同时跑)就紧张了,考虑加内存条——Mac mini Late 2014 的内存是焊死在主板上的,没法升级,这一点注意。

