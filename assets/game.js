// assets/game.js
(() => {
  // ============ Konfigurācija ============
  const symbols = ["★","☾","▲","◆","✚","⬣","⬟","●","▣"];

  // ===== Welcome =====
  const intro = {
    greeting:
      "Čau, Nikola! Daudz laimes dzimšanas dienā! Esam tev sarūpējuši vienu dāvanu, kas liks parakāties atmiņas dzīlēs, paskaitīt, iespējams pasvīst un cerams sagādās pozitīvas emocijas. Vai esi gatava?",
    answer: "jā",
    wrongHint: "tiešām?"
  };

  // ===== LĪMEŅI (NEAIZTIKTI) =====
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
  const resultMsg = document.getElementById("resultMsg");

  // ===== Welcome DOM =====
  const welcome = document.getElementById("welcome");
  const welcomeTitle = document.getElementById("welcomeTitle");
  const welcomeInput = document.getElementById("welcomeInput");
  const welcomeHint = document.getElementById("welcomeHint");

  // ===== UTIL =====
  const normalize = s => (s || "").trim().toLowerCase();

  function showWelcomeHint(txt){
    welcomeHint.textContent = txt;
    welcomeHint.classList.add("show");
    setTimeout(() => welcomeHint.classList.remove("show"), 900);
  }

  function startGame(){
    welcome.style.display = "none";
    loadLevel(0);
    closeDisk();
  }

  function setupWelcome(){
    welcomeTitle.textContent = intro.greeting;

    let isComposing = false;

    function validate(force = false){
      const v = normalize(welcomeInput.value);
      if (!force && v.length < 2) return;

      if (v === normalize(intro.answer)) {
        startGame();
      } else {
        showWelcomeHint(intro.wrongHint);
        welcomeInput.value = "";
      }
    }

    welcomeInput.addEventListener("compositionstart", () => isComposing = true);
    welcomeInput.addEventListener("compositionend", () => {
      isComposing = false;
      validate();
    });

    welcomeInput.addEventListener("input", () => {
      if (!isComposing) validate();
    });

    welcomeInput.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        validate(true);
      }
    });

    setTimeout(() => welcomeInput.focus(), 0);
  }

  // ===== DISKS =====
  const disk = window.DiskGameDisk.create({
    canvas,
    targetSlot: 0,
    symbols,
  });

  let levelIndex = 0;
  let isOpen = false;
  let solved = false;

  function loadLevel(i){
    levelIndex = i;
    const lvl = levels[i];

    scene.style.backgroundImage = `url("assets/${lvl.background}")`;
    cardTitle.textContent = lvl.title;
    cardBody.innerHTML = lvl.cardHtml;
    targetSymbolLabel.textContent = symbols[lvl.targetSlot];

    disk.setTargetSlot(lvl.targetSlot);
    solved = false;
    resultMsg.textContent = "";
    nextBtn.hidden = true;

    if (window.Hints) {
      window.Hints.setHints([
        { title: "Padoms 1", text: lvl.hint1 },
        { title: "Padoms 2", text: lvl.hint2 },
        { title: "Padoms 3", text: lvl.hint3 },
      ]);
      window.Hints.close();
    }
  }

  function openDisk(){
    isOpen = true;
    diskShell.classList.add("disk-center");
    diskShell.classList.remove("disk-corner");
    disk.setInteractive(true);
  }

  function closeDisk(){
    isOpen = false;
    diskShell.classList.add("disk-corner");
    diskShell.classList.remove("disk-center");
    disk.setInteractive(false);
  }

  diskShell.addEventListener("click", () => {
    if (diskShell.classList.contains("disk-corner")) openDisk();
  });

  disk.setOnCheck(() => {
    if (!isOpen) return;

    const lvl = levels[levelIndex];
    const code = disk.getCodeAtTarget();

    if (code === lvl.answer) {
      solved = true;
      disk.renderStatus("OK", true);

      if (levelIndex === levels.length - 1) {
        setTimeout(showFinalScreen, 400);
      } else {
        nextBtn.hidden = false;
        feedback.innerHTML = "Pareizi! Spied <strong>Tālāk</strong>.";
      }
    } else {
      disk.renderStatus("NĒ", false);
      feedback.innerHTML = "Pamēģini vēlreiz.";
    }
  });

  nextBtn.addEventListener("click", () => {
    if (!solved) return;
    loadLevel(levelIndex + 1);
    closeDisk();
  });

  function showFinalScreen(){
    if (window.Hints) window.Hints.close();
    taskCard.hidden = true;
    diskShell.hidden = true;
    scene.style.backgroundImage = `url("assets/finiss.jpg")`;
  }

  // ===== INIT =====
  if (window.Hints) window.Hints.init({ mountEl: scene });
  setupWelcome();
})();