import argparse
import os
import pathlib
import sys

import paramiko


parser = argparse.ArgumentParser(description="Deploy ddns-fw to an OpenWrt router")
parser.add_argument("--host", default="192.168.10.33")
parser.add_argument("--user", default="root")
parser.add_argument("--package", required=True)
parser.add_argument("--probe", action="store_true")
parser.add_argument("--command")
args = parser.parse_args()
password = os.environ.get("DDNS_FW_SSH_PASSWORD")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(args.host, username=args.user, password=password, timeout=10, look_for_keys=password is None)
sftp = client.open_sftp()
sftp.put(str(pathlib.Path(args.package).resolve()), "/tmp/ddns-fw.ipk")
sftp.close()

command = (
    "set -e; "
    "cp /etc/config/firewall /tmp/firewall.ddns-fw.backup; "
    "opkg install --force-reinstall /tmp/ddns-fw.ipk; "
    "/etc/init.d/ddns-fw restart; "
    "i=0; while [ -d /var/run/ddns-fw/lock ] && [ $i -lt 20 ]; do sleep 1; i=$((i+1)); done; "
    "/usr/sbin/ddns-fw sync install; ubus call ddns_fw status"
)
if args.probe:
    command = "ls -l /tmp/ddns-fw.ipk; hexdump -C /tmp/ddns-fw.ipk | head -5; tar -tzf /tmp/ddns-fw.ipk 2>&1 | head -10; opkg install --force-reinstall /tmp/ddns-fw.ipk"
if args.command:
    command = args.command
stdin, stdout, stderr = client.exec_command(command, timeout=90)
out, err = stdout.read().decode(errors="replace"), stderr.read().decode(errors="replace")
code = stdout.channel.recv_exit_status()
if out:
    print(out, end="")
if err:
    print(err, end="", file=sys.stderr)
client.close()
raise SystemExit(code)
