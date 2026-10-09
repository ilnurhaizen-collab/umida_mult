/* Большой просмотр картинок (09.10.2026): герои Умиды и экраны кабинета.
   Группа — контейнер с data-zoom="<имя>" (у кабинета два контейнера с одним именем — листаются вместе).
   Элемент — <figure> с <button> и <img> внутри; подпись — <figcaption> (<b> имя, <span> формат) или просто текст;
   фраза под подписью — data-desc у <figure>; полный файл — data-full у <img> (иначе берётся src).
   «Назад» в браузере (жест в Instagram и Telegram) закрывает просмотр, а не уводит со страницы.
   Старый браузер без <dialog>: картинки и ряд работают, просмотра просто нет. */
(function () {
  'use strict';

  // ── Ряд героев: стрелки и подсказка ───────────────────────────────────────
  var rail = document.getElementById('hrail');
  var nav = document.querySelector('.hrail-nav');
  var btns = nav ? nav.querySelectorAll('.hrail-btn') : [];
  var hint = nav ? nav.querySelector('.hrail-hint') : null;

  function step() {
    var c = rail.querySelector('figure');
    if (!c) return 240;
    var gap = parseFloat(getComputedStyle(rail).columnGap) || 20;
    return c.getBoundingClientRect().width + gap;
  }

  // Всё помещается — стрелок нет и подсказка без «листайте»; на краю ряда крайняя стрелка гаснет.
  function update() {
    if (!rail) return;
    var over = rail.scrollWidth > rail.clientWidth + 2;
    if (nav) nav.classList.toggle('is-static', !over);
    if (hint) hint.textContent = over ? 'Листайте и нажмите на героя' : 'Нажмите на героя, чтобы рассмотреть';
    if (btns.length === 2) {
      btns[0].disabled = rail.scrollLeft <= 2;
      btns[1].disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 2;
    }
  }

  if (rail) {
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener('click', function () {
        rail.scrollBy({ left: Number(b.getAttribute('data-dir')) * step(), behavior: 'smooth' });
      });
    });
    var ticking = false;
    rail.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { ticking = false; update(); });
    }, { passive: true });
    window.addEventListener('resize', update);
    window.addEventListener('load', update);
    update();
  }

  // ── Большой просмотр ──────────────────────────────────────────────────────
  var dlg = document.getElementById('hview');
  if (!dlg || typeof dlg.showModal !== 'function') return;
  // Картинка просмотра появляется при первом открытии: пустой <img> без адреса — лишний «битый» элемент на странице.
  var img = null;
  var x0 = null;
  function ensureImg() {
    if (img) return img;
    img = document.createElement('img');
    img.className = 'hv-img';
    img.alt = '';
    dlg.querySelector('.hv-pic').appendChild(img);
    // Свайп по картинке — к соседней.
    img.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    img.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      x0 = null;
      if (list.length > 1 && Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1));
    }, { passive: true });
    return img;
  }
  var nameEl = dlg.querySelector('.hv-name');
  var fmtEl = dlg.querySelector('.hv-fmt');
  var descEl = dlg.querySelector('.hv-desc');
  var countEl = dlg.querySelector('.hv-count');
  var navEl = dlg.querySelector('.hv-nav');

  var groups = {};
  Array.prototype.forEach.call(document.querySelectorAll('[data-zoom]'), function (box) {
    var g = box.getAttribute('data-zoom');
    groups[g] = groups[g] || [];
    Array.prototype.forEach.call(box.querySelectorAll('figure'), function (fig) {
      var pic = fig.querySelector('img');
      var btn = fig.querySelector('button');
      if (!pic || !btn) return;
      var cap = fig.querySelector('figcaption');
      var b = cap ? cap.querySelector('b') : null;
      var sp = cap ? cap.querySelector('span') : null;
      var item = {
        src: pic.getAttribute('data-full') || pic.getAttribute('src'),
        w: pic.getAttribute('width'),
        h: pic.getAttribute('height'),
        alt: pic.getAttribute('alt') || '',
        name: b ? b.textContent : (cap ? cap.textContent : ''),
        fmt: sp ? sp.textContent : '',
        desc: fig.getAttribute('data-desc') || '',
        btn: btn
      };
      var list = groups[g];
      var idx = list.length;
      list.push(item);
      btn.addEventListener('click', function () { open(g, idx); });
    });
  });

  var list = [];
  var cur = 0;
  var opener = null;
  var pushed = false;
  var closingByBack = false;

  function show(i) {
    cur = (i + list.length) % list.length;
    var it = list[cur];
    ensureImg();
    // Размеры заранее: рамка не прыгает, пока грузится полный файл.
    if (it.w && it.h) { img.setAttribute('width', it.w); img.setAttribute('height', it.h); }
    img.src = it.src;
    img.alt = it.alt;
    nameEl.textContent = it.name;
    fmtEl.textContent = it.fmt;
    fmtEl.hidden = !it.fmt;
    descEl.textContent = it.desc;
    descEl.hidden = !it.desc;
    countEl.textContent = (cur + 1) + ' из ' + list.length;
    navEl.hidden = list.length < 2;
  }

  function open(g, i) {
    list = groups[g] || [];
    if (!list.length) return;
    opener = list[i] ? list[i].btn : null;
    show(i);
    document.body.classList.add('hv-open');
    dlg.showModal();
    try { history.pushState({ hview: 1 }, ''); pushed = true; } catch (e) { pushed = false; }
  }

  dlg.addEventListener('close', function () {
    document.body.classList.remove('hv-open');
    // Закрыли ✕, Esc или нажатием мимо — убираем запись из истории, которую добавили при открытии.
    if (pushed && !closingByBack) {
      pushed = false;
      try { history.back(); } catch (e) { /* ignore */ }
    }
    pushed = false;
    closingByBack = false;
    if (opener && opener.focus) {
      try { opener.focus({ preventScroll: true }); } catch (e) { opener.focus(); }
    }
  });

  // «Назад» в браузере: закрываем просмотр и остаёмся на странице.
  window.addEventListener('popstate', function () {
    if (!dlg.open) return;
    closingByBack = true;
    pushed = false;
    dlg.close();
  });

  dlg.querySelector('.hv-close').addEventListener('click', function () { dlg.close(); });
  Array.prototype.forEach.call(dlg.querySelectorAll('.hv-btn'), function (b) {
    b.addEventListener('click', function () { show(cur + Number(b.getAttribute('data-dir'))); });
  });
  // Нажатие мимо карточки (по затемнению) закрывает просмотр.
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('keydown', function (e) {
    if (list.length < 2) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1); }
  });
})();
