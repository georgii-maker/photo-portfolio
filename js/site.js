/* =========================================================
   Портфолио фотографа — логика сайта
   Галерея, фильтры, лайтбокс, меню, анимации появления.
   ========================================================= */
(function () {
  "use strict";

  var PLACEHOLDER = "images/placeholder.svg";
  var gallery = Array.isArray(window.GALLERY) ? window.GALLERY : [];

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function useFallback(img, host) {
    function apply() {
      if (img.dataset.fallbackUsed) return;
      img.dataset.fallbackUsed = "1";
      img.src = PLACEHOLDER;
      if (host) host.classList.add("is-placeholder");
    }
    img.addEventListener("error", apply);
    // Картинка могла не загрузиться ещё до того, как скрипт повесил обработчик.
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) apply();
  }

  /* ---------------- Универсальные заглушки ---------------- */
  document.querySelectorAll("img[data-fallback]").forEach(function (img) {
    useFallback(img, img.parentElement);
  });

  /* ---------------- Hero-фото (необязательно) ----------------
     Путь подставляем абсолютный (probe.src): относительный url()
     внутри CSS-переменной браузер считает от css/style.css,
     а не от страницы, и картинка бы не нашлась. */
  var hero = document.querySelector(".hero");
  var heroMedia = hero ? hero.querySelector(".hero-media") : null;
  if (hero && heroMedia) {
    var probe = new Image();
    probe.onload = function () {
      heroMedia.style.backgroundImage =
        'linear-gradient(180deg,rgba(11,11,12,.72) 0%,rgba(11,11,12,.86) 55%,#0b0b0c 100%), url("' +
        probe.src + '")';
      heroMedia.style.backgroundSize = "cover";
      heroMedia.style.backgroundPosition = "center";
      hero.classList.add("has-photo");
    };
    probe.src = "images/hero.jpg";
  }

  /* ---------------- Галерея ---------------- */
  var grid = document.getElementById("gallery-grid");
  var filtersBox = document.getElementById("filters");
  var emptyMsg = document.getElementById("gallery-empty");
  var cards = [];

  if (grid) {
    gallery.forEach(function (item, index) {
      var fig = document.createElement("figure");
      fig.className = "gallery-item";
      fig.tabIndex = 0;
      fig.setAttribute("role", "button");
      fig.setAttribute("aria-label", "Открыть фото: " + (item.alt || "без названия"));
      fig.dataset.tag = (item.tag || "").toLowerCase();

      var img = document.createElement("img");
      img.loading = "lazy";
      img.decoding = "async";
      img.alt = item.alt || "Фотография";
      // Размеры из gallery-data.js — чтобы вёрстка не «прыгала» во время загрузки.
      // Поле необязательное: без него всё работает, просто будет сдвиг макета.
      if (item.w && item.h) { img.width = item.w; img.height = item.h; }
      useFallback(img, fig);
      img.src = item.src || PLACEHOLDER;

      var cap = document.createElement("figcaption");
      cap.className = "gallery-caption";
      cap.innerHTML = "<span>" + esc(item.alt || "") + "</span>" +
        (item.tag ? "<em>" + esc(item.tag) + "</em>" : "");

      fig.appendChild(img);
      fig.appendChild(cap);
      grid.appendChild(fig);

      var card = { el: fig, data: item, index: index };
      cards.push(card);

      fig.addEventListener("click", function () { openLightbox(card); });
      fig.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLightbox(card); }
      });
    });
  }

  /* ---------------- Фильтры ---------------- */
  var activeTag = "all";

  function buildFilters() {
    if (!filtersBox) return;
    var seen = [];
    cards.forEach(function (c) {
      var t = c.el.dataset.tag;
      if (t && seen.indexOf(t) === -1) seen.push(t);
    });
    if (seen.length < 2) return;

    var all = ["all"].concat(seen);
    all.forEach(function (tag) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "filter" + (tag === "all" ? " is-active" : "");
      btn.dataset.tag = tag;
      btn.textContent = tag === "all" ? "Все" : tag.charAt(0).toUpperCase() + tag.slice(1);
      btn.addEventListener("click", function () { applyFilter(tag); });
      filtersBox.appendChild(btn);
    });
  }

  function applyFilter(tag) {
    activeTag = tag;
    filtersBox.querySelectorAll(".filter").forEach(function (b) {
      b.classList.toggle("is-active", b.dataset.tag === tag);
    });
    var shown = 0;
    cards.forEach(function (c) {
      var match = tag === "all" || c.el.dataset.tag === tag;
      c.el.classList.toggle("is-hidden", !match);
      if (match) shown++;
    });
    if (emptyMsg) emptyMsg.hidden = shown !== 0;
  }

  buildFilters();

  /* ---------------- Лайтбокс ---------------- */
  var lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-label", "Просмотр фотографии");
  lightbox.innerHTML =
    '<span class="lightbox-count"></span>' +
    '<button class="lightbox-btn lightbox-close" type="button" aria-label="Закрыть">&#10005;</button>' +
    '<button class="lightbox-btn lightbox-prev" type="button" aria-label="Предыдущее фото">&#8249;</button>' +
    '<img alt="">' +
    '<button class="lightbox-btn lightbox-next" type="button" aria-label="Следующее фото">&#8250;</button>' +
    '<p class="lightbox-caption"></p>';
  document.body.appendChild(lightbox);

  var lbImg = lightbox.querySelector("img");
  var lbCap = lightbox.querySelector(".lightbox-caption");
  var lbCount = lightbox.querySelector(".lightbox-count");
  var current = 0;

  function visibleCards() {
    return cards.filter(function (c) { return !c.el.classList.contains("is-hidden"); });
  }

  function render() {
    var list = visibleCards();
    if (!list.length) return;
    var card = list[current % list.length];
    var data = card.data;
    lbImg.dataset.fallbackUsed = "";
    lbImg.onerror = function () { lbImg.src = PLACEHOLDER; };
    lbImg.src = data.src || PLACEHOLDER;
    lbImg.alt = data.alt || "Фотография";
    lbCap.textContent = (data.alt || "") + (data.tag ? " · " + data.tag : "");
    lbCount.textContent = (current % list.length + 1) + " / " + list.length;
  }

  function openLightbox(card) {
    var list = visibleCards();
    current = list.indexOf(card);
    if (current < 0) current = 0;
    render();
    lightbox.classList.add("is-open");
    document.body.classList.add("is-locked");
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    document.body.classList.remove("is-locked");
  }

  function step(delta) {
    var list = visibleCards();
    if (!list.length) return;
    current = (current + delta + list.length) % list.length;
    render();
  }

  lightbox.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
  lightbox.querySelector(".lightbox-prev").addEventListener("click", function (e) { e.stopPropagation(); step(-1); });
  lightbox.querySelector(".lightbox-next").addEventListener("click", function (e) { e.stopPropagation(); step(1); });
  lightbox.addEventListener("click", function (e) { if (e.target === lightbox) closeLightbox(); });

  document.addEventListener("keydown", function (e) {
    if (!lightbox.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "ArrowRight") step(1);
  });

  // Свайпы на телефоне
  var touchX = null;
  lightbox.addEventListener("touchstart", function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
  lightbox.addEventListener("touchend", function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    touchX = null;
  }, { passive: true });

  /* ---------------- Шапка и мобильное меню ---------------- */
  var header = document.querySelector(".site-header");
  var toggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("nav");

  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 40);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------------- Активный пункт меню ---------------- */
  var sections = document.querySelectorAll("main section[id]");
  if ("IntersectionObserver" in window && sections.length) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        document.querySelectorAll(".nav a").forEach(function (a) {
          a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { navObserver.observe(s); });
  }

  /* ---------------- Появление блоков ---------------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        setTimeout(function () { entry.target.classList.add("is-visible"); }, i * 70);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------------- Год в подвале ---------------- */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
