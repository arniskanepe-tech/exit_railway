// assets/game.js
(() => {
  // ============ Konfigurācija (pagaidām hardcoded; vēlāk varēs vilkt no admin/JSON) ============
  const symbols = ["★","☾","▲","◆","✚","⬣","⬟","●","▣"];

  // ===== Welcome / start gate (dzimšanas dienas režīms) =====
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
      targetSlot: 1,      // ☾
      answer: "345",
      cardHtml: `
        <p>Kas par fantastisku Gadu Secību bijusi.</p>
        <p class="muted">Uzgriez kodu pretī izvēlētajam simbolam.</p>
      `,hint1: "Padoms #1 (L1) — paskaties uz GADU secību.",
      hint2: "Padoms #2 (L1) — cipari ir tieši 3 un tie ir redzami vienā līnijā.",
      hint3: "Padoms #3 (L1) — uzgriez līdz MĒRĶA simbolam.",
    
    },
    {
      id: 2,
      title: "",
      background: "bg1.jpg",
      targetSlot: 0,      // ★
      answer: "149",
      cardHtml: `
        <p>Steady, Dress up, Go!</p>
        <p class="muted">Uzgriez kodu pretī izvēlētajam simbolam.</p>
      `,hint1: "",
      hint2: "",
      hint3: "",
    
    },
    {
      id: 3,
      title: "",
      background: "bg2.jpg",
      targetSlot: 3,      // ◆ (symbols[3])
      answer: "159",
      cardHtml: `
        <p></p>
        <p class="muted">Uzgriez kodu pretī izvēlētajam simbolam.</p>
      `,hint1: "",
      hint2: "",
      hint3: "",
    
    },
    {
      id: 4,
      title: "",
      background: "bg3.jpg",
      targetSlot: 2,      // ▲ (symbols[2])
      answer: "317",
      cardHtml: `
        <p></p>
        <p class="muted">Uzgriez kodu pretī izvēlētajam simbolam.</p>
      `,hint1: "",
      hint2: "",
      hint3: "",
    
    },
    {
      id: 5,
      title: "",
      background: "bg4.jpg",
      targetSlot: 6,      // ⬟ (symbols[6])
      answer: "368",
      cardHtml: `
          <p></p>
          <p class="muted">Uzgriez kodu pretī izvēlētajam simbolam.</p>
      `,hint1: "",
      hint2: "",
      hint3: "",
    
    },
  ];

  // ✅ Teksts + skaņa vienā objektā (folderis repo ir assets/sound/)
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

  // ===== HINT KĀRTIS =====
  const hintStack = document.getElementById("hintStack");
  const hintButtons = hintStack ? Array.from(hintStack.querySelectorAll("[data-hint]")) : [];
  const hintOverlay = document.getElementById("hintOverlay");
  const hintModalTitle = document.getElementById("hintModalTitle");
  const hintModalBody = document.getElementById("hintModalBody");
  const hintClose = document.getElementById("hintClose");


  const nextBtn = document.getElementById("nextBtn");

  // ===== Welcome elements =====
  const welcome = document.getElementById("welcome");
  const welcomeTitle = document.getElementById("welcomeTitle");
  const welcomeInput = document.getElementById("welcomeInput");
  const welcomeHint = document.getElementById("welcomeHint");

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
    loadLevel(0);
    closeDisk();
  }

  function setupWelcome(){
    if (!welcome) { startGame(); return; }

    welcomeTitle.textContent = intro.greeting;

    // === FIX: support "dead keys" / composition (ā, ē, ģ, ķ, etc.) on desktop ===
    let isComposing = false;

    function tryValidateWelcome(force = false) {
      const v = normalize(welcomeInput.value);

      if (!force && v.length < 2) return;

      if (v === normalize(intro.answer)) {
        welcome.style.display = "none";
        startGame();
      } else {
        if (!force && v.length < 2) return;

        showWelcomeHint(intro.wrongHint);
        welcomeInput.value = "";
        welcomeInput.focus();
      }
    }

    welcomeInput.addEventListener("compositionstart", () => {
      isComposing = true;
    });

    welcomeInput.addEventListener("compositionend", () => {
      isComposing = false;
      tryValidateWelcome();
    });

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

  const resultMsg = document.getElementById("resultMsg");

  // ============ Disks ============
  const disk = window.DiskGameDisk.create({
    canvas,
    targetSlot: 0,
    symbols,
  });

  // ============ State ============
  let levelIndex = 0;

  // hint cache (vienmēr 3; nākotnē varēs būt arī bilde/audio)
  let currentHints = [
    { title: "Padoms 1", text: "" },
    { title: "Padoms 2", text: "" },
    { title: "Padoms 3", text: "" },
  ];

  function normalizeHints(lvl){
    // ✅ atbalsta gan šodienas variantu (hint1/2/3), gan nākotnes (hints: [...])
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

    // nodrošinām tieši 3 gab.
    while (arr.length < 3) arr.push({ text: "" });
    return arr.slice(0,3).map((h, idx) => ({
      title: h.title || `Padoms ${idx+1}`,
      text: h.text || ""
    }));
  }

  function setHintsForLevel(lvl){
    currentHints = normalizeHints(lvl);
  }

  function openHint(i){
    if (!hintOverlay) return;
    const h = currentHints[i] || { title: `Padoms ${i+1}`, text: "" };

    hintModalTitle.textContent = h.title || `Padoms ${i+1}`;
    hintModalBody.textContent = h.text && h.text.trim()
      ? h.text
      : "Šim līmenim vēl nav padoma.";

    hintOverlay.hidden = false;
  }

  function closeHint(){
    if (!hintOverlay) return;
    hintOverlay.hidden = true;
  }

  let isOpen = false;
  let solved = false;

  // ===== Audio unlock (required for Safari / iOS / some Chrome cases) =====
  let audioUnlocked = false;

  function unlockAudioOnce() {
    if (audioUnlocked) return;
    audioUnlocked = true;

    const a = new Audio("/assets/sound/wrong_01.m4a");
    a.volume = 0; // pilnīgi kluss
    a.play()
      .then(() => {
        a.pause();
        a.currentTime = 0;
      })
      .catch(() => {
        // ignore
      });
  }

  document.addEventListener("pointerdown", unlockAudioOnce, { once: true });
  document.addEventListener("keydown", unlockAudioOnce, { once: true });

  // pool bez atkārtošanās, līdz iztukšojas
  let wrongPool = [...wrongMessages];

  function playSfx(src) {
    if (!src) return;
    const a = new Audio(src);
    a.preload = "auto";
    a.play().catch(() => {});
  }

  // Izvēlas random “wrong” (bez atkārtošanās), atskaņo skaņu un atgriež TEKSTU
  function getNextWrongMessage() {
    if (wrongPool.length === 0) wrongPool = [...wrongMessages];
    const idx = Math.floor(Math.random() * wrongPool.length);
    const item = wrongPool.splice(idx, 1)[0]; // { text, sound }
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

    // hints
    setHintsForLevel(lvl);


    // background
    scene.style.backgroundImage = `url("assets/${lvl.background}")`;

    // card
    cardTitle.textContent = lvl.title;
    cardBody.innerHTML = lvl.cardHtml;

    // target symbol
    targetSymbolLabel.textContent = symbols[lvl.targetSlot];

    // disk config
    disk.setTargetSlot(lvl.targetSlot);

    // state reset
    solved = false;
    resetResultUI();

    // instrukcijas
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

  // sākuma stāvoklis
  disk.setInteractive(false);
  disk.setInteractive(true);
  setupWelcome();

  // ===== Hint kāršu klikšķi =====
  if (hintButtons.length){
    hintButtons.forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = Number(btn.dataset.hint || 0);
        openHint(idx);
      });
    });
  }
  if (hintClose) hintClose.addEventListener("click", closeHint);
  if (hintOverlay){
    hintOverlay.addEventListener("click", (e) => {
      // klikšķis ārpus modal aizver
      if (e.target === hintOverlay) closeHint();
    });
  }


  function openDisk() {
    if (isOpen) return;
    isOpen = true;

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

  // ===== Fināla ekrāns (finiss.jpg) =====
  function showFinalScreen() {
    // “mīksti” aizveram disku (lai nav lēciens)
    if (isOpen) closeDisk();

    // neliela pauze, lai klases paspēj nomainīties (ja ir CSS pārejas)
    setTimeout(() => {
      // paslēpjam UI
      if (taskCard) taskCard.hidden = true;
      if (diskShell) diskShell.hidden = true;

      // drošībai izslēdzam interaktivitāti
      try { disk.setInteractive(false); } catch(e) {}

      // uzliekam pēdējo fonu
      scene.style.backgroundImage = `url("assets/finiss.jpg")`;
    }, 220);
  }

  // atver tikai stūrī
  diskShell.addEventListener("click", () => {
    if (!diskShell.classList.contains("disk-corner")) return;
    openDisk();
  });

  // klikšķis ārpus diska aizver
  document.addEventListener("pointerdown", (e) => {
    if (!isOpen) return;
    if (diskShell.contains(e.target)) return;
    if (taskCard && taskCard.contains(e.target)) return;
    closeDisk();
  });

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
        // pēdējais līmenis: uzreiz uz finālu, bez "Tālāk"
        setNextVisible(false);
        resultMsg.textContent = "";
        feedback.innerHTML = `Pareizi!`;

        // īsa pauze, lai OK “ielasās”, tad finiss
        setTimeout(() => {
          showFinalScreen();
        }, 420);

        return;
      }

      // nav pēdējais
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
        if (!solved && isOpen) {
          disk.setInteractive(true);
        }
      }, 800);
    }
  });

  // ========= TĀLĀK =========
  nextBtn.addEventListener("click", () => {
    if (!solved) return;

    // (drošībai) ja tomēr kādreiz atstāj "Tālāk" pēdējā līmenī
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
