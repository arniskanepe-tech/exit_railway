// assets/hints.js
// Hint kāršu UI/UX modulis (neatkarīgs no diska)
// Plain JS: window.Hints API (draudzīgs GitHub Pages)

(function () {
  const state = {
    mounted: false,
    mountEl: null,
    stackEl: null,
    backdropEl: null,
    cards: [],
    hints: [
      { title: "Padoms 1", text: "" },
      { title: "Padoms 2", text: "" },
      { title: "Padoms 3", text: "" },
    ],
    activeIndex: null,
    visible: true,
  };

  function el(tag, cls, attrs = {}) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === "text") n.textContent = v;
      else if (k === "html") n.innerHTML = v;
      else n.setAttribute(k, v);
    });
    return n;
  }

  function ensureDom() {
    if (state.mounted) return;

    // Backdrop (transparent; click outside -> close)
    const backdrop = el("div", "hint-backdrop", { hidden: "" });
    backdrop.addEventListener("pointerdown", (e) => {
      // klikšķis uz "tukšuma" aizver
      if (e.target === backdrop) close();
    });

    // Stack container
    const stack = el("div", "hint-stack", { "aria-label": "Padomi" });

    const makeCard = (i) => {
      const btn = el("button", `hint-card hc-${i + 1}`, {
        type: "button",
        "data-hint": String(i),
        "aria-label": `Padoms ${i + 1}`,
        "aria-expanded": "false",
      });

      const inner = el("div", "hint-card-inner");

      const front = el("div", "hint-card-face hint-front");
      front.appendChild(el("div", "hint-front-title", { text: `Padoms ${i + 1}` }));

      const back = el("div", "hint-card-face hint-back");
      back.appendChild(el("div", "hint-back-title", { text: `Padoms ${i + 1}` }));
      back.appendChild(el("div", "hint-back-text", { text: "" }));

      inner.appendChild(front);
      inner.appendChild(back);
      btn.appendChild(inner);

      // iOS drošībai: pointerdown + click
      const openHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        open(i);
      };

      btn.addEventListener("pointerdown", openHandler);
      btn.addEventListener("click", openHandler);

      return btn;
    };

    const c0 = makeCard(0);
    const c1 = makeCard(1);
    const c2 = makeCard(2);

    stack.appendChild(c0);
    stack.appendChild(c1);
    stack.appendChild(c2);

    state.cards = [c0, c1, c2];

    // ESC close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    // Global click outside close (papildus drošībai)
    window.addEventListener(
      "pointerdown",
      (e) => {
        if (state.activeIndex == null) return;

        const openCard = state.cards[state.activeIndex];
        if (!openCard) return;

        // ja klikšķis ir uz atvērtās kartes (vai tās iekšā), neaizveram
        if (openCard.contains(e.target)) return;

        // ja klikšķis ir uz kādas hint kartes/stack - ļaujam open() pārslēgt
        if (state.stackEl && state.stackEl.contains(e.target)) return;

        // citur — aizver
        close();
      },
      true // CAPTURE
    );

    // Mount
    state.mountEl.appendChild(backdrop);
    state.mountEl.appendChild(stack);

    state.backdropEl = backdrop;
    state.stackEl = stack;
    state.mounted = true;

    render();
    applyVisibility();
  }

  function applyVisibility() {
    if (!state.mounted) return;
    state.stackEl.style.display = state.visible ? "" : "none";
    // ja slēpjam - aizveram atvērto
    if (!state.visible) close(true);
  }

  function render() {
    for (let i = 0; i < 3; i++) {
      const card = state.cards[i];
      if (!card) continue;

      const h = state.hints[i] || { title: `Padoms ${i + 1}`, text: "" };

      const backTitle = card.querySelector(".hint-back-title");
      const backText = card.querySelector(".hint-back-text");
      const frontTitle = card.querySelector(".hint-front-title");

      if (frontTitle) frontTitle.textContent = h.title || `Padoms ${i + 1}`;
      if (backTitle) backTitle.textContent = h.title || `Padoms ${i + 1}`;
      if (backText) backText.textContent = (h.text && h.text.trim())
        ? h.text
        : "Šim līmenim vēl nav padoma.";
    }
  }

  function open(i) {
    if (!state.mounted) return;
    if (!state.visible) return;

    // ja jau atvērts tas pats — neko
    if (state.activeIndex === i) return;

    // aizver iepriekšējo, bet activeIndex neatmetam uz null (resetActive=false)
    close(false);

    state.activeIndex = i;

    // ✅ parādām backdrop (tas ir caurspīdīgs, bet vajadzīgs klikšķim ārpusē)
    state.backdropEl.hidden = false;

    const card = state.cards[i];
    if (card) {
      card.classList.add("is-open");
      card.setAttribute("aria-expanded", "true");
    }
  }

  function close(resetActive = true) {
    if (!state.mounted) return;

    state.cards.forEach((c) => {
      c.classList.remove("is-open");
      c.setAttribute("aria-expanded", "false");
    });

    // ✅ paslēpjam backdrop
    state.backdropEl.hidden = true;

    if (resetActive) state.activeIndex = null;
  }

  function init({ mountEl }) {
    if (!mountEl) throw new Error("Hints.init({ mountEl }) nepieciešams mountEl");
    state.mountEl = mountEl;
    ensureDom();
  }

  function setHints(hintsArray) {
    const arr = Array.isArray(hintsArray) ? hintsArray.slice(0) : [];
    while (arr.length < 3) arr.push({ title: `Padoms ${arr.length + 1}`, text: "" });

    state.hints = arr.slice(0, 3).map((h, idx) => ({
      title: (h && h.title) ? String(h.title) : `Padoms ${idx + 1}`,
      text: (h && h.text) ? String(h.text) : "",
    }));

    if (state.mounted) render();
  }

  function show() {
    state.visible = true;
    if (state.mounted) applyVisibility();
  }

  function hide() {
    state.visible = false;
    if (state.mounted) applyVisibility();
  }

  window.Hints = { init, setHints, open, close, show, hide };
})();