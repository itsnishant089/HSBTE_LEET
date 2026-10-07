/**
 * premium-report.js — shared by every premium / section mock paper.
 * After the student submits a paper it:
 *   1. shows section-wise performance,
 *   2. shows an explanation under every question in the review (when the question has one),
 *   3. (no download/print/PDF export: question content must not leave the page),
 *   4. records the attempt (Supabase `paper_attempts` + a local copy) so progress can be tracked.
 * Scoring: +1 for a correct answer, 0 for wrong / skipped (no negative marking).
 */
(function () {
  'use strict';

  var SUPA_URL = window.SUPA_URL || 'https://vzfpltvchsxsfqlldafd.supabase.co';
  var SUPA_KEY = window.SUPA_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6ZnBsdHZjaHN4c2ZxbGxkYWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTY3NzksImV4cCI6MjA4ODczMjc3OX0.u9oVBYup_-OdTuY2i14sHGQIvZ4gKReMS919_7zxqCA';
  var LETTERS = ['A', 'B', 'C', 'D', 'E'];
  var last = null; // last computed attempt

  function esc(s) {
    return String(s == null ? '' : s).replace(/&(?!(amp|lt|gt|quot|#\d+);)/g, '&amp;');
  }
  function qs() { try { return questions; } catch (e) { return []; } }
  function title() { try { return PAPER_TITLE; } catch (e) { return document.title; } }

  function compute() {
    var Q = qs(), cor = 0, wro = 0, skp = 0, secs = {}, rows = [];
    Q.forEach(function (q, i) {
      var sel = document.querySelector('input[name="q' + i + '"]:checked');
      var ans = sel ? parseInt(sel.value, 10) : -1;
      var s = secs[q.s] || (secs[q.s] = { c: 0, w: 0, s: 0, t: 0 });
      s.t++;
      if (ans === -1) { skp++; s.s++; } else if (ans === q.a) { cor++; s.c++; } else { wro++; s.w++; }
      rows.push({ q: q, ans: ans });
    });
    var spent = 0;
    try { spent = Math.max(0, TIMER_SEC - timeLeft); } catch (e) {}
    return { cor: cor, wro: wro, skp: skp, total: Q.length, score: cor, secs: secs, rows: rows, spent: spent };
  }

  /* ---------- 1) section-wise block + explanations ---------- */
  function renderSections(a) {
    var host = document.getElementById('results');
    if (!host || document.getElementById('prp-sections')) return;
    var html = '<div id="prp-sections" style="margin:18px 0 8px;background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:16px 18px">' +
      '<div style="font-weight:800;margin-bottom:10px">📊 Section-wise performance <span style="font-weight:500;color:#64748b;font-size:.85em">(+1 correct · 0 wrong · no negative marking)</span></div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:.88rem"><thead><tr style="text-align:left;color:#64748b">' +
      '<th style="padding:6px 4px">Section</th><th>Correct</th><th>Wrong</th><th>Skipped</th><th>Accuracy</th></tr></thead><tbody>';
    Object.keys(a.secs).forEach(function (k) {
      var s = a.secs[k], acc = s.t ? Math.round(s.c / s.t * 100) : 0;
      html += '<tr style="border-top:1px solid #eef2f7"><td style="padding:6px 4px">' + esc(k) + '</td><td style="color:#16a34a;font-weight:700">' + s.c +
        '</td><td style="color:#dc2626">' + s.w + '</td><td style="color:#64748b">' + s.s + '</td><td><b>' + acc + '%</b></td></tr>';
    });
    html += '</tbody></table></div>';
    var anchor = host.querySelector('.review-header');
    if (anchor) anchor.insertAdjacentHTML('beforebegin', html); else host.insertAdjacentHTML('beforeend', html);
  }

  function addExplanations(a) {
    var cards = document.querySelectorAll('#review-area .r-card');
    a.rows.forEach(function (r, i) {
      var c = cards[i];
      if (!c || c.querySelector('.prp-expl')) return;
      var ex = r.q.e || r.q.explanation || '';
      var txt = ex || ('Correct option is ' + LETTERS[r.q.a] + ': ' + r.q.o[r.q.a] + '.');
      c.insertAdjacentHTML('beforeend', '<div class="prp-expl" style="margin-top:8px;padding:8px 10px;background:#f0f9ff;border-left:3px solid #38bdf8;border-radius:6px;font-size:.88rem;line-height:1.5;color:#0c4a6e">💡 <b>Explanation:</b> ' + txt + '</div>');
    });
  }

  /* ---------- 4) record the attempt ---------- */
  function record(a) {
    var rec = { paper: title(), correct: a.cor, wrong: a.wro, skipped: a.skp, score: a.score, total: a.total,
      time_secs: a.spent, sections: a.secs, created_at: new Date().toISOString() };
    try {
      var list = JSON.parse(localStorage.getItem('leet_attempts_v1') || '[]');
      list.push(rec); localStorage.setItem('leet_attempts_v1', JSON.stringify(list.slice(-200)));
    } catch (e) {}
    var uid = sessionStorage.getItem('prem_uid');
    if (!uid || !window.supabase) return;
    try {
      var client = (window.sb && typeof window.sb.from === 'function') ? window.sb : window.supabase.createClient(SUPA_URL, SUPA_KEY);
      var row = { user_id: uid, paper: rec.paper, correct: rec.correct, wrong: rec.wrong, skipped: rec.skipped, score: rec.score,
        total: rec.total, time_secs: rec.time_secs, sections: rec.sections };
      client.from('paper_attempts').insert([row]).then(function (r) {
        if (r && r.error) { try { console.warn('[report] attempt not saved:', r.error.message); } catch (_) {} }
      }).catch(function () {});
    } catch (e) {}
  }

  /* ---------- hook into submitExam ---------- */
  function after() {
    try {
      var a = compute(); last = a;
      var scr = document.getElementById('res-scr'); if (scr) scr.textContent = a.score;
      var sub = document.getElementById('score-subtitle');
      if (sub) sub.textContent = 'Score: ' + a.score + ' / ' + a.total + ' | Accuracy: ' + (a.total ? Math.round(a.cor / a.total * 100) : 0) + '% | hsbteleet.com';
      document.querySelectorAll('#results .s-score .s-lbl').forEach(function (l) { l.textContent = '🏅 Score (+1, 0)'; });
      renderSections(a); addExplanations(a); record(a);
    } catch (e) { try { console.warn('[report]', e); } catch (_) {} }
  }
  function hook() {
    if (typeof window.submitExam !== 'function' || window.submitExam.__wrapped) return false;
    var orig = window.submitExam, done = false;
    var wrapped = function () {
      var r = orig.apply(this, arguments);
      if (!done) { done = true; setTimeout(after, 50); }
      return r;
    };
    wrapped.__wrapped = true;
    window.submitExam = wrapped;
    return true;
  }
  if (!hook()) { window.addEventListener('load', hook); }
})();
