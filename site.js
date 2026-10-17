/* Sonariq site interactions — no frameworks, just vanilla. */
(function () {
  "use strict";

  /* ---- Config: change the link domain in ONE place ---- */
  var LINK_DOMAIN = "sonariq.giize.com";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Link-domain injection (example Sonariq links in the copy) ---- */
  document.querySelectorAll("[data-domain]").forEach(function (el) {
    el.textContent = LINK_DOMAIN;
  });

  /* ---- Sticky nav state ---- */
  var nav = document.querySelector(".nav");
  var onScroll = function () {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 24);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Mobile menu ---- */
  var burger = document.querySelector(".burger");
  var menu = document.querySelector(".mobile-menu");
  if (burger && menu) {
    burger.addEventListener("click", function () {
      menu.classList.toggle("open");
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { menu.classList.remove("open"); });
    });
  }

  /* ---- Scroll reveals (staggered via --d) ---- */
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  /* ---- Animated counters ---- */
  var cio = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, target = parseInt(el.dataset.count, 10) || 0;
        cio.unobserve(el);
        if (reduced) { el.textContent = target; return; }
        var t0 = performance.now(), dur = 1300;
        var tick = function (t) {
          var p = Math.min((t - t0) / dur, 1);
          var ease = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * ease);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    },
    { threshold: 0.5 }
  );
  document.querySelectorAll("[data-count]").forEach(function (el) { cio.observe(el); });

  /* ---- 3D tilt + cursor glow on cards (fine pointers only) ---- */
  if (window.matchMedia("(pointer: fine)").matches && !reduced) {
    document.querySelectorAll(".tilt").forEach(function (card) {
      card.addEventListener("mousemove", function (ev) {
        var r = card.getBoundingClientRect();
        var x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
        card.style.transform =
          "perspective(900px) rotateX(" + ((0.5 - y) * 9).toFixed(2) + "deg) rotateY(" + ((x - 0.5) * 9).toFixed(2) + "deg) translateY(-4px)";
        card.style.setProperty("--mx", x * 100 + "%");
        card.style.setProperty("--my", y * 100 + "%");
      });
      card.addEventListener("mouseleave", function () { card.style.transform = ""; });
    });

    /* ---- Gentle parallax on hero blobs ---- */
    var hero = document.querySelector(".hero");
    if (hero) {
      hero.addEventListener("mousemove", function (ev) {
        var x = (ev.clientX / window.innerWidth - 0.5) * 26;
        var y = (ev.clientY / window.innerHeight - 0.5) * 26;
        document.querySelectorAll(".blob").forEach(function (b, i) {
          var f = (i + 1) * 0.55;
          b.style.translate = x * f + "px " + y * f + "px";
        });
      });
    }
  }

  /* ---- Hero canvas: living waveform ---- */
  var canvas = document.getElementById("wave");
  if (canvas && !reduced) {
    var ctx = canvas.getContext("2d");
    var W = 0, H = 0, t = 0;
    var resize = function () {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    var grad = null;
    var visible = true;
    var draw = function () {
      if (!visible) return;
      t += 0.016;
      ctx.clearRect(0, 0, W, H);
      var n = Math.max(48, Math.floor(W / 16));
      var bw = W / n;
      if (!grad) {
        grad = ctx.createLinearGradient(0, 0, W, 0);
        grad.addColorStop(0, "rgba(255,107,94,0.85)");
        grad.addColorStop(0.5, "rgba(192,132,252,0.85)");
        grad.addColorStop(1, "rgba(34,211,238,0.85)");
      }
      ctx.fillStyle = grad;
      for (var i = 0; i < n; i++) {
        var p = i / n;
        var h =
          Math.sin(p * 9 + t * 1.6) * 0.32 +
          Math.sin(p * 23 - t * 2.3) * 0.2 +
          Math.sin(p * 5 + t * 0.9) * 0.28 +
          0.62;
        h = Math.max(0.04, Math.min(1, h)) * H * 0.92;
        var x = i * bw + bw * 0.22, w = bw * 0.56, y = H - h;
        var r = Math.min(w / 2, 5);
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
        ctx.fill();
      }
      /* soft mirrored echo */
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.translate(0, H * 2);
      ctx.scale(1, -1);
      ctx.fillStyle = grad;
      for (var j = 0; j < n; j += 2) {
        var q = j / n;
        var hh = (Math.sin(q * 9 + t * 1.6) * 0.32 + 0.62) * H * 0.5;
        ctx.fillRect(j * bw + bw * 0.3, H - hh, bw * 0.4, hh);
      }
      ctx.restore();
      requestAnimationFrame(draw);
    };
    /* pause when off-screen */
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && !visible) { visible = true; requestAnimationFrame(draw); }
        else if (!e.isIntersecting) visible = false;
      });
    }).observe(canvas);
    requestAnimationFrame(draw);
  }
})();
