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
})();
