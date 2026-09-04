"use strict";
"require view";
"require rpc";
"require ui";

var callStatus = rpc.declare({ object: "ddns_fw", method: "status", expect: {} });
var callSync = rpc.declare({ object: "ddns_fw", method: "sync", expect: {} });
var callSetMaster = rpc.declare({ object: "ddns_fw", method: "set_master", params: ["enabled"], expect: {} });

function text(s) { return String(s == null ? "—" : s); }

return view.extend({
  load: function() { return callStatus(); },
  render: function(s) {
    var self = this;
    var active = Number(s.active_count || 0), total = Number(s.rule_count || 0);
    var masterEnabled = s.enabled !== false;
    var masterToggle = E("input", { "type": "checkbox", "checked": masterEnabled });
    var ruleRows = (s.rules || []).map(function(r) {
      var isActive = r.status === "active";
      return E("tr", {}, [
        E("td", { "class": "ddns-fw-rule-name" }, [E("strong", {}, text(r.name)), E("span", {}, text(r.source || "自动匹配"))]),
        E("td", { "class": "ddns-fw-ipv6" }, text(r.ipv6 || "等待匹配")),
        E("td", {}, [E("span", { "class": "ddns-fw-proto" }, text(String(r.protocol || "").toUpperCase())), E("span", { "class": "ddns-fw-ports" }, text(r.ports || "—"))]),
        E("td", {}, E("span", { "class": "ddns-fw-status " + (isActive ? "is-active" : "is-waiting") }, [E("i", {}), isActive ? "生效" : "等待"]))
      ]);
    });
    var view = E("div", { "class": "ddns-fw-dashboard" }, [
      E("style", {}, ".ddns-fw-dashboard{--ddns-accent:#55e6c1;--ddns-blue:#7aa7ff;color:#e8eef7;padding:2px 0 24px}.ddns-fw-dashboard *{box-sizing:border-box}.ddns-fw-hero{position:relative;overflow:hidden;background:linear-gradient(135deg,#101d31 0%,#123c50 62%,#165c64 100%);border:1px solid rgba(122,167,255,.22);border-radius:18px;padding:26px 30px;margin:0 0 18px;box-shadow:0 12px 32px rgba(0,0,0,.22)}.ddns-fw-hero:after{content:'';position:absolute;width:190px;height:190px;right:-48px;top:-78px;border-radius:50%;background:rgba(85,230,193,.12);box-shadow:0 0 0 26px rgba(85,230,193,.04)}.ddns-fw-hero-main{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:18px}.ddns-fw-title{display:flex;align-items:center;gap:12px}.ddns-fw-mark{width:13px;height:13px;border-radius:50%;background:var(--ddns-accent);box-shadow:0 0 0 6px rgba(85,230,193,.14),0 0 20px rgba(85,230,193,.7)}.ddns-fw-hero h2{margin:0;font-size:25px;letter-spacing:.2px;color:#fff}.ddns-fw-hero p{margin:8px 0 0 25px;color:#b9c9d8;font-size:13px}.ddns-fw-actions{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.ddns-fw-pill{display:inline-flex;align-items:center;border:1px solid rgba(255,255,255,.16);border-radius:999px;padding:7px 11px;background:rgba(255,255,255,.08);color:#dffaf3;font-size:12px;white-space:nowrap}.ddns-fw-refresh{border:0!important;border-radius:9px!important;padding:9px 14px!important;background:#6c55d9!important;color:#fff!important;box-shadow:0 5px 15px rgba(0,0,0,.2)}.ddns-fw-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:18px}.ddns-fw-card{min-width:0;border:1px solid rgba(150,170,195,.18);border-radius:13px;padding:15px 17px;background:linear-gradient(145deg,rgba(255,255,255,.075),rgba(255,255,255,.035));box-shadow:0 6px 18px rgba(0,0,0,.12)}.ddns-fw-card .ddns-fw-muted{display:block;color:#9eafc2;font-size:12px}.ddns-fw-card strong{display:block;margin-top:8px;color:#f2f6fb;font-size:22px;line-height:1.2;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ddns-fw-card strong.ddns-fw-ok{color:var(--ddns-accent)}.ddns-fw-card strong.ddns-fw-warn{color:#ffc46b}.ddns-fw-panel{border:1px solid rgba(150,170,195,.17);border-radius:13px;background:rgba(0,0,0,.13);overflow:hidden;margin-bottom:14px}.ddns-fw-panel-head{display:flex;align-items:center;justify-content:space-between;padding:14px 17px;border-bottom:1px solid rgba(150,170,195,.14)}.ddns-fw-panel-head h3{margin:0;color:#eef4fb;font-size:16px}.ddns-fw-panel-head span{color:#8fa3b8;font-size:12px}.ddns-fw-table-wrap{overflow-x:auto}.ddns-fw-table{width:100%;border-collapse:collapse;min-width:620px}.ddns-fw-table th{padding:11px 17px;text-align:left;color:#8fa3b8;font-size:12px;font-weight:500;background:rgba(255,255,255,.035);border-bottom:1px solid rgba(150,170,195,.12)}.ddns-fw-table td{padding:14px 17px;color:#dce5ef;font-size:13px;border-bottom:1px solid rgba(150,170,195,.1)}.ddns-fw-table tr:last-child td{border-bottom:0}.ddns-fw-rule-name{min-width:150px}.ddns-fw-rule-name strong{display:block;color:#f2f6fb;font-size:14px}.ddns-fw-rule-name span{display:block;margin-top:3px;color:#8fa3b8;font-size:11px}.ddns-fw-ipv6{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;color:#9cc7ff!important;white-space:nowrap}.ddns-fw-proto{display:inline-block;padding:3px 7px;border-radius:5px;background:rgba(122,167,255,.15);color:#abc5ff;font-size:11px}.ddns-fw-ports{margin-left:8px;color:#c7d3df;white-space:nowrap}.ddns-fw-status{display:inline-flex;align-items:center;gap:6px;font-size:12px}.ddns-fw-status i{width:7px;height:7px;border-radius:50%;background:#ffbd66}.ddns-fw-status.is-active{color:var(--ddns-accent)}.ddns-fw-status.is-active i{background:var(--ddns-accent);box-shadow:0 0 8px rgba(85,230,193,.75)}.ddns-fw-empty{padding:28px 18px;color:#94a5b8;text-align:center}.ddns-fw-hint{padding:15px 17px;color:#aab9c8;font-size:12px;line-height:1.7}@media(max-width:900px){.ddns-fw-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ddns-fw-hero-main{align-items:flex-start;flex-direction:column}}@media(max-width:520px){.ddns-fw-grid{grid-template-columns:1fr}.ddns-fw-hero{padding:21px}.ddns-fw-hero h2{font-size:21px}}"),
      E("style", {}, ".ddns-fw-dashboard{color:#243447}.ddns-fw-card{border:1px solid #d7dee8;background:#fff;box-shadow:0 6px 18px rgba(32,56,85,.1)}.ddns-fw-card .ddns-fw-muted{color:#60748b}.ddns-fw-card strong{color:#243447}.ddns-fw-card strong.ddns-fw-ok{color:#087f6c}.ddns-fw-card strong.ddns-fw-warn{color:#b86b00}.ddns-fw-panel{border:1px solid #d4dce6;background:#fff;box-shadow:0 5px 16px rgba(32,56,85,.07)}.ddns-fw-panel-head{border-bottom:1px solid #e1e7ef}.ddns-fw-panel-head h3{color:#243447}.ddns-fw-panel-head span,.ddns-fw-empty{color:#60748b}.ddns-fw-table th{color:#60748b;background:#f5f8fb;border-color:#e1e7ef}.ddns-fw-table td{color:#33475b;border-color:#edf1f5}.ddns-fw-rule-name strong{color:#243447}.ddns-fw-rule-name span{color:#718399}.ddns-fw-ipv6{color:#2459b8!important}.ddns-fw-proto{background:#e8efff;color:#2459b8}.ddns-fw-ports{color:#50657b}.ddns-fw-hint{color:#536a82}@media(prefers-color-scheme:dark){.ddns-fw-dashboard{color:#e8eef7}.ddns-fw-card{border-color:rgba(150,170,195,.18);background:linear-gradient(145deg,rgba(255,255,255,.075),rgba(255,255,255,.035));box-shadow:0 6px 18px rgba(0,0,0,.12)}.ddns-fw-card .ddns-fw-muted{color:#9eafc2}.ddns-fw-card strong{color:#f2f6fb}.ddns-fw-card strong.ddns-fw-ok{color:#55e6c1}.ddns-fw-card strong.ddns-fw-warn{color:#ffc46b}.ddns-fw-panel{border-color:rgba(150,170,195,.17);background:rgba(0,0,0,.13);box-shadow:none}.ddns-fw-panel-head{border-color:rgba(150,170,195,.14)}.ddns-fw-panel-head h3{color:#eef4fb}.ddns-fw-panel-head span,.ddns-fw-empty{color:#8fa3b8}.ddns-fw-table th{color:#8fa3b8;background:rgba(255,255,255,.035);border-color:rgba(150,170,195,.12)}.ddns-fw-table td{color:#dce5ef;border-color:rgba(150,170,195,.1)}.ddns-fw-rule-name strong{color:#f2f6fb}.ddns-fw-rule-name span{color:#8fa3b8}.ddns-fw-ipv6{color:#9cc7ff!important}.ddns-fw-proto{background:rgba(122,167,255,.15);color:#abc5ff}.ddns-fw-ports{color:#c7d3df}.ddns-fw-hint{color:#aab9c8}}</style>"),
      E("style", {}, ".ddns-fw-dashboard{color:#172b4d!important}.ddns-fw-hero h2{background:transparent!important;color:#fff!important}.ddns-fw-card{background:#fff!important;border:1px solid #bcc8d6!important;box-shadow:0 6px 18px rgba(32,56,85,.1)}.ddns-fw-card .ddns-fw-muted{color:#304b68!important}.ddns-fw-card strong{color:#172b4d!important}.ddns-fw-card strong.ddns-fw-ok{color:#067a63!important}.ddns-fw-card strong.ddns-fw-warn{color:#925200!important}.ddns-fw-panel{background:#fff!important;border:1px solid #bcc8d6!important;box-shadow:0 5px 16px rgba(32,56,85,.07)}.ddns-fw-panel-head{border-bottom:1px solid #cbd6e2!important}.ddns-fw-panel-head h3{color:#172b4d!important}.ddns-fw-panel-head span,.ddns-fw-empty{color:#304b68!important}.ddns-fw-table th{color:#304b68!important;background:#e9f0f7!important;border-color:#cbd6e2!important}.ddns-fw-table td{color:#243f5b!important;border-color:#dce5ee!important}.ddns-fw-rule-name strong{color:#172b4d!important}.ddns-fw-rule-name span{color:#3f5873!important}.ddns-fw-ipv6{color:#12479c!important}.ddns-fw-proto{background:#d9e6ff!important;color:#12479c!important}.ddns-fw-ports{color:#304b68!important}.ddns-fw-status.is-active{color:#067a63!important}.ddns-fw-empty{color:#304b68!important}.ddns-fw-hint{color:#304b68!important}"),
      E("div", { "class": "ddns-fw-hero" }, [
        E("div", { "class": "ddns-fw-hero-main" }, [
          E("div", {}, [E("div", { "class": "ddns-fw-title" }, [E("i", { "class": "ddns-fw-mark" }), E("h2", {}, "DDNS IPv6 防火墙")]), E("p", {}, "IPv6 前缀变化自动吸收，内网设备规则持续在线")]),
          E("div", { "class": "ddns-fw-actions" }, [
            E("span", { "class": "ddns-fw-pill" }, "● " + (s.service === "running" ? "运行中" : "已停止")),
            E("span", { "class": "ddns-fw-pill" }, "后端 " + text(s.backend)),
            E("button", { "class": "cbi-button cbi-button-action ddns-fw-refresh", "click": ui.createHandlerFn(self, function() {
              return callSync().then(function() { ui.addNotification(null, E("p", {}, "规则已刷新"), "info"); window.location.reload(); });
            }) }, "↻ 立即刷新")
          ])
        ])
      ]),
      E("div", { "class": "ddns-fw-grid" }, [
        E("div", { "class": "ddns-fw-card" }, [E("span", { "class": "ddns-fw-muted" }, "WAN IPv6 前缀"), E("strong", {}, text(s.wan_prefix || "未探测到"))]),
        E("div", { "class": "ddns-fw-card" }, [E("span", { "class": "ddns-fw-muted" }, "生效规则"), E("strong", { "class": active ? "ddns-fw-ok" : "ddns-fw-warn" }, active + " / " + total + " 条")]),
        E("div", { "class": "ddns-fw-card" }, [E("span", { "class": "ddns-fw-muted" }, "Webhook"), E("strong", {}, s.api_enabled ? ":" + text(s.api_port) : "关闭")]),
        E("div", { "class": "ddns-fw-card" }, [E("span", { "class": "ddns-fw-muted" }, "最近同步"), E("strong", {}, s.last_sync ? new Date(Number(s.last_sync) * 1000).toLocaleString() : "暂无")])
      ]),
      E("style", {}, ".ddns-fw-master{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:16px 20px;margin-bottom:18px;border:1px solid rgba(122,167,255,.24);border-radius:14px;background:linear-gradient(120deg,#17243a,#183f4c);box-shadow:0 8px 22px rgba(0,0,0,.14)}.ddns-fw-master-copy{display:flex;align-items:center;gap:13px}.ddns-fw-master-icon{display:flex;width:40px;height:40px;align-items:center;justify-content:center;border-radius:12px;background:rgba(85,230,193,.13);color:#69e7c7;font-size:20px}.ddns-fw-master-copy strong{display:block;color:#fff;font-size:15px}.ddns-fw-master-copy span{display:block;margin-top:4px;color:#b9c9d8;font-size:12px}.ddns-fw-master-state{display:flex;align-items:center;gap:11px;color:#dfeaf3;font-size:13px;white-space:nowrap}.ddns-fw-toggle{position:relative;display:inline-block;width:48px;height:26px;cursor:pointer}.ddns-fw-toggle input{position:absolute;opacity:0;width:0;height:0}.ddns-fw-slider{position:absolute;inset:0;border-radius:999px;background:#5d6978;transition:.22s}.ddns-fw-slider:before{content:'';position:absolute;width:20px;height:20px;left:3px;top:3px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.3);transition:.22s}.ddns-fw-toggle input:checked+.ddns-fw-slider{background:#16a085;box-shadow:0 0 0 3px rgba(85,230,193,.12)}.ddns-fw-toggle input:checked+.ddns-fw-slider:before{transform:translateX(22px)}.ddns-fw-master.is-off{background:linear-gradient(120deg,#2b3038,#353b45);border-color:#505967}.ddns-fw-master.is-off .ddns-fw-master-icon{background:rgba(255,255,255,.08);color:#aeb8c5}@media(max-width:650px){.ddns-fw-master{align-items:flex-start}.ddns-fw-master-copy span{max-width:230px}}"),
      E("div", { "class": "ddns-fw-master " + (masterEnabled ? "is-on" : "is-off") }, [
        E("div", { "class": "ddns-fw-master-copy" }, [E("span", { "class": "ddns-fw-master-icon" }, "⏻"), E("div", {}, [E("strong", {}, "插件总开关"), E("span", {}, "关闭后停止主动监听和 Webhook，并撤销本插件生成的动态防火墙规则。")])]),
        E("div", { "class": "ddns-fw-master-state" }, [
          E("span", {}, masterEnabled ? "已启用" : "已关闭"),
          E("label", { "class": "ddns-fw-toggle", "title": masterEnabled ? "关闭插件" : "启用插件" }, [masterToggle, E("span", { "class": "ddns-fw-slider" })])
        ])
      ]),
      E("div", { "class": "ddns-fw-panel" }, [E("div", { "class": "ddns-fw-panel-head" }, [E("h3", {}, "当前规则"), E("span", {}, total ? active + " 条已生效" : "暂无规则")]), ruleRows.length ? E("div", { "class": "ddns-fw-table-wrap" }, E("table", { "class": "ddns-fw-table" }, [E("thead", {}, E("tr", {}, [E("th", {}, "规则"), E("th", {}, "当前公网 IPv6"), E("th", {}, "协议 / 端口"), E("th", {}, "状态")])) , E("tbody", {}, ruleRows)])) : E("div", { "class": "ddns-fw-empty" }, "尚未添加规则，前往“规则与设备”创建第一条规则。")]),
      E("div", { "class": "ddns-fw-panel" }, [E("div", { "class": "ddns-fw-panel-head" }, [E("h3", {}, "运行提示"), E("span", {}, "自动同步已开启")]), E("div", { "class": "ddns-fw-hint" }, "主动模式会轮询 NDP / DHCPv6；Webhook 使用 Authorization: Bearer Token。地址变化走 nft 原子热更新，只有规则拓扑变化才会 reload 防火墙。")])
    ]);
    masterToggle.addEventListener("change", function() {
      var next = masterToggle.checked;
      masterToggle.disabled = true;
      callSetMaster(next).then(function() {
        ui.addNotification(null, E("p", {}, next ? "插件已启用" : "插件已完全关闭"), "info");
        window.location.reload();
      }).catch(function(err) {
        masterToggle.checked = !next;
        masterToggle.disabled = false;
        ui.addNotification(null, E("p", {}, "切换失败：" + err.message), "error");
      });
    });
    return view;
  },
  handleSaveApply: null
});
