param(
    [string]$Router = '192.168.10.33',
    [string]$Password = ''
)
& (Join-Path $PSScriptRoot 'scripts\install-router.ps1') -Router $Router -Password $Password
