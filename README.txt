Run these commands in this folder (Windows PowerShell/CMD):
  pip install requests pillow
  python fetch_images.py

The script sets a real User-Agent and Referer to avoid HTTP 403 from the CDN.
If you're behind a corporate proxy, set HTTPS_PROXY before running.
