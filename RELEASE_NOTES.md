# ddns-fw 0.1.0

面向 OpenWrt / iStoreOS 的动态 IPv6 防火墙自动化插件最终版。

## 本版内容

- 主动监听 WAN/WAN6、NDP 和 DHCPv6 地址变化，动态同步 IPv6 防火墙规则。
- 支持 DDNS-GO / 客户端 Webhook：`POST /api/firewall/sync`，Bearer Token 鉴权。
- 支持 MAC、DUID、DHCP 主机名、固定 IPv6 和 Webhook 多种匹配方式。
- 一个 MAC 对应多个公网 IPv6 时，前端只展示该 MAC 的地址，并允许用户明确选择其中一个。
- 支持 TCP、UDP、TCP+UDP，单端口和端口段。
- firewall4 优先使用 nftables named set 热更新；firewall3 自动降级为隔离 UCI 规则。
- 动态规则统一使用 `ddns_fw_` / `ddns-fw:` 前缀，与用户手工规则隔离。
- LuCI 支持规则新增、编辑、删除；状态概览支持深色主题和响应式布局。
- 主动监听轮询频率可选 5 / 10 / 15 / 30 / 60 / 120 / 300 秒，默认 30 秒。
- 提供自包含 `ddns-fw.run` 安装器，支持 `--check`、安装升级和 `--uninstall`。

## 实机验证

- iStoreOS 24.10.8 x86_64 / firewall4 / LuCI 26.x：通过。
- Kwrt/OpenWrt 25.12-SNAPSHOT aarch64 / firewall4 / LuCI 27.x：通过。
- 两台设备均通过 `fw4 check` 和 `.run --check`。
