param(
    [string]$OutputDir = (Join-Path $PSScriptRoot '..\dist')
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$version = '0.1.0-1'
$stage = Join-Path ([IO.Path]::GetTempPath()) ('ddns-fw-' + [guid]::NewGuid().ToString('N'))
$data = Join-Path $stage 'data'
$control = Join-Path $stage 'control'
New-Item -ItemType Directory -Force -Path $data,$control,$OutputDir | Out-Null

try {
    Copy-Item -Recurse -Force (Join-Path $root 'files\*') $data
    @'
Package: ddns-fw
Version: 0.1.0-1
Architecture: all
Maintainer: Codex
Section: net
Priority: optional
Depends: uci, ubus, jsonfilter, uhttpd, rpcd, luci-base
Description: Dynamic IPv6 firewall automation with nftables hot updates and LuCI.
'@ | Set-Content -Encoding ascii (Join-Path $control 'control')
    @'
#!/bin/sh
[ -x /etc/uci-defaults/99-ddns-fw ] && /etc/uci-defaults/99-ddns-fw
rm -f /tmp/luci-indexcache* 2>/dev/null
rm -rf /tmp/luci-modulecache 2>/dev/null || true
exit 0
'@ | Set-Content -Encoding ascii (Join-Path $control 'postinst')
    @'
#!/bin/sh
[ "$1" = upgrade ] && exit 0
/etc/init.d/ddns-fw stop >/dev/null 2>&1 || true
/etc/init.d/ddns-fw disable >/dev/null 2>&1 || true
uci -q delete firewall.ddns_fw_sets
uci -q delete firewall.ddns_fw_forward
uci commit firewall
rm -rf /var/run/ddns-fw
rm -f /tmp/luci-indexcache*
/etc/init.d/firewall reload >/dev/null 2>&1 || true
exit 0
'@ | Set-Content -Encoding ascii (Join-Path $control 'prerm')
    '/etc/config/ddns_fw' | Set-Content -Encoding ascii (Join-Path $control 'conffiles')

    $python = (Get-Command python).Source
    & $python (Join-Path $PSScriptRoot 'make_ipk.py') $stage (Join-Path $OutputDir "ddns-fw_$version`_all.ipk")
    if ($LASTEXITCODE -ne 0) { throw 'IPK build failed' }
}
finally {
    Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue
}
