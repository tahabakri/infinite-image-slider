# Infinite Image Slider

An infinite, draggable image slider where frames grow as they flow across the screen — vanilla JS, no dependencies, no build step.

[![Infinite image slider — frames grow as they flow across the screen](preview.gif)](https://tahabakri.github.io/infinite-image-slider/)

**▶ [Live demo](https://tahabakri.github.io/infinite-image-slider/)** — drag it, scroll it, or just let it drift.

## How it works

Three ideas do all the work, and they all live in [`slider.js`](slider.js).

### 1. Geometric edge-tiling → frames grow with no gaps

Each slide owns a span `[v, v+1]` on an imaginary number line — the *stream*. A function `E(v)` maps a stream position to an x-coordinate on screen:

```
E(v) = minWidth × (rᵛ − 1) / (r − 1)        where  r = e^growth
```

A slide covering `[v, v+1]` therefore has width `E(v+1) − E(v) = minWidth × rᵛ`. Each slide is exactly `r` times wider than the one before it, so the row **grows** smoothly from left to right.

The key trick: one slide's right edge `E(v+1)` is *exactly* the next slide's left edge. The frames share edges, so the row **tiles with no gaps** — and because both neighbours derive that shared boundary from the same `E(v+1)`, the edges line up exactly even at sub-pixel precision (a 1px overlap, hidden under the slide stacked on top, mops up any hairline seam). Each slide's height comes straight from its width via `aspect`.

### 2. A seamless loop → slide count rounded to whole image-cycles

The script builds just enough slides to span the viewport plus a small `buffer`, then **rounds that count up to a whole number of image-cycles**:

```
count = ceil(need / imageCount) × imageCount
```

Every frame, each slide's position is wrapped with `(i + scroll) % count`. When a slide runs off one edge it recycles around to the other — a handful of elements behave like an endless stream. Because `count` is a whole multiple of `imageCount`, the repeating image sequence lines up perfectly across the wrap, so the loop is **seamless**: no jump, no visible reset.

### 3. Drag via pointer + wheel events

- **Wheel** — a non-passive `wheel` listener (so it can `preventDefault` the page scroll) sums vertical and horizontal delta, so a mouse wheel or a trackpad swipe in either direction moves the row.
- **Pointer** — `pointerdown` / `pointermove` / `pointerup` with `setPointerCapture` give click-and-drag on desktop and touch-drag on mobile from one code path. `touch-action: none` hands the gesture to the script instead of the browser, and capture keeps tracking even if the cursor drifts off the stage mid-drag.

All input nudges a `target` value; the render loop eases the real `scroll` toward it each frame (`scroll += (target − scroll) × ease`), which is what gives the motion its weighted, glide-to-a-stop feel. When you're not dragging, an optional idle drift (`autoSpeed`) keeps it moving — automatically switched off for visitors who prefer reduced motion.

Each slide is positioned *and* sized with **one GPU `transform`** — a `translate` to its left edge plus a `scale` of a single fixed-size element — never by changing `width`/`height`. That keeps every frame on the compositor with no layout work and no per-frame integer rounding, so the motion stays rock-steady with no shimmer.

## Project structure

Three flat files, no build:

```
index.html   — markup (the stage, overlay text, theme toggle)
styles.css   — all styling + the light/dark theme variables
slider.js    — config, geometry, input, the render loop, theme toggle
```

The only inline script is a tiny theme bootstrap in the `<head>` — it sets light/dark before first paint to avoid a flash, which an external file can't do in time.

## Run it locally

No build step, no server, no dependencies. Just open the file:

```bash
# macOS
open index.html
# Windows
start index.html
# Linux
xdg-open index.html
```

Or double-click `index.html` in your file browser. The images load from [Lorem Picsum](https://picsum.photos) over the network, so you'll need an internet connection.

## Deploy (GitHub Pages)

The repo is already a deployable site — the static files at the root are all GitHub Pages needs.

1. Push to GitHub on the `main` branch.
2. Open **Settings → Pages**.
3. Under **Source**, choose **Deploy from a branch**.
4. Set branch to **`main`** and folder to **`/ (root)`**, then **Save**.
5. Wait ~1 minute — your live URL appears at the top of the same page.

## Customise

Everything you'd normally want to tweak lives in the `config` object at the top of [`slider.js`](slider.js):

| Option | Default | What it does |
| --- | --- | --- |
| `imageCount` | `30` | Number of distinct images in the loop |
| `ease` | `0.075` | Motion smoothing — lower is a heavier, slower glide |
| `wheelSpeed` | `0.0015` | Scroll / trackpad sensitivity |
| `dragSpeed` | `0.0016` | Pointer-drag sensitivity |
| `autoSpeed` | `0.0018` | Idle drift per frame — set `0` to disable |
| `minWidth` | `92` | Width of the smallest slide, in px |
| `growth` | `0.17` | Each slide is `e^growth` × wider than the one before it |
| `aspect` | `0.72` | Slide width ÷ height (portrait frames) |
| `bottomOffset` | `0.05` | How far slides lift off the floor, as a fraction of height |
| `buffer` | `3` | Extra slides kept just off the right edge |

Raise `growth` for a more dramatic size ramp, lower `ease` for a heavier glide, or set `autoSpeed: 0` to stop the idle drift.

### Light / dark theme

The page ships with a light/dark toggle (top-right). The choice is saved to `localStorage` and otherwise follows the visitor's `prefers-color-scheme`. Theme colours are CSS variables — edit `:root` for dark and `:root[data-theme="light"]` for light.

### Swap the images

Replace the `images` array with your own URLs — any source works:

```js
const images = [
  "https://example.com/01.jpg",
  "https://example.com/02.jpg",
  // ...
];
```

By default it builds 30 seeded [Lorem Picsum](https://picsum.photos) URLs (`https://picsum.photos/seed/passing-0/900/1250`, …). Seeded URLs are stable — the same seed always returns the same image and never 404s. If you change how many images you supply, keep `config.imageCount` in sync with the array length.

## License

[MIT](LICENSE) © 2026 Taha Bakri
