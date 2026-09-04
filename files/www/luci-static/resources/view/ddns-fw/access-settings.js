"use strict";
"require view";
"require form";
"require uci";
"require rpc";
"require ui";

var callStatus = rpc.declare({ object: "ddns_fw", method: "status", expect: {} });
return view.extend({
  load: function() { return uci.load("ddns_fw").then(callStatus); },
  render: function(status) {
    var m = new form.Map("ddns_fw", "Webhook / 接入", "配置主动监听与 Webhook 接入。主动监听负责自动发现 IPv6 变化；Webhook 可由 DDNS-GO 立即推送。"), s = m.section(form.NamedSection, "main", "global");
    s.anonymous = true;
    var active = s.option(form.Flag, "active_enabled", "启用主动监听");
    active.default = "1";
    active.rmempty = false;
    active.description = "开启后 Daemon 会监听 WAN6、NDP 与 DHCPv6 地址变化，并自动刷新防火墙规则。关闭后不会自动轮询，Webhook 仍可单独使用。";
    var o = s.option(form.ListValue, "refresh_interval", "主动监听轮询间隔");
    [5, 10, 15, 30, 60, 120, 300].forEach(function(seconds) {
      o.value(String(seconds), seconds + " 秒");
    });
    o.default = uci.get("ddns_fw", "main", "refresh_interval") || "30";
    o.description = "Daemon 主动检查 NDP / DHCPv6 和接口变化的频率。默认 30 秒；间隔越短反应越快，但会增加轻微系统开销。";
    o = s.option(form.Flag, "api_enabled", "启用 Webhook"); o.default = "1";
    o = s.option(form.Value, "api_port", "监听端口"); o.datatype = "port"; o.default = "9080";
    o = s.option(form.Value, "api_bind", "IPv4 绑定"); o.default = "0.0.0.0";
    o = s.option(form.Value, "api_bind6", "IPv6 绑定"); o.default = "::";
    o = s.option(form.Value, "token", "Token"); o.password = true; o.rmempty = false;
    o = s.option(form.Flag, "allow_payload_ports", "允许 Payload 携带端口"); o.default = "1";
    var help = E("div", { "class": "cbi-section ddns-fw-active-help" }, [E("h3", {}, "请求示例"), E("pre", {}, '{\n  "client_name": "pc-win",\n  "ipv6": "240e:1234::100",\n  "protocol": "tcpudp",\n  "ports": [8096, "5244", "10000-10010"]\n}'), E("p", {}, "主动监听默认每 30 秒检查一次；Webhook 推送仍可立即触发同步。"), E("p", {}, "当前地址：" + (status && status.api_enabled ? "http://路由器:" + status.api_port + "/api/firewall/sync" : "接口未启用"))]);
    return m.render().then(function(node) {
      var style = E("style", {}, ".ddns-fw-active-help{margin-top:18px;padding:16px 18px;border:1px solid #cbd6e2;border-radius:10px;background:#f5f8fb}.ddns-fw-active-help h3{margin-top:0;color:#172b4d}.ddns-fw-active-help p{color:#304b68}.ddns-fw-active-help pre{background:#172b4d;color:#e7f0ff;border-radius:8px;padding:14px;overflow:auto}");
      node.prepend(style); node.appendChild(help); return node; });
  }
});
