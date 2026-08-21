"use strict";
"require view";
"require rpc";
"require ui";

var callStatus = rpc.declare({ object: "ddns_fw", method: "status", expect: {} });
var callSync = rpc.declare({ object: "ddns_fw", method: "sync", expect: {} });

function text(s) { return String(s == null ? "—" : s); }

return view.extend({
  load: function() { return callStatus(); },
  render: function(s) {
    var self = this;
    var active = Number(s.active_count || 0), total = Number(s.rule_count || 0);
    var ruleRows = (s.rules || []).map(function(r) { return E("tr", {}, [E("td", {}, text(r.name)), E("td", {}, text(r.ipv6 || "等待匹配")), E("td", {}, text(r.protocol + " / " + r.ports)), E("td", {}, text(r.status === "active" ? "生效" : "等待"))]); });
    var view = E("div", { "class": "ddns-fw-dashboard" }, [
      E("style", {}, ".ddns-fw-dashboard{--ddns-accent:#00c2a8}.ddns-fw-hero{background:linear-gradient(135deg,#13233b,#0c4e5e);color:#fff;border-radius:14px;padding:24px;margin-bottom:18px;box-shadow:0 8px 28px #001b2c44}.ddns-fw-hero h2{margin:0 0 8px;font-size:25px}.ddns-fw-hero p{opacity:.85;margin:0}.ddns-fw-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px}.ddns-fw-card{border:1px solid #d9e6eb;border-radius:12px;padding:18px;background:var(--background-color-base,#fff)}.ddns-fw-card strong{font-size:26px;display:block;margin-top:5px}.ddns-fw-muted{color:#71808a;font-size:12px}.ddns-fw-ok{color:#008c74}.ddns-fw-warn{color:#c67a00}.ddns-fw-actions{margin-top:18px;display:flex;gap:10px;flex-wrap:wrap}.ddns-fw-pill{display:inline-block;border-radius:999px;padding:4px 9px;background:#d8f7ef;color:#007964;font-size:12px}"),
      E("div", { "class": "ddns-fw-hero" }, [
        E("h2", {}, "DDNS IPv6 防火墙"),
        E("p", {}, "前缀变化被自动吸收，设备规则保持在线。"),
        E("div", { "class": "ddns-fw-actions" }, [
          E("span", { "class": "ddns-fw-pill" }, "服务：" + (s.service === "running" ? "运行中" : "已停止")),
          E("span", { "class": "ddns-fw-pill" }, "后端：" + text(s.backend)),
          E("button", { "class": "cbi-button cbi-button-action", "click": ui.createHandlerFn(self, function() {
            return callSync().then(function() { ui.addNotification(null, E("p", {}, "规则已刷新"), "info"); window.location.reload(); });
          }) }, "立即刷新")
        ])
      ]),
      E("div", { "class": "ddns-fw-grid" }, [
        E("div", { "class": "ddns-fw-card" }, [E("span", { "class": "ddns-fw-muted" }, "WAN IPv6 前缀"), E("strong", {}, text(s.wan_prefix || "未探测到"))]),
        E("div", { "class": "ddns-fw-card" }, [E("span", { "class": "ddns-fw-muted" }, "生效规则"), E("strong", { "class": active ? "ddns-fw-ok" : "ddns-fw-warn" }, active + " / " + total)]),
        E("div", { "class": "ddns-fw-card" }, [E("span", { "class": "ddns-fw-muted" }, "Webhook"), E("strong", {}, s.api_enabled ? ":" + text(s.api_port) : "关闭")]),
        E("div", { "class": "ddns-fw-card" }, [E("span", { "class": "ddns-fw-muted" }, "最近同步"), E("strong", {}, s.last_sync ? new Date(Number(s.last_sync) * 1000).toLocaleString() : "暂无")])
      ]),
      E("div", { "class": "cbi-map" }, [E("h3", {}, "当前规则"), ruleRows.length ? E("table", { "class": "table" }, [E("tr", { "class": "tr table-titles" }, [E("th", {}, "名称"), E("th", {}, "当前公网 IPv6"), E("th", {}, "协议 / 端口"), E("th", {}, "状态")])].concat(ruleRows)) : E("p", {}, "尚未添加规则。")]),
      E("div", { "class": "cbi-map" }, [E("h3", {}, "运行提示"), E("p", {}, "主动模式会轮询 NDP/DHCPv6；Webhook 使用 Authorization: Bearer Token。规则拓扑变化才触发 firewall reload，单纯地址变化走 nft 原子热更新。")])
    ]);
    return view;
  },
  handleSaveApply: null
});
