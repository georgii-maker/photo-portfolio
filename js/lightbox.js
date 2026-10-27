/* Просмотр фотографии по клику.
   Генерируется sitegen.py - правки здесь перезапишутся при сборке. */
(function () {
  "use strict";

  var THUMB_SELECTOR = ".cat-thumb, .gallery-item";
  var thumbs = Array.prototype.slice.call(document.querySelectorAll(THUMB_SELECTOR));
  var photos = [];

  thumbs.forEach(function (box) {
    var img = box.querySelector("img");
    if (!img || !img.getAttribute("src")) return;
    photos.push({ box: box, img: img });
  });
  if (!photos.length) return;

  var style = document.createElement("style");
  style.textContent =
    ".cat-thumb,.gallery-item{cursor:zoom-in}" +
    ".lightbox.is-single .lightbox-prev,.lightbox.is-single .lightbox-next{display:none}";
  document.head.appendChild(style);

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
  var closeBtn = lightbox.querySelector(".lightbox-close");
  var current = 0;
  var lastFocus = null;

  function show(index) {
    if (!photos.length) return;
    current = (index + photos.length) % photos.length;
    var photo = photos[current];
    lbImg.src = photo.img.getAttribute("src");
    lbImg.alt = photo.img.getAttribute("alt") || "";
    lbCap.textContent = photo.img.getAttribute("alt") || "";
    lbCount.textContent = (current + 1) + " / " + photos.length;
    lightbox.classList.toggle("is-single", photos.length < 2);
  }

  function open(index) {
    lastFocus = document.activeElement;
    show(index);
    lightbox.classList.add("is-open");
    document.body.classList.add("is-locked");
    closeBtn.focus();
  }

  function close() {
    lightbox.classList.remove("is-open");
    document.body.classList.remove("is-locked");
    lbImg.removeAttribute("src");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function step(delta) { show(current + delta); }

  photos.forEach(function (photo, index) {
    photo.box.setAttribute("tabindex", "0");
    photo.box.setAttribute("role", "button");
    var alt = photo.img.getAttribute("alt");
    if (alt) photo.box.setAttribute("aria-label", "Открыть фото: " + alt);
    photo.box.addEventListener("click", function () { open(index); });
    photo.box.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open(index);
      }
    });
  });

  closeBtn.addEventListener("click", close);
  lightbox.querySelector(".lightbox-prev").addEventListener("click", function (e) {
    e.stopPropagation();
    step(-1);
  });
  lightbox.querySelector(".lightbox-next").addEventListener("click", function (e) {
    e.stopPropagation();
    step(1);
  });
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) close();
  });

  document.addEventListener("keydown", function (e) {
    if (!lightbox.classList.contains("is-open")) return;
    if (e.key === "Escape") { close(); }
    else if (e.key === "ArrowLeft") { step(-1); }
    else if (e.key === "ArrowRight") { step(1); }
  });

  var touchX = 0;
  lightbox.addEventListener("touchstart", function (e) {
    touchX = e.changedTouches[0].clientX;
  }, { passive: true });
  lightbox.addEventListener("touchend", function (e) {
    var delta = e.changedTouches[0].clientX - touchX;
    if (Math.abs(delta) > 50) step(delta < 0 ? 1 : -1);
  }, { passive: true });

  if (photos.length < 2) lightbox.classList.add("is-single");
})();
