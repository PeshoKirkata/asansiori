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

  // Етажен индикатор: всяка секция с data-floor е „етаж“
  var floors = Array.prototype.slice.call(document.querySelectorAll("[data-floor]"));
  if (floors.length) {
    var fi = document.createElement("div");
    fi.className = "floor-indicator";
    fi.setAttribute("aria-hidden", "true");
    fi.innerHTML = '<span class="fi-arrow">▲</span><span class="fi-num">00</span><span class="fi-name"></span>';
    document.body.appendChild(fi);
    var num = fi.querySelector(".fi-num");
    var name = fi.querySelector(".fi-name");
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
        name.textContent = active.getAttribute("data-floor-name") || "";
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

  // Табове за материали
  document.querySelectorAll("[data-tabs]").forEach(function (group) {
    var buttons = group.querySelectorAll("[role=tab]");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) {
          var on = b === btn;
          b.setAttribute("aria-selected", on ? "true" : "false");
          document.getElementById(b.getAttribute("aria-controls")).hidden = !on;
        });
      });
    });
  });

  // Форма за запитване — без сървър: съставя имейл в пощенския клиент
  var form = document.querySelector("#inquiry");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var d = new FormData(form);
      var subject = "Запитване: " + (d.get("type") || "асансьор");
      var body = [
        "Име: " + d.get("name"),
        "Телефон: " + d.get("phone"),
        "Имейл: " + d.get("email"),
        "Тип: " + d.get("type"),
        "Обект: " + (d.get("site") || "—"),
        "",
        d.get("message")
      ].join("\n");
      window.location.href = "mailto:" + form.getAttribute("data-to") +
        "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      var status = form.querySelector(".form-status");
      if (status) status.textContent = "Отваряме пощенския ви клиент с попълненото запитване.";
    });
  }

  var yearEl = document.querySelectorAll("[data-year]");
  yearEl.forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
