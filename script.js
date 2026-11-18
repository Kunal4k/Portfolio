(() => {
  "use strict";

  const root = document.documentElement;
  const THEME_KEY = "portfolio-accent";
  const ACCENTS = ["amber", "teal", "violet", "coral"];

  /* ---------- Accent theme (remembered between visits) ---------- */
  const swatches = Array.from(document.querySelectorAll("[data-accent-choice]"));

  function applyAccent(name) {
    if (!ACCENTS.includes(name)) name = "amber";
    root.dataset.accent = name;
    swatches.forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.accentChoice === name));
    });
  }

  let saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (_) { /* storage unavailable */ }
  applyAccent(saved);

  swatches.forEach((btn) => {
    btn.addEventListener("click", () => {
      const choice = btn.dataset.accentChoice;
      applyAccent(choice);
      try { localStorage.setItem(THEME_KEY, choice); } catch (_) { /* ignore */ }
    });
  });

  /* ---------- Mobile menu ---------- */
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.getElementById("site-nav");

  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  toggle.addEventListener("click", () => {
    setMenu(toggle.getAttribute("aria-expanded") !== "true");
  });

  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) setMenu(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      setMenu(false);
      toggle.focus();
    }
  });

  window.matchMedia("(min-width: 981px)").addEventListener("change", (e) => {
    if (e.matches) setMenu(false);
  });

  /* ---------- Highlight the nav link for the section in view ---------- */
  const links = Array.from(nav.querySelectorAll("a"));
  const sections = links
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((a) => {
            a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id);
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => observer.observe(s));
  }

  /* ---------- Contact: copy email ---------- */
  const emailLink = document.getElementById("email-link");
  const copyBtn = document.getElementById("copy-email");
  const status = document.getElementById("copy-status");

  if (emailLink && copyBtn) {
    const email = emailLink.getAttribute("href").replace("mailto:", "");

    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(email);
        status.textContent = "Email copied";
      } catch (_) {
        status.textContent = "Copy failed. Select the address and copy it manually.";
      }
      setTimeout(() => { status.textContent = ""; }, 2500);
    });
  }

  /* ---------- Scroll reveal: content fades in gently as it enters the screen ---------- */
  const REVEAL_GROUPS = [
    // [selector, delay between siblings in ms]
    [".hero-inner > *", 130],
    [".section h2", 0],
    [".about-headline", 0],
    [".section-intro", 0],
    [".prose > *", 90],
    [".info-block", 110],
    [".callout", 0],
    [".project", 0],
    [".skill-group h3", 0],
    [".skill-group .tags li", 45],
    [".timeline li", 0],
    [".subhead", 0],
    [".subhead + .tags", 0],
    [".contact-lead", 0],
    [".contact-actions", 0],
    [".cert-item", 90],
    [".cert-panel", 0],
    [".social li", 80]
  ];

  const canReveal = "IntersectionObserver" in window &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (canReveal) {
    const items = [];
    REVEAL_GROUPS.forEach(([selector, step]) => {
      const perParent = new Map();
      document.querySelectorAll(selector).forEach((el) => {
        const n = perParent.get(el.parentElement) || 0;
        perParent.set(el.parentElement, n + 1);
        const delay = Math.min(n * step, 600);
        el.style.setProperty("--reveal-delay", delay + "ms");
        el.classList.add("reveal");
        items.push({ el, delay });
      });
    });

    root.classList.add("js-reveal");

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const item = items.find((i) => i.el === entry.target);
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
          // Once it has faded in, drop the helper classes so hover effects are unaffected.
          setTimeout(() => {
            entry.target.classList.remove("reveal", "is-visible");
            entry.target.style.removeProperty("--reveal-delay");
          }, (item ? item.delay : 0) + 1200);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    items.forEach(({ el }) => revealObserver.observe(el));
  }

  /* ---------- Certificates: optional in-page preview of the Drive folder ---------- */
  const previewBtn = document.getElementById("cert-preview-toggle");
  const previewBox = document.getElementById("cert-preview");
  const previewFrame = document.getElementById("cert-frame");

  if (previewBtn && previewBox && previewFrame) {
    previewBtn.hidden = false; // only offered when scripting works
    previewBtn.addEventListener("click", () => {
      const open = previewBtn.getAttribute("aria-expanded") !== "true";
      if (open && !previewFrame.getAttribute("src")) {
        previewFrame.setAttribute("src", previewFrame.dataset.src); // load only when asked for
      }
      previewBox.hidden = !open;
      previewBtn.setAttribute("aria-expanded", String(open));
      previewBtn.textContent = open ? "Hide preview" : "Preview here";
    });
  }

  /* ---------- Horizontal page swipe (in addition to normal vertical scrolling) ---------- */
  const PAGES = [
    ["top", "Home"], ["about", "About"], ["projects", "Projects"], ["skills", "Skills"],
    ["experience", "Experience"], ["certifications", "Certifications"], ["contact", "Contact"]
  ].map(([id, name]) => ({ el: document.getElementById(id), name })).filter((p) => p.el);

  const mainEl = document.getElementById("main");
  const pager = document.getElementById("pager");
  const siteHeader = document.querySelector(".site-header");

  if (PAGES.length > 1 && mainEl && pager && siteHeader && typeof mainEl.animate === "function") {
    const count = PAGES.length;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const prevBtn = pager.querySelector("[data-pager-prev]");
    const nextBtn = pager.querySelector("[data-pager-next]");
    const dotsBox = pager.querySelector(".pager-dots");
    const liveRegion = pager.querySelector("[role='status']");
    const hint = pager.querySelector(".pager-hint");
    let current = 0;
    let busy = false;
    let ticking = false;

    const dots = PAGES.map((page, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "pager-dot";
      b.title = page.name;
      b.setAttribute("aria-label", "Go to " + page.name);
      b.addEventListener("click", () => { if (i !== current) transitionTo(i, i > current ? 1 : -1); });
      dotsBox.appendChild(b);
      return b;
    });

    const topFor = (i) =>
      i === 0 ? 0 : Math.max(0, PAGES[i].el.getBoundingClientRect().top + window.scrollY - siteHeader.offsetHeight);

    function detect() {
      const line = siteHeader.offsetHeight + window.innerHeight * 0.35;
      let idx = 0;
      PAGES.forEach((p, i) => { if (p.el.getBoundingClientRect().top <= line) idx = i; });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) idx = count - 1;
      return idx;
    }

    function render(force) {
      const idx = detect();
      if (idx === current && !force) return;
      const changed = idx !== current;
      current = idx;
      dots.forEach((d, i) => {
        d.classList.toggle("is-active", i === current);
        if (i === current) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current");
      });
      prevBtn.disabled = current === 0;
      nextBtn.disabled = current === count - 1;
      if (changed) liveRegion.textContent = PAGES[current].name + ", page " + (current + 1) + " of " + count;
    }

    function jumpTo(i, y) {
      const html = document.documentElement;
      const previous = html.style.scrollBehavior;
      html.style.scrollBehavior = "auto"; // instant, even though the page normally scrolls smoothly
      window.scrollTo(0, y == null ? topFor(i) : y);
      html.style.scrollBehavior = previous;
      render();
    }

    // Slide the current page out, jump to the next one, and slide it in from the opposite side.
    function transitionTo(i, dir, fromX, fromOpacity) {
      if (busy || i < 0 || i >= count) return;
      hideHint();
      const y = topFor(i); // measured now, before the page is moved sideways
      if (reduceMotion.matches) { jumpTo(i, y); return; }
      busy = true;
      mainEl.style.willChange = "transform, opacity";
      const out = mainEl.animate(
        [
          { transform: "translateX(" + (fromX || 0) + "px)", opacity: fromOpacity == null ? 1 : fromOpacity },
          { transform: "translateX(" + (-dir * 80) + "px)", opacity: 0 }
        ],
        { duration: 240, easing: "cubic-bezier(0.4, 0, 0.9, 0.6)", fill: "forwards" }
      );
      out.finished
        .then(() => {
          jumpTo(i, y);
          const incoming = mainEl.animate(
            [
              { transform: "translateX(" + (dir * 110) + "px)", opacity: 0 },
              { transform: "translateX(0)", opacity: 1 }
            ],
            { duration: 560, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)" }
          );
          out.cancel();
          return incoming.finished;
        })
        .catch(() => {})
        .finally(() => {
          mainEl.getAnimations().forEach((a) => a.cancel());
          mainEl.style.willChange = "";
          mainEl.style.transform = "";
          mainEl.style.opacity = "";
          busy = false;
        });
    }

    // Small bounce when there is no page in that direction.
    function nudge(dir) {
      if (busy || reduceMotion.matches) return;
      mainEl.animate(
        [{ transform: "translateX(0)" }, { transform: "translateX(" + (-dir * 28) + "px)" }, { transform: "translateX(0)" }],
        { duration: 380, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)" }
      );
    }

    function step(dir) {
      const target = current + dir;
      if (target < 0 || target >= count) nudge(dir); else transitionTo(target, dir);
    }

    prevBtn.addEventListener("click", () => step(-1));
    nextBtn.addEventListener("click", () => step(1));

    // --- Touch: the page follows your finger, then commits or springs back ---
    let mode = null; // null | "pending" | "h" (horizontal swipe) | "v" (ignore)
    let startX = 0, startY = 0, startT = 0, dragX = 0;
    const IGNORE = "input, textarea, select, iframe, [data-no-swipe]";

    window.addEventListener("touchstart", (e) => {
      if (busy || e.touches.length !== 1 || e.target.closest(IGNORE) ||
          (window.visualViewport && window.visualViewport.scale > 1.02)) { mode = "v"; return; }
      const t = e.touches[0];
      startX = t.clientX; startY = t.clientY; startT = Date.now(); dragX = 0;
      mode = "pending";
    }, { passive: true });

    window.addEventListener("touchmove", (e) => {
      if (mode !== "pending" && mode !== "h") return;
      const t = e.touches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (mode === "pending") {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        mode = Math.abs(dx) > Math.abs(dy) * 1.4 ? "h" : "v";
        if (mode === "v") return;
        mainEl.style.willChange = "transform, opacity";
      }
      const dir = dx < 0 ? 1 : -1;
      const target = current + dir;
      const resist = target < 0 || target >= count ? 0.18 : 0.45;
      dragX = dx * resist;
      mainEl.style.transform = "translateX(" + dragX + "px)";
      mainEl.style.opacity = String(1 - Math.min(Math.abs(dx) / 600, 0.35));
    }, { passive: true });

    function endTouch(e, cancelled) {
      if (mode !== "h") { mode = null; return; }
      mode = null;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dir = dx < 0 ? 1 : -1;
      const target = current + dir;
      const quick = Date.now() - startT < 280 && Math.abs(dx) > 35;
      const commit = !cancelled && (Math.abs(dx) > 80 || quick) && target >= 0 && target < count;
      const fromOpacity = parseFloat(mainEl.style.opacity) || 1;
      const fromX = dragX;
      mainEl.style.transform = "";
      mainEl.style.opacity = "";
      if (commit) {
        transitionTo(target, dir, fromX, fromOpacity);
      } else {
        const back = mainEl.animate(
          [{ transform: "translateX(" + fromX + "px)", opacity: fromOpacity }, { transform: "translateX(0)", opacity: 1 }],
          { duration: 380, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)" }
        );
        back.finished.catch(() => {}).finally(() => { mainEl.style.willChange = ""; });
      }
    }
    window.addEventListener("touchend", (e) => endTouch(e, false), { passive: true });
    window.addEventListener("touchcancel", (e) => endTouch(e, true), { passive: true });

    // --- Trackpad / horizontal wheel swipe ---
    let wheelAcc = 0, wheelLocked = false, wheelTimer = 0;
    window.addEventListener("wheel", (e) => {
      if (e.ctrlKey || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => { wheelLocked = false; wheelAcc = 0; }, 160); // unlocks once the swipe's momentum ends
      if (wheelLocked || busy) return;
      wheelAcc += e.deltaX;
      if (Math.abs(wheelAcc) > 90) {
        wheelLocked = true;
        step(wheelAcc > 0 ? 1 : -1);
        wheelAcc = 0;
      }
    }, { passive: true });

    // --- Keyboard: left and right arrow keys ---
    document.addEventListener("keydown", (e) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      if (e.target.closest && e.target.closest(IGNORE + ", [contenteditable='true']")) return;
      step(e.key === "ArrowRight" ? 1 : -1);
    });

    // --- Keep the pager in step with normal scrolling ---
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { render(); ticking = false; });
    }, { passive: true });
    window.addEventListener("resize", () => render());

    // --- One-time hint ---
    function hideHint() { if (hint) hint.classList.remove("is-shown"); }
    let hintSeen = false;
    try { hintSeen = localStorage.getItem("portfolio-swipe-hint") === "1"; } catch (_) { /* ignore */ }
    if (hint && !hintSeen) {
      hint.textContent = window.matchMedia("(pointer: coarse)").matches
        ? "Swipe left or right to change page"
        : "Swipe, or press the \u2190 \u2192 keys, to change page";
      setTimeout(() => hint.classList.add("is-shown"), 1400);
      setTimeout(hideHint, 7000);
      try { localStorage.setItem("portfolio-swipe-hint", "1"); } catch (_) { /* ignore */ }
    }

    render(true);
    pager.hidden = false;
  }

  /* ---------- Footer year ---------- */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
