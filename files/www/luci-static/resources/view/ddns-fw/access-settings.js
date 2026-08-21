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
    var m = new form.Map("ddns_fw", "Webhook / 接入", "接口使用独立端口；请将 Token 放入 Authorization: Bearer <Token> 请求头，并用 OpenWrt 入站规则控制访问范围。"), s = m.section(form.NamedSection, "main", "global");
    s.anonymous = true;
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
    var help = E("div", { "class": "cbi-section" }, [E("h3", {}, "请求示例"), E("pre", {}, '{\n  "client_name": "pc-win",\n  "ipv6": "240e:1234::100",\n  "protocol": "tcpudp",\n  "ports": [8096, "5244", "10000-10010"]\n}'), E("p", {}, "主动监听默认每 30 秒检查一次；Webhook 推送仍可立即触发同步。"), E("p", {}, "当前地址：" + (status && status.api_enabled ? "http://路由器:" + status.api_port + "/api/firewall/sync" : "接口未启用"))]);
    return m.render().then(function(node) { node.appendChild(help); return node; });
  }
});
