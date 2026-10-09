import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

DEST = Path(r"c:\Users\tssre\OneDrive\Desktop\TEST FILES\UPDATEED\councils\sourced\_cand")
UA = "BMUN2026CouncilPhotos/1.0 (educational school site; offline use) urllib"

TITLES = {
    "uncsw_k": "File:UN Women Session.jpg",
    "uncsw_l": "File:UN Women Session - 1.jpg",
    "uncsw_m": "File:UN Women Session - 2.jpg",
    "uncsw_n": "File:UN Women Session - 3.jpg",
    "uncsw_o": "File:2016 UN Women 01.jpg",
    "uncsw_p": "File:2016 UN Women 08.jpg",
    "uncsw_q": "File:2016 UN Women 12.jpg",
}

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=90) as resp:
                return resp.read()
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < 2:
                print("429, waiting 25s")
                time.sleep(25)
                continue
            raise

q = urllib.parse.urlencode({
    "action": "query",
    "titles": "|".join(TITLES.values()),
    "prop": "imageinfo",
    "iiprop": "url|mime",
    "iiurlwidth": "1400",
    "format": "json",
})
data = json.loads(get("https://commons.wikimedia.org/w/api.php?" + q).decode("utf-8"))
urlmap = {}
for page in data["query"]["pages"].values():
    title = page.get("title")
    if page.get("missing") or "imageinfo" not in page:
        print("MISS", (title or "?").encode("ascii", "replace").decode())
        continue
    info = page["imageinfo"][0]
    urlmap[title] = info.get("thumburl") or info.get("url")
    print("URL", title.encode("ascii", "replace").decode())

time.sleep(3.2)
by_title = {v: k for k, v in TITLES.items()}
for title, url in urlmap.items():
    slug = by_title[title]
    blob = get(url)
    if not blob.startswith(b"\xff\xd8"):
        print("NOTJPEG", slug, blob[:30])
    else:
        (DEST / (slug + ".jpg")).write_bytes(blob)
        print("OK", slug, len(blob))
    time.sleep(3.2)
