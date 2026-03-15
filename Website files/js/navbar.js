/**
 * navbar.js — Scroll glass effect & mobile menu toggle
 * Staffer.pl Marketing Site
 */

(function () {
  'use strict';

  var SCROLL_THRESHOLD = 20;

  function initNavbarScroll() {
    var navbar = document.querySelector('.navbar');
    if (!navbar) return;

    var ticking = false;

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          if (window.scrollY > SCROLL_THRESHOLD) {
            navbar.classList.add('is-scrolled');
          } else {
            navbar.classList.remove('is-scrolled');
          }
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initMobileMenu() {
    var toggle = document.querySelector('.navbar-toggle');
    var menu = document.querySelector('.navbar-mobile-menu');
    if (!toggle || !menu) return;

    var isOpen = false;

    function openMenu() {
      isOpen = true;
      menu.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
    }

    function closeMenu() {
      isOpen = false;
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', function () {
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('click', function (e) {
      if (isOpen && !toggle.contains(e.target) && !menu.contains(e.target)) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) {
        closeMenu();
        toggle.focus();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNavbarScroll();
    initMobileMenu();
  });
})();
