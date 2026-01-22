// assets/disk.js
// 3 grozāmi riņķi + fiksēts simbolu gredzens
// + centrs kā aplis: "Pārbaudīt" / OK / NĒ
// Stabils ciparu nolasījums: tas pats slotu režģis, kas zīmēšanā.

(function(){
  const SECTORS = 9;
  const TAU = Math.PI * 2;
  const STEP = TAU / SECTORS;
  const START = -Math.PI / 2; // 12:00

  function norm(a){
    a = a % TAU;
    return a < 0 ? a + TAU : a;
  }

  function create(opts){
    const canvas = opts.canvas;
    const ctx = canvas.getContext("2d");

    const W = canvas.width;
    const H = canvas.height;
    const cx = W/2, cy = H/2;

    // ===== STATUS (centra teksts) =====
    // statusOk: null => rādām "Pārbaudīt"
    // statusOk: true => OK
    // statusOk: false => NĒ
    let statusText = "";
    let statusOk = null;

    // ===== callback pārbaudei =====
    let onCheck = null;

    // ===== simboli =====
    const symbols = opts.symbols || ["★","☾","▲","◆","✚","⬣","⬟","●","▣"];
    let targetSlot = Number.isInteger(opts.targetSlot) ? opts.targetSlot : 0;

    const fixedRing = { r0: 410, r1: 455, color:"#0b0f14", text:"#e5e7eb" };

    // ===== riņķi (ārējais -> iekšējais) =====
    const rings = [
      { name:'white', color:'#f8fafc', text:'#0f172a', r0:300, r1:395, angle: 0, digits:[1,2,3,4,5,6,7,8,9] },
      { name:'red',   color:'#d32f2f', text:'#ffffff', r0:220, r1:300, angle: 0, digits:[1,2,3,4,5,6,7,8,9] },
      { name:'blue',  color:'#1e88e5', text:'#0b1020', r0:140, r1:220, angle: 0, digits:[1,2,3,4,5,6,7,8,9] },
    ];

    const center = { r:140 };

    // ===== interaction =====
    let interactive = false;
    let activeRing = null;
    let startAngle = 0;
    let startRingAngle = 0;
    let autoAngle = 0;

    // ✅ STABILS NOLESĪJUMS:
    // Slotam (0..8) paņemam tā sektora vidus leņķi pasaulē,
    // pārceļam uz ringa lokālo telpu (atņemot ring.angle),
    // un atrodam, kurš i indekss tam atbilst.
    function digitAtSlot(ring, slot){
      const worldMid = START + slot*STEP + STEP/2;   // slot sektora vidus
      const local = norm(worldMid - ring.angle);     // ringa lokālais leņķis
      const rel = norm(local - START);               // pret START
      const i = Math.floor(rel / STEP) % SECTORS;    // sektora indekss
      return ring.digits[i];
    }

    function getCodeAtSlot(slot){
      const a = digitAtSlot(rings[0], slot); // white
      const b = digitAtSlot(rings[1], slot); // red
      const c = digitAtSlot(rings[2], slot); // blue
      return `${a}${b}${c}`;
    }

    function drawFixedOuterRing(){
      ctx.beginPath();
      ctx.arc(0,0, fixedRing.r1, 0, TAU);
      ctx.arc(0,0, fixedRing.r0, 0, TAU, true);
      ctx.fillStyle = fixedRing.color;
      ctx.fill("evenodd");

      for(let i=0;i<SECTORS;i++){
        const a0 = i*STEP + START;
        const a1 = a0 + STEP;
        const mid = (a0+a1)/2;

        // robeža
        ctx.beginPath();
        ctx.moveTo(Math.cos(a0)*fixedRing.r0, Math.sin(a0)*fixedRing.r0);
        ctx.lineTo(Math.cos(a0)*fixedRing.r1, Math.sin(a0)*fixedRing.r1);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "rgba(255,255,255,.14)";
        ctx.stroke();

        // target highlight + bultiņa
        if(i === targetSlot){
          ctx.save();
          ctx.beginPath();
          ctx.arc(0,0, (fixedRing.r0+fixedRing.r1)/2, a0+0.06, a1-0.06);
          ctx.lineWidth = 9;
          ctx.strokeStyle = "rgba(212,162,74,.95)";
          ctx.stroke();
          ctx.restore();

          ctx.save();
          const r = fixedRing.r1 + 18;
          ctx.translate(Math.cos(mid)*r, Math.sin(mid)*r);
          ctx.rotate(mid + Math.PI/2);
          ctx.fillStyle = "rgba(212,162,74,.98)";
          ctx.font = "900 26px system-ui";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("▼", 0, 0);
          ctx.restore();
        }

        // simbols
        const rr = (fixedRing.r0+fixedRing.r1)/2;
        const x = Math.cos(mid)*rr;
        const y = Math.sin(mid)*rr;

        ctx.save();
        ctx.translate(x,y);
        ctx.rotate(mid + Math.PI/2);
        ctx.fillStyle = fixedRing.text;
        ctx.font = (i===targetSlot) ? "900 34px system-ui" : "800 32px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(symbols[i] ?? "•", 0, 0);
        ctx.restore();
      }
    }

    function drawRing(ring){
      ctx.save();
      ctx.rotate(ring.angle);

      for(let i=0;i<SECTORS;i++){
        const a0 = i*STEP + START;
        const a1 = a0 + STEP;

        ctx.beginPath();
        ctx.arc(0,0, ring.r1, a0, a1);
        ctx.arc(0,0, ring.r0, a1, a0, true);
        ctx.closePath();
        ctx.fillStyle = ring.color;
        ctx.fill();

        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(0,0,0,.26)";
        ctx.stroke();

        const mid = (a0+a1)/2;
        const rr = (ring.r0+ring.r1)/2;
        const x = Math.cos(mid)*rr;
        const y = Math.sin(mid)*rr;

        ctx.save();
        ctx.translate(x,y);
        ctx.rotate(mid + Math.PI/2);
        ctx.fillStyle = ring.text;
        ctx.font = "900 44px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(ring.digits[i]), 0, 0);
        ctx.restore();
      }

      ctx.restore();
    }

    // ✅ JAUNA, TĪRA CENTRA ZĪMĒŠANA (APLIS, NEVIS TAISNSTŪRIS)
    function drawCenter(){
      // centrs
      ctx.beginPath();
      ctx.arc(0,0, center.r, 0, TAU);
      ctx.fillStyle = "#0b0f14";
      ctx.fill();

      // zelta rāmis
      ctx.lineWidth = 7;
      ctx.strokeStyle = "#d4a24a";
      ctx.stroke();

      // saturs
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      if (interactive && statusOk === null){
        // "Pārbaudīt" režīms
        ctx.fillStyle = "#e5e7eb";
        ctx.font = "800 22px system-ui";
        ctx.fillText("Pārbaudīt", 0, 0);

        // viegls iekšējais aplis (pogas sajūtai)
        ctx.beginPath();
        ctx.arc(0,0, center.r - 16, 0, TAU);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255,255,255,0.18)";
        ctx.stroke();
      } else {
        // OK / NĒ režīms
        const ok = !!statusOk;
        const text = statusText || (ok ? "OK" : "NĒ");
        ctx.fillStyle = ok ? "#34d399" : "#ef4444";
        ctx.font = "900 64px system-ui";
        ctx.fillText(text, 0, 2);
      }

      // ass punkts (mazs, lai netraucē)
      // ctx.beginPath();
      // ctx.arc(0,0, 8, 0, TAU);
      // ctx.fillStyle = "#111827";
      // ctx.fill();
    }

    function draw(){
      ctx.clearRect(0,0,W,H);
      ctx.save();
      ctx.translate(cx, cy);

      drawFixedOuterRing();
      rings.forEach(drawRing);
      drawCenter();

      // axle
      // ctx.beginPath();
      // ctx.arc(0,0, 18, 0, TAU);
      // ctx.fillStyle = "#111827";
      // ctx.fill();
      // ctx.lineWidth = 4;
      // ctx.strokeStyle = "#0f172a";
      // ctx.stroke();

      ctx.restore();
    }

    function getPointerPos(e){
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      return {x,y};
    }

    function pickRing(x,y){
      const dx = x - cx, dy = y - cy;
      const r = Math.hypot(dx,dy);
      for(const ring of rings){
        if(r >= ring.r0 && r <= ring.r1) return ring;
      }
      return null;
    }

    function pointAngle(x,y){
      return Math.atan2(y - cy, x - cx);
    }

    function snapToSector(ring){
      ring.angle = Math.round(ring.angle / STEP) * STEP;
    }

    // ✅ CENTRA APLIS = POGA
    function isCenterHit(x,y){
      const dx = x - cx;
      const dy = y - cy;
      return Math.hypot(dx,dy) <= center.r;
    }

    function onDown(e){
      e.stopPropagation();
      if(!interactive) return;
      e.preventDefault();

      const {x,y} = getPointerPos(e);

      // klikšķis uz centra apļa => Pārbaudīt
      if (isCenterHit(x,y)){
        if (typeof onCheck === "function") onCheck();
        return;
      }

      const ring = pickRing(x,y);
      if(!ring) return;

      activeRing = ring;
      startAngle = pointAngle(x,y);
      startRingAngle = ring.angle;

      window.addEventListener('pointermove', onMove, {passive:false});
      window.addEventListener('pointerup', onUp, {passive:false});
      window.addEventListener('pointercancel', onUp, {passive:false});
    }

    function onMove(e){
      if(!activeRing) return;
      e.preventDefault();
      const {x,y} = getPointerPos(e);
      activeRing.angle = startRingAngle + (pointAngle(x,y) - startAngle);
    }

    function onUp(e){
      if(!activeRing) return;
      e.preventDefault();
      snapToSector(activeRing);
      activeRing = null;

      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    }

    canvas.addEventListener('pointerdown', onDown, {passive:false});

    function tick(){
      if(!interactive){
        autoAngle += 0.0022;
        rings.forEach((r, idx) => r.angle = autoAngle * (1 + idx*0.06));
      }
      draw();
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    return {
      setInteractive(v){
        interactive = !!v;
        // kad atver disku: parādam "Pārbaudīt"
        if (interactive){
          statusOk = null;
          statusText = "";
        }
      },
      setTargetSlot(slot){ targetSlot = ((slot%SECTORS)+SECTORS)%SECTORS; },
      getTargetSlot(){ return targetSlot; },
      getCodeAtTarget(){ return getCodeAtSlot(targetSlot); },
      getCodeAtSlot,

      // game.js var izsaukt:
      // renderStatus("OK", true) vai renderStatus("NĒ", false)
      renderStatus(text, ok){
        statusText = text;
        statusOk = !!ok;
      },

      // game.js uzliek:
      // disk.setOnCheck(() => { ... })
      setOnCheck(fn){ onCheck = (typeof fn === "function") ? fn : null; },
    };
  }

  window.DiskGameDisk = { create };
})();
