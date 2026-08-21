import io
import os
import stat
import sys
import tarfile
import time
from pathlib import Path


def tar_gz(root: Path) -> bytes:
    stream = io.BytesIO()
    with tarfile.open(fileobj=stream, mode="w:gz", format=tarfile.GNU_FORMAT) as tf:
        for path in sorted(root.rglob("*")):
            rel = "./" + path.relative_to(root).as_posix()
            info = tf.gettarinfo(str(path), arcname=rel)
            info.mtime = int(time.time())
            if path.is_file():
                executable = (
                    rel.startswith("./etc/init.d/")
                    or rel.startswith("./etc/hotplug.d/")
                    or rel.startswith("./etc/uci-defaults/")
                    or rel.startswith("./usr/sbin/")
                    or rel.startswith("./usr/libexec/rpcd/")
                    or rel == "./www/ddns-fw-api/api/firewall/sync"
                    or rel in ("./postinst", "./prerm")
                )
                info.mode = 0o755 if executable else 0o644
                payload = path.read_bytes()
                if executable or rel in ("./control", "./conffiles"):
                    payload = payload.replace(b"\r\n", b"\n")
                    if not payload.endswith(b"\n"):
                        payload += b"\n"
                    info.size = len(payload)
                tf.addfile(info, io.BytesIO(payload))
            else:
                tf.addfile(info)
    return stream.getvalue()


stage, output = Path(sys.argv[1]), Path(sys.argv[2])
debian = b"2.0\n"
control = tar_gz(stage / "control")
data = tar_gz(stage / "data")
output.parent.mkdir(parents=True, exist_ok=True)
with tarfile.open(output, mode="w:gz", format=tarfile.GNU_FORMAT) as package:
    for name, payload in (("debian-binary", debian), ("control.tar.gz", control), ("data.tar.gz", data)):
        info = tarfile.TarInfo(name)
        info.size = len(payload)
        info.mode = 0o644
        info.mtime = int(time.time())
        package.addfile(info, io.BytesIO(payload))
print(output)
