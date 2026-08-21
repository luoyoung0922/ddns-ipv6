include $(TOPDIR)/rules.mk

PKG_NAME:=ddns-fw
PKG_VERSION:=0.1.0
PKG_RELEASE:=1
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/ddns-fw
  SECTION:=net
  CATEGORY:=Network
  SUBMENU:=Firewall
  TITLE:=Dynamic IPv6 firewall automation
  DEPENDS:=+uci +ubus +jsonfilter +uhttpd +rpcd +luci-base
  PKGARCH:=all
endef

define Package/ddns-fw/description
 Keeps IPv6 firewall rules synchronized with delegated prefixes, DHCPv6/NDP
 device addresses, and authenticated DDNS webhook updates.
endef

define Package/ddns-fw/conffiles
/etc/config/ddns_fw
endef

define Build/Compile
endef

define Package/ddns-fw/install
	$(CP) ./files/* $(1)/
	chmod 0755 $(1)/etc/init.d/ddns-fw \
		$(1)/etc/hotplug.d/iface/95-ddns-fw \
		$(1)/etc/hotplug.d/neigh/95-ddns-fw \
		$(1)/etc/uci-defaults/99-ddns-fw \
		$(1)/usr/sbin/ddns-fw \
		$(1)/usr/sbin/ddns-fw-daemon \
		$(1)/usr/libexec/rpcd/ddns_fw \
		$(1)/www/ddns-fw-api/api/firewall/sync
endef

$(eval $(call BuildPackage,ddns-fw))
