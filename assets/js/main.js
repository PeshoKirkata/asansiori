(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Мобилно меню
  var toggle = document.querySelector(".nav-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.querySelectorAll(".nav a").forEach(function (a) {
      a.addEventListener("click", function () {
        document.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Вратите на асансьора в hero секцията се отварят при зареждане
  var lift = document.querySelector(".lift");
  if (lift) {
    var img = lift.querySelector("img");
    var open = function () { requestAnimationFrame(function () { lift.classList.add("open"); }); };
    if (!img || img.complete) open();
    else { img.addEventListener("load", open); img.addEventListener("error", open); }
  }

  // Поява на елементи при скрол
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  // Етажен индикатор: всяка секция с data-floor е етаж
  var floors = Array.prototype.slice.call(document.querySelectorAll("[data-floor]"));
  if (floors.length) {
    var fi = document.createElement("div");
    fi.className = "floor-indicator";
    fi.setAttribute("aria-hidden", "true");
    fi.innerHTML = '<span class="fi-arrow">▲</span><span class="fi-num">1</span>';
    document.body.appendChild(fi);
    var num = fi.querySelector(".fi-num");
    var lastY = window.scrollY;
    var current = null;

    var update = function () {
      var y = window.scrollY;
      var mid = y + window.innerHeight * 0.45;
      var active = null;
      floors.forEach(function (s) {
        var top = s.getBoundingClientRect().top + y;
        if (top <= mid) active = s;
      });
      fi.classList.toggle("down", y > lastY);
      lastY = y;
      fi.classList.toggle("show", y > 240);
      if (active && active !== current) {
        current = active;
        num.textContent = active.getAttribute("data-floor");
      }
    };
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function () { update(); ticking = false; });
      }
    }, { passive: true });
    update();
  }

  // Табове (материали, модели). Хеш в адреса отваря съответния таб.
  var tabGroups = document.querySelectorAll("[data-tabs]");
  var selectTab = function (btn, focus) {
    var group = btn.closest("[data-tabs]");
    group.querySelectorAll("[role=tab]").forEach(function (b) {
      var on = b === btn;
      b.setAttribute("aria-selected", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
      document.getElementById(b.getAttribute("aria-controls")).hidden = !on;
    });
    if (focus) btn.focus();
  };
  tabGroups.forEach(function (group) {
    var buttons = Array.prototype.slice.call(group.querySelectorAll("[role=tab]"));
    buttons.forEach(function (btn, i) {
      btn.addEventListener("click", function () {
        selectTab(btn);
        var id = btn.getAttribute("aria-controls");
        if (group.hasAttribute("data-hash")) {
          history.replaceState(null, "", "#" + id);
        }
      });
      btn.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
        if (d) { e.preventDefault(); selectTab(buttons[(i + d + buttons.length) % buttons.length], true); }
      });
    });
  });
  var openFromHash = function () {
    var id = location.hash.slice(1);
    if (!id) return;
    var btn = document.querySelector('[role=tab][aria-controls="' + id + '"]');
    if (btn) {
      selectTab(btn);
      var host = btn.closest("[data-tabs]").closest("section");
      if (host) host.scrollIntoView();
    }
  };
  openFromHash();
  window.addEventListener("hashchange", openFromHash);

  // Меню в страницата: маркира секцията, която се вижда
  var subLinks = document.querySelectorAll(".subnav a");
  if (subLinks.length && "IntersectionObserver" in window) {
    var map = {};
    subLinks.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          subLinks.forEach(function (a) { a.classList.remove("active"); });
          map[e.target.id].classList.add("active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) so.observe(el); });
  }

  // Форма за запитване без сървър: съставя имейл в пощенския клиент
  var form = document.querySelector("#inquiry");
  if (form) {
    // ?tema=Сервиз избира темата предварително
    var tema = new URLSearchParams(location.search).get("tema");
    var sel = form.querySelector("[name=type]");
    if (tema && sel) {
      Array.prototype.forEach.call(sel.options, function (o) { if (o.text === tema) sel.value = o.value; });
    }
    // ?model=Verton+Arbor попълва съобщението
    var model = new URLSearchParams(location.search).get("model");
    var msg = form.querySelector("[name=message]");
    if (model && msg && !msg.value) msg.value = /cargo/i.test(model) ? "Интересувам се от товарна платформа " + model + "." : "Интересувам се от кабина " + model + ".";
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var d = new FormData(form);
      var subject = "Запитване: " + (d.get("type") || "асансьор");
      var body = [
        "Име: " + d.get("name"),
        "Телефон: " + d.get("phone"),
        "Имейл: " + (d.get("email") || "-"),
        "Тема: " + d.get("type"),
        "Сграда: " + (d.get("building") || "-"),
        "Етажи: " + (d.get("floors") || "-"),
        "",
        d.get("message")
      ].join("\n");
      window.location.href = "mailto:" + form.getAttribute("data-to") +
        "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      var status = form.querySelector(".form-status");
      if (status) status.textContent = "Отваряме имейл с попълненото запитване.";
    });
  }

  // Мобилният бутон за обаждане се показва след първия екран
  var fab = document.querySelector(".call-fab");
  if (fab) {
    var onScroll = function () { fab.classList.toggle("show", window.scrollY > window.innerHeight * 0.8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  var yearEl = document.querySelectorAll("[data-year]");
  yearEl.forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
