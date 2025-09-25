#!/usr/bin/env python3
"""
Downloads royalty-free dish photos and creates responsive sizes.
Fixes HTTP 403 by sending a real User-Agent and a Pexels referer.
"""
import os, sys, time
from urllib.parse import urlsplit
from io import BytesIO

URLS = {
    "hero_samosa": "https://images.pexels.com/photos/21078315/pexels-photo-21078315.jpeg?auto=compress&cs=tinysrgb&w=1920",
    "hero_dahivada": "https://images.pexels.com/photos/9213253/pexels-photo-9213253.jpeg?auto=compress&cs=tinysrgb&w=1920",
    "hero_chowmein": "https://images.pexels.com/photos/5848496/pexels-photo-5848496.jpeg?auto=compress&cs=tinysrgb&w=1920",
    "hero_kadhaipaneer": "https://images.pexels.com/photos/12737799/pexels-photo-12737799.jpeg?auto=compress&cs=tinysrgb&w=1920",
}

ASSETS = os.path.join(os.path.dirname(__file__), "assets")
os.makedirs(ASSETS, exist_ok=True)

def _download(url, headers, session=None):
    data = None
    if session is not None:
        resp = session.get(url, headers=headers, stream=True, timeout=60)
        resp.raise_for_status()
        data = resp.content
    else:
        # urllib fallback with headers
        from urllib.request import Request, urlopen
        req = Request(url, headers=headers, method="GET")
        with urlopen(req, timeout=60) as r:
            data = r.read()
    return data

def download_with_workarounds(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        "Referer": "https://www.pexels.com/",
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    }
    # Prefer requests if available
    session = None
    try:
        import requests  # type: ignore
        session = requests.Session()
    except Exception:
        session = None

    attempts = [url]
    # also try without query params in case CDN blocks params
    try:
        base = url.split("?")[0]
        if base not in attempts:
            attempts.append(base)
    except Exception:
        pass

    last_err = None
    for attempt in attempts:
        try:
            print(f" - GET {attempt}")
            return _download(attempt, headers, session=session)
        except Exception as e:
            print(f"   ! Failed: {e}")
            last_err = e
            time.sleep(0.8)
            continue
    raise last_err if last_err else RuntimeError("Download failed")

def ensure_pillow():
    try:
        from PIL import Image  # noqa: F401
    except Exception:
        print("This script needs Pillow. Install with:\n  pip install pillow requests\n")
        raise

def save_sizes(base_key, raw):
    from PIL import Image
    from PIL.Image import Resampling
    path_1920 = os.path.join(ASSETS, f"{base_key}-1920.jpg")
    with open(path_1920, "wb") as f:
        f.write(raw)
    im = Image.open(BytesIO(raw)).convert("RGB")
    for w,h in [(1280,720),(640,360)]:
        im.resize((w,h), Resampling.LANCZOS).save(os.path.join(ASSETS, f"{base_key}-{w}.jpg"), "JPEG", quality=84, optimize=True, progressive=True)
    # thumbnail
    im.resize((96,96), Resampling.LANCZOS).save(os.path.join(ASSETS, f"thumb_{base_key}.jpg"), "JPEG", quality=86, optimize=True, progressive=True)

def main():
    ensure_pillow()
    ok = 0
    for key, url in URLS.items():
        print(f"Downloading {key}...")
        raw = download_with_workarounds(url)
        save_sizes(key, raw)
        ok += 1
    print(f"Done. Downloaded {ok} images and generated sizes.\nOpen index.html or deploy the folder.")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("\nERROR:", e)
        print("\nTroubleshooting:\n"
              " - Ensure you have internet access (some networks block CDN downloads).\n"
              " - If you're behind a proxy, set HTTPS_PROXY, e.g.:\n"
              "     set HTTPS_PROXY=http://user:pass@proxy:port\n"
              " - Try: pip install requests pillow\n"
              " - If it still fails, download the images manually and place them as:\n"
              "     assets/hero_samosa-1920.jpg (and similarly for others), then re-run this script.\n")
        raise
