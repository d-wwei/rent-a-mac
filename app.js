(function () {
  'use strict';

  var D = window.SITE_DATA || {};
  var P = Object.assign({ yearly: 79, monthly: 99, standard: 159, setupFee: 49, buyServiceFee: 79 }, D.pricing);
  var S = Object.assign({ total: 30, claimed: 12 }, D.slots);
  var C = Object.assign({ wechatId: '', wechatQr: '', email: '' }, D.contact);

  var total = Math.max(1, Math.round(Number(S.total) || 30));
  var claimed = Math.max(0, Math.min(total, Math.round(Number(S.claimed) || 0)));
  var left = total - claimed;

  var CUR = Object.assign({ default: 'USD', cnyRate: 7.2 }, D.currency);
  var rate = Number(CUR.cnyRate) > 0 ? Number(CUR.cnyRate) : 7.2;

  var savedCur = null;
  try { savedCur = localStorage.getItem('mh-currency'); } catch (e) {}
  var state = {
    mode: 'buy',
    billing: D.defaultBilling === 'month' ? 'month' : 'year',
    currency: savedCur === 'USD' || savedCur === 'CNY' ? savedCur : (CUR.default === 'CNY' ? 'CNY' : 'USD')
  };

  var MODES = { byo: 'Bring Your Mac', buy: 'Buy & Host' };

  // Amount in the selected currency, as a whole number.
  function amount(usd) { return state.currency === 'CNY' ? Math.round(usd * rate) : usd; }
  function money(n) { return (state.currency === 'CNY' ? '¥' : '$') + n.toLocaleString('en-US'); }

  function $(id) { return document.getElementById(id); }
  function each(sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); }
  function setV(key, val) { each('[data-v="' + key + '"]', function (el) { el.textContent = val; }); }

  // ── Static numbers from site-data.js ──
  setV('total', total);
  setV('claimed', claimed);
  setV('left', left);
  setV('leftPrefix', left > 0 ? '仅剩' : '已售罄');

  // ── Hero: isometric field of Mac minis, one lit ──
  var grid = $('hero-grid');
  if (grid) {
    var tiles = '';
    for (var i = 0; i < 81; i++) tiles += '<div class="tile' + (i === 40 ? ' tile-on' : '') + '"></div>';
    grid.innerHTML = tiles;
  }

  // ── Early-bird slots ──
  var slots = $('slots-grid');
  if (slots) {
    var html = '';
    for (var j = 0; j < total; j++) {
      if (j < claimed) {
        var dur = (1.4 + (j * 7 % 5) * 0.35).toFixed(2);
        var delay = (-(j * 13 % 9) * 0.3).toFixed(1);
        html += '<div class="slot slot-on"><i style="animation-duration:' + dur + 's;animation-delay:' + delay + 's"></i></div>';
      } else {
        html += '<div class="slot slot-free"></div>';
      }
    }
    slots.innerHTML = html;
    slots.setAttribute('aria-label', '早鸟名额共 ' + total + ' 台：运行中 ' + claimed + ' 台，可预订 ' + left + ' 台');
  }

  // ── Pricing configurator ──
  function render() {
    var year = state.billing === 'year';
    var cny = state.currency === 'CNY';
    var perMonth = amount(year ? P.yearly : P.monthly);
    each('#mode-opts .plan', function (b) { b.setAttribute('aria-checked', String(b.dataset.mode === state.mode)); });
    each('#billing-opts .opt', function (b) { b.setAttribute('aria-checked', String(b.dataset.billing === state.billing)); });
    each('#cur button', function (b) { b.setAttribute('aria-pressed', String(b.dataset.cur === state.currency)); });
    each('[data-m]', function (el) { el.textContent = money(amount(P[el.dataset.m])); });
    $('price-note').textContent = year
      ? '年付总额 ' + money(perMonth * 12) + ' · 早鸟价首年有效'
      : '按月付费 · 可取消下一周期续费';
    var fx = $('fx-note');
    fx.hidden = !cny;
    fx.textContent = cny ? '人民币为参考价，按 1 USD = ' + rate + ' CNY 折算，以结算时汇率为准。' : '';
    setV('price', money(perMonth));
    setV('configLabel', MODES[state.mode] + ' · ' + (year ? '年付' : '月付'));
  }
  each('#mode-opts .plan', function (b) {
    b.addEventListener('click', function () { if (!b.disabled) { state.mode = b.dataset.mode; render(); } });
  });
  each('#billing-opts .opt', function (b) {
    b.addEventListener('click', function () { state.billing = b.dataset.billing; render(); });
  });
  each('#cur button', function (b) {
    b.addEventListener('click', function () {
      state.currency = b.dataset.cur;
      try { localStorage.setItem('mh-currency', state.currency); } catch (e) {}
      render();
    });
  });
  render();

  // ── Nav CTA: stays out of the way until the hero's own CTA has scrolled off ──
  var navCta = $('nav-cta'), heroCta = $('hero-cta');
  if (navCta && heroCta) {
    var navShown = false, navQueued = false;
    var syncNav = function () {
      navQueued = false;
      var show = heroCta.getBoundingClientRect().bottom < 72;
      if (show === navShown) return;
      navShown = show;
      navCta.classList.toggle('show', show);
      navCta.setAttribute('aria-hidden', String(!show));
      navCta.tabIndex = show ? 0 : -1;
    };
    var queueNav = function () { if (!navQueued) { navQueued = true; requestAnimationFrame(syncNav); } };
    window.addEventListener('scroll', queueNav, { passive: true });
    window.addEventListener('resize', queueNav);
    syncNav();
  }

  // ── FAQ accordion (one open at a time) ──
  each('.faq-q', function (q) {
    q.addEventListener('click', function () {
      var wasOpen = q.getAttribute('aria-expanded') === 'true';
      each('.faq-q', function (o) {
        o.setAttribute('aria-expanded', 'false');
        o.querySelector('.faq-sign').textContent = '+';
        o.nextElementSibling.hidden = true;
      });
      if (!wasOpen) {
        q.setAttribute('aria-expanded', 'true');
        q.querySelector('.faq-sign').textContent = '–';
        q.nextElementSibling.hidden = false;
      }
    });
  });

  // ── Sticky buy bar: appears once the pricing CTA has scrolled off the top ──
  var bar = $('buybar'), cta = $('buy-cta');
  // (measured on scroll rather than with IntersectionObserver, so jumping
  //  straight past the CTA via an anchor link still shows the bar)
  if (bar && cta && D.stickyBar !== false) {
    var shown = false, queued = false;
    var syncBar = function () {
      queued = false;
      var show = cta.getBoundingClientRect().bottom < 0;
      if (show === shown) return;
      shown = show;
      bar.classList.toggle('show', show);
      bar.setAttribute('aria-hidden', String(!show));
      bar.querySelector('a').tabIndex = show ? 0 : -1;
    };
    var queueBar = function () { if (!queued) { queued = true; requestAnimationFrame(syncBar); } };
    window.addEventListener('scroll', queueBar, { passive: true });
    window.addEventListener('resize', queueBar);
    syncBar();
  }

  // ── Contact modal ──
  var modal = $('contact-modal');
  if (C.wechatQr) { $('modal-qr').src = C.wechatQr; $('modal-qr').hidden = false; }
  if (C.wechatId) { $('modal-wechat-id').textContent = C.wechatId; $('modal-wechat').hidden = false; }
  if (C.email) {
    $('modal-email-addr').textContent = C.email;
    $('modal-email').href = 'mailto:' + C.email;
    $('modal-email').hidden = false;
  }

  function openContact(ev) {
    if (ev) ev.preventDefault();
    if (modal.showModal) modal.showModal(); else modal.setAttribute('open', '');
  }
  function closeContact() { if (modal.close) modal.close(); else modal.removeAttribute('open'); }
  each('[data-open-contact]', function (b) { b.addEventListener('click', openContact); });
  each('[data-close-contact]', function (b) { b.addEventListener('click', closeContact); });
  modal.addEventListener('click', function (e) { if (e.target === modal) closeContact(); });

  $('modal-copy').addEventListener('click', function () {
    var btn = this;
    function done() { btn.textContent = '已复制'; setTimeout(function () { btn.textContent = '复制'; }, 1600); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(C.wechatId).then(done, function () {});
    } else {
      var t = document.createElement('textarea');
      t.value = C.wechatId; document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); done(); } catch (err) {}
      document.body.removeChild(t);
    }
  });
})();
