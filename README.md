# Watermark Remover AI

A local-first tool to remove watermarks from photos, GIFs and videos, plus a
GIF → MP4 converter. Everything runs in the browser — no uploads, no backend.

## Project structure

```
index.html              Page markup
css/style.css            Design system + all styling (light/dark, tokens, components)
js/extras.js              Settings, mode switching, shortcuts, extra MP4 options
js/app.js                 App logic (UI, canvas drawing, GIF/video processing, MP4 export)
js/vendor/omggif.js       GIF decoder (exposes `OG`)
js/vendor/gifenc.js       GIF encoder (exposes `GE`)
js/vendor/mp4-muxer.js    MP4 container muxer (exposes `Mp4Muxer`)
```

Load order matters: the three `js/vendor/*.js` files must load **before**
`js/app.js`, since app.js calls `OG.*`, `GE.*` and `Mp4Muxer.*` as globals.
`index.html` already has them in the right order.

## Running it

Just open `index.html` in a modern browser (Chrome, Edge, or Safari 14.1+).
No build step, no install.

For the best experience (persistent caching of the optional ~200MB AI model,
and multi-threaded WASM), serve the folder instead of double-clicking the file:

```bash
# from the project folder
python3 -m http.server 8080
# then open http://localhost:8080
```

## Design system

Styling lives in `css/style.css` and is driven by CSS custom properties at the
top of the file (surfaces, ink, accent, radii, shadows). It follows the OS
light/dark appearance automatically and uses the native system font stack
(SF Pro on Apple devices). Bootstrap was removed: the new design system
replaces it and has no external CSS/JS dependencies.

The JS hooks into element IDs (`#go`, `#wrap`, `#drop`, `#ed`, …) and a few
classes (`.lbl`, `.pill`, `.box`, `.cmpon`, `.conv`, `body.editing`), so keep
those if you restructure the markup.

## Notes

- "AI erase" downloads a LaMa ONNX model (~200MB) from a CDN on first use.
  Everything else works fully offline once the page is loaded.
- All processing (canvas drawing, GIF encode/decode, MP4 muxing) happens
  client-side; no files ever leave the browser.

## v7 redesign

- Sidebar: GIF watermark remover, GIF to MP4, Settings.
- Right action bar: removal tools (or MP4 options) plus New File and one shared Download button.
- New: Settings, keyboard shortcuts, paste/drop anywhere, MP4 speed and background colour, optional auto-download.
- Credits: Rajesh, UI/UX Designer at Beleaf Technologies. For office use only.
