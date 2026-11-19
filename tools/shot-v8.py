# Cover Coast v8 - screenshot helper (Playwright + bundled Chromium).
# Reads shots.json, serves each ?shot= scene at its own viewport, waits for
# window.__shotReady, saves JPEG into screenshots/. Usage:
#   python3 tools/shot-v8.py [name ...]   (default: all shots in shots.json)
import json, sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SHOTS = json.loads((ROOT / "shots.json").read_text())
CHROME = "/home/hatch/.cache/ms-playwright/chromium-1255/chrome-linux/chrome"

def main():
    wanted = sys.argv[1:] or [s["name"] for s in SHOTS]
    out_dir = ROOT / "screenshots"
    out_dir.mkdir(exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROME,
                              args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--no-sandbox"])
        for shot in SHOTS:
            if shot["name"] not in wanted:
                continue
            errors = []
            reqs = []
            pg = b.new_page(viewport={"width": shot["w"], "height": shot["h"]})
            pg.on("console", lambda m: errors.append(f"{m.type}: {m.text}") if m.type == "error" else None)
            pg.on("pageerror", lambda e: errors.append(f"PAGEERROR: {e}"))
            pg.on("request", lambda r: reqs.append(r.url) if r.url.startswith("http") and "localhost" not in r.url else None)
            pg.goto(f"http://localhost:8091/{shot['query']}")
            try:
                pg.wait_for_function("window.__shotReady===true", timeout=30000)
            except Exception as e:
                errors.append(f"TIMEOUT shotReady: {e}")
            pg.wait_for_timeout(400)
            out = out_dir / shot["name"]
            pg.screenshot(path=str(out), type="jpeg", quality=80)
            size = out.stat().st_size
            print(f"{shot['name']}: {shot['w']}x{shot['h']} {size} bytes "
                  f"({'OVER 256KiB!' if size > 262144 else 'ok'}) "
                  f"errors={errors if errors else 'none'} external={reqs if reqs else 'none'}")
            pg.close()
        b.close()

if __name__ == "__main__":
    main()
