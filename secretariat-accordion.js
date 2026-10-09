(function () {
  'use strict';

  var ACCORDION_SELECTOR = '[data-sec-accordion]';
  var PANEL_SELECTOR = '[data-sec-acc-panel]';
  var AUTO_CYCLE_MS = 4800;
  var AUTO_RESTART_MS = 20000;
  var HOVER_LEAVE_DELAY_MS = 160;
  var TRANSITION_MS = 380;
  var hasGsap = typeof window.gsap !== 'undefined';

  var hoverMedia = window.matchMedia('(hover: hover) and (pointer: fine)');

  function initAccordion(root) {
    if (!root || root.dataset.secAccordionInit === '1') return;
    root.dataset.secAccordionInit = '1';

    var panels = Array.prototype.slice.call(root.querySelectorAll(PANEL_SELECTOR));
    if (!panels.length) return;

    var activeIndex = panels.findIndex(function (panel) {
      return panel.classList.contains('is-active');
    });
    if (activeIndex < 0) activeIndex = 0;

    var cycleTimer = null;
    var restartTimer = null;
    var leaveTimer = null;
    var animTimer = null;
    var hoverMode = hoverMedia.matches;
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var autoEnabled =
      root.dataset.secAccordionAutoplay !== 'false' &&
      !prefersReducedMotion &&
      !hoverMode;

    if (hoverMode) {
      root.classList.add('sec-accordion--hover');
    }
    if (hasGsap && !prefersReducedMotion) {
      root.classList.add('sec-accordion--gsap');
    }

    function markAnimating() {
      if (prefersReducedMotion) return;
      root.classList.add('is-animating');
      if (animTimer) clearTimeout(animTimer);
      animTimer = setTimeout(function () {
        root.classList.remove('is-animating');
      }, TRANSITION_MS + 40);
    }

    function animateCopy(panel, isActive, instant) {
      var nameplate = panel.querySelector('.sec-acc-nameplate');
      var person = panel.querySelector('.sec-acc-person');
      if (!hasGsap || prefersReducedMotion) return;

      var duration = instant ? 0 : 0.32;
      gsap.killTweensOf([nameplate, person].filter(Boolean));

      if (nameplate) {
        gsap.to(nameplate, {
          rotation: isActive ? 0 : 90,
          x: isActive ? 0 : -22,
          duration: duration,
          ease: 'power2.out',
          force3D: true,
          overwrite: 'auto'
        });
      }

      if (person) {
        if (isActive) {
          gsap.to(person, {
            opacity: 1,
            y: 0,
            duration: instant ? 0 : 0.35,
            delay: instant ? 0 : 0.14,
            ease: 'power2.out',
            force3D: true,
            overwrite: 'auto',
            onStart: function () {
              person.style.visibility = 'visible';
              person.style.maxHeight = '2.5em';
            }
          });
        } else {
          gsap.to(person, {
            opacity: 0,
            y: 8,
            duration: instant ? 0 : 0.18,
            ease: 'power1.in',
            force3D: true,
            overwrite: 'auto',
            onComplete: function () {
              if (!panel.classList.contains('is-active')) {
                person.style.visibility = 'hidden';
                person.style.maxHeight = '0';
              }
            }
          });
        }
      }
    }

    function setCopyInitial(panel, isActive) {
      var nameplate = panel.querySelector('.sec-acc-nameplate');
      var person = panel.querySelector('.sec-acc-person');
      if (!hasGsap) return;

      if (nameplate) {
        gsap.set(nameplate, {
          rotation: isActive ? 0 : 90,
          x: isActive ? 0 : -22,
          transformOrigin: 'center center',
          force3D: true
        });
      }
      if (person) {
        gsap.set(person, {
          opacity: isActive ? 1 : 0,
          y: isActive ? 0 : 8
        });
        person.style.visibility = isActive ? 'visible' : 'hidden';
        person.style.maxHeight = isActive ? '2.5em' : '0';
      }
    }

    function setActive(index, focusPanel, instant) {
      var next = ((index % panels.length) + panels.length) % panels.length;
      if (next === activeIndex && !instant) return;
      var prev = activeIndex;
      activeIndex = next;

      panels.forEach(function (panel, i) {
        var isActive = i === activeIndex;
        var wasActive = i === prev;
        panel.classList.toggle('is-active', isActive);
        panel.setAttribute('aria-expanded', isActive ? 'true' : 'false');
        panel.setAttribute('tabindex', isActive ? '0' : '-1');
        if (instant || isActive || wasActive) {
          animateCopy(panel, isActive, !!instant);
        }
      });

      markAnimating();
      if (focusPanel) panels[activeIndex].focus({ preventScroll: true });
    }

    function wake() {
      // After a hidden dept page becomes visible, re-assert active copy state
      setActive(activeIndex, false, true);
      markAnimating();
    }

    root.__secAccWake = wake;

    function stopCycle() {
      if (cycleTimer) {
        clearInterval(cycleTimer);
        cycleTimer = null;
      }
      if (restartTimer) {
        clearTimeout(restartTimer);
        restartTimer = null;
      }
    }

    function clearLeaveTimer() {
      if (leaveTimer) {
        clearTimeout(leaveTimer);
        leaveTimer = null;
      }
    }

    function startCycle() {
      if (!autoEnabled || panels.length < 2) return;
      if (hoverMode && root.matches(':hover')) return;
      stopCycle();
      cycleTimer = setInterval(function () {
        setActive(activeIndex + 1, false, false);
      }, AUTO_CYCLE_MS);
    }

    function scheduleRestart() {
      if (!autoEnabled) return;
      if (restartTimer) clearTimeout(restartTimer);
      restartTimer = setTimeout(startCycle, AUTO_RESTART_MS);
    }

    root.querySelectorAll('.sec-acc-cta').forEach(function (cta) {
      cta.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
      });
    });

    panels.forEach(function (panel, index) {
      panel.setAttribute('role', 'button');
      panel.setAttribute('tabindex', index === activeIndex ? '0' : '-1');
      panel.setAttribute('aria-expanded', index === activeIndex ? 'true' : 'false');
      setCopyInitial(panel, index === activeIndex);

      panel.addEventListener('click', function (event) {
        event.preventDefault();
        stopCycle();
        setActive(index, false, false);
        scheduleRestart();
      });

      panel.addEventListener('pointerup', function (event) {
        if (event.pointerType === 'touch') {
          stopCycle();
          setActive(index, false, false);
          scheduleRestart();
        }
      });

      panel.addEventListener('keydown', function (event) {
        var key = event.key;
        if (key !== 'Enter' && key !== ' ') return;
        event.preventDefault();
        stopCycle();
        setActive(index, false, false);
        scheduleRestart();
      });

      panel.addEventListener('focus', function () {
        panels.forEach(function (p, i) {
          p.setAttribute('tabindex', i === index ? '0' : '-1');
        });
      });

      if (hoverMode) {
        panel.addEventListener('pointerenter', function () {
          clearLeaveTimer();
          stopCycle();
          setActive(index, false, false);
        });
      }
    });

    if (hoverMode) {
      root.addEventListener('pointerenter', function () {
        clearLeaveTimer();
        stopCycle();
      });

      root.addEventListener('pointerleave', function () {
        clearLeaveTimer();
        leaveTimer = setTimeout(scheduleRestart, HOVER_LEAVE_DELAY_MS);
      });
    } else {
      root.addEventListener('mouseenter', stopCycle);
      root.addEventListener('mouseleave', scheduleRestart);
    }

    root.addEventListener('focusin', stopCycle);
    root.addEventListener('focusout', function (event) {
      if (!root.contains(event.relatedTarget)) scheduleRestart();
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopCycle();
      else scheduleRestart();
    });

    hoverMedia.addEventListener('change', function (event) {
      hoverMode = event.matches;
      root.classList.toggle('sec-accordion--hover', hoverMode);
      autoEnabled =
        root.dataset.secAccordionAutoplay !== 'false' &&
        !prefersReducedMotion &&
        !hoverMode;
      stopCycle();
      if (!hoverMode && autoEnabled) startCycle();
    });

    setActive(activeIndex, false, true);

    if (autoEnabled) {
      if (hoverMode) scheduleRestart();
      else startCycle();
    }
  }

  function boot() {
    document.querySelectorAll(ACCORDION_SELECTOR).forEach(initAccordion);
  }

  window.__secAccWake = function (root) {
    if (!root) {
      document.querySelectorAll(ACCORDION_SELECTOR).forEach(function (el) {
        if (typeof el.__secAccWake === 'function') el.__secAccWake();
      });
      return;
    }
    if (typeof root.__secAccWake === 'function') root.__secAccWake();
    else initAccordion(root);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
