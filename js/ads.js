/**
 * ads.js - Auto-injects Google AdSense ad units into qualifying pages.
 * Skips excluded pages (premium, sample papers, admin, etc.).
 *
 * Important layout rule:
 * Never place auto ads directly before, inside, or after the footer. Unfilled
 * AdSense slots are also removed so they do not leave large blank gaps.
 *
 * AdSense Publisher ID: ca-pub-3142279668395491
 */

(function () {
  'use strict';

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
  let adsInjected = false;

  function isExcluded() {
    return EXCLUDED_PATTERNS.some(function (pattern) {
      return currentPage.indexOf(pattern) !== -1;
    });
  }

  function getFooterAnchor() {
    return document.querySelector('footer') || document.querySelector('[data-include*="footer"]');
  }

  function isInsideFooter(node) {
    return Boolean(node && node.closest && node.closest('footer, [data-include*="footer"]'));
  }

  function isFooterAdjacent(node) {
    const footer = getFooterAnchor();
    if (!node || !footer) return false;

    return node === footer || node.nextElementSibling === footer || node.previousElementSibling === footer;
  }

  function isFaqAdjacent(node) {
    if (!node) return false;

    return Boolean(
      (node.matches && node.matches('.faq-section, #faq')) ||
      (node.nextElementSibling && node.nextElementSibling.matches('.faq-section, #faq')) ||
      (node.previousElementSibling && node.previousElementSibling.matches('.faq-section, #faq'))
    );
  }

  function installFooterAdGuardStyles() {
    if (document.getElementById('footer-ad-guard-styles')) return;

    const style = document.createElement('style');
    style.id = 'footer-ad-guard-styles';
    style.textContent = [
      'footer .ad-container, footer .adsbygoogle, [data-include*="footer"] .ad-container, [data-include*="footer"] .adsbygoogle { display: none !important; height: 0 !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; }',
      '.ad-container.ad-empty { display: none !important; height: 0 !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; }',
    ].join('\n');

    (document.head || document.documentElement).appendChild(style);
  }

  function loadAdsense() {
    if (document.querySelector('script[src*="pagead2.googlesyndication.com"]')) return;

    const adScript = document.createElement('script');
    adScript.async = true;
    adScript.crossOrigin = 'anonymous';
    adScript.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3142279668395491';
    document.head.appendChild(adScript);
  }

  function removeAdUnit(wrapper) {
    if (!wrapper || !wrapper.isConnected) return;
    wrapper.classList.add('ad-empty');
    wrapper.remove();
  }

  function removeFooterAds() {
    document
      .querySelectorAll('footer .ad-container, footer .adsbygoogle, [data-include*="footer"] .ad-container, [data-include*="footer"] .adsbygoogle')
      .forEach(function (element) {
        removeAdUnit(element.closest('.ad-container') || element);
      });

    const footer = getFooterAnchor();
    if (!footer) return;

    [footer.previousElementSibling, footer.nextElementSibling].forEach(function (sibling) {
      if (sibling && sibling.matches('.ad-container, [data-auto-ad="true"], .adsbygoogle')) {
        removeAdUnit(sibling.closest('.ad-container') || sibling);
      }
    });
  }

  function startFooterAdGuard() {
    const runGuard = function () {
      removeFooterAds();

      if (window.MutationObserver && document.body && !window.__footerAdGuardStarted) {
        window.__footerAdGuardStarted = true;
        new MutationObserver(removeFooterAds).observe(document.body, {
          childList: true,
          subtree: true,
        });
      }

      [1500, 4000, 9000].forEach(function (delay) {
        window.setTimeout(removeFooterAds, delay);
      });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', runGuard, { once: true });
    } else {
      runGuard();
    }
  }

  installFooterAdGuardStyles();
  startFooterAdGuard();

  if (isExcluded()) return;

  function collapseUnfilledAd(wrapper) {
    if (!wrapper || !wrapper.isConnected) return;

    if (isInsideFooter(wrapper) || isFooterAdjacent(wrapper)) {
      removeAdUnit(wrapper);
      return;
    }

    const ins = wrapper.querySelector('.adsbygoogle');
    if (!ins) {
      removeAdUnit(wrapper);
      return;
    }

    const status = ins.getAttribute('data-ad-status');
    const hasIframe = Boolean(ins.querySelector('iframe'));

    if (status === 'unfilled' || (!hasIframe && status !== 'filled')) {
      removeAdUnit(wrapper);
    }
  }

  function scheduleEmptyAdCleanup(wrapper) {
    [6000, 12000, 20000].forEach(function (delay) {
      window.setTimeout(function () {
        collapseUnfilledAd(wrapper);
      }, delay);
    });
  }

  function createAdUnit(format, slot, layout, layoutKey) {
    const wrapper = document.createElement('div');
    wrapper.className = 'ad-container';
    wrapper.setAttribute('data-auto-ad', 'true');
    wrapper.style.cssText = 'text-align:center;margin:16px auto;max-width:100%;overflow:hidden;clear:both;min-height:0;';

    const label = document.createElement('div');
    label.textContent = 'Advertisement';
    label.style.cssText = 'font-size:0.7rem;color:#999;text-align:center;margin-bottom:4px;letter-spacing:0.5px;';
    wrapper.appendChild(label);

    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.cssText = 'display:block;min-height:0;';
    ins.setAttribute('data-ad-client', 'ca-pub-3142279668395491');

    if (format === 'auto') {
      ins.setAttribute('data-ad-format', 'auto');
      ins.setAttribute('data-full-width-responsive', 'true');
      if (slot) ins.setAttribute('data-ad-slot', slot);
    } else if (format === 'infeed') {
      ins.setAttribute('data-ad-format', 'fluid');
      ins.setAttribute('data-ad-layout-key', layoutKey || '-fb+5w+4e-db+86');
      if (slot) ins.setAttribute('data-ad-slot', slot);
    } else if (format === 'inarticle') {
      ins.setAttribute('data-ad-format', 'fluid');
      ins.setAttribute('data-ad-layout', layout || 'in-article');
      ins.style.textAlign = 'center';
      if (slot) ins.setAttribute('data-ad-slot', slot);
    }

    wrapper.appendChild(ins);
    scheduleEmptyAdCleanup(wrapper);
    return wrapper;
  }

  function pushAd() {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // AdSense may not be ready yet.
    }
  }

  function insertAdAfter(anchor, ad) {
    if (!anchor || !anchor.parentNode || !ad || isInsideFooter(anchor)) return false;

    const footer = getFooterAnchor();
    if (anchor === footer || (footer && anchor.contains && anchor.contains(footer))) return false;

    anchor.parentNode.insertBefore(ad, anchor.nextSibling);

    if (isInsideFooter(ad) || isFooterAdjacent(ad) || isFaqAdjacent(ad)) {
      removeAdUnit(ad);
      return false;
    }

    pushAd();
    return true;
  }

  function injectAds() {
    if (adsInjected) return;
    adsInjected = true;

    loadAdsense();

    const main = document.querySelector('main') || document.querySelector('#main-content');
    if (!main) return;

    const isIndex = currentPage === '/' || currentPage.endsWith('/index.html') || currentPage.endsWith('/index');

    if (isIndex) {
      const heroSection = document.querySelector('.hero-section');
      if (heroSection) {
        insertAdAfter(heroSection, createAdUnit('auto'));
      }
      return;
    }

    const pageHero = main.querySelector('.page-hero') ||
      main.querySelector('.main-content-hsbte h1') ||
      main.querySelector('h1');

    if (pageHero) {
      const heroParent = pageHero.closest('.page-hero') || pageHero.parentElement;
      insertAdAfter(heroParent, createAdUnit('auto'));
    }

    const contentSections = main.querySelectorAll(
      '.cards-wrap, .branch-info, .info-cards-grid, .tips-section, .computer-pyq-grid, .hsbte-grid, .resources-grid, .why-section, .popular-section, section, .computer-pyq > div'
    );

    if (contentSections.length >= 3) {
      const midIndex = Math.floor(contentSections.length * 0.4);
      const midSection = contentSections[midIndex];

      if (midSection && !isInsideFooter(midSection)) {
        insertAdAfter(midSection, createAdUnit('inarticle'));
      }
    }
  }

  function initAdsOnInteraction() {
    if (adsInjected) return;
    injectAds();
    ['scroll', 'mousemove', 'touchstart', 'keydown'].forEach(function (e) {
      window.removeEventListener(e, initAdsOnInteraction);
    });
  }

  ['scroll', 'mousemove', 'touchstart', 'keydown'].forEach(function (e) {
    window.addEventListener(e, initAdsOnInteraction, { passive: true });
  });

  // Fallback timeout in case of no user interaction
  window.setTimeout(initAdsOnInteraction, 4000);
})();
