import json
import urllib.parse
import urllib.request

UA = "BMUN-local/1.0 (school site)"
titles = [
    "File:Fédération Internationale de l'Automobile wordmark.svg",
    "File:FIA logo (transparent).png",
    "File:FIA logo (white).png",
]
q = urllib.parse.urlencode({
    "action": "query",
    "titles": "|".join(titles),
    "prop": "imageinfo",
    "iiprop": "url|mime|size",
    "format": "json",
})
req = urllib.request.Request(
    "https://commons.wikimedia.org/w/api.php?" + q,
    headers={"User-Agent": UA},
)
data = json.load(urllib.request.urlopen(req, timeout=40))
for page in data["query"]["pages"].values():
    print(page.get("title"))
    info = (page.get("imageinfo") or [{}])[0]
    print(info.get("mime"), info.get("width"), info.get("height"))
    print(info.get("url"))
    print("---")
