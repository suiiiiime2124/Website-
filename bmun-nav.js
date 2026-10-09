/* BMUN mobile nav — burger menu, flat links on small screens (no dropdowns) */
(function () {
  'use strict';

  var MOBILE_MQ = window.matchMedia('(max-width: 860px)');

  function init() {
    var header = document.getElementById('site-header') || document.querySelector('.header-container');
    var burger = document.getElementById('nav-burger');
    if (!header || !burger) return;

    function setOpen(open) {
      header.classList.toggle('menu-open', open);
      document.body.classList.toggle('nav-menu-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function closeMenu() {
      setOpen(false);
      header.querySelectorAll('.nav-dd').forEach(function (dd) {
        dd.classList.remove('is-open');
        var trigger = dd.querySelector('.nav-dd-trigger');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      });
    }

    burger.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(!header.classList.contains('menu-open'));
    });

    document.addEventListener('click', function (e) {
      if (!header.classList.contains('menu-open')) return;
      if (!header.contains(e.target)) closeMenu();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    MOBILE_MQ.addEventListener('change', function () {
      if (!MOBILE_MQ.matches) closeMenu();
    });

    header.querySelectorAll('.nav-item, .register-bubble').forEach(function (link) {
      link.addEventListener('click', function () {
        if (!MOBILE_MQ.matches) return;
        closeMenu();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
