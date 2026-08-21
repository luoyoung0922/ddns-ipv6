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
      deviceGroups[d.mac] = d;
    });
    var m = new form.Map("ddns_fw", "设备开放规则",
      "一条规则就是：选择内网设备 → 填写对外开放端口 → 保存应用。IPv6 改变后插件会自动更新防火墙。");
    var s = m.section(form.GridSection, "rule", "已配置规则");
    s.addremove = true;
    s.anonymous = true;
    s.sortable = true;
    s.nodescriptions = false;
    s.addbtntitle = "添加设备开放规则";

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
    o.value("mac", "从 MAC / NDP 自动查找（推荐）");
    o.value("duid", "从 DHCPv6 DUID 查找");
    o.value("client", "从 DHCP 主机名查找");
    o.value("static", "直接填写固定 IPv6");
    o.value("webhook", "由 DDNS-GO / Webhook 推送");
    o.default = "mac";
    o.description = "普通局域网设备优先选择 MAC；由客户端主动上报时选择 Webhook。";

    o = field("device", form.ListValue, "mac", "① 选择设备 MAC");
    o.datatype = "macaddr";
    o.description = devices.length ? "先选 MAC，下面的 IPv6 列表会自动只显示这个设备的地址。" : "当前尚未发现设备，请稍后刷新。";
    devices.forEach(function(d) {
      if (d.mac)
        o.value(d.mac, (d.hostname || "未知设备") + " · " + d.mac);
    });
    o.depends("match_type", "mac");

    o = field("device", form.Value, "duid", "设备 DUID");
    o.placeholder = "00010001…";
    o.description = "从 DHCPv6 租约中复制 DUID。";
    o.depends("match_type", "duid");

    o = field("device", form.Value, "client_name", "设备标识");
    o.placeholder = "pc-win";
    o.description = "主机名模式填写 DHCP 主机名；Webhook 模式填写 POST 数据中的 client_name。";
    o.depends("match_type", "client");
    o.depends("match_type", "webhook");

    o = field("device", form.ListValue, "ipv6", "② 只显示该设备的 IPv6");
    o.datatype = "ip6addr";
    o.description = "只显示上面所选 MAC 对应的全局 IPv6，不会把其他设备地址混在一起。";
    o.value("", "先选择设备 MAC");
    devices.forEach(function(d) {
      (d.ipv6s || []).forEach(function(item) {
        if (/^[23]/.test(item.address || ""))
          o.value(d.mac + "|" + item.address, d.mac + " · " + item.address);
      });
    });
    o.depends("match_type", "mac");
    o.depends("match_type", "static");

    o = field("device", form.Value, "ipv6_manual", "固定 IPv6 地址");
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
      function refreshIpv6(selectMac) {
        var row = selectMac.closest("tr") || selectMac.closest(".cbi-section-table-row") || selectMac.parentNode.parentNode.parentNode;
        var selectIp = row && row.querySelector("select[name*='.ipv6']");
        if (!selectIp) return;
        var old = selectIp.value;
        var oldAddress = old.indexOf("|") >= 0 ? old.split("|").slice(1).join("|") : old;
        while (selectIp.options.length) selectIp.remove(0);
        var empty = document.createElement("option");
        empty.value = "";
        empty.textContent = selectMac.value ? "请选择该设备的 IPv6" : "先选择设备 MAC";
        selectIp.appendChild(empty);
        var seen = {};
        var group = deviceGroups[selectMac.value];
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
      node.querySelectorAll("select[name$='.mac']").forEach(function(selectMac) {
        selectMac.addEventListener("change", function() { refreshIpv6(selectMac); });
        refreshIpv6(selectMac);
      });
      node.insertBefore(guide, node.firstChild);
      return node;
    });
  }
});
