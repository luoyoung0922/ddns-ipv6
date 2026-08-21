"use strict";
"require view";
"require rpc";

var callLogs = rpc.declare({ object: "ddns_fw", method: "logs", params: ["limit"], expect: {} });
return view.extend({
  load: function() { return callLogs(200); },
  render: function(data) {
    var rows = data && data.entries || [];
    var box = E("div", { "class": "cbi-map" }, [E("h2", {}, "审计日志"), E("p", {}, "仅记录地址变化、Webhook 鉴权与规则更新结果。"), E("pre", { "style": "max-height:60vh;overflow:auto;background:#111827;color:#d1fae5;padding:16px;border-radius:8px;white-space:pre-wrap" }, rows.join("\n") || "暂无日志")]);
    return box;
  }
});
