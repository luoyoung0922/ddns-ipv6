param(
    [string]$Package = (Join-Path $PSScriptRoot '..\dist\ddns-fw_0.1.0-1_all.ipk'),
    [string]$Output = (Join-Path $PSScriptRoot '..\dist\ddns-fw-0.1.0.run')
)

$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $Package)) {
    & (Join-Path $PSScriptRoot 'build-ipk.ps1')
}
$bytes = [IO.File]::ReadAllBytes((Resolve-Path -LiteralPath $Package))
$payload = [Convert]::ToBase64String($bytes)
$header = @'
#!/bin/sh
# ddns-fw standalone installer 0.1.0
# Usage: ./ddns-fw-0.1.0.run [--check|--uninstall|--help]
set -eu

SELF="$0"
TMP="/tmp/ddns-fw-run.$$"
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT INT TERM

usage() {
    cat <<'EOF'
ddns-fw standalone installer

Usage:
  ddns-fw-0.1.0.run              Install or upgrade
  ddns-fw-0.1.0.run --check      Validate package and dependencies
  ddns-fw-0.1.0.run --uninstall  Remove ddns-fw and its own firewall hooks
  ddns-fw-0.1.0.run --help       Show this help
EOF
}

case "${1:-}" in
    --help|-h) usage; exit 0 ;;
    --uninstall)
        [ "$(id -u)" = 0 ] || { echo '需要 root 权限' >&2; exit 1; }
        if command -v opkg >/dev/null 2>&1 && opkg status ddns-fw 2>/dev/null | grep -q 'Package:'; then
            opkg remove ddns-fw
        else
            echo 'ddns-fw 未安装'
        fi
        exit 0
        ;;
esac

[ "$(id -u)" = 0 ] || { echo '需要 root 权限，请使用 root 执行' >&2; exit 1; }
command -v opkg >/dev/null 2>&1 || { echo '未找到 opkg：这不是 OpenWrt/iStoreOS 系统？' >&2; exit 1; }
command -v base64 >/dev/null 2>&1 || { echo '未找到 base64 命令，请安装 coreutils-base64' >&2; exit 1; }

PAYLOAD_LINE="$(awk '/^__DDNS_FW_PAYLOAD_BELOW__$/ {print NR + 1; exit}' "$SELF")"
[ -n "$PAYLOAD_LINE" ] || { echo '安装器损坏：找不到 payload' >&2; exit 1; }
mkdir -p "$TMP"
sed -n "${PAYLOAD_LINE},\$p" "$SELF" | base64 -d > "$TMP/ddns-fw.ipk"
[ -s "$TMP/ddns-fw.ipk" ] || { echo '安装器损坏：payload 为空' >&2; exit 1; }

if [ "${1:-}" = "--check" ]; then
    opkg install --noaction "$TMP/ddns-fw.ipk"
    echo 'ddns-fw package check: OK'
    exit 0
fi

mkdir -p /tmp/ddns-fw-backup
[ -f /etc/config/firewall ] && cp /etc/config/firewall /tmp/ddns-fw-backup/firewall.$(date +%Y%m%d-%H%M%S)
opkg install --force-reinstall "$TMP/ddns-fw.ipk"
command -v ddns-fw >/dev/null 2>&1 && ddns-fw sync standalone || true
/etc/init.d/ddns-fw enable >/dev/null 2>&1 || true
/etc/init.d/ddns-fw restart >/dev/null 2>&1 || true
echo
echo 'ddns-fw 安装完成。'
echo '查看状态：ubus call ddns_fw status'
echo '配置页面：LuCI → 网络 → DDNS IPv6 防火墙'
echo '防火墙备份：/tmp/ddns-fw-backup/'
exit 0

__DDNS_FW_PAYLOAD_BELOW__
'@
$content = $header + "`n" + $payload + "`n"
$target = [IO.Path]::GetFullPath($Output)
[IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($target)) | Out-Null
[IO.File]::WriteAllText($target, $content, [Text.UTF8Encoding]::new($false))
Write-Output $target
