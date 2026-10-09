/* BMUN — Promotions bento hover animations (Lottie / video / GIF) */
(function () {
  var EXT_ORDER = ['mp4', 'webm', 'gif', 'json', 'lottie'];
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function extFromPath(path) {
    var i = path.lastIndexOf('.');
    return i > -1 ? path.slice(i + 1).toLowerCase() : '';
  }

  function baseFromAnim(name) {
    return 'promo-animations/' + name;
  }

  function resolveSources(tile) {
    var explicit = tile.getAttribute('data-promo-src');
    if (explicit) {
      var ext = extFromPath(explicit);
      if (ext) return [{ url: explicit, ext: ext }];
      return EXT_ORDER.map(function (ext) {
        return { url: explicit + '.' + ext, ext: ext };
      });
    }
    var anim = tile.getAttribute('data-promo-anim');
    if (!anim) return [];
    return EXT_ORDER.map(function (ext) {
      return { url: baseFromAnim(anim) + '.' + ext, ext: ext };
    });
  }

  function probeUrl(url) {
    return fetch(url, { method: 'HEAD', cache: 'no-store' })
      .then(function (res) { return res.ok ? url : null; })
      .catch(function () { return null; });
  }

  function findFirstSource(sources) {
    var chain = Promise.resolve(null);
    sources.forEach(function (src) {
      chain = chain.then(function (found) {
        if (found) return found;
        return probeUrl(src.url).then(function (ok) {
          return ok ? src : null;
        });
      });
    });
    return chain;
  }

  function tryLottie(host, url, tile) {
    return new Promise(function (resolve) {
      if (!window.lottie) {
        resolve(null);
        return;
      }
      var anim = window.lottie.loadAnimation({
        container: host,
        renderer: 'svg',
        loop: true,
        autoplay: false,
        path: url
      });
      anim.addEventListener('DOMLoaded', function () {
        tile.classList.add('has-promo-art');
        anim.goToAndStop(0, true);
        resolve({ type: 'lottie', handle: anim });
      });
      anim.addEventListener('data_failed', function () {
        host.innerHTML = '';
        resolve(null);
      });
    });
  }

  function tryVideo(host, url, tile) {
    return new Promise(function (resolve) {
      var video = document.createElement('video');
      video.src = url;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.preload = 'auto';
      video.setAttribute('aria-hidden', 'true');

      video.addEventListener('loadeddata', function () {
        video.pause();
        video.currentTime = 0;
        host.appendChild(video);
        tile.classList.add('has-promo-art');
        resolve({ type: 'video', handle: video });
      }, { once: true });

      video.addEventListener('error', function () {
        host.innerHTML = '';
        resolve(null);
      }, { once: true });
    });
  }

  function tryGif(host, url, tile) {
    return new Promise(function (resolve) {
      var img = document.createElement('img');
      img.src = url;
      img.alt = '';
      img.decoding = 'async';
      img.addEventListener('load', function () {
        tile.classList.add('has-promo-art');
        resolve({ type: 'gif', handle: img });
      }, { once: true });
      img.addEventListener('error', function () {
        host.innerHTML = '';
        resolve(null);
      }, { once: true });
      host.appendChild(img);
    });
  }

  function trySource(host, tile, src) {
    if (src.ext === 'json' || src.ext === 'lottie') return tryLottie(host, src.url, tile);
    if (src.ext === 'webm' || src.ext === 'mp4') return tryVideo(host, src.url, tile);
    if (src.ext === 'gif') return tryGif(host, src.url, tile);
    return Promise.resolve(null);
  }

  function loadFirstAvailable(host, tile, sources, index) {
    if (index >= sources.length) return Promise.resolve(null);
    return trySource(host, tile, sources[index]).then(function (player) {
      if (player) return player;
      return loadFirstAvailable(host, tile, sources, index + 1);
    });
  }

  function bindSpotlight(tile) {
    var lens = tile.querySelector('.bento-spotlight-lens, .tile-spotlight-lens');
    if (!lens) return;
    var raf = 0;
    tile.addEventListener('mousemove', function (e) {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var rect = tile.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / rect.width) * 100;
        var y = ((e.clientY - rect.top) / rect.height) * 100;
        lens.style.background =
          'radial-gradient(circle at ' + x + '% ' + y + '%, rgba(168, 197, 220, 0.42) 0%, rgba(224, 232, 238, 0.12) 38%, transparent 68%)';
      });
    });
  }

  function bindPlayback(tile, player) {
    if (!player || reducedMotion) return;

    tile.addEventListener('mouseenter', function () {
      if (player.type === 'lottie') player.handle.play();
      if (player.type === 'video') {
        var p = player.handle.play();
        if (p && p.catch) p.catch(function () {});
      }
    });

    tile.addEventListener('mouseleave', function () {
      if (player.type === 'lottie') {
        player.handle.pause();
        player.handle.goToAndStop(0, true);
      }
      if (player.type === 'video') {
        player.handle.pause();
        player.handle.currentTime = 0;
      }
    });

    tile.addEventListener('focusin', function () {
      tile.dispatchEvent(new Event('mouseenter'));
    });
    tile.addEventListener('focusout', function () {
      tile.dispatchEvent(new Event('mouseleave'));
    });
  }

  function getMediaHost(tile) {
    var host = tile.querySelector('.tile-role-art:not(.tile-role-art--icons), .bento-tile-art');
    if (!host) return null;
    host.innerHTML = '';
    var media = document.createElement('div');
    media.className = 'tile-role-art-media';
    media.setAttribute('aria-hidden', 'true');
    host.appendChild(media);
    return media;
  }

  function initTile(tile) {
    var host = getMediaHost(tile);
    if (!host) return;
    bindSpotlight(tile);

    var sources = resolveSources(tile);
    if (!sources.length) return;

    loadFirstAvailable(host, tile, sources, 0).then(function (player) {
      bindPlayback(tile, player);
    });
  }

  function init() {
    document.querySelectorAll('.large-tile[data-promo-anim], .bento-glass[data-promo-anim], [data-promo-src]').forEach(initTile);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
