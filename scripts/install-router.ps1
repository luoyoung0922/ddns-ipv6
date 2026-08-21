param(
    [string]$Router = '192.168.10.33',
    [string]$User = 'root',
	[string]$Password = '',
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
if (-not $SkipBuild) { & (Join-Path $PSScriptRoot 'build-ipk.ps1') }
$ipk = Get-ChildItem (Join-Path $root 'dist\ddns-fw_*_all.ipk') | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $ipk) { throw 'No package found in dist/' }
$oldPassword = $env:DDNS_FW_SSH_PASSWORD
try {
    if ($Password) { $env:DDNS_FW_SSH_PASSWORD = $Password }
    python (Join-Path $PSScriptRoot 'deploy.py') --host $Router --user $User --package $ipk.FullName
}
finally {
    $env:DDNS_FW_SSH_PASSWORD = $oldPassword
}
if ($LASTEXITCODE -ne 0) { throw 'Remote installation failed; backup: /tmp/firewall.ddns-fw.backup' }
