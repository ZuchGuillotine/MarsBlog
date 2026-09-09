"""Fetch immutable input snapshots sequentially from NASA/JPL (build-time only)."""

import json
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CACHE = ROOT / "sources"
CACHE.mkdir(exist_ok=True)
FILES = {
    "pck00011.tpc": "https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/pck00011.tpc",
    "gm_de440.tpc": "https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/gm_de440.tpc",
    "Gravity.tpc": "https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/Gravity.tpc",
    "naif0012.tls.pc": "https://naif.jpl.nasa.gov/pub/naif/generic_kernels/lsk/naif0012.tls.pc",
}
for filename, url in FILES.items():
    p = CACHE / filename
    if not p.exists():
        p.write_bytes(urllib.request.urlopen(url, timeout=60).read())
for name, code in [
    ("mro", "-74"),
    ("odyssey", "-53"),
    ("mars-express", "-41"),
    ("tgo", "-143"),
    ("sun", "10"),
]:
    p = CACHE / f"{name}-20250101.json"
    if p.exists():
        continue
    params = {
        "format": "json",
        "COMMAND": f"'{code}'",
        "MAKE_EPHEM": "YES",
        "EPHEM_TYPE": "VECTORS",
        "CENTER": "'500@499'",
        "START_TIME": "'2025-01-01 00:00:00'",
        "STOP_TIME": "'2025-01-01 06:00:00'",
        "STEP_SIZE": "'720'",
        "TIME_TYPE": "UT",
        "REF_SYSTEM": "ICRF",
        "REF_PLANE": "FRAME",
        "VEC_CORR": "NONE",
        "OUT_UNITS": "KM-S",
        "VEC_TABLE": "2",
        "CSV_FORMAT": "YES",
        "OBJ_DATA": "YES",
    }
    url = "https://ssd.jpl.nasa.gov/api/horizons.api?" + urllib.parse.urlencode(params)
    data = json.load(urllib.request.urlopen(url, timeout=120))
    if "$$SOE" not in data.get("result", ""):
        raise RuntimeError(str(data)[:3000])
    data["requestUrl"] = url
    p.write_text(json.dumps(data, indent=2) + "\n")
    print(name, "cached", len(data["result"]), flush=True)
texture = ROOT.parents[1] / "public/data/orbits/earth-blue-marble.png"
if not texture.exists():
    texture.write_bytes(
        urllib.request.urlopen(
            "https://svs.gsfc.nasa.gov/vis/a000000/a002900/a002915/bluemarble-2048.png",
            timeout=60,
        ).read()
    )
