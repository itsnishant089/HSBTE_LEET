/**
 * ads.js — Auto-injects Google AdSense ad units into qualifying pages.
 * Skips excluded pages (premium, sample papers, admin, etc.)
 *
 * AdSense Publisher ID: ca-pub-3142279668395491
 */

(function () {
  'use strict';

  // ─── EXCLUDED PAGES: no ads on these ────────────────────────────────
  const EXCLUDED_PATTERNS = [
    'premium',
    'sample-paper',
    'section-',
    'rank-analysis',
    'study-plan',
    'ultra-premium',
    'college-predictor',
    'admin',
  ];

  const currentPage = window.location.pathname;

  // Check if current page is excluded
  function isExcluded() {
    for (let i = 0; i < EXCLUDED_PATTERNS.length; i++) {
      if (currentPage.indexOf(EXCLUDED_PATTERNS[i]) !== -1) {
        return true;
      }
    }
    return false;
  }

  if (isExcluded()) return;

  // ─── LOAD ADSENSE LIBRARY (if not already loaded) ───────────────────
  if (!document.querySelector('script[src*="pagead2.googlesyndication.com"]')) {
    const adScript = document.createElement('script');
    adScript.async = true;
    adScript.crossOrigin = 'anonymous';
    adScript.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3142279668395491';
    document.head.appendChild(adScript);
  }

  // ─── HELPER: Create an ad unit ──────────────────────────────────────
  function createAdUnit(format, slot, layout, layoutKey) {
    const wrapper = document.createElement('div');
    wrapper.className = 'ad-container';
    wrapper.style.cssText = 'text-align:center;margin:12px auto;max-width:100%;overflow:hidden;clear:both;';

    // Small label
    const label = document.createElement('div');
    label.textContent = '— Advertisement —';
    label.style.cssText = 'font-size:0.7rem;color:#999;text-align:center;margin-bottom:4px;letter-spacing:0.5px;';
    wrapper.appendChild(label);

    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', 'ca-pub-3142279668395491');

    if (format === 'auto') {
      // Responsive display ad
      ins.setAttribute('data-ad-format', 'auto');
      ins.setAttribute('data-full-width-responsive', 'true');
      if (slot) ins.setAttribute('data-ad-slot', slot);
    } else if (format === 'infeed') {
      // In-feed ad
      ins.setAttribute('data-ad-format', 'fluid');
      ins.setAttribute('data-ad-layout-key', layoutKey || '-fb+5w+4e-db+86');
      if (slot) ins.setAttribute('data-ad-slot', slot);
    } else if (format === 'inarticle') {
      // In-article ad
      ins.setAttribute('data-ad-format', 'fluid');
      ins.setAttribute('data-ad-layout', 'in-article');
      ins.style.textAlign = 'center';
      if (slot) ins.setAttribute('data-ad-slot', slot);
    } else if (format === 'multiplex') {
      // Multiplex ad
      ins.setAttribute('data-ad-format', 'autorelaxed');
      if (slot) ins.setAttribute('data-ad-slot', slot);
    }

    wrapper.appendChild(ins);
    return wrapper;
  }

  // ─── HELPER: Push ad after inserting ────────────────────────────────
  function pushAd() {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // AdSense may not be ready yet; ignore
    }
  }

  // ─── INJECT ADS ON DOM READY ────────────────────────────────────────
  function injectAds() {
    const main = document.querySelector('main') || document.querySelector('#main-content');
    if (!main) return;

    const isIndex = currentPage === '/' || currentPage.endsWith('/index.html') || currentPage.endsWith('/index');

    // ─── Strategy 1: INDEX PAGE ─────────────────────────────────
    if (isIndex) {
      // Ad after hero section
      const heroSection = document.querySelector('.hero-section');
      if (heroSection) {
        const ad1 = createAdUnit('auto');
        heroSection.parentNode.insertBefore(ad1, heroSection.nextSibling);
        pushAd();
      }

      // Ad before FAQ section
      const faqSection = document.querySelector('.faq-section');
      if (faqSection) {
        const ad2 = createAdUnit('auto');
        faqSection.parentNode.insertBefore(ad2, faqSection);
        pushAd();
      }

      // Multiplex ad before footer
      const footer = document.querySelector('footer') || document.querySelector('[data-include*="footer"]');
      if (footer) {
        const ad3 = createAdUnit('multiplex');
        footer.parentNode.insertBefore(ad3, footer);
        pushAd();
      }
      return;
    }

    // ─── Strategy 2: CONTENT PAGES (html/ directory) ────────────
    const allChildren = main.children;

    // --- Top ad: after hero/heading area ---
    const pageHero = main.querySelector('.page-hero') || main.querySelector('.main-content-hsbte h1') || main.querySelector('h1');
    if (pageHero) {
      const heroParent = pageHero.closest('.page-hero') || pageHero.parentElement;
      if (heroParent && heroParent.parentNode) {
        const adTop = createAdUnit('auto');
        heroParent.parentNode.insertBefore(adTop, heroParent.nextSibling);
        pushAd();
      }
    }

    // --- Middle ad: in-article style between content sections ---
    // Find good injection points (sections, card grids, info sections, etc.)
    const contentSections = main.querySelectorAll(
      '.cards-wrap, .branch-info, .info-cards-grid, .tips-section, .computer-pyq-grid, .hsbte-grid, .resources-grid, .why-section, .popular-section, section, .computer-pyq > div'
    );

    if (contentSections.length >= 3) {
      // Place ad after ~40% of sections
      const midIndex = Math.floor(contentSections.length * 0.4);
      const midSection = contentSections[midIndex];
      if (midSection && midSection.parentNode) {
        const adMid = createAdUnit('inarticle');
        midSection.parentNode.insertBefore(adMid, midSection.nextSibling);
        pushAd();
      }
    }

    // --- Bottom ad: before footer ---
    const closingMain = main.querySelector('.computer-pyq') || main;
    const lastChild = closingMain.lastElementChild;
    if (lastChild) {
      const adBottom = createAdUnit('auto');
      closingMain.appendChild(adBottom);
      pushAd();
    }

    // --- Multiplex ad at very bottom (before footer) ---
    const footerIncl = document.querySelector('[data-include*="footer"]') || document.querySelector('footer');
    if (footerIncl && footerIncl.parentNode) {
      const adMulti = createAdUnit('multiplex');
      footerIncl.parentNode.insertBefore(adMulti, footerIncl);
      pushAd();
    }
  }

  // ─── WAIT FOR DOM + partials ────────────────────────────────────────
  // First try after DOMContentLoaded, then retry after partials load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      // Delay slightly to let partials/includes render
      setTimeout(injectAds, 1500);
    });
  } else {
    setTimeout(injectAds, 1500);
  }

})();
