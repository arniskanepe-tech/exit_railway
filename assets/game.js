// assets/game.js
(async () => {
  // ============ Konfigurācija ============
  const symbols = ["★","☾","▲","◆","✚","⬣","⬟","●","▣"];

  const bgm = document.getElementById("bgm");
  if (bgm) bgm.volume = 0.22; // fons klusāks

  function startBgmOnce() {
    if (!bgm) return;
    if (!bgm.paused) return;

    bgm.play().catch(() => {
      // iOS var nobloķēt līdz pirmajam user-gesture
    });
  }

  window.addEventListener("pointerdown", startBgmOnce, { once: true });
  window.addEventListener("keydown", startBgmOnce, { once: true });

  // ===== Welcome / start gate =====
  const intro = {
    greeting: "Čau, Nikola! Daudz laimes dzimšanas dienā! Esam tev sarūpējuši vienu dāvanu, kas liks parakāties atmiņas dzīlēs, paskaitīt, iespējams pasvīst un cerams sagādās pozitīvas emocijas. Vai esi gatava?",
    answer: "jā",
    wrongHint: "tiešām?"
  };

  // ===== Default līmeņi (fallback, ja DB nav pieejams) =====
  const DEFAULT_LEVELS = [
    {
      id: 1,
      title: "",
      background: "bg.jpg",
      targetSlot: 1,      // ☾
      answer: "532",
      cardHtml: `
        <p>Kas par fantastisku Gadu Secību bijusi.</p>
        <p class="muted">Uzgriez kodu pretī izvēlētajam simbolam.</p>
      `,
      hint1: "Šobrīd ir 2026.gads.",
      hint2: "Tu taču saproti, mazāks riņķis agrāks gads - loģiski ne?",
      hint3: "Bledā mēs bijām 2025.gadā! Un tu saproti, ka uz diska nevar izvēlēties vairāk kā 1 ciparu, turklāt kāda jēga visos apļos būtu rakstīt to, kas atkārtojas! ",
    },
    {
      id: 2,
      title: "",
      background: "bg1.jpg",
      targetSlot: 0,      // ★
      answer: "941",
      cardHtml: `
        <p>Steady, Dress up, Go!</p>
        <p class="muted">Uzgriez kodu pretī izvēlētajam simbolam.</p>
      `,
      hint1: "Šī uzdevuma veikšanai nāksies silti saģērbties!",
      hint2: "Pievēsi uzmanību skaitļiem uz pakāpieniem? Esi kaut kur tos redzējusi? Ja gadienā kāds cipars nav redzams tas nenozīmē ka dabā viņa nav, ja?",
      hint3: "Formula uz akmens droši vien nav rakstīta tāpat viens. Iegūtajā kodā cipari ir atšķirīgi un pakāpienu vērtības nav vienādas. Kādam krāsas pakāpienam lielāka vērtība, kādam mazāka. Ja ar to vēl ir par maz, tad viss ko varu piebilst ir - All the way to the top",
    },
    {
      id: 3,
      title: "",
      background: "bg2.jpg",
      targetSlot: 3,      // ◆
      answer: "591",
      cardHtml: `
        <p></p>
        <p class="muted">Uzgriez kodu pretī izvēlētajam simbolam.</p>
      `,
      hint1: "Šo uzdevumu nevarēs veikt bez Tavas mobilās ierīces palīdzības.",
      hint2: "Bildē izmētātie skaitļi nav mazsvarīgi, tikai ko tie nozīmē, un kāds tam sakars ar mobilo ierīci?",
      hint3: "Varētu būt viens no datuma formātiem, ne? Un vai tik tu tajā datumā neveici skrējienu? Nez cik tas bija grūts? Jā un sirds ritms ir aidzdomīgi daudzkrāsains.",
    },
    {
      id: 4,
      title: "",
      background: "bg3.jpg",
      targetSlot: 2,      // ▲
      answer: "317",
      cardHtml: `
        <p></p>
        <p class="muted">Uzgriez kodu pretī izvēlētajam simbolam.</p>
      `,
      hint1: "Tev var nākties meklēt bildē sīkumus - zooom in",
      hint2: "3 grāmatas 3 valodas 3 skaiļi",
      hint3: "Grāmatas ir dažādās krāsās, pa visu bildi izmētāti teksti",
    },
    {
      id: 5,
      title: "",
      background: "bg4.jpg",
      targetSlot: 6,      // ⬟
      answer: "368",
      cardHtml: `
        <p></p>
        <p class="muted">Uzgriez kodu pretī izvēlētajam simbolam.</p>
      `,
      hint1: "Šāvējām ir stilīgi kostīmi, ne? Un krāsas pazīstamas, bet neviena nav baltās drēbēs, labi ka ir ziema un daudz sniega.",
      hint2: "Kā tev kafejnīcas nosaukums? Un piedāvātās atlaides?",
      hint3: "Tīra matemātika, šur tur %, šur tur trijstūri :))) Ā - vēl liekas nulles, bet tāpēc jau trasei ir mērogs",
    },
  ];

  let levels = DEFAULT_LEVELS;

  // ===== Ielādē līmeņus no DB (Railway) ar fallback =====
  async function loadLevelsFromApi(){
    try {
      const res = await fetch("/api/levels/active", { cache: "no-store" });
      const data = await res.json();
      if (data && data.ok && Array.isArray(data.levels) && data.levels.length > 0) {
        levels = data.levels;
        console.log("Levels loaded from DB:", levels.length);
      } else {
        levels = DEFAULT_LEVELS;
        console.warn("DB levels empty/invalid -> using DEFAULT_LEVELS");
      }
    } catch (e) {
      levels = DEFAULT_LEVELS;
      console.warn("Failed to load levels from API -> using DEFAULT_LEVELS", e);
    }
  }

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

  // ============ DOM ============
  const scene = document.getElementById("scene");
  const diskShell = document.getElementById("diskShell");
  const canvas = document.getElementById("diskCanvas");

  const cardTitle = document.getElementById("cardTitle");
  const cardBody = document.getElementById("cardBody");
  const feedback = document.getElementById("feedback");
  const targetSymbolLabel = document.getElementById("targetSymbolLabel");
  const taskCard = document.getElementById("taskCard");
  const taskBackdrop = document.getElementById("taskBackdrop");
  const targetBtn = document.getElementById("targetBtn");

  const nextBtn = document.getElementById("nextBtn");
  const resultMsg = document.getElementById("resultMsg");

  // ===== Welcome elements =====
  const welcome = document.getElementById("welcome");
  const welcomeTitle = document.getElementById("welcomeTitle");
  const welcomeInput = document.getElementById("welcomeInput");
  const welcomeHint = document.getElementById("welcomeHint");

  function normalize(s){ return (s || "").trim().toLowerCase(); }

  function showWelcomeHint(txt){
    if (!welcomeHint) return;
    welcomeHint.textContent = txt;
    welcomeHint.classList.add("show");
    setTimeout(() => welcomeHint.classList.remove("show"), 900);
  }

  // ============ Disks ============
  const disk = window.DiskGameDisk.create({
    canvas,
    targetSlot: 0,
    symbols,
  });

  // ============ State ============
  let levelIndex = 0;
  let isOpen = false;          // disk open
  let solved = false;
  let isTaskOpen = false;      // task modal open

  // ===== Audio unlock (iOS/Safari) =====
  let audioUnlocked = false;
  function unlockAudioOnce() {
    if (audioUnlocked) return;
    audioUnlocked = true;

    const a = new Audio("assets/sound/wrong_01.m4a");
    a.volume = 0;
    a.play()
      .then(() => { a.pause(); a.currentTime = 0; })
      .catch(() => {});
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

  function setNextVisible(visible) { nextBtn.hidden = !visible; }

  function resetResultUI() {
    resultMsg.textContent = "";
    setNextVisible(false);
  }

  // ===== Hints =====
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

  // ✅ init Hints
  if (window.Hints && typeof window.Hints.init === "function") {
    try { window.Hints.init({ mountEl: scene }); } catch (e) {}
  }

  // ===== Task modal open/close =====
  function openTask(){
    if (!taskCard) return;

    if (window.Hints && typeof window.Hints.close === "function") window.Hints.close();
    if (isOpen) closeDisk();

    isTaskOpen = true;
    taskCard.classList.add("is-open");
    taskCard.setAttribute("aria-hidden", "false");

    if (taskBackdrop) taskBackdrop.hidden = false;
  }

  function closeTask(){
    if (!taskCard) return;
    isTaskOpen = false;

    taskCard.classList.remove("is-open");
    taskCard.setAttribute("aria-hidden", "true");

    if (taskBackdrop) taskBackdrop.hidden = true;
  }

  if (taskBackdrop) {
    taskBackdrop.addEventListener("pointerdown", () => closeTask());
  }

  if (targetBtn) {
    targetBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (isTaskOpen) closeTask();
      else openTask();
    });
  }

  // ===== Level loader =====
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

    taskCard.classList.remove("show-result-only");
    closeTask();
  }

  // ===== Welcome flow =====
  function startGame(){
    if (window.Hints && typeof window.Hints.show === "function") window.Hints.show();
    loadLevel(0);
    closeDisk();
    closeTask();
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

    welcomeInput.addEventListener("input", () => {
      if (isComposing) return;
      tryValidateWelcome();
    });

    welcomeInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        tryValidateWelcome(true);
      }
    });

    setTimeout(() => welcomeInput.focus(), 0);
  }

  // ===== Disk open/close =====
  function openDisk() {
    if (isOpen) return;
    isOpen = true;

    closeTask();
    if (window.Hints && typeof window.Hints.close === "function") window.Hints.close();

    const lvl = levels[levelIndex];

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

  diskShell.addEventListener("click", () => {
    if (!diskShell.classList.contains("disk-corner")) return;
    openDisk();
  });

  document.addEventListener("pointerdown", (e) => {
    if (isOpen) {
      if (!diskShell.contains(e.target) && !(taskCard && taskCard.contains(e.target))) {
        closeDisk();
      }
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeTask();
    if (window.Hints && typeof window.Hints.close === "function") window.Hints.close();
    if (isOpen) closeDisk();
  });

  // ===== Fināls =====
  function showFinalScreen() {
    if (isOpen) closeDisk();
    closeTask();

    if (taskCard) {
      taskCard.classList.remove("is-open");
      taskCard.classList.remove("show-result-only");
    }
    if (taskBackdrop) taskBackdrop.hidden = true;

    if (window.Hints && typeof window.Hints.hide === "function") {
      window.Hints.hide();
    } else if (window.Hints && typeof window.Hints.close === "function") {
      window.Hints.close();
    }

    if (targetBtn) targetBtn.hidden = true;

    setTimeout(() => {
      if (diskShell) diskShell.hidden = true;
      try { disk.setInteractive(false); } catch(e) {}
      scene.style.backgroundImage = `url("assets/finiss.jpg")`;
    }, 220);
  }

  // ========= POGA “Pārbaudīt” =========
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

        setTimeout(() => {
          showFinalScreen();
        }, 420);

        return;
      }

      resultMsg.textContent = "";
      setNextVisible(true);
      feedback.innerHTML = `Pareizi! Spied <strong>Tālāk</strong>, lai pārietu uz nākamo uzdevumu.`;
      taskCard.classList.add("show-result-only");
      openTask();
    } else {
      solved = false;
      disk.renderStatus("NĒ", false);

      setNextVisible(false);
      resultMsg.textContent = getNextWrongMessage();

      feedback.innerHTML =
        `Pamēģini vēlreiz. Uzgriez kodu pretī <strong>${symbols[lvl.targetSlot]}</strong> un spied <strong>Pārbaudīt</strong>.`;

      setTimeout(() => {
        if (!solved && isOpen) disk.setInteractive(true);
      }, 800);
    }
  });

  // ========= TĀLĀK =========
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
    closeTask();
  });

  // ===== start =====
  disk.setInteractive(false);
  disk.setInteractive(true);

  // mēģinam ielādēt no DB, ja nesanāk — fallback uz DEFAULT_LEVELS
  await loadLevelsFromApi();

  setupWelcome();
})();
