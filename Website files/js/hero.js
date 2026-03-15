/**
 * hero.js — Rotating headline animation
 * Staffer.pl Marketing Site
 */

(function () {
  'use strict';

  var ROTATE_INTERVAL = 3000;

  function initRotatingHeadline() {
    var container = document.querySelector('.rotating-words');
    if (!container) return;

    var words = container.querySelectorAll('.rotating-word');
    if (words.length < 2) return;

    var prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    var currentIndex = 0;
    words[0].classList.add('is-active');

    if (prefersReducedMotion) {
      // Still rotate text, just skip animation
      setInterval(function () {
        words[currentIndex].classList.remove('is-active');
        currentIndex = (currentIndex + 1) % words.length;
        words[currentIndex].classList.add('is-active');
      }, ROTATE_INTERVAL);
      return;
    }

    setInterval(function () {
      var current = words[currentIndex];
      current.classList.remove('is-active');
      current.classList.add('is-exiting');

      var nextIndex = (currentIndex + 1) % words.length;
      var next = words[nextIndex];

      setTimeout(function () {
        current.classList.remove('is-exiting');
        next.classList.add('is-active');
        currentIndex = nextIndex;
      }, 400);
    }, ROTATE_INTERVAL);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initRotatingHeadline();
  });
})();
