/* A slow, always-on layer behind the page: falling petals, drifting blossoms,
   and twinkling sparkles. Confetti stays on its own canvas above the content. */

const PETAL_COLORS = [
  ["#ffd2e0", "#f7a8c4"],
  ["#ffe3c9", "#f6bd94"],
  ["#e6d6f7", "#c3a6e8"],
  ["#d7eee3", "#a5d6c0"],
  ["#ffe9b8", "#f2cc7a"],
];
const BLOSSOM_COLORS = ["#f7a8c4", "#f6bd94", "#c3a6e8", "#a5d6c0", "#f2cc7a"];
const SPARKLE_COLORS = ["#ffffff", "#ffe9b8", "#ffd2e0"];
const CANDLE_SPARK_COLORS = ["#ffe9b8", "#ffd88a", "#fff4d2"];

/* Pressed-flower tones for the cover: everything a little sun-faded. */
const VINTAGE_PETAL_COLORS = [
  ["#e8d4b4", "#c9a877"],
  ["#e3c3b0", "#c08d74"],
  ["#dcd2b6", "#b6a878"],
  ["#e6cfc0", "#bf9b86"],
  ["#d8c8ae", "#ab9670"],
];
const VINTAGE_BLOSSOM_COLORS = ["#c9a877", "#c08d74", "#b6a878", "#bf9b86", "#a8845f"];
const VINTAGE_SPARKLE_COLORS = ["#f3e6cb", "#e2cda3", "#d9bf94"];

const MAX_PETALS = 26;
const MAX_BLOSSOMS = 7;
const MAX_SPARKLES = 22;
const MAX_CANDLES = 9;

const canvas = document.getElementById("ambience");
const ctx = canvas?.getContext("2d");
const calmMode = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let petals = [];
let blossoms = [];
let sparkles = [];
let candles = [];
let snitch = null;
let theme = "";
let frame = null;
let running = false;

function resize() {
  if (!canvas) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * ratio);
  canvas.height = Math.floor(window.innerHeight * ratio);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function between(min, max) {
  return min + Math.random() * (max - min);
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

/* The cover drifts with the same flowers as everywhere else, only sun-faded,
   so recycled pieces have to keep asking which palette is in play. */
const faded = () => theme === "vintage";

function makePetal(seeded = false) {
  const size = between(9, 19);
  return {
    x: between(-40, window.innerWidth + 40),
    y: seeded ? between(-60, window.innerHeight) : between(-120, -20),
    size,
    colors: pick(faded() ? VINTAGE_PETAL_COLORS : PETAL_COLORS),
    fall: between(0.22, 0.62),
    sway: between(0.5, 1.5),
    swayPhase: between(0, Math.PI * 2),
    swaySpeed: between(0.004, 0.011),
    angle: between(0, Math.PI * 2),
    spin: between(-0.009, 0.009),
    /* flutter makes the petal turn edge-on as it falls */
    flutter: between(0, Math.PI * 2),
    flutterSpeed: between(0.012, 0.028),
    alpha: faded() ? between(0.3, 0.58) : between(0.42, 0.78),
  };
}

function makeBlossom(seeded = false) {
  return {
    x: between(-30, window.innerWidth + 30),
    y: seeded ? between(-40, window.innerHeight) : between(-140, -40),
    size: between(9, 15),
    color: pick(faded() ? VINTAGE_BLOSSOM_COLORS : BLOSSOM_COLORS),
    fall: between(0.16, 0.38),
    sway: between(0.8, 2),
    swayPhase: between(0, Math.PI * 2),
    swaySpeed: between(0.003, 0.008),
    angle: between(0, Math.PI * 2),
    spin: between(-0.006, 0.006),
    alpha: faded() ? between(0.22, 0.42) : between(0.3, 0.55),
  };
}

function makeSparkle(seeded = false) {
  return {
    x: between(0, window.innerWidth),
    y: seeded ? between(0, window.innerHeight) : between(window.innerHeight * 0.55, window.innerHeight + 60),
    size: between(1.8, 4.4),
    color: pick(faded() ? VINTAGE_SPARKLE_COLORS : SPARKLE_COLORS),
    rise: between(0.08, 0.32),
    drift: between(-0.16, 0.16),
    phase: between(0, Math.PI * 2),
    twinkle: between(0.012, 0.035),
    alpha: between(0.3, 0.8),
  };
}

function drawPetal(petal) {
  const { size } = petal;
  ctx.save();
  ctx.translate(petal.x, petal.y);
  ctx.rotate(petal.angle);
  ctx.scale(Math.max(0.24, Math.abs(Math.cos(petal.flutter))), 1);
  ctx.globalAlpha = petal.alpha;

  const gradient = ctx.createLinearGradient(0, -size, 0, size);
  gradient.addColorStop(0, petal.colors[0]);
  gradient.addColorStop(1, petal.colors[1]);
  ctx.fillStyle = gradient;

  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.bezierCurveTo(size * 0.82, -size * 0.5, size * 0.6, size * 0.72, 0, size);
  ctx.bezierCurveTo(-size * 0.6, size * 0.72, -size * 0.82, -size * 0.5, 0, -size);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawBlossom(blossom) {
  const { size } = blossom;
  ctx.save();
  ctx.translate(blossom.x, blossom.y);
  ctx.rotate(blossom.angle);
  ctx.globalAlpha = blossom.alpha;
  ctx.fillStyle = blossom.color;

  for (let i = 0; i < 5; i += 1) {
    ctx.save();
    ctx.rotate((Math.PI * 2 * i) / 5);
    ctx.beginPath();
    ctx.ellipse(0, -size * 0.58, size * 0.34, size * 0.58, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.globalAlpha = Math.min(1, blossom.alpha + 0.25);
  ctx.fillStyle = "#fff6dd";
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.26, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawSparkle(sparkle) {
  const pulse = (Math.sin(sparkle.phase) + 1) / 2;
  const reach = sparkle.size * (1.6 + pulse * 1.5);
  ctx.save();
  ctx.translate(sparkle.x, sparkle.y);
  ctx.globalAlpha = sparkle.alpha * (0.35 + pulse * 0.65);
  ctx.fillStyle = sparkle.color;

  /* a soft four-point star */
  ctx.beginPath();
  ctx.moveTo(0, -reach);
  ctx.quadraticCurveTo(0, 0, reach, 0);
  ctx.quadraticCurveTo(0, 0, 0, reach);
  ctx.quadraticCurveTo(0, 0, -reach, 0);
  ctx.quadraticCurveTo(0, 0, 0, -reach);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/* ---------- hogwarts ---------- */

function makeCandle(seeded = false) {
  return {
    x: between(0.04, 0.96) * window.innerWidth,
    y: seeded ? between(0, window.innerHeight) : between(window.innerHeight, window.innerHeight + 200),
    scale: between(0.6, 1.25),
    bob: between(0, Math.PI * 2),
    bobSpeed: between(0.008, 0.018),
    rise: between(0.05, 0.16),
    drift: between(-0.08, 0.08),
    flicker: between(0, Math.PI * 2),
    flickerSpeed: between(0.09, 0.2),
    alpha: between(0.5, 0.9),
  };
}

function makeSnitch() {
  return {
    x: -80,
    y: between(window.innerHeight * 0.15, window.innerHeight * 0.6),
    vx: between(1.6, 2.8),
    wander: between(0, Math.PI * 2),
    wanderSpeed: between(0.02, 0.04),
    amplitude: between(40, 110),
    wing: 0,
    /* the snitch rests offscreen between passes */
    pause: between(120, 420),
  };
}

function drawCandle(candle) {
  const s = candle.scale;
  const flicker = 0.78 + Math.sin(candle.flicker) * 0.22;
  const sway = Math.sin(candle.bob) * 4;

  ctx.save();
  ctx.translate(candle.x + sway, candle.y);
  ctx.globalAlpha = candle.alpha;

  /* halo */
  const halo = ctx.createRadialGradient(0, -14 * s, 0, 0, -14 * s, 34 * s * flicker);
  halo.addColorStop(0, "rgba(255, 214, 140, 0.5)");
  halo.addColorStop(1, "rgba(255, 196, 110, 0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, -14 * s, 34 * s * flicker, 0, Math.PI * 2);
  ctx.fill();

  /* wax */
  ctx.fillStyle = "rgba(250, 240, 220, 0.9)";
  ctx.fillRect(-3 * s, -8 * s, 6 * s, 24 * s);
  ctx.fillStyle = "rgba(220, 205, 180, 0.7)";
  ctx.fillRect(1 * s, -8 * s, 2 * s, 24 * s);

  /* flame */
  ctx.fillStyle = "rgba(255, 176, 74, 0.95)";
  ctx.beginPath();
  ctx.ellipse(0, -13 * s, 3.2 * s * flicker, 7.5 * s * flicker, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 240, 190, 0.95)";
  ctx.beginPath();
  ctx.ellipse(0, -12 * s, 1.5 * s * flicker, 4 * s * flicker, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawSnitch(bird) {
  ctx.save();
  ctx.translate(bird.x, bird.y + Math.sin(bird.wander) * bird.amplitude);

  const spread = 9 + Math.sin(bird.wing) * 7;

  /* wings */
  ctx.globalAlpha = 0.72;
  ctx.fillStyle = "rgba(255, 248, 226, 0.9)";
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);
    ctx.beginPath();
    ctx.ellipse(11, -spread * 0.4, 12, spread * 0.55, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* glow */
  ctx.globalAlpha = 1;
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 26);
  glow.addColorStop(0, "rgba(255, 214, 120, 0.55)");
  glow.addColorStop(1, "rgba(255, 196, 90, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 26, 0, Math.PI * 2);
  ctx.fill();

  /* body */
  const body = ctx.createRadialGradient(-2, -2, 1, 0, 0, 8);
  body.addColorStop(0, "#ffe9a8");
  body.addColorStop(1, "#c8922c");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function tick() {
  if (!running) {
    frame = null;
    return;
  }

  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  if (theme === "hogwarts") {
    if (!document.hidden) {
      for (const candle of candles) {
        candle.bob += candle.bobSpeed;
        candle.flicker += candle.flickerSpeed;
        candle.x += candle.drift;
        candle.y -= candle.rise;
        if (candle.y < -60) Object.assign(candle, makeCandle(), { y: window.innerHeight + between(20, 220) });
      }

      for (const sparkle of sparkles) {
        sparkle.phase += sparkle.twinkle;
        sparkle.x += sparkle.drift;
        sparkle.y -= sparkle.rise;
        if (sparkle.y < -30) Object.assign(sparkle, makeSparkle());
      }

      if (snitch) {
        if (snitch.pause > 0) {
          snitch.pause -= 1;
        } else {
          snitch.wander += snitch.wanderSpeed;
          snitch.wing += 0.55;
          snitch.x += snitch.vx;
          if (snitch.x > window.innerWidth + 80) snitch = makeSnitch();
        }
      }
    }

    candles.forEach(drawCandle);
    sparkles.forEach(drawSparkle);
    if (snitch && snitch.pause <= 0) drawSnitch(snitch);

    frame = requestAnimationFrame(tick);
    return;
  }

  if (!document.hidden) {
    for (const petal of petals) {
      petal.swayPhase += petal.swaySpeed;
      petal.flutter += petal.flutterSpeed;
      petal.angle += petal.spin;
      petal.x += Math.sin(petal.swayPhase) * petal.sway;
      petal.y += petal.fall;
      if (petal.y > window.innerHeight + 50) Object.assign(petal, makePetal());
    }

    for (const blossom of blossoms) {
      blossom.swayPhase += blossom.swaySpeed;
      blossom.angle += blossom.spin;
      blossom.x += Math.sin(blossom.swayPhase) * blossom.sway;
      blossom.y += blossom.fall;
      if (blossom.y > window.innerHeight + 60) Object.assign(blossom, makeBlossom());
    }

    for (const sparkle of sparkles) {
      sparkle.phase += sparkle.twinkle;
      sparkle.x += sparkle.drift;
      sparkle.y -= sparkle.rise;
      if (sparkle.y < -30) Object.assign(sparkle, makeSparkle());
    }
  }

  petals.forEach(drawPetal);
  blossoms.forEach(drawBlossom);
  sparkles.forEach(drawSparkle);

  frame = requestAnimationFrame(tick);
}

function seed() {
  petals = Array.from({ length: MAX_PETALS }, () => makePetal(true));
  blossoms = Array.from({ length: MAX_BLOSSOMS }, () => makeBlossom(true));
  sparkles = Array.from({ length: MAX_SPARKLES }, () => makeSparkle(true));
  candles = Array.from({ length: MAX_CANDLES }, () => makeCandle(true));
  snitch = makeSnitch();
}

export function startAmbience() {
  if (!canvas || calmMode || running) return;
  resize();
  window.addEventListener("resize", resize);
  seed();

  running = true;
  frame = requestAnimationFrame(tick);
}

/* Swaps which world is drifting behind the page. */
export function setAmbienceTheme(name = "") {
  if (name === theme) return;
  theme = name;
  if (!canvas || calmMode) return;

  sparkles = Array.from({ length: MAX_SPARKLES }, () => makeSparkle(true));

  if (theme === "hogwarts") {
    sparkles.forEach((sparkle) => {
      sparkle.color = pick(CANDLE_SPARK_COLORS);
    });
    candles = Array.from({ length: MAX_CANDLES }, () => makeCandle(true));
    snitch = makeSnitch();
    return;
  }

  petals = Array.from({ length: MAX_PETALS }, () => makePetal(true));
  blossoms = Array.from({ length: MAX_BLOSSOMS }, () => makeBlossom(true));
}

export function stopAmbience() {
  running = false;
  if (frame) cancelAnimationFrame(frame);
  frame = null;
}

/* A gust of extra petals, for moments worth marking. Under candlelight the
   same moment arrives as a swirl of embers instead. */
export function petalBurst(count = 12) {
  if (!canvas || calmMode) return;

  if (theme === "hogwarts") {
    for (let i = 0; i < count; i += 1) {
      const sparkle = makeSparkle();
      sparkle.color = pick(CANDLE_SPARK_COLORS);
      sparkle.y = between(window.innerHeight * 0.6, window.innerHeight + 40);
      sparkle.rise = between(0.5, 1.4);
      sparkle.size = between(2.4, 5.6);
      sparkles.push(sparkle);
    }
    sparkles = sparkles.slice(-(MAX_SPARKLES + 26));
  } else {
    for (let i = 0; i < count; i += 1) {
      const petal = makePetal();
      petal.y = between(-160, -30);
      petal.fall = between(0.6, 1.5);
      petals.push(petal);
    }
    petals = petals.slice(-(MAX_PETALS + 26));
  }

  if (!running) startAmbience();
}
