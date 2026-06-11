/* Infinite, draggable image slider — slides grow as they flow across.
   Original implementation of the technique (no tutorial code reused). */

const config = {
  imageCount: 30,      // number of distinct images in the loop
  ease: 0.075,         // motion smoothing (lower = heavier glide)
  wheelSpeed: 0.0015,  // scroll/trackpad sensitivity
  dragSpeed: 0.0016,   // click/touch drag sensitivity
  autoSpeed: 0.0018,   // gentle idle drift per frame (set 0 to disable)
  minWidth: 92,        // width of the smallest slide, px
  growth: 0.17,        // each slide is e^growth times wider than the last
  aspect: 0.72,        // slide width / height (portrait frames)
  bottomOffset: 0.05,  // lift slides off the floor, as a fraction of height
  buffer: 3,           // extra slides kept just off the right edge
};

const stage = document.querySelector('.slider');
const r = Math.exp(config.growth);

// Slides are one fixed-size element scaled by a GPU transform — never resized via
// width/height — so the row grows and glides with no layout work and no jitter.
const baseW = 720;
const baseH = baseW / config.aspect;

// Stable, royalty-free images from Lorem Picsum. Seeded URLs never 404 and
// always return the same image — swap the seeds or the whole list freely.
const images = Array.from(
  { length: config.imageCount },
  (_, i) => `https://picsum.photos/seed/passing-${i}/900/1250`
);

// E(v) maps a position along the stream to an x-coordinate. A slide spanning
// stream positions [v, v+1] has width E(v+1) - E(v) = minWidth * r^v, so each
// slide is a constant ratio bigger than the one before it. Adjacent slides
// share an edge, so the row tiles with no gaps.
const E = (v) => (config.minWidth * (Math.pow(r, v) - 1)) / (r - 1);
const Einv = (x) =>
  Math.log(1 + (x * (r - 1)) / config.minWidth) / Math.log(r);

let slides = [];
let count = 0;

function build() {
  // Enough slides to span the screen plus a buffer, rounded UP to a whole
  // number of image-cycles so the looping image pattern is perfectly seamless.
  const need = Math.ceil(Einv(window.innerWidth)) + config.buffer;
  count = Math.ceil(need / config.imageCount) * config.imageCount;

  stage.querySelectorAll('.slide').forEach((el) => el.remove());
  slides = [];
  for (let i = 0; i < count; i++) {
    const slide = document.createElement('div');
    slide.className = 'slide';
    slide.style.width = baseW + 'px';
    slide.style.height = baseH + 'px';
    const img = document.createElement('img');
    img.src = images[i % config.imageCount];
    img.alt = '';
    slide.appendChild(img);
    stage.appendChild(slide);
    slides.push(slide);
  }
}

let target = 0; // where we want to be
let scroll = 0; // where we are (eased toward target)

// ---------- input ----------
let dragging = false;
let lastX = 0;

stage.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    target += (e.deltaY + e.deltaX) * config.wheelSpeed;
  },
  { passive: false }
);

stage.addEventListener('pointerdown', (e) => {
  dragging = true;
  lastX = e.clientX;
  stage.classList.add('is-grabbing');
  stage.setPointerCapture(e.pointerId);
});

stage.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  target += (e.clientX - lastX) * config.dragSpeed;
  lastX = e.clientX;
});

function endDrag() {
  dragging = false;
  stage.classList.remove('is-grabbing');
}
stage.addEventListener('pointerup', endDrag);
stage.addEventListener('pointercancel', endDrag);

// Respect users who prefer no motion: no idle drift for them.
let idle = config.autoSpeed;
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) idle = 0;

// ---------- render loop ----------
function render() {
  if (!dragging) target += idle;
  scroll += (target - scroll) * config.ease;

  // Keep the numbers bounded over long runs without disturbing the motion.
  if (scroll > count && target > count) {
    scroll -= count;
    target -= count;
  }

  const lift = stage.clientHeight * config.bottomOffset;

  for (let i = 0; i < count; i++) {
    let v = (i + scroll) % count;
    if (v < 0) v += count;

    // Position and size are one GPU transform: translate to the left edge, then
    // scale the fixed-size slide down to this slot's width. Sub-pixel and
    // composited, so the row glides with no shimmer and no layout work.
    const left = E(v);
    const w = E(v + 1) - left;
    const scale = (w + 1) / baseW; // +1px overlap, hidden by the slide on top, kills seams

    const s = slides[i].style;
    s.transform = `translate3d(${left}px, ${-lift}px, 0) scale(${scale})`;
    s.zIndex = v | 0; // bounded 0..count, so the row always sits under the overlay text
  }

  requestAnimationFrame(render);
}

// Rebuild on resize (debounced) so the slide count fits the new width.
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(build, 150);
});

build();
render();

// ---------- light / dark theme ----------
const themeToggle = document.querySelector('.theme-toggle');
function syncThemeLabel() {
  // The label shows the mode you'll switch to.
  const isDark = document.documentElement.dataset.theme !== 'light';
  themeToggle.textContent = isDark ? 'Light' : 'Dark';
}
themeToggle.addEventListener('pointerdown', (e) => e.stopPropagation());
themeToggle.addEventListener('click', () => {
  const next =
    document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem('theme', next);
  } catch (e) {}
  syncThemeLabel();
});
syncThemeLabel();
