/* Цены тарифов — из живого прайса api (тот же, что читают бот курса и страница оплаты на уян.рф), чтобы сайт
   не врал в день, когда цена меняется. Решение 05.10.2026: «Студия» весь октябрь за 29 000 при обычной 49 000;
   обычную показываем зачёркнутой («сейчас вместо …»), срок скидки нигде не называем — его не присылает и api.

   Отдельный файл и свой try/catch: ошибка здесь не должна ломать меню и аккордеоны (script.js).
   Нет ответа за 3 секунды — остаются цены из разметки. У «Студии» цены в разметке нет намеренно: скидка
   меняется по расписанию, и статичная цифра однажды соврала бы. Тогда там «цена — на странице оплаты».
   В ссылку оплаты кладём показанную цену (&p=): если к моменту открытия она другая, страница оплаты скажет
   об этом до оплаты. Сумму счёта считает сервер, p на неё не влияет. */
(function () {
  'use strict';
  var API = 'https://api.xn--m1al0b.xn--p1ai/api/payment/tiers/multiki';

  function fmt(n) {
    return n.toLocaleString('ru-RU') + ' ₽';
  }

  /* Метка из адреса страницы — в кнопки «Оплатить» (10.10.2026). Бот курса ведёт сюда с меткой входа (?cp=…),
     ссылка партнёра — ещё с меткой и подписью (?ref=…&rs=…). Кнопки несут их на страницу оплаты: в записи оплаты
     видно, откуда человек. Ник (?tg=) бот сюда не шлёт: сайт за рубежом, ссылка идёт без ника (решение 16.10);
     если ник в адресе есть — кнопки понесут и его. Только проверенный формат — мусор из адреса в ссылку оплаты
     не попадает. src=umida_site стоит в самих кнопках и из адреса не меняется. Формат ref — как в api
     (одиночный «_» — старые метки p_<имя>). */
  function carryLabel() {
    var q = new URLSearchParams(location.search);
    var put = [];
    var tg = (q.get('tg') || '').replace(/^@/, '');
    if (/^[a-zA-Z0-9_]{5,32}$/.test(tg)) put.push(['tg', tg]);
    var cp = q.get('cp') || '';
    if (/^[A-Za-z0-9_-]{1,64}$/.test(cp)) put.push(['cp', cp]);
    var ref = q.get('ref') || '', rs = q.get('rs') || '';
    if (/^(?=[a-z0-9_-]{2,24}(?:__a\d{1,2})?$)[a-z0-9-]+(?:_[a-z0-9-]+)*(?:__a\d{1,2})?$/.test(ref)) {
      put.push(['ref', ref]);
      if (/^\d{9,11}\.[A-Za-z0-9_-]{22}$/.test(rs)) put.push(['rs', rs]);
    }
    /* Кто открыл страницу оплаты (22.10.2026): бот курса кладёт id человека и свою подпись ФРАГМЕНТОМ адреса
       (#k=…&i=…) — фрагмент браузер на сервер не отправляет, и в журналы зарубежного хостинга id не попадает.
       Кнопки несут его на страницу оплаты (наш домен) параметрами tgid и k: если оплата не дойдёт до конца, бот
       через час спросит «что остановило?» именно этого человека. Подпись проверяет сервер; мусор не переносим. */
    var h = new URLSearchParams((location.hash || '').replace(/^#/, ''));
    var hk = h.get('k') || '', hi = h.get('i') || '';
    if (/^\d{9,11}\.[A-Za-z0-9_-]{22}$/.test(hk) && /^\d{5,15}$/.test(hi)) {
      put.push(['tgid', hi]);
      put.push(['k', hk]);
    }
    if (!put.length) return;
    var pay = document.querySelectorAll('a[data-pay]');
    for (var i = 0; i < pay.length; i++) {
      var u = new URL(pay[i].href);
      for (var k = 0; k < put.length; k++) u.searchParams.set(put[k][0], put[k][1]);
      pay[i].href = u.toString();
    }
  }
  try {
    carryLabel();
  } catch (e) { /* старый браузер без URL — кнопки остаются как в разметке */ }

  /* Бот курса ведёт на тарифы с тем, кто открыл ссылку, во фрагменте: #prices&k=…&i=… (23.10.2026). К такому адресу
     браузер сам не листает — элемента с id «prices&k=…» нет, — поэтому листаем к первому слову фрагмента сами, сразу
     и ещё раз после загрузки картинок. Человек успел прокрутить или нажать клавишу — второй раз не дёргаем. */
  function scrollToSection() {
    var parts = (location.hash || '').replace(/^#/, '').split('&');
    if (parts.length < 2 || !/^[a-z][a-z0-9_-]{0,40}$/i.test(parts[0])) return;
    var el = document.getElementById(parts[0]);
    if (!el) return;
    var moved = false;
    var stop = function () { moved = true; };
    window.addEventListener('wheel', stop, { passive: true, once: true });
    window.addEventListener('touchstart', stop, { passive: true, once: true });
    window.addEventListener('keydown', stop, { once: true });
    el.scrollIntoView({ behavior: 'instant', block: 'start' });
    window.addEventListener('load', function () {
      if (!moved) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    }, { once: true });
  }
  try {
    scrollToSection();
  } catch (e) { /* старый браузер — остаётся первый экран */ }

  // Что не заполнил прайс — честная заглушка вместо «…».
  function fallback() {
    var els = document.querySelectorAll('[data-price]');
    for (var i = 0; i < els.length; i++) {
      if (els[i].textContent.trim() === '…') {
        els[i].textContent = 'цена — на странице оплаты';
        els[i].classList.add('pcost-wait');
      }
    }
  }

  function apply(tiers) {
    for (var i = 0; i < tiers.length; i++) {
      var t = tiers[i];
      if (!t || typeof t.id !== 'string' || typeof t.price_rub !== 'number' || !(t.price_rub > 0)) continue;
      var price = document.querySelectorAll('[data-price="' + t.id + '"]');
      for (var j = 0; j < price.length; j++) {
        price[j].textContent = fmt(t.price_rub);
        price[j].classList.remove('pcost-wait');
      }
      var hasList = typeof t.list_price_rub === 'number' && t.list_price_rub > t.price_rub;
      var was = document.querySelectorAll('[data-was="' + t.id + '"]');
      for (var k = 0; k < was.length; k++) {
        var s = was[k].querySelector('s');
        if (s) s.textContent = hasList ? fmt(t.list_price_rub) : '';
        was[k].hidden = !hasList;
      }
      var pay = document.querySelectorAll('a[data-pay="' + t.id + '"]');
      for (var m = 0; m < pay.length; m++) {
        try {
          var u = new URL(pay[m].href);
          u.searchParams.set('p', String(Math.round(t.price_rub)));
          pay[m].href = u.toString();
        } catch (e) { /* старый браузер без URL — ссылка остаётся как была */ }
      }
    }
  }

  try {
    var ctl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = setTimeout(function () {
      if (ctl) ctl.abort();
      fallback();
    }, 3000);
    fetch(API, { cache: 'no-store', signal: ctl ? ctl.signal : undefined })
      .then(function (r) {
        if (!r.ok) throw new Error('http ' + r.status);
        return r.json();
      })
      .then(function (d) {
        clearTimeout(timer);
        if (!d || !Array.isArray(d.tiers)) throw new Error('bad tiers');
        apply(d.tiers);
        fallback();
      })
      .catch(function () {
        clearTimeout(timer);
        fallback();
      });
  } catch (e) {
    fallback();
  }
  /* Липкая кнопка прячется, когда тарифы на экране: там и так есть кнопки у каждой карточки */
  try {
    var cta = document.querySelector('.sticky-cta');
    var prices = document.getElementById('prices');
    if (cta && prices && typeof IntersectionObserver === 'function') {
      new IntersectionObserver(function (entries) {
        cta.hidden = entries.some(function (e) { return e.isIntersecting; });
      }, { threshold: 0 }).observe(prices);
    }
  } catch (e) { /* кнопка просто останется видимой */ }
})();
