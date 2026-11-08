  const TAU = Math.PI * 2;
  const $ = (selector) => document.querySelector(selector);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const rand = (min, max) => min + Math.random() * (max - min);
  const hash = (n) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const pad2 = (n) => String(n).padStart(2, "0");

  const THEMES = [
    { id: "mile", stage: "MUTANT MILE", sky: ["#241b4a", "#76516f", "#e17d69", "#f3a56d"], sunGlow: "rgba(255,176,112,0.42)", sun: "#ffd07a", far: "#754d68", mid: "#503b58", city: "#362943", haze: "rgba(255,164,125,0.22)", groundTop: "#6e4253", ground: "#382943", groundDeep: "#171426", grass: "#a4d76d" },
    { id: "marsh", stage: "TOXIC MARSH", sky: ["#111a3d", "#31566a", "#70a17d", "#c2bb72"], sunGlow: "rgba(165,255,140,0.34)", sun: "#d8f48a", far: "#47635d", mid: "#304947", city: "#213638", haze: "rgba(169,236,147,0.2)", groundTop: "#52604a", ground: "#303c36", groundDeep: "#141e22", grass: "#b3df75" },
    { id: "ash", stage: "ASHEN OUTPOST", sky: ["#17132e", "#49344c", "#a64f52", "#e28b55"], sunGlow: "rgba(255,137,90,0.38)", sun: "#ffb35e", far: "#68434e", mid: "#47323f", city: "#302438", haze: "rgba(244,142,111,0.2)", groundTop: "#674047", ground: "#382b37", groundDeep: "#171321", grass: "#d49a66" },
    { id: "neon", stage: "NEON BADLANDS", sky: ["#101637", "#27376c", "#72518a", "#d66b86"], sunGlow: "rgba(94,235,255,0.36)", sun: "#ff8eb9", far: "#4e4875", mid: "#36365f", city: "#252747", haze: "rgba(105,220,239,0.2)", groundTop: "#51416a", ground: "#302841", groundDeep: "#131222", grass: "#66d6cf" },
  ];
  const WEAPONS = [
    { id: "ripper", name: "RIPPER", tag: "BALANCED AUTO", cost: 0, damage: 18, rate: 0.19, speed: 740, spread: 0.018, pellets: 1, color: "#d9ff45", description: "Reliable full-auto sidearm." },
    { id: "scatter", name: "ROADBURN", tag: "SCRAP SHOTGUN", cost: 180, damage: 12, rate: 0.58, speed: 620, spread: 0.22, pellets: 5, color: "#ff9b50", description: "Five hot shells. Up close, nothing stays up." },
    { id: "arc", name: "ARC-9", tag: "CHAIN LIGHTNING", cost: 340, damage: 14, rate: 0.34, speed: 900, spread: 0.035, pellets: 1, color: "#69efff", chain: 2, description: "A charged bolt that jumps between mutants." },
    { id: "rocket", name: "BOOMSTICK", tag: "HEAVY ORDNANCE", cost: 560, damage: 52, rate: 0.82, speed: 430, spread: 0.012, pellets: 1, color: "#ff547d", splash: 76, description: "Slow rockets. Extremely loud punctuation." },
  ];
  const UPGRADES = [
    { id: "damage", name: "HOTTER LEAD", icon: "✦", description: "+12% weapon damage per rank", base: 110, step: 90, max: 8 },
    { id: "armor", name: "REINFORCED VEST", icon: "⬟", description: "+15 max armor per rank", base: 100, step: 85, max: 8 },
    { id: "fire", name: "QUICK-FINGER KIT", icon: "»", description: "Fire 7% faster per rank", base: 135, step: 105, max: 7 },
    { id: "magnet", name: "LOOT MAGNET", icon: "◎", description: "Coins pull in from farther away", base: 90, step: 80, max: 6 },
  ];
  const SAVE_KEY = "gunrush-mutant-mile-v1";
  function freshMeta() {
    return { coins: 120, sector: 1, weapon: "ripper", unlocked: ["ripper"], upgrades: { damage: 0, armor: 0, fire: 0, magnet: 0 }, muted: false, bestSector: 1 };
  }
  function loadMeta() {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      if (!saved || typeof saved !== "object") return freshMeta();
      const base = freshMeta();
      const meta = { ...base, ...saved, upgrades: { ...base.upgrades, ...(saved.upgrades || {}) } };
      meta.coins = Math.max(0, Math.floor(Number(meta.coins) || 0));
      meta.sector = Math.max(1, Math.floor(Number(meta.sector) || 1));
      meta.unlocked = Array.from(new Set(["ripper", ...(Array.isArray(meta.unlocked) ? meta.unlocked : [])]));
      return meta;
    } catch { return freshMeta(); }
  }
  let meta = loadMeta();
  function saveMeta() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(meta)); } catch { /* Storage can be disabled. */ }
  }
  function getWeapon(id = meta.weapon) { return WEAPONS.find((weapon) => weapon.id === id) || WEAPONS[0]; }
  function getLevel(sector) {
    const themeIndex = Math.floor((sector - 1) / 2) % THEMES.length;
    const theme = THEMES[themeIndex];
    const bosses = ["GOREFANG", "MIRE MOTHER", "THE ASH TITAN", "NEON REAPER"];
    return { sector, themeIndex, stage: theme.stage, boss: bosses[(sector - 1) % bosses.length], difficulty: 1 + (sector - 1) * 0.19 };
  }
  function upgradeCost(upgrade, rank) { return upgrade.base + rank * upgrade.step; }
  function upgradeValue(id) { return Number(meta.upgrades[id]) || 0; }

  /* ------------------------------------------------------------------ */
  /* DOM + viewport                                                     */
  /* ------------------------------------------------------------------ */

  const ui = {
    body: document.body,
    canvas: $("#game"),
    coinLayer: $("#coinLayer"),
    hud: $("#gameHud"),
    sectorNum: $("#sectorNum"),
    sectorName: $("#sectorName"),
    coinCount: $("#coinCount"),
    titleCoinCount: $("#titleCoinCount"),
    armoryCoins: $("#armoryCoins"),
    hpText: $("#hpText"),
    hpFill: $("#hpFill"),
    healthCard: $(".health-card"),
    hudWeapon: $("#hudWeapon"),
    hudWeaponTag: $("#hudWeaponTag"),
    waveHud: $("#waveHud"),
    waveLabel: $("#waveLabel"),
    wavePercent: $("#wavePercent"),
    waveFill: $("#waveFill"),
    bossHud: $("#bossHud"),
    bossName: $("#bossName"),
    bossFill: $("#bossFill"),
    bossTag: $("#bossTag"),
    comboHud: $("#comboHud"),
    comboCount: $("#comboCount"),
    comboFill: $("#comboFill"),
    aimHint: $("#aimHint"),
    banner: $("#stageBanner"),
    bannerKicker: $("#bannerKicker"),
    bannerTitle: $("#bannerTitle"),
    bannerSub: $("#bannerSub"),
    toast: $("#toast"),
    titleScreen: $("#titleScreen"),
    titleSector: $("#titleSector"),
    pauseScreen: $("#pauseScreen"),
    clearScreen: $("#clearScreen"),
    deadScreen: $("#deadScreen"),
    armoryScreen: $("#armoryScreen"),
    weaponList: $("#weaponList"),
    upgradeList: $("#upgradeList"),
    clearSector: $("#clearSector"),
    clearBossLine: $("#clearBossLine"),
    clearKills: $("#clearKills"),
    clearCoins: $("#clearCoins"),
    clearCombo: $("#clearCombo"),
    deadSector: $("#deadSector"),
    deadKills: $("#deadKills"),
    deadCoins: $("#deadCoins"),
    muteBtn: $("#muteBtn"),
    pauseBtn: $("#pauseBtn"),
  };

  const view = {
    W: window.innerWidth,
    H: window.innerHeight,
    DPR: 1,
    groundY: 0,
    horizonY: 0,
    compact: false,
  };

  const ctx = ui.canvas.getContext("2d", { alpha: false });
  let backdrop = null;
  let backdropTheme = -1;
  let worldTime = 0;

  function playerScale() {
    return clamp(view.H / 770, 0.82, 1.22) * (view.compact ? 0.92 : 1);
  }

  function actorScale() {
    return clamp(view.H / 810, 0.78, 1.08) * (view.compact ? 0.92 : 1);
  }

  function resize() {
    view.W = Math.max(320, window.innerWidth);
    view.H = Math.max(420, window.innerHeight);
    view.DPR = Math.min(window.devicePixelRatio || 1, 2);
    view.groundY = view.H * 0.795;
    view.horizonY = view.H * 0.615;
    view.compact = view.H < 560;

    ui.canvas.width = Math.round(view.W * view.DPR);
    ui.canvas.height = Math.round(view.H * view.DPR);
    ui.canvas.style.width = view.W + "px";
    ui.canvas.style.height = view.H + "px";
    ctx.setTransform(view.DPR, 0, 0, view.DPR, 0, 0);
    ctx.imageSmoothingEnabled = true;

    if (player) {
      player.x = playerX();
      player.y = view.groundY;
    }
    buildBackdrop();
  }

  function playerX() {
    return view.W * (view.W < 620 ? 0.24 : 0.255);
  }

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("orientationchange", () => setTimeout(resize, 120));

  /* ------------------------------------------------------------------ */
  /* Scene / run state                                                  */
  /* ------------------------------------------------------------------ */

  let scene = "menu";
  let armoryReturn = "menu";
  let run = null;
  let player = null;
  let enemies = [];
  let bullets = [];
  let hazards = [];
  let pickups = [];
  let particles = [];
  let floaters = [];
  let boss = null;
  let shake = 0;
  let shakeX = 0;
  let shakeY = 0;
  let flash = 0;
  let flashColor = "255,255,255";
  let hitStop = 0;
  let timeScale = 1;
  let toastTimer = 0;
  let bannerTimer = 0;
  let hintTimer = 0;
  let uid = 1;

  const input = {
    aiming: false,
    pointer: null,
    pointerId: null,
    usedAim: false,
  };

  const menu = {
    time: 0,
    scroll: 0,
  };

  function updateMetaUI() {
    const sector = pad2(meta.sector);
    ui.titleSector.textContent = sector;
    ui.titleCoinCount.textContent = meta.coins;
    ui.coinCount.textContent = meta.coins;
    ui.armoryCoins.textContent = meta.coins;
    ui.body.classList.toggle("muted", meta.muted);
    if (ui.sectorNum) ui.sectorNum.textContent = sector;
    const lv = getLevel(meta.sector);
    if (ui.sectorName) ui.sectorName.textContent = lv.stage.split(" ").slice(0, -1).join(" ") || lv.stage;
  }

  const SCREENS = {
    title: ui.titleScreen,
    pause: ui.pauseScreen,
    clear: ui.clearScreen,
    dead: ui.deadScreen,
    armory: ui.armoryScreen,
  };

  function hideScreens(except) {
    for (const [name, el] of Object.entries(SCREENS)) {
      if (name !== except) el.classList.remove("show");
    }
  }

  function setScene(next) {
    scene = next;
    ui.body.dataset.scene = next;
    ui.body.classList.toggle("in-game", ["playing", "paused", "clear", "dead"].includes(next));
    ui.body.classList.toggle("paused", next === "paused");
    ui.body.classList.remove("armory-open");

    if (next === "playing") {
      hideScreens("__none__");
    } else if (next === "menu") {
      hideScreens("title");
      ui.titleScreen.classList.add("show");
      ui.hud.setAttribute("aria-hidden", "true");
      resetMenuScene();
    } else if (next === "paused") {
      hideScreens("pause");
      ui.pauseScreen.classList.add("show");
      ui.hud.setAttribute("aria-hidden", "false");
    } else if (next === "clear") {
      hideScreens("clear");
      ui.clearScreen.classList.add("show");
      ui.hud.setAttribute("aria-hidden", "false");
    } else if (next === "dead") {
      hideScreens("dead");
      ui.deadScreen.classList.add("show");
      ui.hud.setAttribute("aria-hidden", "false");
    }
  }

  function resetMenuScene() {
    player = makePlayer();
    player.x = view.W > 760 ? view.W * 0.67 : view.W * 0.5;
    player.y = view.groundY;
    player.aimAngle = -0.72;
    player.menu = true;
    run = null;
    enemies = [];
    bullets = [];
    hazards = [];
    pickups = [];
    particles = [];
    floaters = [];
    boss = null;
    menu.scroll = 0;
  }

  function makePlayer() {
    return {
      x: playerX(),
      y: view.groundY,
      hp: 120,
      maxHp: 120,
      aimAngle: 0,
      desiredAim: 0,
      recoil: 0,
      flash: 0,
      invuln: 0,
      hitFlash: 0,
      dead: false,
      fireCd: 0,
      muzzle: 0,
      muzzleBurst: 0,
      runPhase: 0,
    };
  }

  /* ------------------------------------------------------------------ */
  /* Backdrop cache + parallax scenery                                  */
  /* ------------------------------------------------------------------ */

  function buildBackdrop() {
    const theme = THEMES[run ? run.level.themeIndex : Math.floor(((meta.sector || 1) - 1) / 2) % THEMES.length];
    const key = theme.id;
    if (backdrop && backdropTheme === key) return;

    const dpr = view.DPR;
    const c = document.createElement("canvas");
    c.width = Math.round(view.W * dpr);
    c.height = Math.round(view.H * dpr);
    const g = c.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    const W = view.W;
    const H = view.H;
    const horizon = view.horizonY;

    const sky = g.createLinearGradient(0, 0, 0, horizon + 10);
    sky.addColorStop(0, theme.sky[0]);
    sky.addColorStop(0.4, theme.sky[1]);
    sky.addColorStop(0.72, theme.sky[2]);
    sky.addColorStop(1, theme.sky[3]);
    g.fillStyle = sky;
    g.fillRect(0, 0, W, horizon + 14);

    // Stars in the darker part of the sky.
    for (let i = 0; i < 52; i++) {
      const x = hash(i * 3.1) * W;
      const y = hash(i * 7.7 + 2) * horizon * 0.48;
      const a = 0.16 + hash(i * 4.8) * 0.5;
      g.fillStyle = `rgba(255,255,255,${a * (1 - y / (horizon * 0.7))})`;
      g.fillRect(x, y, hash(i * 2.3) > 0.86 ? 2 : 1, hash(i * 2.3) > 0.86 ? 2 : 1);
    }

    // Sundown disc with soft halo.
    const sunX = W * (W > 700 ? 0.72 : 0.64);
    const sunY = horizon * 0.42;
    const sunR = Math.min(W, H) * (W > 700 ? 0.1 : 0.16);
    const halo = g.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 3.6);
    halo.addColorStop(0, theme.sunGlow);
    halo.addColorStop(0.45, theme.sunGlow.replace(/[\d.]+\)$/, "0.15)"));
    halo.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = halo;
    g.fillRect(sunX - sunR * 4, sunY - sunR * 4, sunR * 8, sunR * 8);
    g.fillStyle = theme.sun;
    g.beginPath();
    g.arc(sunX, sunY, sunR, 0, TAU);
    g.fill();

    // Retro bands across the lower half of the sun.
    g.save();
    g.beginPath();
    g.arc(sunX, sunY, sunR, 0, TAU);
    g.clip();
    g.fillStyle = "rgba(20, 12, 40, 0.18)";
    for (let i = 0; i < 5; i++) {
      const h = 2 + i * 1.8;
      g.fillRect(sunX - sunR, sunY + sunR * (0.2 + i * 0.13), sunR * 2, h);
    }
    g.restore();

    // Layered mountain silhouettes.
    drawMountainLayer(g, W, horizon, theme.far, 0.55, 0.36, 8, 1001);
    drawMountainLayer(g, W, horizon, theme.mid, 0.4, 0.5, 7, 2029);

    // Era-appropriate ruins on the skyline.
    g.save();
    g.fillStyle = theme.city;
    for (let i = 0; i < 14; i++) {
      const x = hash(i * 6.7 + 11) * W;
      const h = 20 + hash(i * 3.3 + 4) * horizon * 0.25;
      const w = 18 + hash(i * 8.1) * 44;
      g.fillRect(x, horizon - h, w, h);
      if (i % 3 === 0) g.fillRect(x + w * 0.3, horizon - h - 12, w * 0.16, 12);
      g.fillStyle = theme.sunGlow;
      for (let wy = horizon - h + 9; wy < horizon - 5; wy += 16) {
        if (hash(i * 14 + wy) > 0.58) g.fillRect(x + 5, wy, 3, 5);
      }
      g.fillStyle = theme.city;
    }
    g.restore();

    // Soft atmospheric haze at the horizon.
    const haze = g.createLinearGradient(0, horizon - 70, 0, horizon + 20);
    haze.addColorStop(0, "rgba(255,255,255,0)");
    haze.addColorStop(0.65, theme.haze);
    haze.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = haze;
    g.fillRect(0, horizon - 70, W, 90);

    // Cloud bands.
    g.save();
    for (let i = 0; i < 8; i++) {
      const y = horizon * (0.12 + hash(i * 9.2) * 0.55);
      const x = hash(i * 2.7 + 5) * W;
      const w = 40 + hash(i * 5.8) * 150;
      g.fillStyle = `rgba(255, 218, 201, ${0.035 + hash(i * 4.4) * 0.075})`;
      g.beginPath();
      g.ellipse(x, y, w, 5 + hash(i) * 3, 0, 0, TAU);
      g.fill();
    }
    g.restore();

    backdrop = c;
    backdropTheme = key;
  }

  function drawMountainLayer(g, W, horizon, color, alpha, heightRatio, count, seed) {
    g.save();
    g.globalAlpha = alpha;
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(-20, horizon + 20);
    const segment = W / count;
    for (let i = 0; i <= count; i++) {
      const peak = horizon - heightRatio * horizon * (0.5 + hash(seed + i * 2.73) * 0.7);
      g.lineTo(i * segment + hash(seed + i) * segment * 0.2, peak);
      g.lineTo((i + 0.5) * segment, horizon - heightRatio * horizon * 0.16);
    }
    g.lineTo(W + 20, horizon + 20);
    g.closePath();
    g.fill();
    g.restore();
  }

  function drawScenery(scroll, dt) {
    const themeIndex = run ? run.level.themeIndex : Math.floor(((meta.sector || 1) - 1) / 2) % THEMES.length;
    const theme = THEMES[themeIndex];
    const W = view.W;
    const H = view.H;
    const ground = view.groundY;
    const horizon = view.horizonY;

    // Low ruins and dead trees, scrolling slower than the ground.
    const ruinGap = W < 620 ? 160 : 230;
    const ruinOffset = scroll * 0.1 % ruinGap;
    ctx.save();
    for (let i = -1; i < W / ruinGap + 2; i++) {
      const x = i * ruinGap - ruinOffset;
      const r = hash(i * 7.7 + 3);
      const h = 35 + r * 85;
      const w = 18 + hash(i * 3.2) * 30;
      ctx.fillStyle = "rgba(13, 7, 24, 0.32)";
      ctx.fillRect(x, horizon + 12 - h, w, h);
      if (r > 0.5) {
        ctx.fillRect(x + w * 0.25, horizon + 12 - h - 15, 4, 15);
        ctx.fillRect(x + w * 0.25 - 3, horizon + 12 - h - 16, 10, 3);
      }
      // A few window lights.
      ctx.fillStyle = `rgba(255, 214, 122, ${0.08 + r * 0.09})`;
      ctx.fillRect(x + 5, horizon + 12 - h + 10, 3, 5);
      if (r > 0.4) ctx.fillRect(x + w - 8, horizon + 12 - h + 25, 3, 5);
    }
    ctx.restore();

    // Utility poles in the middle distance.
    const poleGap = W < 620 ? 155 : 210;
    const poleOffset = scroll * 0.34 % poleGap;
    ctx.save();
    for (let i = -1; i < W / poleGap + 2; i++) {
      const x = i * poleGap - poleOffset;
      const h = 55 + hash(i * 4.2) * 35;
      ctx.strokeStyle = "rgba(12, 8, 22, 0.46)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, horizon + 18);
      ctx.lineTo(x, horizon + 18 - h);
      ctx.moveTo(x - 11, horizon + 10 - h);
      ctx.lineTo(x + 11, horizon + 10 - h);
      ctx.stroke();
      ctx.strokeStyle = "rgba(12, 8, 22, 0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 11, horizon + 10 - h);
      ctx.quadraticCurveTo(x + poleGap * 0.5, horizon - h * 0.15, x + poleGap, horizon + 10 - h);
      ctx.stroke();
    }
    ctx.restore();

    // Ground slab.
    const groundGrad = ctx.createLinearGradient(0, horizon, 0, H);
    groundGrad.addColorStop(0, theme.groundTop);
    groundGrad.addColorStop(0.36, theme.ground);
    groundGrad.addColorStop(1, theme.groundDeep);
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, horizon + 5, W, H - horizon);

    // Horizon rim light.
    const rim = ctx.createLinearGradient(0, horizon - 3, 0, horizon + 22);
    rim.addColorStop(0, "rgba(255,255,255,0)");
    rim.addColorStop(0.45, theme.haze);
    rim.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = rim;
    ctx.fillRect(0, horizon - 3, W, 26);

    // The running lane. Its motion is the strongest cue that the hero is moving.
    const laneY = ground + 6;
    ctx.fillStyle = "rgba(8, 5, 15, 0.24)";
    ctx.fillRect(0, laneY, W, H - laneY);
    const scrollFast = scroll * 1.18;
    const dashGap = W < 620 ? 88 : 128;
    const dashOff = scrollFast % dashGap;
    for (let i = -1; i < W / dashGap + 2; i++) {
      const x = i * dashGap - dashOff;
      const y = laneY + 18 + (i % 2) * 19;
      ctx.fillStyle = "rgba(255, 245, 214, 0.085)";
      ctx.beginPath();
      ctx.moveTo(x + 11, y);
      ctx.lineTo(x + 57, y);
      ctx.lineTo(x + 52, y + 4);
      ctx.lineTo(x + 7, y + 4);
      ctx.closePath();
      ctx.fill();
    }

    // Scrolling stones and grass tufts.
    const pebbleGap = 58;
    const pebbleOff = scrollFast * 1.6 % pebbleGap;
    for (let i = -1; i < W / pebbleGap + 2; i++) {
      const x = i * pebbleGap - pebbleOff;
      const r = hash(i * 5.4 + 9);
      const y = ground + 24 + r * (H - ground - 33);
      ctx.fillStyle = r > 0.5 ? "rgba(255, 221, 174, 0.09)" : "rgba(0,0,0,0.2)";
      ctx.beginPath();
      ctx.ellipse(x, y, 3 + r * 8, 1.5 + r * 3.5, 0, 0, TAU);
      ctx.fill();
    }

    const tuftGap = 43;
    const tuftOff = scroll * 1.4 % tuftGap;
    for (let i = -1; i < W / tuftGap + 2; i++) {
      const x = i * tuftGap - tuftOff;
      const r = hash(i * 8.3 + 1);
      if (r < 0.25) continue;
      const h = 5 + r * 11;
      ctx.strokeStyle = theme.grass;
      ctx.globalAlpha = 0.22 + r * 0.3;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x, ground + 8);
      ctx.quadraticCurveTo(x - 3, ground + 8 - h * 0.6, x - 5 - r * 4, ground + 8 - h);
      ctx.moveTo(x + 2, ground + 8);
      ctx.quadraticCurveTo(x + 4, ground + 8 - h * 0.5, x + 3 + r * 3, ground + 8 - h * 0.8);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Tiny drifting spores / fireflies.
    for (let i = 0; i < 14; i++) {
      const x = (hash(i * 2.2) * W + worldTime * (8 + hash(i) * 8)) % W;
      const y = horizon + 20 + hash(i * 7.1) * (H - horizon - 50);
      const a = 0.12 + Math.sin(worldTime * 1.4 + i) * 0.08;
      ctx.fillStyle = `rgba(255, 233, 168, ${Math.max(0, a)})`;
      ctx.beginPath();
      ctx.arc(x, y, 1 + hash(i * 9) * 1.5, 0, TAU);
      ctx.fill();
    }

    drawForegroundGrass(scroll, theme);
  }

  function drawForegroundGrass(scroll, theme) {
    const W = view.W;
    const H = view.H;
    const gap = 175;
    const off = (scroll * 1.9) % gap;
    ctx.save();
    for (let i = -1; i < W / gap + 2; i++) {
      const x = i * gap - off;
      const r = hash(i * 6.6 + 2);
      const h = 24 + r * 42;
      ctx.globalAlpha = 0.32;
      ctx.strokeStyle = theme.grass;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(x, H + 4);
      ctx.quadraticCurveTo(x - 8, H - h * 0.65, x - 22 - r * 14, H - h);
      ctx.moveTo(x + 4, H + 4);
      ctx.quadraticCurveTo(x + 14, H - h * 0.7, x + 26 + r * 12, H - h * 0.74);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ------------------------------------------------------------------ */
  /* Actors, waves, combat and effects                                   */
  /* ------------------------------------------------------------------ */

  function startRun(sector = meta.sector) {
    meta.sector = Math.max(1, sector);
    meta.bestSector = Math.max(meta.bestSector || 1, meta.sector);
    saveMeta();
    const armor = upgradeValue("armor");
    player = makePlayer();
    player.maxHp = 120 + armor * 15;
    player.hp = player.maxHp;
    player.aimAngle = -0.22;
    player.desiredAim = player.aimAngle;
    run = { level: getLevel(meta.sector), wave: 1, waves: 3, waveKills: 0, waveGoal: 6 + Math.min(5, Math.floor(meta.sector / 2)), spawnLeft: 6 + Math.min(5, Math.floor(meta.sector / 2)), spawnTimer: 0.6, intermission: 0, kills: 0, coins: 0, bestCombo: 0, combo: 0, comboTimer: 0, elapsed: 0, scroll: 0, totalSpawned: 0, bossDefeated: false, lastShot: 0 };
    enemies = []; bullets = []; hazards = []; pickups = []; particles = []; floaters = []; boss = null;
    shake = 0; flash = 0; hitStop = 0; hintTimer = 7; input.usedAim = false;
    backdrop = null;
    buildBackdrop();
    setScene("playing");
    ui.hud.setAttribute("aria-hidden", "false");
    updateMetaUI();
    updateHUD();
    showBanner(`SECTOR ${pad2(meta.sector)}`, run.level.stage, "SURVIVE THE HORDE");
    sound("start");
  }

  function showBanner(kicker, title, sub) {
    ui.bannerKicker.textContent = kicker;
    ui.bannerTitle.textContent = title;
    ui.bannerSub.textContent = sub;
    ui.banner.classList.remove("show");
    void ui.banner.offsetWidth;
    ui.banner.classList.add("show");
    bannerTimer = 2.45;
  }

  function showToast(message, kind = "") {
    ui.toast.textContent = message;
    ui.toast.className = `toast show${kind ? ` ${kind}` : ""}`;
    toastTimer = 1.8;
  }

  function makeEnemy() {
    const d = run.level.difficulty;
    const roll = Math.random();
    const type = roll < 0.58 ? "runner" : roll < 0.84 ? "brute" : "spitter";
    const stats = type === "runner" ? { hp: 34, speed: 49, damage: 9, radius: 19, color: "#91d95e" }
      : type === "brute" ? { hp: 76, speed: 26, damage: 17, radius: 26, color: "#d88752" }
        : { hp: 46, speed: 34, damage: 8, radius: 21, color: "#c675b6" };
    const y = view.groundY - rand(8, Math.min(115, view.H * 0.18));
    return { id: uid++, type, x: view.W + rand(30, 115), y, hp: stats.hp * d, maxHp: stats.hp * d, speed: stats.speed * (1 + (d - 1) * 0.22), damage: stats.damage * (1 + (d - 1) * 0.12), radius: stats.radius * actorScale(), color: stats.color, hit: 0, attackCd: rand(0.35, 1.1), bob: rand(0, TAU), dead: false, spitCd: rand(1.7, 3.4), knock: 0 };
  }

  function spawnBoss() {
    boss = { x: view.W + 110, y: view.groundY - 65 * actorScale(), hp: 950 * run.level.difficulty, maxHp: 950 * run.level.difficulty, radius: 58 * actorScale(), attackCd: 1.5, phase: 0, hit: 0, bob: 0, name: run.level.boss };
    ui.bossName.textContent = boss.name;
    ui.bossHud.classList.add("active");
    ui.waveHud.classList.add("boss-wave");
    showBanner("FINAL WAVE", boss.name, "IT'S BIG. MAKE IT SMALLER.");
    sound("boss");
  }

  function beginNextWave() {
    if (run.wave < run.waves) {
      run.wave++;
      run.waveKills = 0;
      run.waveGoal = 6 + Math.min(5, Math.floor(meta.sector / 2)) + run.wave;
      run.spawnLeft = run.waveGoal;
      run.spawnTimer = 0.7;
      showBanner(`WAVE ${run.wave} / ${run.waves}`, "KEEP MOVING", "THE HORDE IS GETTING CLOSER");
    } else spawnBoss();
  }

  function damagePlayer(amount) {
    if (!player || player.invuln > 0 || scene !== "playing") return;
    const reduction = Math.min(0.38, upgradeValue("armor") * 0.035);
    player.hp -= amount * (1 - reduction);
    player.invuln = 0.68;
    player.hitFlash = 0.24;
    shake = Math.max(shake, 7);
    flash = Math.max(flash, 0.12);
    flashColor = "255,65,112";
    burst(player.x + 10, player.y - 42 * playerScale(), "#ff526f", 8, 150);
    sound("hurt");
    if (player.hp <= 0) finishRun(false);
  }

  function killEnemy(enemy) {
    if (enemy.dead) return;
    enemy.dead = true;
    run.kills++;
    run.waveKills++;
    run.combo++;
    run.comboTimer = 2.15;
    run.bestCombo = Math.max(run.bestCombo, run.combo);
    const payout = enemy.type === "brute" ? 5 : 3;
    const bonus = run.combo > 1 && run.combo % 5 === 0 ? 5 : 0;
    dropCoins(enemy.x, enemy.y - 12, payout + bonus);
    burst(enemy.x, enemy.y - enemy.radius * 0.55, enemy.color, enemy.type === "brute" ? 15 : 10, 190);
    floatText(enemy.x, enemy.y - enemy.radius, `+${payout + bonus}`, "#ffe66d");
    shake = Math.max(shake, enemy.type === "brute" ? 4 : 2);
    sound("kill");
  }

  function hurtBoss(damage) {
    if (!boss) return;
    boss.hp -= damage;
    boss.hit = 0.11;
    if (boss.hp <= 0) {
      boss.hp = 0;
      burst(boss.x, boss.y - 45, "#ffb04e", 42, 300);
      burst(boss.x, boss.y - 45, "#ff4e83", 28, 250);
      dropCoins(boss.x, boss.y - 25, 55 + meta.sector * 5);
      run.coins += 55 + meta.sector * 5;
      floatText(boss.x, boss.y - 100, "BOSS DOWN!", "#d9ff45");
      boss = null;
      run.bossDefeated = true;
      ui.bossHud.classList.remove("active");
      ui.waveHud.classList.remove("boss-wave");
      shake = 18; flash = 0.22; flashColor = "255,219,89";
      sound("bossdown");
      window.setTimeout(() => { if (scene === "playing" && run?.bossDefeated) finishRun(true); }, 900);
    }
  }

  function dropCoins(x, y, amount) {
    const count = amount >= 20 ? 5 : amount >= 5 ? 2 : 1;
    const each = Math.floor(amount / count);
    let left = amount;
    for (let i = 0; i < count; i++) {
      const value = i === count - 1 ? left : each;
      left -= value;
      pickups.push({ x: x + rand(-10, 10), y: y + rand(-10, 8), vx: rand(-60, 25), vy: rand(-170, -70), value, life: 9, r: 7, phase: rand(0, TAU) });
    }
  }

  function burst(x, y, color, count = 10, force = 150) {
    for (let i = 0; i < count; i++) {
      const angle = rand(0, TAU); const speed = rand(force * 0.22, force);
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: rand(0.22, 0.62), maxLife: 0.62, size: rand(2, 5), color, gravity: 260 });
    }
    particles.push({ x, y, vx: 0, vy: 0, life: 0.22, maxLife: 0.22, size: 12, color, ring: true });
  }

  function floatText(x, y, text, color) { floaters.push({ x, y, text, color, life: 0.82, maxLife: 0.82 }); }

  function finishRun(won) {
    if (scene !== "playing") return;
    if (won) {
      meta.coins += run.coins;
      meta.sector = Math.max(meta.sector, run.level.sector + 1);
      meta.bestSector = Math.max(meta.bestSector, meta.sector);
      saveMeta(); updateMetaUI();
      ui.clearSector.textContent = pad2(run.level.sector);
      ui.clearBossLine.textContent = `${run.level.boss} has been erased. The next road is calling.`;
      ui.clearKills.textContent = run.kills;
      ui.clearCoins.textContent = run.coins;
      ui.clearCombo.textContent = run.bestCombo;
      setScene("clear");
      sound("clear");
    } else {
      meta.coins += run.coins;
      saveMeta(); updateMetaUI();
      ui.deadSector.textContent = pad2(run.level.sector);
      ui.deadKills.textContent = run.kills;
      ui.deadCoins.textContent = run.coins;
      setScene("dead");
    }
  }

  function updateGame(dt) {
    if (scene !== "playing" || !run || !player) return;
    run.elapsed += dt;
    run.scroll += dt * 115;
    player.runPhase += dt * 11;
    player.recoil = Math.max(0, player.recoil - dt * 5.5);
    player.invuln = Math.max(0, player.invuln - dt);
    player.hitFlash = Math.max(0, player.hitFlash - dt);
    player.muzzle = Math.max(0, player.muzzle - dt * 7);
    player.muzzleBurst = Math.max(0, player.muzzleBurst - dt * 5);
    if (input.aiming && input.pointer) {
      const gunX = player.x + 37 * playerScale();
      const gunY = player.y - 54 * playerScale();
      player.desiredAim = clamp(Math.atan2(gunY - input.pointer.y, input.pointer.x - gunX), -1.32, 0.3);
    } else if (!input.usedAim) {
      const target = nearestTarget(player.x + 40, player.y - 55, 1.8);
      if (target) player.desiredAim = clamp(Math.atan2(target.y - player.y + 55 * playerScale(), target.x - player.x - 38 * playerScale()), -1.22, 0.22);
    }
    let angleDelta = player.desiredAim - player.aimAngle;
    while (angleDelta > Math.PI) angleDelta -= TAU;
    while (angleDelta < -Math.PI) angleDelta += TAU;
    player.aimAngle += angleDelta * Math.min(1, dt * 12);

    if (!run.bossDefeated) {
      if (run.spawnLeft > 0) {
        run.spawnTimer -= dt;
        if (run.spawnTimer <= 0) {
          enemies.push(makeEnemy()); run.spawnLeft--; run.totalSpawned++;
          run.spawnTimer = Math.max(0.38, rand(0.72, 1.05) - run.level.difficulty * 0.035);
        }
      } else if (enemies.length === 0 && !boss) {
        run.intermission += dt;
        if (run.intermission > 1.2) { run.intermission = 0; beginNextWave(); }
      }
    }

    const weapon = getWeapon();
    const fireRate = weapon.rate * Math.max(0.52, 1 - upgradeValue("fire") * 0.07);
    player.fireCd -= dt;
    if (player.fireCd <= 0 && !run.bossDefeated) {
      const muzzleX = player.x + 38 * playerScale();
      const muzzleY = player.y - 57 * playerScale();
      let fireAngle = player.aimAngle;
      if (!input.usedAim) {
        const target = nearestTarget(muzzleX, muzzleY, 2.4);
        if (target) fireAngle = Math.atan2(target.y - muzzleY, target.x - muzzleX);
      }
      player.fireCd = fireRate;
      player.recoil = 1; player.muzzle = 1; player.muzzleBurst = 1;
      for (let i = 0; i < weapon.pellets; i++) {
        const a = fireAngle + rand(-weapon.spread, weapon.spread);
        bullets.push({ x: muzzleX, y: muzzleY, vx: Math.cos(a) * weapon.speed, vy: Math.sin(a) * weapon.speed, damage: weapon.damage * (1 + upgradeValue("damage") * 0.12), color: weapon.color, life: 1.45, r: weapon.id === "rocket" ? 5 : 3, splash: weapon.splash || 0, chain: weapon.chain || 0, hitIds: [] });
      }
      burst(muzzleX, muzzleY, weapon.color, weapon.id === "rocket" ? 5 : 2, 55);
      sound("shot", weapon.id);
    }

    for (const enemy of enemies) {
      enemy.bob += dt * (enemy.type === "runner" ? 7 : 4);
      enemy.hit = Math.max(0, enemy.hit - dt);
      enemy.attackCd -= dt;
      enemy.spitCd -= dt;
      const targetX = player.x + 61;
      if (enemy.x > targetX) enemy.x -= enemy.speed * dt;
      else if (enemy.attackCd <= 0) { enemy.attackCd = enemy.type === "brute" ? 0.92 : 0.72; damagePlayer(enemy.damage); }
      if (enemy.type === "spitter" && enemy.spitCd <= 0 && enemy.x > player.x + 135 && enemy.x < view.W + 20) {
        enemy.spitCd = rand(2.2, 3.2);
        const dx = player.x + 20 - enemy.x; const dy = player.y - 45 - enemy.y;
        const a = Math.atan2(dy, dx);
        hazards.push({ x: enemy.x - 10, y: enemy.y - 20, vx: Math.cos(a) * 235, vy: Math.sin(a) * 235, life: 3, r: 7, damage: enemy.damage * 0.75, color: "#ce78b6" });
      }
    }

    if (boss) {
      boss.bob += dt * 2.6; boss.hit = Math.max(0, boss.hit - dt); boss.attackCd -= dt;
      boss.x = Math.max(view.W * 0.7, boss.x - 24 * dt);
      boss.y = view.groundY - 70 * actorScale() + Math.sin(boss.bob) * 8;
      if (boss.attackCd <= 0) {
        boss.attackCd = Math.max(0.8, 1.7 - run.level.difficulty * 0.04);
        const a = Math.atan2(player.y - 55 * playerScale() - boss.y, player.x + 20 - boss.x);
        const spread = run.level.sector > 3 ? [-0.13, 0, 0.13] : [0];
        for (const offset of spread) hazards.push({ x: boss.x - 36, y: boss.y - 26, vx: Math.cos(a + offset) * 290, vy: Math.sin(a + offset) * 290, life: 3, r: 10, damage: 15 + run.level.difficulty * 1.5, color: "#ff597a" });
        burst(boss.x - 30, boss.y - 26, "#ff597a", 5, 65); sound("spit");
      }
    }

    for (const bullet of bullets) {
      bullet.x += bullet.vx * dt; bullet.y += bullet.vy * dt; bullet.life -= dt;
      for (const enemy of enemies) {
        if (enemy.dead || bullet.hitIds.includes(enemy.id)) continue;
        if (Math.hypot(enemy.x - bullet.x, enemy.y - enemy.radius * 0.5 - bullet.y) < enemy.radius * 0.8 + bullet.r) {
          enemy.hp -= bullet.damage; enemy.hit = 0.12; bullet.life = 0;
          burst(bullet.x, bullet.y, bullet.color, 3, 70); sound("impact");
          if (bullet.splash) for (const other of enemies) if (!other.dead && other !== enemy && Math.hypot(other.x - enemy.x, other.y - enemy.y) < bullet.splash) other.hp -= bullet.damage * 0.65;
          if (bullet.chain) {
            let left = bullet.chain;
            for (const other of enemies) if (!other.dead && other !== enemy && Math.hypot(other.x - enemy.x, other.y - enemy.y) < 150 && left-- > 0) { other.hp -= bullet.damage * 0.65; burst(other.x, other.y - 10, "#69efff", 6, 95); }
          }
          if (enemy.hp <= 0) killEnemy(enemy);
          break;
        }
      }
      if (boss && bullet.life > 0 && Math.hypot(boss.x - bullet.x, boss.y - 28 - bullet.y) < boss.radius * 0.82 + bullet.r) { hurtBoss(bullet.damage); bullet.life = 0; burst(bullet.x, bullet.y, bullet.color, 4, 90); }
    }
    bullets = bullets.filter((bullet) => bullet.life > 0 && bullet.x < view.W + 80 && bullet.y > -30 && bullet.y < view.H + 20);
    enemies = enemies.filter((enemy) => !enemy.dead && enemy.x > -80);

    for (const hazard of hazards) {
      hazard.x += hazard.vx * dt; hazard.y += hazard.vy * dt; hazard.life -= dt;
      if (Math.hypot(hazard.x - player.x, hazard.y - (player.y - 52 * playerScale())) < hazard.r + 28 * playerScale()) { hazard.life = 0; damagePlayer(hazard.damage); burst(hazard.x, hazard.y, hazard.color, 8, 110); }
    }
    hazards = hazards.filter((hazard) => hazard.life > 0 && hazard.x > -30 && hazard.x < view.W + 30);

    for (const coin of pickups) {
      coin.phase += dt * 5; coin.vy += 360 * dt; coin.x += coin.vx * dt; coin.y += coin.vy * dt;
      const magnet = 100 + upgradeValue("magnet") * 45;
      const distance = Math.hypot(player.x - coin.x, player.y - coin.y);
      if (distance < magnet) { const force = (1 - distance / magnet) * 580; coin.vx += (player.x - coin.x) / Math.max(1, distance) * force * dt; coin.vy += (player.y - coin.y) / Math.max(1, distance) * force * dt; }
      if (distance < 45 * playerScale()) { run.coins += coin.value; coin.life = 0; burst(coin.x, coin.y, "#ffe66d", 4, 75); floatText(player.x, player.y - 110, `+${coin.value}`, "#ffe66d"); sound("coin"); }
      coin.life -= dt;
    }
    pickups = pickups.filter((coin) => coin.life > 0 && coin.y < view.H + 30);

    for (const part of particles) { part.life -= dt; part.x += part.vx * dt; part.y += part.vy * dt; part.vx *= Math.pow(0.1, dt); part.vy += (part.gravity || 0) * dt; }
    particles = particles.filter((part) => part.life > 0);
    for (const floater of floaters) { floater.life -= dt; floater.y -= 30 * dt; }
    floaters = floaters.filter((floater) => floater.life > 0);
    run.comboTimer -= dt;
    if (run.comboTimer <= 0) run.combo = 0;
    shake = Math.max(0, shake - dt * 24);
    flash = Math.max(0, flash - dt * 1.8);
    if (hintTimer > 0) hintTimer -= dt;
    if (bannerTimer > 0 && (bannerTimer -= dt) <= 0) ui.banner.classList.remove("show");
    if (toastTimer > 0 && (toastTimer -= dt) <= 0) ui.toast.classList.remove("show");
    updateHUD();
  }

  /* ------------------------------------------------------------------ */
  /* Canvas rendering                                                    */
  /* ------------------------------------------------------------------ */

  function drawPlayer(actor, now) {
    const s = playerScale();
    const moving = scene === "playing" || actor.menu;
    const stride = moving ? Math.sin(now * 10) : 0;
    const x = actor.x; const y = actor.y;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    if (actor.invuln > 0 && Math.floor(now * 18) % 2) ctx.globalAlpha = 0.55;
    // Ground shadow
    ctx.fillStyle = "rgba(8,4,16,0.42)";
    ctx.beginPath(); ctx.ellipse(-4, 3, 35, 8, 0, 0, TAU); ctx.fill();
    // Back leg and boot
    ctx.strokeStyle = "#26304a"; ctx.lineWidth = 10; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-8, -28); ctx.lineTo(-16 + stride * 7, -10); ctx.lineTo(-19 + stride * 10, -2); ctx.stroke();
    ctx.fillStyle = "#22283d"; ctx.beginPath(); ctx.roundRect(-26 + stride * 10, -7, 17, 7, 3); ctx.fill();
    // Front leg
    ctx.strokeStyle = "#38435c"; ctx.lineWidth = 11;
    ctx.beginPath(); ctx.moveTo(6, -29); ctx.lineTo(13 - stride * 7, -12); ctx.lineTo(20 - stride * 10, -2); ctx.stroke();
    ctx.fillStyle = "#303449"; ctx.beginPath(); ctx.roundRect(11 - stride * 10, -7, 19, 7, 3); ctx.fill();
    // Jacket torso
    ctx.fillStyle = actor.hitFlash > 0 ? "#fff0d6" : "#e4a344";
    ctx.beginPath(); ctx.moveTo(-14, -66); ctx.quadraticCurveTo(-3, -74, 12, -67); ctx.lineTo(19, -31); ctx.quadraticCurveTo(0, -22, -18, -32); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#f6c75e"; ctx.beginPath(); ctx.moveTo(-12, -63); ctx.lineTo(-2, -58); ctx.lineTo(-8, -34); ctx.lineTo(-17, -36); ctx.closePath(); ctx.fill();
    // Backpack
    ctx.fillStyle = "#50556b"; ctx.beginPath(); ctx.roundRect(-24, -65, 12, 24, 4); ctx.fill();
    ctx.fillStyle = "#d8ff47"; ctx.fillRect(-21, -59, 5, 6);
    // Neck + head
    ctx.fillStyle = "#d78b67"; ctx.fillRect(0, -77, 9, 12);
    ctx.fillStyle = "#f0bd8e"; ctx.beginPath(); ctx.ellipse(2, -83, 13, 14, -0.08, 0, TAU); ctx.fill();
    ctx.fillStyle = "#344358"; ctx.beginPath(); ctx.ellipse(1, -88, 14, 11, -0.08, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = "#d9ff45"; ctx.fillRect(4, -88, 10, 4);
    ctx.fillStyle = "#533c42"; ctx.fillRect(-8, -81, 5, 2);
    // Gun and aiming arm
    const gunX = 7; const gunY = -56;
    ctx.save(); ctx.translate(gunX, gunY); ctx.rotate(actor.aimAngle || -0.15);
    ctx.fillStyle = "#b9c3cf"; ctx.beginPath(); ctx.roundRect(0, -5, 30, 10, 3); ctx.fill();
    ctx.fillStyle = "#34404f"; ctx.fillRect(8, -3, 21, 5);
    ctx.fillStyle = "#d9ff45"; ctx.fillRect(22, -4, 5, 2);
    ctx.fillStyle = "#3b4050"; ctx.beginPath(); ctx.roundRect(7, 2, 8, 11, 2); ctx.fill();
    if (actor.muzzle > 0) {
      const power = actor.muzzle;
      ctx.fillStyle = `rgba(255,235,135,${power})`;
      ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(43 + Math.random() * 5, -7 * power); ctx.lineTo(38, 0); ctx.lineTo(43 + Math.random() * 5, 7 * power); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = "#d99571"; ctx.lineWidth = 7; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(4, -57); ctx.lineTo(17, -55); ctx.stroke();
    // Jacket details
    ctx.fillStyle = "#392d3c"; ctx.fillRect(-2, -48, 4, 10);
    ctx.restore();
  }

  function drawEnemy(enemy) {
    const perspective = clamp(0.7 + (enemy.y - view.horizonY) / (view.groundY - view.horizonY) * 0.36, 0.65, 1.12);
    const s = actorScale() * perspective;
    const bob = Math.sin(enemy.bob) * 2.4;
    ctx.save(); ctx.translate(enemy.x, enemy.y + bob); ctx.scale(s, s);
    const r = enemy.radius / Math.max(0.7, s);
    ctx.fillStyle = "rgba(8,4,16,0.35)"; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.12, 6, 0, 0, TAU); ctx.fill();
    const body = enemy.hit > 0 ? "#fff4d8" : enemy.color;
    // lurching legs and claws
    ctx.strokeStyle = body; ctx.lineWidth = enemy.type === "brute" ? 9 : 6; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-7, -20); ctx.lineTo(-12 + Math.sin(enemy.bob) * 5, -4); ctx.moveTo(7, -20); ctx.lineTo(13 - Math.sin(enemy.bob) * 5, -4); ctx.stroke();
    ctx.fillStyle = body;
    if (enemy.type === "brute") {
      ctx.beginPath(); ctx.ellipse(0, -34, 24, 27, -0.12, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(2, -61, 19, 18, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = "#462e43"; ctx.fillRect(4, -64, 17, 6);
      ctx.fillStyle = "#ffed91"; ctx.fillRect(8, -63, 5, 3); ctx.fillRect(17, -63, 5, 3);
      ctx.fillStyle = "#f5d894"; ctx.fillRect(-16, -23, 8, 4);
    } else {
      ctx.beginPath(); ctx.ellipse(0, -31, 16, 23, 0.1, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(2, -56, 14, 14, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = "#35283f"; ctx.beginPath(); ctx.ellipse(5, -58, 12, 5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = enemy.type === "spitter" ? "#bbf773" : "#ffdd72";
      ctx.fillRect(3, -59, 4, 3); ctx.fillRect(12, -59, 4, 3);
      ctx.fillStyle = "#eee0bd"; ctx.fillRect(6, -48, 8, 3);
      ctx.strokeStyle = body; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-11, -39); ctx.lineTo(-21, -26); ctx.moveTo(11, -38); ctx.lineTo(19, -28); ctx.stroke();
      ctx.fillStyle = "#f5e4bd"; ctx.fillRect(-24, -27, 8, 3); ctx.fillRect(16, -29, 8, 3);
    }
    if (enemy.hp < enemy.maxHp) {
      ctx.fillStyle = "rgba(15,9,24,0.7)"; ctx.fillRect(-16, -83, 32, 4);
      ctx.fillStyle = "#ff577a"; ctx.fillRect(-16, -83, 32 * clamp(enemy.hp / enemy.maxHp, 0, 1), 4);
    }
    ctx.restore();
  }

  function drawBoss() {
    if (!boss) return;
    const s = actorScale() * 1.7; const bob = Math.sin(boss.bob) * 3;
    ctx.save(); ctx.translate(boss.x, boss.y + bob); ctx.scale(s, s);
    ctx.fillStyle = "rgba(8,4,16,0.45)"; ctx.beginPath(); ctx.ellipse(0, 4, 54, 11, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = boss.hit > 0 ? "#fff2dc" : "#75964f"; ctx.lineWidth = 17; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-20, -50); ctx.lineTo(-31, -8); ctx.moveTo(19, -49); ctx.lineTo(32, -8); ctx.stroke();
    ctx.fillStyle = boss.hit > 0 ? "#fff2dc" : "#638848";
    ctx.beginPath(); ctx.ellipse(0, -63, 48, 44, -0.06, 0, TAU); ctx.fill();
    ctx.fillStyle = boss.hit > 0 ? "#fff2dc" : "#89a94e";
    ctx.beginPath(); ctx.ellipse(4, -109, 34, 31, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = "#34253c"; ctx.beginPath(); ctx.ellipse(13, -110, 26, 10, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = "#ff405f"; ctx.shadowColor = "#ff3159"; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.ellipse(8, -110, 6, 4, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(27, -110, 6, 4, 0, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff0c8"; ctx.beginPath(); ctx.moveTo(12, -92); ctx.lineTo(18, -78); ctx.lineTo(23, -94); ctx.fill();
    ctx.strokeStyle = "#8faf5c"; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(-35, -80); ctx.lineTo(-54, -55); ctx.moveTo(35, -80); ctx.lineTo(54, -55); ctx.stroke();
    ctx.restore();
  }

  function drawWorld(now) {
    if (!backdrop) buildBackdrop();
    ctx.setTransform(view.DPR, 0, 0, view.DPR, 0, 0);
    ctx.fillStyle = "#100b21"; ctx.fillRect(0, 0, view.W, view.H);
    const shakeX = shake ? rand(-shake, shake) : 0; const shakeY = shake ? rand(-shake * 0.5, shake * 0.5) : 0;
    ctx.save(); ctx.translate(shakeX, shakeY);
    ctx.drawImage(backdrop, 0, 0, view.W, view.H);
    drawScenery(run ? run.scroll : menu.scroll, 0);
    if (scene === "playing" || ["paused", "clear", "dead"].includes(scene)) {
      const sorted = enemies.slice().sort((a, b) => a.y - b.y);
      for (const enemy of sorted) drawEnemy(enemy);
      drawBoss();
      for (const hazard of hazards) {
        ctx.fillStyle = hazard.color; ctx.shadowColor = hazard.color; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(hazard.x, hazard.y, hazard.r, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.beginPath(); ctx.arc(hazard.x - 2, hazard.y - 2, hazard.r * 0.35, 0, TAU); ctx.fill();
      }
      for (const bullet of bullets) {
        ctx.strokeStyle = bullet.color; ctx.lineWidth = bullet.r * 1.4; ctx.lineCap = "round"; ctx.globalAlpha = 0.45;
        ctx.beginPath(); ctx.moveTo(bullet.x - bullet.vx * 0.018, bullet.y - bullet.vy * 0.018); ctx.lineTo(bullet.x, bullet.y); ctx.stroke(); ctx.globalAlpha = 1;
        ctx.fillStyle = "#fff8d5"; ctx.beginPath(); ctx.arc(bullet.x, bullet.y, bullet.r, 0, TAU); ctx.fill();
      }
      for (const coin of pickups) {
        const bob = Math.sin(coin.phase) * 3;
        ctx.fillStyle = "#c87811"; ctx.beginPath(); ctx.arc(coin.x, coin.y + bob, coin.r, 0, TAU); ctx.fill();
        ctx.fillStyle = "#ffe362"; ctx.beginPath(); ctx.arc(coin.x, coin.y + bob - 1, coin.r - 2, 0, TAU); ctx.fill();
        ctx.fillStyle = "#fff4b1"; ctx.fillRect(coin.x - 1, coin.y + bob - 4, 2, 7);
      }
      if (player) drawPlayer(player, now);
      for (const part of particles) {
        const alpha = clamp(part.life / part.maxLife, 0, 1);
        ctx.globalAlpha = alpha; ctx.strokeStyle = part.color; ctx.fillStyle = part.color;
        if (part.ring) { ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(part.x, part.y, part.size * (1.4 - alpha), 0, TAU); ctx.stroke(); }
        else { ctx.beginPath(); ctx.arc(part.x, part.y, Math.max(0.7, part.size * alpha), 0, TAU); ctx.fill(); }
      }
      ctx.globalAlpha = 1;
      for (const text of floaters) { ctx.globalAlpha = clamp(text.life / text.maxLife, 0, 1); ctx.font = "900 15px Outfit, sans-serif"; ctx.textAlign = "center"; ctx.lineWidth = 3; ctx.strokeStyle = "rgba(20,12,32,.8)"; ctx.strokeText(text.text, text.x, text.y); ctx.fillStyle = text.color; ctx.fillText(text.text, text.x, text.y); }
      ctx.globalAlpha = 1;
    } else {
      // A tiny animated title-scene vignette; the actual game remains in the same canvas.
      if (!player) player = makePlayer();
      player.menu = true; player.aimAngle = -0.48;
      drawPlayer(player, now);
      for (let i = 0; i < 3; i++) drawEnemy({ x: view.W * (0.73 + i * 0.13), y: view.groundY - 18 - i * 12, radius: 20, bob: now * 4 + i * 1.8, type: i === 1 ? "brute" : "runner", color: ["#91d95e", "#d88752", "#c675b6"][i], hp: 20, maxHp: 20, hit: 0 });
    }
    ctx.restore();
    if (flash > 0) { ctx.fillStyle = `rgba(${flashColor},${flash})`; ctx.fillRect(0, 0, view.W, view.H); }
    if (scene === "playing" && input.aiming && player) {
      const mx = player.x + 38 * playerScale(); const my = player.y - 57 * playerScale();
      ctx.strokeStyle = "rgba(217,255,69,.15)"; ctx.setLineDash([5, 8]); ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + Math.cos(player.aimAngle) * 100, my + Math.sin(player.aimAngle) * 100); ctx.stroke(); ctx.setLineDash([]);
    }
  }

  function nearestTarget(x, y, maxDistance = Infinity) {
    let best = null; let bestDist = maxDistance * maxDistance;
    for (const enemy of enemies) {
      if (enemy.dead) continue;
      const d = (enemy.x - x) ** 2 + (enemy.y - enemy.radius * 0.6 - y) ** 2;
      if (d < bestDist) { bestDist = d; best = { x: enemy.x, y: enemy.y - enemy.radius * 0.6 }; }
    }
    if (boss) { const d = (boss.x - x) ** 2 + (boss.y - 28 - y) ** 2; if (d < bestDist) best = { x: boss.x, y: boss.y - 28 }; }
    return best;
  }

  function updateHUD() {
    if (!run || !player) return;
    const hp = clamp(player.hp / player.maxHp, 0, 1);
    ui.hpText.textContent = `${Math.ceil(Math.max(0, player.hp))}`;
    ui.hpFill.style.transform = `scaleX(${hp})`;
    ui.healthCard.classList.toggle("low", hp < 0.3);
    ui.hudWeapon.textContent = getWeapon().name;
    ui.hudWeaponTag.textContent = getWeapon().tag;
    ui.sectorNum.textContent = pad2(run.level.sector);
    ui.sectorName.textContent = run.level.stage;
    ui.waveLabel.textContent = `WAVE ${Math.min(run.wave, run.waves)} / ${run.waves}`;
    const waveProgress = run.wave <= run.waves ? (run.wave - 1 + (run.waveKills / Math.max(1, run.waveGoal))) / run.waves : 1;
    ui.wavePercent.textContent = `${Math.round(waveProgress * 100)}%`;
    ui.waveFill.style.transform = `scaleX(${clamp(waveProgress, 0, 1)})`;
    ui.bossFill.style.transform = `scaleX(${boss ? clamp(boss.hp / boss.maxHp, 0, 1) : 0})`;
    ui.comboHud.classList.toggle("active", run.combo > 1);
    ui.comboCount.textContent = run.combo;
    ui.comboFill.style.transform = `scaleX(${clamp(run.comboTimer / 2.15, 0, 1)})`;
    ui.aimHint.classList.toggle("visible", hintTimer > 0 && !input.usedAim);
  }
