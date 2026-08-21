"use strict";
"require view";
"require form";
"require uci";
"require rpc";

var callDevices = rpc.declare({ object: "ddns_fw", method: "devices", expect: {} });

return view.extend({
  load: function() {
    return Promise.all([uci.load("ddns_fw"), callDevices()]);
  },

  render: function(data) {
    var devices = data[1] && data[1].devices || [];
    var deviceGroups = {};
    devices.forEach(function(d) {
      if (d.mac)
        deviceGroups[d.mac.toLowerCase()] = d;
    });
    var m = new form.Map("ddns_fw", "设备开放规则",
      "一条规则就是：选择内网设备 → 填写对外开放端口 → 保存应用。IPv6 改变后插件会自动更新防火墙。");
    var s = m.section(form.GridSection, "rule", "已配置规则");
    s.addremove = true;
    s.anonymous = true;
    s.sortable = true;
    s.nodescriptions = false;
    s.addbtntitle = "添加设备开放规则";
    s.actionstitle = "操作";
    s.delbtntitle = "删除";
    s.cloneable = false;
    s.description = "列表只展示常用信息，点击“编辑”查看完整配置；点击“删除”并保存应用后，会移除对应的防火墙放行规则。";
    s.handleRemove = function(section_id, ev) {
      var title = uci.get("ddns_fw", section_id, "name") || section_id;
      if (!window.confirm("确定删除规则“" + title + "”？此操作会立即移除对应的防火墙放行规则。"))
        return;
      this.map.data.remove(this.uciconfig || this.map.config, section_id);
      return this.map.save(null, true);
    };

    var supportsTabs = typeof s.taboption === "function";
    if (supportsTabs) {
      s.tab("device", "① 选择设备");
      s.tab("service", "② 开放端口");
      s.tab("advanced", "③ 高级选项");
    }
    function field(tab, type, name, label) {
      return supportsTabs ? s.taboption(tab, type, name, label) : s.option(type, name, label);
    }

    var o = field("device", form.Flag, "enabled", "启用");
    o.default = "1";
    o.rmempty = false;
    o.editable = true;

    o = field("device", form.Value, "name", "规则名称");
    o.placeholder = "例如：NAS 的 Jellyfin";
    o.description = "只用于界面显示，建议写成“设备 + 服务”。";
    o.rmempty = false;

    o = field("device", form.ListValue, "match_type", "如何找到设备");
    o.modalonly = true;
    o.value("mac", "从 MAC / NDP 自动查找（推荐）");
    o.value("duid", "从 DHCPv6 DUID 查找");
    o.value("client", "从 DHCP 主机名查找");
    o.value("static", "直接填写固定 IPv6");
    o.value("webhook", "由 DDNS-GO / Webhook 推送");
    o.default = "mac";
    o.description = "普通局域网设备优先选择 MAC；由客户端主动上报时选择 Webhook。";

    o = field("device", form.ListValue, "mac", "① 选择设备 MAC");
    o.modalonly = true;
    o.datatype = "macaddr";
    o.description = devices.length ? "先选 MAC，下面的 IPv6 列表会自动只显示这个设备的地址。" : "当前尚未发现设备，请稍后刷新。";
    devices.forEach(function(d) {
      if (d.mac)
        o.value(d.mac, (d.hostname || "未知设备") + " · " + d.mac);
    });
    o.depends("match_type", "mac");

    o = field("device", form.Value, "duid", "设备 DUID");
    o.modalonly = true;
    o.placeholder = "00010001…";
    o.description = "从 DHCPv6 租约中复制 DUID。";
    o.depends("match_type", "duid");

    o = field("device", form.Value, "client_name", "设备标识");
    o.modalonly = true;
    o.placeholder = "pc-win";
    o.description = "主机名模式填写 DHCP 主机名；Webhook 模式填写 POST 数据中的 client_name。";
    o.depends("match_type", "client");
    o.depends("match_type", "webhook");

    o = field("device", form.ListValue, "ipv6", "② 只显示该设备的 IPv6");
    o.modalonly = true;
    o.datatype = "ip6addr";
    o.description = "只显示上面所选 MAC 对应的全局 IPv6，不会把其他设备地址混在一起。";
    o.value("", "先选择设备 MAC");
    o.depends("match_type", "mac");
    o.depends("match_type", "static");

    o = field("device", form.Value, "ipv6_manual", "固定 IPv6 地址");
    o.modalonly = true;
    o.datatype = "ip6addr";
    o.placeholder = "240e:1234::100";
    o.description = "仅固定 IPv6 模式使用；MAC 模式请在上面的列表中选择。";
    o.depends("match_type", "static");

    o = field("service", form.DynamicList, "ports", "对外开放端口");
    o.datatype = "or(port, portrange)";
    o.placeholder = "8096 或 10000-20000";
    o.description = "每行填写一个端口或端口段，例如 8096、5244、10000-20000。";
    o.rmempty = false;

    o = field("service", form.ListValue, "proto", "协议");
    o.value("tcp", "TCP");
    o.value("udp", "UDP");
    o.value("tcpudp", "TCP + UDP");
    o.default = "tcp";
    o.description = "网页、SSH、Jellyfin 通常使用 TCP；不确定时查看对应服务文档。";

    o = field("advanced", form.ListValue, "strategy", "IPv6 更新策略");
    o.modalonly = true;
    o.value("precise", "精准 IPv6 热更新（推荐）");
    o.value("iid", "固定接口 ID / 仅替换前缀");
    o.default = "precise";
    o.description = "精准模式最安全。只有确定设备 IPv6 后 64 位长期不变时，才选择接口 ID 模式。";

    var guide = E("div", { "class": "cbi-section", "style": "margin-bottom:16px" }, [
      E("h3", {}, "最常用的填写方式"),
      E("ol", {}, [
        E("li", {}, "点击“添加设备开放规则”。"),
        E("li", {}, "选择“从 MAC / NDP 自动查找”，再选择设备。"),
        E("li", {}, "填写端口，例如 Jellyfin 填 8096，协议选 TCP。"),
        E("li", {}, "IPv6 更新策略保持推荐值，保存并应用。")
      ]),
      E("p", { "class": "alert-message warning" }, "此功能会让服务可从公网 IPv6 访问。请只开放必要端口，并确保设备服务启用了账号、强密码或 HTTPS。")
    ]);

    return m.render().then(function(node) {
      function refreshIpv6(selectMac, selectIp) {
        if (!selectIp) return;
        var old = selectIp.value;
        var oldAddress = old.indexOf("|") >= 0 ? old.split("|").slice(1).join("|") : old;
        while (selectIp.options.length) selectIp.remove(0);
        var empty = document.createElement("option");
        empty.value = "";
        empty.textContent = selectMac.value ? "请选择该设备的 IPv6" : "先选择设备 MAC";
        selectIp.appendChild(empty);
        var seen = {};
        var group = deviceGroups[(selectMac.value || "").toLowerCase()];
        var list = group && group.ipv6s || [];
        list.forEach(function(item) {
          if (!/^[23]/.test(item.address || "") || seen[item.address]) return;
          seen[item.address] = true;
          var opt = document.createElement("option");
          opt.value = item.address;
          opt.textContent = item.address + (item.state ? " · " + item.state : "");
          selectIp.appendChild(opt);
        });
        if (oldAddress && Array.prototype.some.call(selectIp.options, function(option) { return option.value === oldAddress; })) selectIp.value = oldAddress;
      }
      function selectKey(select) {
        if (!select) return "";
        return select.name || select.id || (select.parentNode && select.parentNode.id) || "";
      }
      function isMacSelect(select) {
        return select && select.tagName === "SELECT" && /(?:^|[.\]])mac$/i.test(selectKey(select));
      }
      function findIpv6Select(selectMac) {
        var owner = selectMac.closest(".cbi-map") || document;
        var all = Array.prototype.slice.call(owner.querySelectorAll("select"));
        var prefix = selectKey(selectMac).replace(/mac$/i, "");
        var row = selectMac.closest("tr") || selectMac.closest(".cbi-section-table-row") || selectMac.parentNode;
        var local = row ? Array.prototype.slice.call(row.querySelectorAll("select")) : all;
        return local.filter(function(select) {
          return selectKey(select).replace(/ipv6$/i, "") === prefix;
        })[0] || all.filter(function(select) {
          return selectKey(select).replace(/ipv6$/i, "") === prefix;
        })[0] || local.filter(function(select) {
          return /(?:^|[.\]])ipv6$/i.test(selectKey(select));
        })[0] || all.filter(function(select) {
          return /(?:^|[.\]])ipv6$/i.test(selectKey(select));
        })[0] || null;
      }
      function scanMacSelects(scope) {
        var macSelects = [];
        if (isMacSelect(scope)) macSelects.push(scope);
        if (scope && scope.querySelectorAll) {
          Array.prototype.forEach.call(scope.querySelectorAll("select"), function(select) {
            if (isMacSelect(select)) macSelects.push(select);
          });
        }
        macSelects.forEach(function(selectMac) {
          refreshIpv6(selectMac, findIpv6Select(selectMac));
        });
      }

      if (window.ddnsFwMacChangeHandler)
        document.removeEventListener("change", window.ddnsFwMacChangeHandler, true);
      window.ddnsFwMacChangeHandler = function(ev) {
        if (isMacSelect(ev.target))
          window.setTimeout(function() { refreshIpv6(ev.target, findIpv6Select(ev.target)); }, 40);
      };
      document.addEventListener("change", window.ddnsFwMacChangeHandler, true);

      if (window.ddnsFwRuleObserver)
        window.ddnsFwRuleObserver.disconnect();
      window.ddnsFwRuleObserver = new MutationObserver(function(mutations) {
        var hasNewMacField = mutations.some(function(mutation) {
          return Array.prototype.some.call(mutation.addedNodes || [], function(added) {
            return added.nodeType === 1 && (isMacSelect(added) ||
              (added.querySelector && added.querySelector("select[id$='.mac'], select[name$='.mac']")));
          });
        });
        if (hasNewMacField)
          window.setTimeout(function() { scanMacSelects(document); }, 40);
      });
      window.ddnsFwRuleObserver.observe(document.body, { childList: true, subtree: true });
      scanMacSelects(document);
      node.insertBefore(guide, node.firstChild);
      return node;
    });
  }
});
