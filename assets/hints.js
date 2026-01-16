// assets/hints.js
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

    const backdrop = el("div", "hint-backdrop", { hidden: "" });
    backdrop.addEventListener("pointerdown", (e) => {
      if (e.target === backdrop) close();
    });

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

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        open(i);
      });

      return btn;
    };

    const c0 = makeCard(0);
    const c1 = makeCard(1);
    const c2 = makeCard(2);

    stack.appendChild(c0);
    stack.appendChild(c1);
    stack.appendChild(c2);

    state.cards = [c0, c1, c2];

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    state.mountEl.appendChild(backdrop);
    state.mountEl.appendChild(stack);

    state.backdropEl = backdrop;
    state.stackEl = stack;
    state.mounted = true;

    render();
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
      if (backText) backText.textContent = (h.text && h.text.trim()) ? h.text : "Šim līmenim vēl nav padoma.";
    }
  }

  function open(i) {
    if (!state.mounted) return;

    if (state.activeIndex === i) return;

    close(false);

    state.activeIndex = i;

    // ✅ parādam backdrop, lai klikšķis fonā aizver
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

  function hide(){
    if (!state.mounted) return;
    close();
    state.stackEl.style.display = "none";
    state.backdropEl.hidden = true;
  }

  function show(){
    if (!state.mounted) return;
    state.stackEl.style.display = "";
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

  window.Hints = { init, setHints, close, hide, show };
})();