const PALETTES = {
  "": ["#ff4f8b", "#f5c445", "#37c2dd", "#9b7ce0", "#4fc78e", "#ff9f6e"],
  hogwarts: ["#d4af5f", "#9b1c2a", "#f0d6a0", "#7d1523", "#ffeec2", "#b8862f"],
  vintage: ["#c9a877", "#a8845f", "#c08d74", "#8e6b4a", "#dcc9a3", "#9c7b52"],
};

let PALETTE = PALETTES[""];

export function setConfettiTheme(name = "") {
  PALETTE = PALETTES[name] || PALETTES[""];
}
const GRAVITY = 0.16;
const DRAG = 0.987;
const TERMINAL = 4.6;
const MAX_PARTICLES = 340;

const canvas = document.getElementById("confetti");
const ctx = canvas.getContext("2d");
const calmMode = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let particles = [];
let frame = null;
let driftTimer = null;

function resize() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * ratio);
  canvas.height = Math.floor(window.innerHeight * ratio);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

resize();
window.addEventListener("resize", resize);

function between(min, max) {
  return min + Math.random() * (max - min);
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function makeParticle(x, y, vx, vy, scale = 1) {
  const round = Math.random() < 0.45;
  return {
    x,
    y,
    vx,
    vy,
    width: between(3.5, 7) * scale,
    height: round ? 0 : between(5, 11) * scale,
    round,
    color: pick(PALETTE),
    angle: between(0, Math.PI * 2),
    spin: between(-0.06, 0.06),
    wobble: between(0, Math.PI * 2),
    wobbleSpeed: between(0.02, 0.05),
    life: between(220, 400),
    maxLife: 400,
  };
}

function add(newParticles) {
  particles = particles.concat(newParticles).slice(-MAX_PARTICLES);
  if (!frame) frame = requestAnimationFrame(tick);
}

function roundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  ctx.fill();
}

function draw(particle) {
  ctx.save();
  ctx.translate(particle.x, particle.y);
  ctx.rotate(particle.angle);
  ctx.fillStyle = particle.color;
  ctx.globalAlpha = 0.82 * Math.min(1, particle.life / 90);

  if (particle.round) {
    ctx.beginPath();
    ctx.arc(0, 0, particle.width / 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.scale(1, Math.max(0.3, Math.abs(Math.cos(particle.wobble))));
    roundedRect(
      -particle.width / 2,
      -particle.height / 2,
      particle.width,
      particle.height,
      particle.width / 2.4,
    );
  }

  ctx.restore();
}

function tick() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  const alive = [];
  for (const particle of particles) {
    particle.vy = Math.min(particle.vy + GRAVITY, TERMINAL);
    particle.vx *= DRAG;
    particle.vy *= DRAG;
    particle.x += particle.vx + Math.sin(particle.wobble) * 0.55;
    particle.y += particle.vy;
    particle.angle += particle.spin;
    particle.wobble += particle.wobbleSpeed;
    particle.life -= 1;

    if (particle.life > 0 && particle.y < window.innerHeight + 40) {
      draw(particle);
      alive.push(particle);
    }
  }

  particles = alive;
  frame = particles.length ? requestAnimationFrame(tick) : null;
}

export function puff(x, y, count = 34) {
  const total = calmMode ? Math.round(count / 4) : count;
  const made = [];
  for (let i = 0; i < total; i += 1) {
    const angle = between(0, Math.PI * 2);
    const speed = between(1.5, 6.5);
    made.push(makeParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed - 2.2));
  }
  add(made);
}

export function puffFrom(element, count = 30) {
  const box = element.getBoundingClientRect();
  puff(box.left + box.width / 2, box.top + box.height / 2, count);
}

export function fall(count = 26) {
  const total = calmMode ? Math.round(count / 4) : count;
  const made = [];
  for (let i = 0; i < total; i += 1) {
    made.push(
      makeParticle(between(0, window.innerWidth), between(-140, -20), between(-0.7, 0.7), between(0.4, 1.6)),
    );
  }
  add(made);
}

export function startDrift() {
  if (calmMode || driftTimer) return;
  driftTimer = setInterval(() => {
    if (document.hidden) return;
    add([makeParticle(between(0, window.innerWidth), -20, between(-0.5, 0.5), between(0.3, 1), 0.85)]);
  }, 1700);
}

export function stopDrift() {
  clearInterval(driftTimer);
  driftTimer = null;
}
