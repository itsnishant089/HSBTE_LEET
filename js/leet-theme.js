/**
 * leet-theme.js — scroll reveal, 3D hover tilt and the floating 3D chips on the Premium/Ultra plans page.
 * Works together with css/leet-theme.css (body.leet-themed). Safe to fail: pages still render normally.
 */
(function () {
  'use strict';
  if (!document.body.classList.contains('leet-themed')) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
  var hover = window.matchMedia && matchMedia('(hover:hover)').matches;

  var REVEAL = '.content-card,.sample-card,.sample-paper-card,.adm-card,.dh-card,.lp-card,.hl-card,.guide-card,.seat-card,.btech-card,.syllabus-card,.doc-item-card,.leet-quick-card,.ch-card,.feat-card,.resource-link-card,.seo-related-card,.tier-card,.paper-card,.review-card';
  var TILT = '.sample-card,.sample-paper-card,.btech-card,.doc-item-card,.leet-quick-card,.ch-card,.feat-card,.resource-link-card,.tier-card,.seo-related-card';

  function init() {
    var cards = document.querySelectorAll(REVEAL);
    if ('IntersectionObserver' in window && !reduce) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('lt-in'); io.unobserve(e.target); } });
      }, { threshold: .08, rootMargin: '0px 0px -30px 0px' });
      cards.forEach(function (c, i) { c.classList.add('lt-rev'); c.style.transitionDelay = (i % 4) * 60 + 'ms'; io.observe(c); });
    }
    if (hover && !reduce) {
      document.querySelectorAll(TILT).forEach(function (c) {
        c.classList.add('lt-tilt');
        c.addEventListener('mousemove', function (e) {
          var r = c.getBoundingClientRect();
          c.style.setProperty('--ry', (((e.clientX - r.left) / r.width - .5) * 9).toFixed(2) + 'deg');
          c.style.setProperty('--rx', (-((e.clientY - r.top) / r.height - .5) * 9).toFixed(2) + 'deg');
        });
        c.addEventListener('mouseleave', function () { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
      });
    }
    // plans page: floating 3D chips under the hero buttons
    var btn = document.querySelector('section.hero .btn-hero');
    if (btn && !document.querySelector('.lt-float3d')) {
      var host = btn.parentElement;
      host.insertAdjacentHTML('afterend',
        '<div class="lt-float3d" aria-hidden="true">' +
        '<div class="c"><i>👑</i><b>₹69</b><span>Premium · 54 papers</span></div>' +
        '<div class="c"><i>🚀</i><b>₹99</b><span>Ultra · AI tools + book ₹299</span></div>' +
        '<div class="c"><i>🎯</i><b>50% off</b><span>Counselling for members</span></div></div>');
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
