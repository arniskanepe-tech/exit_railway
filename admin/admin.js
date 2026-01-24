(() => {
  const $ = (id) => document.getElementById(id);

  // =====================================================
  // LOGIN PAGE (admin/index.html)
  // =====================================================
  const loginForm = $("loginForm");
  const tokenInput = $("token");

  if (loginForm && tokenInput) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const token = tokenInput.value.trim();
      if (!token) {
        alert("Ievadi admin atslēgu");
        return;
      }

      localStorage.setItem("adminToken", token);
      window.location.href = "/admin/panel";
    });

    return; // ⬅️ ļoti svarīgi: login lapā NEIZPILDĀM panel kodu
  }

  // =====================================================
  // ADMIN PANEL (admin/panel.html)
  // =====================================================
  const statusLine = $("statusLine");
  const levelsList = $("levelsList");

  const btnImportSeed = $("btnImportSeed");
  const btnAdd = $("btnAdd");

  // modal
  const levelModal = $("levelModal");
  const levelForm = $("levelForm");
  const levelFormError = $("levelFormError");

  const f_id = $("levelId");
  const f_title = $("f_title");
  const f_background = $("f_background");
  const f_targetSlot = $("f_targetSlot");
  const f_answer = $("f_answer");
  const f_cardHtml = $("f_cardHtml");
  const f_hint1 = $("f_hint1");
  const f_hint2 = $("f_hint2");
  const f_hint3 = $("f_hint3");
  const f_sortOrder = $("f_sortOrder");
  const f_active = $("f_active");

  let levelsCache = [];

  // =====================================================
  // UTILS
  // =====================================================
  function getToken() {
    return localStorage.getItem("adminToken") || "";
  }

  function setStatus(msg) {
    if (statusLine) statusLine.textContent = msg;
  }

  function showError(msg) {
    levelFormError.textContent = msg;
    levelFormError.classList.remove("hidden");
  }

  function clearError() {
    levelFormError.textContent = "";
    levelFormError.classList.add("hidden");
  }

  async function apiJSON(url, opts = {}) {
    const token = getToken();
    const headers = {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    };

    if (token) headers["x-admin-token"] = token;

    const res = await fetch(url, { ...opts, headers });
    const text = await res.text();

    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch {}

    if (!res.ok) {
      throw new Error(data?.error || `HTTP ${res.status}`);
    }

    return data;
  }

  function escapeHTML(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  // =====================================================
  // MODAL
  // =====================================================
  function openModal(mode, level = {}) {
    clearError();

    if (mode === "add") {
      $("levelModalTitle").textContent = "Pievienot līmeni";
      f_id.value = "";
      f_title.value = "";
      f_background.value = "";
      f_targetSlot.value = 1;
      f_answer.value = "";
      f_cardHtml.value = "";
      f_hint1.value = "";
      f_hint2.value = "";
      f_hint3.value = "";
      f_sortOrder.value = 100;
      f_active.checked = true;
    } else {
      $("levelModalTitle").textContent = `Rediģēt līmeni #${level.id}`;
      f_id.value = level.id;
      f_title.value = level.title || "";
      f_background.value = level.background || "";
      f_targetSlot.value = level.targetSlot || 1;
      f_answer.value = level.answer || "";
      f_cardHtml.value = level.cardHtml || "";
      f_hint1.value = level.hint1 || "";
      f_hint2.value = level.hint2 || "";
      f_hint3.value = level.hint3 || "";
      f_sortOrder.value = level.sortOrder ?? 100;
      f_active.checked = !!level.active;
    }

    levelModal.classList.remove("hidden");
    setTimeout(() => f_title.focus(), 0);
  }

  function closeModal() {
    levelModal.classList.add("hidden");
  }

  levelModal.addEventListener("click", (e) => {
    if (e.target.dataset.close !== undefined) closeModal();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !levelModal.classList.contains("hidden")) {
      closeModal();
    }
  });

  // =====================================================
  // DATA
  // =====================================================
  async function loadLevels() {
    setStatus("Ielādēju līmeņus...");
    const data = await apiJSON("/api/admin/levels");
    levelsCache = data.levels || [];
    renderLevels(levelsCache);
    setStatus(`Līmeņi: ${levelsCache.length}`);
  }

  function renderLevels(levels) {
    levelsList.innerHTML = "";

    if (!levels.length) {
      levelsList.innerHTML = `<div class="muted">Nav līmeņu.</div>`;
      return;
    }

    for (const lvl of levels) {
      const badge = lvl.active
        ? `<span class="badge badge-on">active</span>`
        : `<span class="badge badge-off">off</span>`;

      const row = document.createElement("div");
      row.className = "level-row";
      row.innerHTML = `
        <div class="level-meta">
          <div class="name">#${lvl.id} — ${escapeHTML(lvl.title)} ${badge}</div>
          <div class="desc">
            sort: ${lvl.sortOrder} · slot: ${lvl.targetSlot} · bg: ${escapeHTML(lvl.background || "—")}
          </div>
        </div>
        <div style="display:flex; gap:10px;">
          <button class="btn" data-edit="${lvl.id}">Edit</button>
          <button class="btn-toggle" data-toggle="${lvl.id}">
            ${lvl.active ? "Izslēgt" : "Ieslēgt"}
          </button>
        </div>
      `;
      levelsList.appendChild(row);
    }
  }

  // =====================================================
  // EVENTS
  // =====================================================
  levelsList.addEventListener("click", async (e) => {
    const editId = e.target.dataset.edit;
    const toggleId = e.target.dataset.toggle;

    if (editId) {
      const lvl = levelsCache.find(l => l.id == editId);
      if (lvl) openModal("edit", lvl);
    }

    if (toggleId) {
      await apiJSON(`/api/admin/levels/${toggleId}`, {
        method: "PUT",
        body: JSON.stringify({ active: !levelsCache.find(l => l.id == toggleId).active }),
      });
      await loadLevels();
    }
  });

  levelForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();

    try {
      const payload = {
        title: f_title.value.trim(),
        background: f_background.value || null,
        targetSlot: Number(f_targetSlot.value),
        answer: f_answer.value.trim(),
        cardHtml: f_cardHtml.value || "",
        hint1: f_hint1.value || null,
        hint2: f_hint2.value || null,
        hint3: f_hint3.value || null,
        sortOrder: Number(f_sortOrder.value || 100),
        active: f_active.checked,
      };

      if (!payload.title || !payload.answer) {
        throw new Error("Title un Answer ir obligāti");
      }

      const id = f_id.value;
      if (id) {
        await apiJSON(`/api/admin/levels/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiJSON("/api/admin/levels", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      closeModal();
      await loadLevels();
    } catch (err) {
      showError(err.message);
    }
  });

  btnAdd.addEventListener("click", () => openModal("add"));

  btnImportSeed.addEventListener("click", async () => {
    if (!confirm("Importēt seed?")) return;
    await apiJSON("/api/admin/import-seed", { method: "POST" });
    await loadLevels();
  });

  // =====================================================
  // INIT
  // =====================================================
  loadLevels().catch(() => {
    setStatus("Neizdevās ielādēt līmeņus");
  });
})();