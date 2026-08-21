# DDNS IPv6 Firewall

面向 OpenWrt / iStoreOS 的动态 IPv6 防火墙自动化插件。它把设备的动态公网 IPv6 放进独立的 firewall4 named set，地址变化时用 nft 原子事务热更新；端口、协议或规则拓扑变化时才执行 `fw4 reload`。旧版 firewall3 自动降级为隔离命名的 UCI 规则。

## 功能

- 主动模式：轮询 NDP、`/tmp/hosts/odhcpd`、`/tmp/odhcpd.leases`，并响应 WAN/WAN6 hotplug。
- 被动模式：独立 uhttpd 提供 `POST /api/firewall/sync`，Bearer Token 鉴权。
- 匹配方式：MAC、DUID、主机名、固定 IPv6、Webhook 客户端。
- 多 IPv6 设备：MAC 只用于锁定设备；同一设备存在多个公网 IPv6 时，规则中的“用户选定的公网 IPv6”优先使用用户选择的地址，前缀变化时保留其接口 ID。
- 地址策略：精准 IPv6 named set；或低 64 位 IID 掩码规则。
- 端口策略：TCP、UDP、TCP+UDP；单端口及端口段。
- 隔离：UCI section、nft set 和 comment 均使用 `ddns_fw_` / `ddns-fw:` 前缀。
- LuCI：状态概览、规则设备、Webhook 接入、审计日志四个独立页面，可在多个浏览器窗口同时打开；规则支持编辑、删除，概览页适配深色主题。
- 主动监听频率：LuCI 可选 5 / 10 / 15 / 30 / 60 / 120 / 300 秒，默认 30 秒；Webhook 推送仍可立即触发同步。

## 一键构建和安装

Windows PowerShell：

```powershell
.\run.ps1 -Router 192.168.10.33 -Password '你的 root 密码'
```

如果只需要给路由器一个文件，使用 `dist/ddns-fw.run`。它是自包含安装器，不依赖源码或 PowerShell：

```sh
chmod +x ddns-fw.run
./ddns-fw.run
./ddns-fw.run --check
./ddns-fw.run --uninstall
```

可通过 LuCI 文件传输、SCP 或 U 盘复制到 `/tmp` 后执行。安装器会自动备份 `/etc/config/firewall` 到 `/tmp/ddns-fw-backup/`。

只构建：

```powershell
.\scripts\build-ipk.ps1
```

产物位于 `dist/ddns-fw_0.1.0-1_all.ipk`。也可复制到路由器后执行：

```sh
opkg install /tmp/ddns-fw_0.1.0-1_all.ipk
```

安装脚本会生成 48 位随机 Token，并只添加两个 firewall4 include：`firewall.ddns_fw_sets` 与 `firewall.ddns_fw_forward`。已有防火墙配置在一键部署时备份为 `/tmp/firewall.ddns-fw.backup`。

## DDNS-GO / 客户端调用

```sh
curl -X POST 'http://192.168.10.1:9080/api/firewall/sync' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{
    "client_name":"pc-win",
    "ipv6":"240e:1234::100",
    "protocol":"tcpudp",
    "ports":[8096,5244,"10000-10010"]
  }'
```

Token 和主动监听频率可在 LuCI 的“网络 → DDNS IPv6 防火墙 → Webhook / 接入”或“服务 → DDNS IPv6 防火墙 → Webhook / 接入”查看或修改。默认监听 `9080`、轮询 `30` 秒；uhttpd 本身不创建 WAN 入站放行规则，若需要公网调用，请仅向可信来源开放该端口，推荐再叠加 VPN 或反向代理 TLS。升级插件后如果菜单暂时不出现，请退出 LuCI、按 `Ctrl+F5` 强制刷新一次。

## 配置模型

全局配置：`/etc/config/ddns_fw`。规则示例：

```uci
config rule 'nas'
        option enabled '1'
        option name 'NAS'
        option match_type 'mac'
        option mac '00:11:22:33:44:55'
        option strategy 'precise'
        option proto 'tcpudp'
        list ports '8096'
        list ports '10000-10010'
```

常用诊断：

```sh
/usr/sbin/ddns-fw status
/usr/sbin/ddns-fw devices
/usr/sbin/ddns-fw sync manual
ubus call ddns_fw logs '{"limit":100}'
nft list table inet fw4 | grep -A8 -B2 ddns_fw
```

## 安全与回滚

- Webhook Body 最大 16 KiB，客户端名、IPv6、协议和端口均做白名单校验。
- Webhook 仅接受全局单播 IPv6（`2000::/3`）。
- nft 生成文件先通过 `fw4 check`，失败时恢复上一版本，绝不删除非本插件规则。
- 卸载：`opkg remove ddns-fw`。卸载脚本只清除本插件的 include、运行时 set 和 `ddns_fw_` UCI 规则。
- 紧急恢复测试机防火墙配置：`cp /tmp/firewall.ddns-fw.backup /etc/config/firewall && /etc/init.d/firewall restart`。

## 兼容范围

- 主路径：OpenWrt 22.03+ / firewall4 / nftables / 现代 LuCI JavaScript。
- 降级路径：firewall3 / UCI，地址变化会 reload firewall。
- 已实机验证：iStoreOS 24.10.8 x86_64、firewall4 2024.12、LuCI 25.x。
