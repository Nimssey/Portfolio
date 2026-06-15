const year = document.querySelector("#year");
year.textContent = new Date().getFullYear();

function hideLoader() {
  document.body.classList.add("is-loaded");
}

window.addEventListener("load", () => {
  window.setTimeout(hideLoader, 450);
});

window.setTimeout(hideLoader, 1800);

const canvas = document.querySelector("#heroCanvas");
const context = canvas.getContext("2d");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let width = 0;
let height = 0;
let points = [];
let animationFrame = 0;

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);

  const count = Math.max(28, Math.floor((width * height) / 26000));
  points = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.28,
    vy: (Math.random() - 0.5) * 0.28
  }));
}

function drawNetwork() {
  context.clearRect(0, 0, width, height);

  for (const point of points) {
    point.x += point.vx;
    point.y += point.vy;

    if (point.x < 0 || point.x > width) {
      point.vx *= -1;
    }

    if (point.y < 0 || point.y > height) {
      point.vy *= -1;
    }
  }

  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const a = points[i];
      const b = points[j];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);

      if (distance < 145) {
        context.strokeStyle = `rgba(82, 185, 255, ${0.16 * (1 - distance / 145)})`;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.stroke();
      }
    }
  }

  for (const point of points) {
    context.fillStyle = "rgba(223, 243, 255, 0.65)";
    context.beginPath();
    context.arc(point.x, point.y, 1.4, 0, Math.PI * 2);
    context.fill();
  }

  animationFrame = requestAnimationFrame(drawNetwork);
}

resizeCanvas();

if (!prefersReducedMotion) {
  drawNetwork();
}

window.addEventListener("resize", () => {
  cancelAnimationFrame(animationFrame);
  resizeCanvas();

  if (!prefersReducedMotion) {
    drawNetwork();
  }
});
