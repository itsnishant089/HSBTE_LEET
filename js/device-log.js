/**
 * device-log.js — records which browsers an account is used from (shown in the admin portal → Devices).
 * Sends one small request per account per browser session to /api/device/log.
 */
(function () {
  'use strict';
  try {
    var ss = sessionStorage, ls = localStorage;
    var product, ref, mobile;
    if (ss.getItem('prem_uid')) { product = ss.getItem('prem_tier') === 'ultra' ? 'ultra' : 'premium'; ref = ss.getItem('prem_uid'); mobile = ss.getItem('prem_mob') || ''; }
    else if (ss.getItem('counsel_uid')) { product = 'counseling'; ref = ss.getItem('counsel_uid'); mobile = ''; }
    if (!ref || ss.getItem('devlog_' + product + ref)) return;
    var dev = ls.getItem('bk_dev');
    if (!dev || !/^[A-Za-z0-9_-]{8,64}$/.test(dev)) { dev = 'd' + Array.prototype.map.call(crypto.getRandomValues(new Uint8Array(12)), function (b) { return b.toString(16).padStart(2, '0'); }).join(''); ls.setItem('bk_dev', dev); }
    var s = [navigator.userAgent, navigator.language, screen.width + 'x' + screen.height, Intl.DateTimeFormat().resolvedOptions().timeZone].join('|'), h = 0;
    for (var i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    fetch('/api/device/log', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
      body: JSON.stringify({ product: product, userRef: ref, mobile: mobile, deviceId: dev, fp: 'f' + (h >>> 0).toString(16) })
    }).then(function () { ss.setItem('devlog_' + product + ref, '1'); }).catch(function () {});
  } catch (e) {}
})();
