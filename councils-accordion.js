(function () {
  'use strict';
  var ROOT_ID = 'council-acc-workspace';
  var PANEL_SEL = '[data-council-acc-panel]';
  var TRANSITION_MS = 720;
  var OPEN_MS = 1100;
  var OPEN_EASE = 'cubic-bezier(0.33, 1, 0.28, 1)';
  var CLOSE_MS = 1280;
  var CLOSE_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }
  function initCouncilAccordion() {
    var root = document.getElementById(ROOT_ID);
    if (!root || root.dataset.init === '1') return;
    root.dataset.init = '1';
    var viewport = root.querySelector('.council-acc-viewport');
    var track = root.querySelector('.council-acc-track');
    var panels = Array.prototype.slice.call(root.querySelectorAll(PANEL_SEL));
    var dots = Array.prototype.slice.call(root.querySelectorAll('.council-acc-dot'));
    var prevBtn = root.querySelector('[data-council-acc-prev]');
    var nextBtn = root.querySelector('[data-council-acc-next]');
    if (!viewport || !track || !panels.length) return;
    var activeIndex = panels.findIndex(function (p) {
      return p.classList.contains('is-active');
    });
    if (activeIndex < 0) activeIndex = 0;
    var offsetX = 0;
    var drag = null;
    var isFsOpen = false;
    var hoverMedia = window.matchMedia('(hover: hover) and (pointer: fine)');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var LOGO_MAP = {
      unsc: 'councils/logos/un.svg',
      uncsw: 'councils/logos/unwomen.svg',
      fifa: 'councils/logos/fifa.svg',
      fia: 'councils/logos/fia-official.png',
      fcc: 'councils/logos/fcc.png',
      hcc: 'councils/logos/hcc.png',
      covhe: 'councils/logos/covhe.png',
      unicef: 'councils/logos/unicef.svg',
      eu: 'councils/logos/eu.svg',
      copuos: 'councils/logos/unoosa.svg',
      unga: 'councils/logos/un.svg',
      pokemon: 'councils/logos/pokemon.svg',
      who: 'councils/logos/who.svg',
      loksabha: 'councils/logos/loksabha.svg'
    };
    var LOGO_ROTATE = {
      uncsw: 90,
      fifa: -90,
      eu: 90,
      unicef: -90,
      copuos: -90
    };
    panels.forEach(function (panel) {
      panel.classList.remove('is-open', 'is-fs-animating');
      panel.querySelectorAll('.council-acc-mist, .council-acc-ghost, .council-acc-open').forEach(function (el) {
        el.remove();
      });
      var slug = panel.getAttribute('data-council') || '';
      var rot = LOGO_ROTATE[slug] || 0;

      function applyLogoRotation(el) {
        el.classList.remove('is-rotated', 'is-rotated-90', 'is-rotated-neg90', 'is-rotated-180');
        if (rot === 90) el.classList.add('is-rotated-90');
        if (rot === -90 || rot === 270) el.classList.add('is-rotated-neg90');
        if (rot === 180) el.classList.add('is-rotated-180');
      }
      var existing = panel.querySelector('.council-acc-logo');
      if (existing) {
        applyLogoRotation(existing);
      } else {
        var src = LOGO_MAP[slug];
        if (src) {
          var logo = document.createElement('img');
          logo.className = 'council-acc-logo';
          applyLogoRotation(logo);
          logo.src = src;
          logo.alt = '';
          logo.setAttribute('aria-hidden', 'true');
          logo.decoding = 'async';
          panel.appendChild(logo);
        }
      }
      if (!panel.querySelector('.council-acc-close')) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'council-acc-close';
        btn.setAttribute('aria-label', 'Close council');
        btn.innerHTML = '<i class="fas fa-times" aria-hidden="true"></i>';
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          closeFullscreen();
        });
        panel.appendChild(btn);
      }
      var copy = panel.querySelector('.council-acc-copy');
      var cue = panel.querySelector('.council-acc-open-cue');
      if (!cue) {
        cue = document.createElement('div');
        cue.className = 'council-acc-open-cue';
        cue.setAttribute('aria-hidden', 'true');
        cue.innerHTML =
          '<span>Open</span><i class="fas fa-arrow-right" aria-hidden="true"></i>';
      }
      if (copy) copy.appendChild(cue);
      else if (!cue.parentNode) panel.appendChild(cue);
    });

    function maxOffset() {
      return Math.max(0, track.scrollWidth - viewport.clientWidth);
    }
    function applyOffset(x, animate) {
      offsetX = clamp(x, -maxOffset(), 0);
      if (viewport.scrollLeft) viewport.scrollLeft = 0;
      track.style.transition = !animate || reduceMotion ? 'none' : '';
      track.style.transform = 'translate3d(' + offsetX + 'px,0,0)';
    }
    function ensureVisible(index) {
      var panel = panels[index];
      if (!panel || isFsOpen) return;

      window.requestAnimationFrame(function () {
        var viewW = viewport.clientWidth;
        var left = panel.offsetLeft;
        var right = left + panel.offsetWidth;
        var next = offsetX;
        if (left + offsetX < 0) next = -left;
        else if (right + offsetX > viewW) next = viewW - right;
        applyOffset(next, true);
      });
    }
    function setActive(index, opts) {
      opts = opts || {};
      if (isFsOpen && !opts.fromFs) return;
      var next = ((index % panels.length) + panels.length) % panels.length;
      activeIndex = next;
      panels.forEach(function (panel, i) {
        var on = i === activeIndex;
        panel.classList.toggle('is-active', on);
        panel.setAttribute('aria-expanded', on ? 'true' : 'false');
        panel.setAttribute('tabindex', on ? '0' : '-1');
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === activeIndex);
      });

      window.clearTimeout(setActive._t);
      setActive._t = window.setTimeout(function () {
        ensureVisible(activeIndex);
      }, opts.instant ? 0 : 280);
      if (opts.updateHash !== false) {
        var id = panels[activeIndex].id;
        if (id && history.replaceState) {
          history.replaceState(null, '', '#' + id);
        }
      }
    }
    var fsPlaceholder = null;
    var fsTimer = null;
    var fsOrigNext = null;
    var sub = document.getElementById('council-sub');
    var subGap = document.querySelector('.council-sub-gap');
    var subRevealTimer = null;
    var PIN_POS = [
      [172, 36],
      [150, 58],
      [122, 78],
      [148, 118],
      [96, 150],
      [48, 150],
      [20, 152],
      [96, 202],
      [100, 236],
      [118, 300]
    ];

    function subText(panel, sel) {
      var el = panel.querySelector(sel);
      return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
    }
    function splitHeading(full, shortName) {
      var words = full.split(/\s+/).filter(Boolean);
      if (!words.length) return ['', shortName || ''];
      if (words.length === 1) {
        return [words[0], shortName && shortName !== words[0] ? shortName : ''];
      }
      var best = 1;
      var i;
      for (i = 1; i < words.length; i++) {
        var a = words.slice(0, i).join(' ');
        var b = words.slice(i).join(' ');
        if (a.length <= b.length) best = i;
      }
      var line1 = words.slice(0, best).join(' ');
      var line2 = words.slice(best).join(' ');
      if (line1.length <= 18 && line2.length <= 18) return [line1, line2];
      var phrase = words.slice(0, 2).join(' ').replace(/[,:]+$/, '');
      if (phrase.length > 18) phrase = words[0].replace(/[,:]+$/, '');
      return [phrase, shortName || line2];
    }
    function splitDesc(desc) {
      var sentences = desc.split(/(?<=\.)\s+/).filter(Boolean);
      if (sentences.length >= 2) {
        return [sentences[0], sentences.slice(1).join(' ')];
      }
      return [desc, ''];
    }
    function coordsFor(index) {
      var lat = 62.0919277 + ((index % 5) - 2) * 0.0371842;
      var lng = -(6.932373 + ((index % 4) - 1) * 0.081226);
      return [Math.abs(lat).toFixed(7) + ' N', Math.abs(lng).toFixed(7) + ' W'];
    }
    function placeMapMarks(index) {
      if (!sub) return;
      var focus = (index + 4) % PIN_POS.length;
      sub.querySelectorAll('[data-island]').forEach(function (island, i) {
        island.setAttribute('fill', i === focus ? '#8a8a8a' : '#d2d2d2');
      });
      var pin = sub.querySelector('.council-sub-pin');
      if (pin) {
        var p = PIN_POS[focus];
        pin.setAttribute('transform', 'translate(' + p[0] + ' ' + (p[1] - 26) + ')');
      }
      var planes = sub.querySelectorAll('[data-plane]');
      var preferred = [0, 3, 5, 9, 1, 8];
      var used = 0;
      var step = 0;
      while (used < planes.length && step < preferred.length) {
        var spotIndex = preferred[step];
        step += 1;
        if (spotIndex === focus) continue;
        var spot = PIN_POS[spotIndex];
        planes[used].setAttribute('transform', 'translate(' + (spot[0] - 6) + ' ' + (spot[1] - 3) + ')');
        used += 1;
      }
    }
    function fillSub(panel) {
      if (!sub || !panel) return;
      var img = panel.querySelector('.council-acc-photo img');
      var src = img && img.getAttribute('src');
      if (src) sub.style.setProperty('--council-sub-photo', 'url("' + src + '")');
    }
    function hideSub() {
      window.clearTimeout(subRevealTimer);
      subRevealTimer = null;
      if (window.scrollY) window.scrollTo(0, 0);
      document.documentElement.classList.remove('council-sub-on');
      if (sub) {
        sub.classList.remove('is-in');
        sub.hidden = true;
      }
      if (subGap) subGap.hidden = true;
    }
    function revealSubBelow() {
      if (!isFsOpen || !sub) return;
      var panel = panels[activeIndex];
      if (!panel) return;
      panel.style.position = 'absolute';
      panel.style.top = '0px';
      panel.style.left = '0px';
      panel.style.width = '100%';
      panel.style.height = '100vh';
      panel.style.height = '100dvh';
      panel.style.zIndex = '900';
      if (subGap) subGap.hidden = false;
      sub.hidden = false;
      document.documentElement.classList.add('council-sub-on');
    }

    function clearFsStyles(panel) {
      panel.style.left = '';
      panel.style.width = '';
      panel.style.top = '';
      panel.style.height = '';
      panel.style.right = '';
      panel.style.bottom = '';
      panel.style.margin = '';
      panel.style.transition = '';
      panel.style.flex = '';
      panel.style.minWidth = '';
      panel.classList.remove('is-open', 'is-fs-animating', 'is-fs-closing');
    }
    function removePlaceholder() {
      if (fsPlaceholder && fsPlaceholder.parentNode) {
        fsPlaceholder.parentNode.removeChild(fsPlaceholder);
      }
      fsPlaceholder = null;
      fsOrigNext = null;
    }
    function restorePanelToTrack(panel) {
      if (fsPlaceholder && fsPlaceholder.parentNode) {
        fsPlaceholder.parentNode.insertBefore(panel, fsPlaceholder);
        fsPlaceholder.parentNode.removeChild(fsPlaceholder);
      } else if (fsOrigNext && fsOrigNext.parentNode === track) {
        track.insertBefore(panel, fsOrigNext);
      } else {
        track.appendChild(panel);
      }
      fsPlaceholder = null;
      fsOrigNext = null;
    }
    function expandedPx() {
      var raw = window.getComputedStyle(track).getPropertyValue('--cacc-expanded').trim();
      if (raw.indexOf('vw') !== -1) return window.innerWidth * parseFloat(raw) / 100;
      var n = parseFloat(raw);
      return n > 0 ? n : 0;
    }

    function pinPanel(panel, rect) {
      panel.style.position = 'fixed';
      panel.style.top = '0px';
      panel.style.left = rect.left + 'px';
      panel.style.width = rect.width + 'px';
      panel.style.height = '100vh';
      panel.style.height = '100dvh';
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
      panel.style.zIndex = '900';
      panel.style.margin = '0';
      panel.style.flex = 'none';
      panel.style.minWidth = '0';
      panel.style.maxWidth = 'none';
    }
    function openFullscreen(index) {
      if (isFsOpen) return;

      window.clearTimeout(fsTimer);
      var next = ((index % panels.length) + panels.length) % panels.length;
      var panel = panels[next];

      // Measure BEFORE layout / reparent so expand starts from the real tile
      var rect = panel.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      setActive(next, { updateHash: true, instant: true });
      isFsOpen = true;
      root.classList.add('is-fs-open');
      document.documentElement.classList.add('council-fs-open');
      panel.classList.add('is-open');
      panel.classList.add('is-active');

      // Spacer keeps track layout; reparent out of transformed track
      // (transform on ancestors breaks position:fixed vs the viewport)
      removePlaceholder();
      fsOrigNext = panel.nextSibling;
      fsPlaceholder = document.createElement('div');
      fsPlaceholder.className = 'council-acc-fs-spacer';
      fsPlaceholder.setAttribute('aria-hidden', 'true');
      var slot = Math.max(rect.width, expandedPx());
      fsPlaceholder.style.cssText =
        'flex:0 0 ' + slot + 'px;' +
        'width:' + slot + 'px;' +
        'min-width:' + slot + 'px;' +
        'height:100%;' +
        'pointer-events:none;' +
        'visibility:hidden;';
      panel.parentNode.insertBefore(fsPlaceholder, panel);

      // Body = true viewport fixed (track transform + workspace stacking both break cover)
      document.body.appendChild(panel);
      pinPanel(panel, rect);
      panel.style.transition = 'none';
      void panel.offsetWidth;
      fillSub(panel);

      window.requestAnimationFrame(function () {

        window.requestAnimationFrame(function () {
          panel.classList.add('is-fs-animating');
          var w = window.innerWidth + 'px';
          if (!reduceMotion) {
            panel.style.transition =
              'left ' + (OPEN_MS / 1000) + 's ' + OPEN_EASE + ',' +
              'width ' + (OPEN_MS / 1000) + 's ' + OPEN_EASE;
          }
          panel.style.left = '0px';
          panel.style.width = w;
        });
      });
      window.clearTimeout(subRevealTimer);
      subRevealTimer = window.setTimeout(revealSubBelow, reduceMotion ? 0 : OPEN_MS);
    }
    function closeFullscreen() {
      if (!isFsOpen) return;

      window.clearTimeout(fsTimer);
      var panel = panels[activeIndex];
      hideSub();
      panel.style.position = 'fixed';
      panel.style.top = '0px';
      panel.style.left = '0px';
      panel.style.width = window.innerWidth + 'px';
      panel.style.height = '100vh';
      panel.style.height = '100dvh';
      panel.style.zIndex = '900';
      panel.classList.remove('is-hot', 'is-fs-animating');
      panel.classList.add('is-fs-closing');

      // Land on the expanded tile, not a thinner leftover slot
      var slot = expandedPx();
      if (fsPlaceholder && slot > 0) {
        fsPlaceholder.style.flex = '0 0 ' + slot + 'px';
        fsPlaceholder.style.width = slot + 'px';
        fsPlaceholder.style.minWidth = slot + 'px';
      }
      var spacer = fsPlaceholder;
      var targetRect = spacer
        ? spacer.getBoundingClientRect()
        : { left: 0, width: slot || panel.offsetWidth || 200 };

      root.classList.remove('is-fs-open');
      var closeTime = reduceMotion ? 'none' : 'left ' + (CLOSE_MS / 1000) + 's ' + CLOSE_EASE + ',width ' + (CLOSE_MS / 1000) + 's ' + CLOSE_EASE;
      panel.style.transition = 'none';
      void panel.offsetWidth;
      panel.style.transition = closeTime;
      window.requestAnimationFrame(function () {
        panel.style.left = targetRect.left + 'px';
        panel.style.width = Math.max(targetRect.width, slot) + 'px';
      });
      fsTimer = window.setTimeout(function () {
        panel.classList.add('is-settling');
        restorePanelToTrack(panel);
        clearFsStyles(panel);
        panel.style.transition = 'none';
        panel.style.position = '';
        panel.style.zIndex = '';
        panel.style.transform = 'none';
        document.documentElement.classList.remove('council-fs-open');
        isFsOpen = false;
        ensureVisible(activeIndex);
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(function () {
            panel.style.transition = '';
            panel.style.transform = '';
            panel.classList.remove('is-settling');
          });
        });
      }, reduceMotion ? 0 : CLOSE_MS);
    }
    function go(delta) {
      if (isFsOpen) {

        window.clearTimeout(fsTimer);
        hideSub();
        var panel = panels[activeIndex];
        clearFsStyles(panel);
        panel.style.position = '';
        panel.style.zIndex = '';
        restorePanelToTrack(panel);
        isFsOpen = false;
        root.classList.remove('is-fs-open');
        document.documentElement.classList.remove('council-fs-open');
        openFullscreen(activeIndex + delta);
      } else {
        setActive(activeIndex + delta);
      }
    }
    panels.forEach(function (panel, index) {
      panel.addEventListener('click', function (e) {
        if (e.target.closest('.council-acc-close')) return;
        if (viewport.dataset.suppressClick === '1') return;
        if (isFsOpen) return;
        openFullscreen(index);
      });
      panel.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          if (!isFsOpen) openFullscreen(index);
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          go(1);
        } else if (event.key === 'ArrowLeft') {
          event.preventDefault();
          go(-1);
        }
      });
      if (hoverMedia.matches) {
        panel.addEventListener('pointerenter', function () {
          if (drag || isFsOpen) return;
          setActive(index, { updateHash: false });
          panel.classList.add('is-hot');
        });
        panel.addEventListener('pointerleave', function () {
          panel.classList.remove('is-hot');
        });
      }
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeFullscreen();
    });
    if (prevBtn) {
      prevBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        go(-1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        go(1);
      });
    }
    dots.forEach(function (dot) {
      dot.addEventListener('click', function (e) {
        e.stopPropagation();
        var target = parseInt(dot.getAttribute('data-target'), 10);
        if (isNaN(target)) return;
        if (isFsOpen) {

          window.clearTimeout(fsTimer);
          hideSub();
          var panel = panels[activeIndex];
          clearFsStyles(panel);
          panel.style.position = '';
          panel.style.zIndex = '';
          restorePanelToTrack(panel);
          isFsOpen = false;
          root.classList.remove('is-fs-open');
          document.documentElement.classList.remove('council-fs-open');
          openFullscreen(target);
        } else {
          setActive(target);
        }
      });
    });

    function onPointerDown(event) {
      if (isFsOpen) return;
      if (event.button != null && event.button !== 0) return;
      if (event.target.closest('.council-acc-controls')) return;
      if (event.target.closest('.council-acc-close')) return;
      drag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        lastX: event.clientX,
        lastT: performance.now(),
        velocity: 0,
        origin: offsetX,
        moved: false
      };
    }
    function onPointerMove(event) {
      if (!drag || event.pointerId !== drag.pointerId) return;
      var now = performance.now();
      var dx = event.clientX - drag.startX;
      var dt = Math.max(1, now - drag.lastT);
      drag.velocity = ((event.clientX - drag.lastX) / dt) * 16;
      drag.lastX = event.clientX;
      drag.lastT = now;
      if (Math.abs(dx) > 12) {
        if (!drag.moved) {
          drag.moved = true;
          viewport.classList.add('is-dragging');
          try {
            viewport.setPointerCapture(event.pointerId);
          } catch (err) {}
        }
        applyOffset(drag.origin + dx, false);
      }
    }
    function onPointerUp(event) {
      if (!drag || event.pointerId !== drag.pointerId) return;
      var moved = drag.moved;
      var dx = event.clientX - drag.startX;
      var velocity = drag.velocity;
      drag = null;
      viewport.classList.remove('is-dragging');

      // Only suppress click when this was a real swipe
      if (moved && (Math.abs(dx) > 70 || Math.abs(velocity) > 1.2)) {
        viewport.dataset.suppressClick = '1';

        window.setTimeout(function () {
          delete viewport.dataset.suppressClick;
        }, 100);
        go(dx < 0 || velocity < 0 ? 1 : -1);
      } else if (moved) {

        // Soft settle with leftover momentum
        applyOffset(offsetX + velocity * 18, true);
        ensureVisible(activeIndex);
      } else {
        applyOffset(offsetX, true);
      }
    }
    viewport.addEventListener('pointerdown', onPointerDown);
    viewport.addEventListener('pointermove', onPointerMove);
    viewport.addEventListener('pointerup', onPointerUp);
    viewport.addEventListener('pointercancel', onPointerUp);
    var wheelLock = false;
    viewport.addEventListener(
      'wheel',
      function (event) {
        if (isFsOpen || wheelLock) return;
        var dominant = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
        if (Math.abs(dominant) < 28) return;
        wheelLock = true;
        go(dominant > 0 ? 1 : -1);

        window.setTimeout(function () {
          wheelLock = false;
        }, TRANSITION_MS);
      },
      { passive: true }
    );

    window.addEventListener('resize', function () {
      if (!isFsOpen) ensureVisible(activeIndex);
    });

    function fromHash() {
      var hash = (location.hash || '').replace(/^#/, '');
      if (!hash) return;
      var el = document.getElementById(hash);
      if (!el) return;
      var idx = panels.indexOf(el);
      if (idx < 0) return;
      setActive(idx, { updateHash: false, instant: true });
    }
    setActive(activeIndex, { updateHash: false, instant: true });
    fromHash();

    window.addEventListener('hashchange', fromHash);

    window.__councilAccGo = setActive;

    window.__councilAccOpen = openFullscreen;

    window.__councilAccClose = closeFullscreen;
  }
  function boot() {
    initCouncilAccordion();
  }
  window.__bmunAfterBook = boot;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {

      window.setTimeout(boot, 50);
    });
  } else {

    window.setTimeout(boot, 50);
  }
})();
