import json
import time
import urllib.parse
import urllib.request

UA = "BMUN2026CouncilPhotos/1.0 (educational school site; offline use) urllib"

def api(params):
    q = urllib.parse.urlencode(params)
    req = urllib.request.Request(
        "https://commons.wikimedia.org/w/api.php?" + q,
        headers={"User-Agent": UA},
    )
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < 2:
                print("429, waiting 25s")
                time.sleep(25)
                continue
            raise

data = api({
    "action": "query",
    "list": "search",
    "srsearch": "intitle:\"2016 UN Women\" filetype:bitmap",
    "srnamespace": "6",
    "srlimit": "30",
    "format": "json",
})
print("UN WOMEN 2016")
for hit in data.get("query", {}).get("search", []):
    print("-", hit["title"].encode("ascii", "replace").decode())

time.sleep(3.2)
data = api({
    "action": "query",
    "list": "search",
    "srsearch": "intitle:\"UN Women\" hall OR plenary OR conference OR session filetype:bitmap",
    "srnamespace": "6",
    "srlimit": "20",
    "format": "json",
})
print("\nUN WOMEN HALL")
for hit in data.get("query", {}).get("search", []):
    print("-", hit["title"].encode("ascii", "replace").decode())

time.sleep(3.2)
data = api({
    "action": "query",
    "titles": "File:Under FNs kvinnekommisjons sesjon (CSW).jpg",
    "prop": "categories",
    "cllimit": "20",
    "format": "json",
})
print("\nCATS")
for page in data["query"]["pages"].values():
    for c in page.get("categories", []):
        print("-", c["title"].encode("ascii", "replace").decode())
