(() => {
  // ====== DOM ======
  const statusLine = document.getElementById("statusLine");
  const levelsList = document.getElementById("levelsList");

  const btnImportSeed = document.getElementById("btnImportSeed");
  const btnAdd = document.getElementById("btnAdd");
  const btnLogout = document.getElementById("btnLogout");

  // modal
  const levelModal = document.getElementById("levelModal");
  const levelForm = document.getElementById("levelForm");
  const levelFormError = document.getElementById("levelFormError");

  const $ = (id) => document.getElementById(id);

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

  // ====== state ======
  let levelsCache = [];

  // ====== utils ======
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

  function getToken() {
    // ja tev tokens ir citādi, pielāgo šeit
    return localStorage.getItem("adminToken") || "";
  }

  async function apiJSON(url, opts = {}) {
    const token = getToken();
    const headers = {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    };
    if (token) headers["x-admin-token"] = token;

    const res = await fetch(url, {
      ...opts,
      headers,
    });

    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (_) {}

    if (!res.ok) {
      const msg = data?.error || data?.message || `HTTP ${res.status}`;
      throw new Error(msg);
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

  // ====== modal open/close ======
  function openModal(mode, level = null) {
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
      f_id.value = level.id ?? "";
      f_title.value = level.title ?? "";
      f_background.value = level.background ?? "";
      f_targetSlot.value = Number(level.targetSlot ?? 1);
      f_answer.value = level.answer ?? "";
      f_cardHtml.value = level.cardHtml ?? "";
      f_hint1.value = level.hint1 ?? "";
      f_hint2.value = level.hint2 ?? "";
      f_hint3.value = level.hint3 ?? "";
      f_sortOrder.value = (level.sortOrder ?? 100);
      f_active.checked = !!level.active;
    }

    levelModal.classList.remove("hidden");
    levelModal.setAttribute("aria-hidden", "false");
    setTimeout(() => f_title.focus(), 0);
  }

  function closeModal() {
    levelModal.classList.add("hidden");
    levelModal.setAttribute("aria-hidden", "true");
  }

  levelModal.addEventListener("click", (e) => {
    const el = e.target;
    if (el?.dataset?.close) closeModal();
  });

  window.addEventListener("keydown", (e) => {
    if (!levelModal.classList.contains("hidden") && e.key === "Escape") closeModal();
  });

  // ====== collect payload ======
  function buildPayload() {
    const title = f_title.value.trim();
    const background = f_background.value.trim();
    const targetSlot = Number(f_targetSlot.value);
    const answer = f_answer.value.trim();

    if (!title) throw new Error("Title ir obligāts.");
    if (!Number.isFinite(targetSlot) || targetSlot < 1 || targetSlot > 9) {
      throw new Error("Target slot jābūt 1..9.");
    }
    if (!answer) throw new Error("Answer ir obligāts.");

    const sortOrderRaw = String(f_sortOrder.value ?? "").trim();
    const sortOrder = sortOrderRaw === "" ? 100 : Number(sortOrderRaw);
    if (!Number.isFinite(sortOrder)) throw new Error("Sort order jābūt skaitlim.");

    return {
      title,
      background: background || null,
      targetSlot,
      answer,
      cardHtml: f_cardHtml.value ?? "",
      hint1: f_hint1.value ?? "",
      hint2: f_hint2.value ?? "",
      hint3: f_hint3.value ?? "",
      sortOrder,
      active: !!f_active.checked,
    };
  }

  // ====== render list ======
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
          <div class="name">
            #${escapeHTML(lvl.id)} — ${escapeHTML(lvl.title)} ${badge}
          </div>
          <div class="desc">
            sort: ${escapeHTML(lvl.sortOrder)} · slot: ${escapeHTML(lvl.targetSlot)} · bg: ${escapeHTML(lvl.background || "—")}
          </div>
        </div>

        <div style="display:flex; gap:10px; align-items:center;">
          <button class="btn" type="button" data-edit-id="${escapeHTML(lvl.id)}">Edit</button>
          <button class="btn-toggle" type="button" data-toggle-id="${escapeHTML(lvl.id)}" data-active="${lvl.active ? "1" : "0"}">
            ${lvl.active ? "Izslēgt" : "Ieslēgt"}
          </button>
        </div>
      `;
      levelsList.appendChild(row);
    }
  }

  async function loadLevels() {
    setStatus("Ielādēju līmeņus...");
    const data = await apiJSON("/api/admin/levels");
    levelsCache = data.levels || [];
    renderLevels(levelsCache);
    setStatus(`Līmeņi: ${levelsCache.length}`);
  }

  // ====== events: list buttons ======
  levelsList.addEventListener("click", async (e) => {
    const toggleBtn = e.target.closest("[data-toggle-id]");
    const editBtn = e.target.closest("[data-edit-id]");

    if (toggleBtn) {
      const id = Number(toggleBtn.dataset.toggleId);
      const current = toggleBtn.dataset.active === "1";
      const next = !current;

      toggleBtn.disabled = true;
      try {
        await apiJSON(`/api/admin/levels/${id}`, {
          method: "PUT",
          body: JSON.stringify({ active: next }),
        });
        await loadLevels();
      } catch (err) {
        alert(err.message || "Neizdevās pārslēgt active.");
      } finally {
        toggleBtn.disabled = false;
      }
      return;
    }

    if (editBtn) {
      const id = Number(editBtn.dataset.editId);
      const lvl = levelsCache.find((x) => Number(x.id) === id);
      if (!lvl) return;
      openModal("edit", lvl);
      return;
    }
  });

  // ====== submit modal ======
  levelForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();

    const btn = document.getElementById("btnSaveLevel");
    const prev = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Saglabā...";

    try {
      const payload = buildPayload();
      const id = f_id.value ? Number(f_id.value) : null;

      if (!id) {
        await apiJSON("/api/admin/levels", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else {
        await apiJSON(`/api/admin/levels/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      }

      closeModal();
      await loadLevels();
    } catch (err) {
      showError(err.message || "Neizdevās saglabāt.");
    } finally {
      btn.disabled = false;
      btn.textContent = prev;
    }
  });

  // ====== header buttons ======
  btnAdd.addEventListener("click", () => openModal("add"));

  btnImportSeed.addEventListener("click", async () => {
    if (!confirm("Importēt līmeņus no seed? (Pievienos tikai trūkstošos)")) return;
    try {
      setStatus("Importēju seed...");
      const data = await apiJSON("/api/admin/import-seed", { method: "POST" });
      setStatus(`Seed imports OK. Inserted: ${data?.summary?.inserted ?? 0}, skipped: ${data?.summary?.skipped ?? 0}`);
      await loadLevels();
    } catch (err) {
      alert(err.message || "Seed imports neizdevās.");
      setStatus("Seed imports neizdevās.");
    }
  });

  btnLogout.addEventListener("click", () => {
    // ja tev ir login lapa ar tokenu, šis ir ok
    localStorage.removeItem("adminToken");
    window.location.href = "/admin";
  });

  // ====== init ======
  loadLevels().catch((e) => {
    console.error(e);
    setStatus("Neizdevās ielādēt līmeņus.");
  });
})();