const canvas = document.getElementById("cursorCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// --- Config ---
const RADIUS = 12.5; // 25px diameter
const STIFFNESS = 0.05; // slower follow
const DAMPING = 0.75; // slightly more damping for heavier elastic feel
const STRETCH_MAX = 2;
const STRETCH_DECAY = 0.1;

// Ease in/out cubic applied to spring force
// When circle is far → pulls harder (ease-in)
// When circle is close → eases off (ease-out)
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Mouse target
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

// Spring position (starts centered)
let posX = mouseX;
let posY = mouseY;

// Spring velocity
let velX = 0;
let velY = 0;

// Stretch state
let stretchX = 1;
let stretchY = 1;
let motionAngle = 0;

document.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

document.addEventListener("touchmove", (e) => {
  mouseX = e.touches[0].clientX;
  mouseY = e.touches[0].clientY;
});

// --- Helpers ---
let lastTime = performance.now();
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// --- Animation loop ---
function tick(now) {
  const dt = Math.min((now - lastTime) / (1000 / 60), 3);
  lastTime = now;

  // Distance from circle to cursor — used to ease the stiffness
  const dx = mouseX - posX;
  const dy = mouseY - posY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Normalise: 300px = "fully away", eased 0..1
  const normDist = clamp(dist / 300, 0, 1);
  const easedMult = easeInOutCubic(normDist);

  // Stiffness ramps from ~30% at rest up to full STIFFNESS when far
  const easedStiffness = lerp(STIFFNESS * 0.3, STIFFNESS, easedMult);

  // Sub-step physics for ultra-smooth motion
  const steps = 4;
  const dtStep = dt / steps;
  for (let i = 0; i < steps; i++) {
    const fx = (mouseX - posX) * easedStiffness;
    const fy = (mouseY - posY) * easedStiffness;
    velX = (velX + fx) * DAMPING;
    velY = (velY + fy) * DAMPING;
    posX += velX * dtStep;
    posY += velY * dtStep;
  }

  // Speed → stretch amount
  const speed = Math.sqrt(velX * velX + velY * velY);
  const targetStretch = clamp(1 + speed * 0.048, 1, STRETCH_MAX);

  if (speed > 0.3) {
    motionAngle = Math.atan2(velY, velX);
  }

  // Lerp stretch axes smoothly
  stretchX = lerp(stretchX, targetStretch, STRETCH_DECAY * dt * 2.5);
  stretchY = lerp(stretchY, 1 / Math.sqrt(stretchX), STRETCH_DECAY * dt * 2.5);

  // --- Draw ---
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(posX, posY);
  ctx.rotate(motionAngle);
  ctx.scale(stretchX, stretchY);

  // Outer ring
  ctx.beginPath();
  ctx.arc(0, 0, RADIUS, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
  ctx.lineWidth = 1.5 / Math.max(stretchX, stretchY);
  ctx.shadowColor = "rgba(255,255,255,0.25)";
  ctx.shadowBlur = 6;
  ctx.stroke();

  // Tiny center dot
  ctx.beginPath();
  ctx.arc(0, 0, 1.2, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.shadowBlur = 0;
  ctx.fill();

  ctx.restore();

  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
