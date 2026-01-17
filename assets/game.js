// assets/game.js
(() => {
  const symbols = ["★","☾","▲","◆","✚","⬣","⬟","●","▣"];

  const intro = {
    greeting: "Čau, Nikola! Daudz laimes dzimšanas dienā! Esam tev sarūpējuši vienu dāvanu, kas liks parakāties atmiņas dzīlēs, paskaitīt, iespējams pasvīst un cerams sagādās pozitīvas emocijas. Vai esi gatava?",
    answer: "jā",
    wrongHint: "tiešām?"
  };

  const levels = [
    {
      id: 1,
      title: "",
      background: "bg.jpg",
      targetSlot: 1,
      answer: "345",
      cardHtml: `
        <p>Kas par fantastisku Gadu Secību bijusi.</p>
        <p class="muted">Uzgriez kodu pretī izvēlētajam simbolam.</p>
      `,
      hint1: "Padoms #1 (L1) — paskaties uz GADU secību.",
      hint2: "Padoms #2 (L1) — cipari ir tieši 3 un tie ir redzami vienā līnijā.",
      hint3: "Padoms #3 (L1) — uzgriez līdz MĒRĶA simbolam.",
    },
    {
      id: 2,
      title: "",
      background: "bg1.jpg",
      targetSlot: 0,
      answer: "149",
      cardHtml: `
        <p>Steady, Dress up, Go!</p>
        <p class="muted">Uzgriez kodu pretī izvēlētajam simbolam.</p>
      `,
      hint1: "",
      hint2: "",
      hint3: "",
    },
    {
      id: 3,
      title: "",
      background: "bg2.jpg",
      targetSlot: 3,
      answer: "159",
      cardHtml: `
        <p></p>
        <p class="muted">Uzgriez kodu pretī izvēlētajam simbolam.</p>
      `,
      hint1: "",
      hint2: "",
      hint3: "",
    },
    {
      id: 4,
      title: "",
      background: "bg3.jpg",
      targetSlot: 2,
      answer: "317",
      cardHtml: `
        <p></p>
        <p class="muted">Uzgriez kodu pretī izvēlētajam simbolam.</p>
      `,
      hint1: "",
      hint2: "",
      hint3: "",
    },
    {
      id: 5,
      title: "",
      background: "bg4.jpg",
      targetSlot: 6,
      answer: "368",
      cardHtml: `
        <p></p>
        <p class="muted">Uzgriez kodu pretī izvēlētajam simbolam.</p>
      `,
      hint1: "",
      hint2: "",
      hint3: "",
    },
  ];

  const wrongMessages = [
    { text: "Tā jau nu gan nebūs",                 sound: "assets/sound/wrong_01.m4a" },
    { text: "Sīkais, nu tu dod...",                sound: "assets/sound/wrong_09.m4a" },
    { text: "Ola, Ola, seniorita...",              sound: "assets/sound/wrong_08.m4a" },
    { text: "Wtf...",                              sound: "assets/sound/wrong_07.m4a" },
    { text: "Vēl kaut kādas grandiozas idejas..",  sound: "assets/sound/wrong_06.m4a" },
    { text: "Asprāte, ja?",                        sound: "assets/sound/wrong_05.m4a" },
    { text: "Atpakaļ uz bērnu dārzu?",             sound: "assets/sound/wrong_04.m4a" },
    { text: "Saņemies, tu to vari?",               sound: "assets/sound/wrong_03.m4a" },
    { text: "Es zinu, ka tu vari labāk!",          sound: "assets/sound/wrong_02.m4a" },
    { text: "Forza, forza!!!",                     sound: "assets/sound/wrong_10.m4a" },
  ];

  // ===== DOM =====
  const scene = document.getElementById("scene");

  const diskShell = document.getElementById("diskShell");
  const canvas = document.getElementById("diskCanvas");

  const cardTitle = document.getElementById("cardTitle");
  const cardBody = document.getElementById("cardBody");
  const feedback = document.getElementById("feedback");
  const targetSymbolLabel = document.getElementById("targetSymbolLabel");
  const taskCard = document.getElementById("taskCard");

  const nextBtn = document.getElementById("nextBtn");

  const welcome = document.getElementById("welcome");
  const welcomeTitle = document.getElementById("welcomeTitle");
  const welcomeInput = document.getElementById("welcomeInput");
  const welcomeHint = document.getElementById("welcomeHint");

  const resultMsg = document.getElementById("resultMsg");

  function normalize(s){
    return (s || "").trim().toLowerCase();
  }

  function showWelcomeHint(txt){
    if (!welcomeHint) return;
    welcomeHint.textContent = txt;
    welcomeHint.classList.add("show");
    setTimeout(() => welcomeHint.classList.remove("show"), 900);
  }

  function startGame(){
    if (window.Hints && typeof window.Hints.show === "function") window.Hints.show();
    loadLevel(0);
    closeDisk();
  }

  function setupWelcome(){
    if (!welcome) { startGame(); return; }
    welcomeTitle.textContent = intro.greeting;

    let isComposing = false;

    function tryValidateWelcome(force = false) {
      const v = normalize(welcomeInput.value);
      if (!force && v.length < 2) return;

      if (v === normalize(intro.answer)) {
        welcome.style.display = "none";
        startGame();
      } else {
        showWelcomeHint(intro.wrongHint);
        welcomeInput.value = "";
        welcomeInput.focus();
      }
    }

    welcomeInput.addEventListener("compositionstart", () => { isComposing = true; });
    welcomeInput.addEventListener("compositionend", () => { isComposing = false; tryValidateWelcome(); });
    welcomeInput.addEventListener("input", () => { if (!isComposing) tryValidateWelcome(); });

    welcomeInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        tryValidateWelcome(true);
      }
    });

    setTimeout(() => welcomeInput.focus(), 0);
  }

  // ===== Disk =====
  const disk = window.DiskGameDisk.create({
    canvas,
    targetSlot: 0,
    symbols,
  });

  let levelIndex = 0;

  function normalizeHints(lvl){
    const arr = [];
    if (Array.isArray(lvl.hints)) {
      for (let i=0; i<lvl.hints.length; i++){
        const h = lvl.hints[i];
        if (typeof h === "string") arr.push({ text: h });
        else if (h && typeof h === "object") arr.push(h);
      }
    } else {
      if (lvl.hint1 != null) arr.push({ text: String(lvl.hint1) });
      if (lvl.hint2 != null) arr.push({ text: String(lvl.hint2) });
      if (lvl.hint3 != null) arr.push({ text: String(lvl.hint3) });
    }
    while (arr.length < 3) arr.push({ text: "" });
    return arr.slice(0,3).map((h, idx) => ({
      title: h.title || `Padoms ${idx+1}`,
      text: h.text || ""
    }));
  }

  function setHintsForLevel(lvl){
    const hints = normalizeHints(lvl);
    if (window.Hints && typeof window.Hints.setHints === "function") {
      window.Hints.setHints(hints);
      if (typeof window.Hints.close === "function") window.Hints.close();
      if (typeof window.Hints.show === "function") window.Hints.show();
    }
  }

  let isOpen = false;
  let solved = false;

  // ===== Audio unlock =====
  let audioUnlocked = false;
  function unlockAudioOnce() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    const a = new Audio("assets/sound/wrong_01.m4a");
    a.volume = 0;
    a.play().then(() => { a.pause(); a.currentTime = 0; }).catch(() => {});
  }
  document.addEventListener("pointerdown", unlockAudioOnce, { once: true });
  document.addEventListener("keydown", unlockAudioOnce, { once: true });

  let wrongPool = [...wrongMessages];

  function playSfx(src) {
    if (!src) return;
    const a = new Audio(src);
    a.preload = "auto";
    a.play().catch(() => {});
  }

  function getNextWrongMessage() {
    if (wrongPool.length === 0) wrongPool = [...wrongMessages];
    const idx = Math.floor(Math.random() * wrongPool.length);
    const item = wrongPool.splice(idx, 1)[0];
    playSfx(item.sound);
    return item.text;
  }

  function setNextVisible(visible) {
    nextBtn.hidden = !visible;
  }

  function resetResultUI() {
    resultMsg.textContent = "";
    setNextVisible(false);
  }

  function loadLevel(i) {
    levelIndex = i;
    const lvl = levels[levelIndex];

    setHintsForLevel(lvl);

    scene.style.backgroundImage = `url("assets/${lvl.background}")`;

    cardTitle.textContent = lvl.title;
    cardBody.innerHTML = lvl.cardHtml;

    targetSymbolLabel.textContent = symbols[lvl.targetSlot];
    disk.setTargetSlot(lvl.targetSlot);

    solved = false;
    resetResultUI();

    if (isOpen) {
      feedback.innerHTML =
        `Uzgriez disku, līdz pretī mērķa simbolam <strong>${symbols[lvl.targetSlot]}</strong> redzi kodu. ` +
        `Kad esi gatavs, spied centrā <strong>Pārbaudīt</strong>.`;
      disk.setInteractive(true);
    } else {
      feedback.innerHTML =
        `Klikšķini uz diska stūrī, lai atvērtu. Kad pareizi — centrā parādīsies <strong>OK</strong>.`;
      disk.setInteractive(true);
    }
  }

  // ===== Init hints =====
  if (window.Hints && typeof window.Hints.init === "function") {
    try { window.Hints.init({ mountEl: scene }); } catch (e) {}
  }

  disk.setInteractive(true);
  setupWelcome();

  function openDisk() {
    if (isOpen) return;
    isOpen = true;

    const lvl = levels[levelIndex];

    if (window.Hints && typeof window.Hints.close === "function") window.Hints.close();

    diskShell.classList.add("disk-center");
    diskShell.classList.remove("disk-corner");

    disk.setInteractive(true);

    feedback.innerHTML =
      `Uzgriez disku, līdz pretī mērķa simbolam <strong>${symbols[lvl.targetSlot]}</strong> redzi kodu. ` +
      `Kad esi gatavs, spied centrā <strong>Pārbaudīt</strong>.`;
  }

  function closeDisk() {
    if (!isOpen) return;
    isOpen = false;

    diskShell.classList.add("disk-corner");
    diskShell.classList.remove("disk-center");

    disk.setInteractive(false);
  }

  function showFinalScreen() {
    if (isOpen) closeDisk();

    if (window.Hints && typeof window.Hints.hide === "function") {
      window.Hints.hide();
    } else if (window.Hints && typeof window.Hints.close === "function") {
      window.Hints.close();
    }

    setTimeout(() => {
      if (taskCard) taskCard.hidden = true;
      if (diskShell) diskShell.hidden = true;
      try { disk.setInteractive(false); } catch(e) {}
      scene.style.backgroundImage = `url("assets/finiss.jpg")`;
    }, 220);
  }

  // atver tikai stūrī
  diskShell.addEventListener("click", () => {
    if (!diskShell.classList.contains("disk-corner")) return;
    openDisk();
  });

  // ✅ FIX: mobile drošs "tap outside closes disk"
  function shouldIgnoreOutsideClose(target) {
    if (!target) return false;

    // ja klikšķis ir uz hintiem – nedrīkst aizvērt disku
    if (target.closest(".hint-stack")) return true;
    if (target.closest(".hint-card")) return true;
    if (target.closest(".hint-backdrop")) return true;

    return false;
  }

  function outsideCloseHandler(e) {
    if (!isOpen) return;

    if (diskShell.contains(e.target)) return;
    if (taskCard && taskCard.contains(e.target)) return;
    if (shouldIgnoreOutsideClose(e.target)) return;

    closeDisk();
  }

  // CAPTURE režīms = nostrādā pirms canvas/diska iekšējiem handleriem
  window.addEventListener("pointerdown", outsideCloseHandler, true);
  window.addEventListener("click", outsideCloseHandler, true);

  // ===== Check =====
  disk.setOnCheck(() => {
    if (!isOpen) return;

    const lvl = levels[levelIndex];
    const atTarget = disk.getCodeAtTarget();

    if (atTarget === lvl.answer) {
      solved = true;
      disk.renderStatus("OK", true);

      const isLast = levelIndex >= levels.length - 1;

      if (isLast) {
        setNextVisible(false);
        resultMsg.textContent = "";
        feedback.innerHTML = `Pareizi!`;
        setTimeout(() => showFinalScreen(), 420);
        return;
      }

      resultMsg.textContent = "";
      setNextVisible(true);
      feedback.innerHTML = `Pareizi! Spied <strong>Tālāk</strong>, lai pārietu uz nākamo uzdevumu.`;
    } else {
      solved = false;
      disk.renderStatus("NĒ", false);

      setNextVisible(false);
      resultMsg.textContent = getNextWrongMessage();

      feedback.innerHTML = `Pamēģini vēlreiz. Uzgriez kodu pretī <strong>${symbols[lvl.targetSlot]}</strong> un spied <strong>Pārbaudīt</strong>.`;

      setTimeout(() => {
        if (!solved && isOpen) disk.setInteractive(true);
      }, 800);
    }
  });

  // ===== Next =====
  nextBtn.addEventListener("click", () => {
    if (!solved) return;

    const isLast = levelIndex >= levels.length - 1;
    if (isLast) {
      showFinalScreen();
      return;
    }

    loadLevel(levelIndex + 1);
    disk.setInteractive(true);
    resultMsg.textContent = "";
    closeDisk();
  });
})();