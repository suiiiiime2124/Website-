/* BMUN petal-bloom text — play once per section, never reset */
(function (global) {
  'use strict';

  var EXCLUDE =
    '#bmun-page-transition, .bmun-page-transition, .header-container, ' +
    '.nav-pill-right, .nav-dd, .register-bubble, .brand-left, [data-text-animate-skip], ' +
    '.slider-content, .reveal-inner, .noise, #slider-workspace, .slider-item, .slider-list, ' +
    '.role-desc-block, .role-points, .role-instructions-label';

  var CHAR_SEL =
    'h1:not(.hero-brand-title), h2, h3, h4, .display, .massive-display, .section-label, .eyebrow, ' +
    '.eyebrow-briefing, .role-section-tag, .role-huge-header, .benefits-title, ' +
    '.contact-heading, .slide-title, .faq-heading, .tile-header, .gallery-bento-label, ' +
    '.sec-core-title, .journey-title, .journey-label, .journey-num';

  var WORD_SEL =
    'p, li, label, .subtext, .hero-subtext, .hero-brand-subtext, .section-tag, .topic-label, ' +
    '.benefit-label, .slide-desc, .council-level, .council-number, ' +
    '.footer-location-title, .footer-brand-title, .footer-power-text, ' +
    '.footer-copyright, .footer-nav-links a, .footer-contact-list a, ' +
    '.footer-location-text, .tile-top-label, .tile-footer-action, ' +
    '.hero-btn, .question, .answer, .role-meta, .role-desc, .detail-line, .gallery-bento-sub, ' +
    '.sec-core-bubble';

  var SECTION_FALLBACK =
    '#home, #journey, #faq, #footer, .journey-bento, .photo-hero, .gallery-section, ' +
    '.roles-matte-section, .gallery-archive > section, ' +
    '.secretariat-hero, .secretariat-blank, .secretariat-org, .secretariat-coming-soon, #detailsScreen, .details-layout, ' +
    '#faq, #footer, footer.bmun-footer, #info-top, #roles, ' +
    '.landing-screen, .details-screen, ' +
    '.contact-section, .benefits-section, .faq-section, ' +
    '.main-content-wrapper, .info-panel, .contact-form-section, ' +
    'body > section, body > footer, body > main > section';

  function isExcluded(el) {
    return !el || !el.closest || !!el.closest(EXCLUDE);
  }

  function collectRoots() {
    var list = [];
    var nodes = document.querySelectorAll(SECTION_FALLBACK);
    nodes.forEach(function (el) {
      if (!el || isExcluded(el)) return;
      var nested = list.some(function (other) {
        return other !== el && other.contains(el);
      });
      if (nested) return;
      list.push(el);
    });
    if (!list.length) list.push(document.body);
    return list;
  }

  function markUnit(el) {
    if (!el || el.dataset.bloomSplit === '1' || isExcluded(el)) return;
    el.classList.add('bloom-host', 'bloom-unit');
    el.style.setProperty('--i', '0');
    el.dataset.bloomSplit = '1';
  }

  function splitBloom(el, mode) {
    if (!el || el.dataset.bloomSplit === '1' || isExcluded(el)) return;

    var complex = el.querySelector(
      'img, svg, video, iframe, input, textarea, select, button, a, ' +
      '.material-symbols-outlined, i.fas, i.fa, i.fab, .nav-ico, .journey-icon, .tile-role-art'
    );
    if (complex) {
      markUnit(el);
      return;
    }

    var raw = el.textContent;
    if (!raw || !String(raw).trim()) return;

    el.setAttribute('aria-label', String(raw).replace(/\s+/g, ' ').trim());
    el.textContent = '';
    el.classList.add('bloom-host', 'bloom-split');
    el.dataset.bloomSplit = '1';

    var idx = 0;
    var useChars = mode === 'char';
    var parts = String(raw).split(/(\s+)/);
    var maxI = useChars ? 28 : 18;

    parts.forEach(function (part) {
      if (!part) return;
      if (/^\s+$/.test(part)) {
        el.appendChild(document.createTextNode(part));
        return;
      }
      if (useChars) {
        var word = document.createElement('span');
        word.className = 'bloom-word';
        Array.prototype.forEach.call(Array.from(part), function (ch) {
          var span = document.createElement('span');
          span.className = 'bloom-char';
          span.style.setProperty('--i', String(Math.min(idx, maxI)));
          idx += 1;
          span.textContent = ch;
          word.appendChild(span);
        });
        el.appendChild(word);
      } else {
        var w = document.createElement('span');
        w.className = 'bloom-char bloom-word';
        w.style.setProperty('--i', String(Math.min(idx, maxI)));
        idx += 1;
        w.textContent = part;
        el.appendChild(w);
      }
    });
  }

  function prepare(root) {
    if (!root || root.dataset.bloomReady === '1') return;

    root.querySelectorAll('.hero-brand-title').forEach(function (el) {
      if (isExcluded(el)) return;
      if (!el.classList.contains('animate-overshoot') && !el.classList.contains('animate-fade-up')) {
        el.classList.add('animate-overshoot');
      }
      markUnit(el);
    });

    root.querySelectorAll(CHAR_SEL).forEach(function (el) {
      if (isExcluded(el)) return;
      if (!el.classList.contains('animate-overshoot') && !el.classList.contains('animate-fade-up')) {
        el.classList.add('animate-overshoot');
      }
      splitBloom(el, 'char');
    });

    root.querySelectorAll(WORD_SEL).forEach(function (el) {
      if (isExcluded(el)) return;
      if (el.closest(CHAR_SEL + ', .hero-brand-title')) return;
      if (!el.classList.contains('animate-overshoot') && !el.classList.contains('animate-fade-up')) {
        el.classList.add('animate-fade-up');
      }
      splitBloom(el, 'word');
    });

    root.querySelectorAll('.animate-overshoot, .animate-fade-up').forEach(function (el) {
      if (isExcluded(el) || el.dataset.bloomSplit === '1') return;
      if (el.querySelector('.bloom-char')) {
        el.classList.add('bloom-host');
        el.dataset.bloomSplit = '1';
        return;
      }
      markUnit(el);
    });

    root.dataset.bloomReady = '1';
  }

  function settleVisible(root) {
    if (!root) return;
    root.classList.remove('bloom-paused');
    root.querySelectorAll('.bloom-char, .bloom-unit').forEach(function (el) {
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.filter = 'none';
      el.style.animation = 'none';
      el.style.willChange = 'auto';
      el.classList.add('is-blooming');
    });
  }

  function play(root) {
    if (!root || root.dataset.bloomPlayed === '1') return;
    prepare(root);
    root.dataset.bloomPlayed = '1';

    root.classList.add('bloom-paused');
    var nodes = root.querySelectorAll('.bloom-host, .bloom-unit');
    nodes.forEach(function (el, i) {
      el.classList.remove('is-blooming');
      el.style.setProperty('--block-i', String(Math.min(i, 14)));
    });
    void root.offsetWidth;

    requestAnimationFrame(function () {
      root.classList.remove('bloom-paused');
      nodes.forEach(function (el) {
        el.classList.add('is-blooming');
      });
    });

    if (!root._bloomEndBound) {
      root._bloomEndBound = true;
      root.addEventListener('animationend', function (e) {
        var t = e.target;
        if (t && t.classList && (t.classList.contains('bloom-char') || t.classList.contains('bloom-unit'))) {
          t.style.willChange = 'auto';
          t.style.opacity = '1';
          t.style.transform = 'none';
          t.style.filter = 'none';
        }
      }, { passive: true });
    }
  }

  /* Keep API: replay only plays if this root never animated */
  function replay(root) {
    if (!root) return;
    if (root.dataset.bloomPlayed === '1') {
      settleVisible(root);
      return;
    }
    root.dataset.bloomReady = '';
    play(root);
  }

  function reset() {
    /* no-op — text bloom never resets */
  }

  var started = false;

  function start() {
    if (started) return;
    started = true;

    var roots = collectRoots();
    if (!('IntersectionObserver' in global)) {
      roots.forEach(play);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        play(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    roots.forEach(function (root) {
      io.observe(root);
    });
  }

  global.BMUNBloom = { start: start, play: play, reset: reset, prepare: prepare, replay: replay };

  function wrapAfterBook() {
    var prev = global.__bmunAfterBook;
    if (prev && prev._bloomWrapped) return;
    var wrapped = function () {
      if (typeof prev === 'function') prev();
      start();
    };
    wrapped._bloomWrapped = true;
    global.__bmunAfterBook = wrapped;
  }

  wrapAfterBook();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wrapAfterBook);
  }

  var tries = 0;
  var poll = setInterval(function () {
    tries += 1;
    wrapAfterBook();
    if (tries > 20 || (global.BMUNBloom && global.__bmunAfterBook && global.__bmunAfterBook._bloomWrapped)) {
      clearInterval(poll);
    }
  }, 200);

  global.addEventListener('load', function () {
    wrapAfterBook();
    setTimeout(function () {
      var t = document.getElementById('bmun-page-transition');
      if (!t || !t.classList.contains('is-active')) start();
      else setTimeout(start, 6500);
    }, 120);
  });
})(typeof window !== 'undefined' ? window : this);
