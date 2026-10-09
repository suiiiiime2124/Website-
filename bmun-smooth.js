/* BMUN smooth layout — zoom/resize without visual redesign */
(function (global) {
  'use strict';

  var root = document.documentElement;
  var header = null;
  var ticking = false;

  function measure() {
    ticking = false;
    if (!header) {
      header = document.getElementById('site-header') || document.querySelector('.header-container');
    }
    var vv = global.visualViewport;
    var layoutW = global.innerWidth || root.clientWidth || 0;
    var layoutH = global.innerHeight || root.clientHeight || 0;
    var vvW = vv && vv.width ? vv.width : layoutW;
    var vvH = vv && vv.height ? vv.height : layoutH;
    var scale = vv && vv.scale ? vv.scale : 1;

    root.style.setProperty('--vv-width', vvW + 'px');
    root.style.setProperty('--vv-height', vvH + 'px');
    root.style.setProperty('--vv-scale', String(scale));
    root.style.setProperty('--layout-width', layoutW + 'px');
    root.style.setProperty('--layout-height', layoutH + 'px');

    if (header) {
      var rect = header.getBoundingClientRect();
      var buffer = layoutW <= 860 ? 28 : 44;
      var offset = Math.max(rect.bottom, 0) + buffer;
      root.style.setProperty('--header-offset', offset + 'px');
    }
  }

  function requestMeasure() {
    if (ticking) return;
    ticking = true;
    global.requestAnimationFrame(measure);
  }

  function bind() {
    measure();
    global.addEventListener('resize', requestMeasure, { passive: true });
    global.addEventListener('orientationchange', requestMeasure, { passive: true });
    if (global.visualViewport) {
      global.visualViewport.addEventListener('resize', requestMeasure, { passive: true });
      global.visualViewport.addEventListener('scroll', requestMeasure, { passive: true });
    }
    global.addEventListener('load', requestMeasure, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})(typeof window !== 'undefined' ? window : this);
