# Sumair Innovations

A responsive seven-page website for Sumair Innovations, Kopargaon. The design uses forest green, lime, ivory, bundled typefaces, an illustrated globe and product previews.

## Pages

- `index.html` — services, products, about, process, FAQ and contact
- `services/tax-accounting.html`
- `services/web-app-development.html`
- `services/social-media-management.html`
- `services/digital-marketing.html`
- `products/maktab-manager.html`
- `products/tuition-manager.html`

## Run and edit

The generated website is plain HTML, CSS and JavaScript. No package installation, backend, API keys or build step is needed to serve it.

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

Run from the repository root. Edit shared content in `tools/content.py`, markup in `templates/` and `tools/build_site.py`, and styling/behaviour in `assets/styles.css` and `assets/script.js`. After editing templates or content, regenerate the committed HTML:

```sh
python3 tools/build_site.py
```

The contact form validates input and prepares an encoded WhatsApp message for **+91 70485 44134**. The visitor reviews and sends it in WhatsApp. This website does not store submissions or send email. Product screens contain labelled sample data; no app-store listing or real customer statistics are implied.

## Downloadable copy

`downloads/Sumair-Innovations.html` is a standalone copy containing all seven pages, fonts and graphics. Open it in a modern browser with JavaScript enabled. Its navigation uses an embedded frame and hash routes. The source website also has ordinary, directly addressable HTML pages.

Regenerate the standalone copy and source ZIP with:

```sh
python3 tools/export_website.py
```

The default output directory is `dist/`; pass another directory as the first argument if needed. After regeneration, copy the standalone HTML to `downloads/` to update the committed download. The ZIP excludes generated downloads, Git metadata and caches.

## Validation

The smoke test uses Node.js, Playwright and Chromium (test tooling only). In the prepared cloud environment:

```sh
node tools/smoke_test.cjs
```

Override `CHROMIUM_PATH` or `TEST_BASE_URL` if necessary. Tests cover all seven pages at 12 widths from 320 to 1920 pixels, same-page anchor targets, mobile navigation, keyboard-controlled product tabs, contact validation and WhatsApp message encoding. `window.open` is intercepted; tests never send a message. This is browser viewport testing, not certification on every physical device.

For another development machine, install Playwright in an external test workspace and make it available to Node, or install it locally without committing `node_modules`. Use an installed Chromium via `CHROMIUM_PATH`.

## Assets and publishing

Manrope and DM Sans variable Latin fonts are bundled from `@fontsource-variable/manrope@5.3.0` and `@fontsource-variable/dm-sans@5.3.0`; their SIL Open Font Licenses are in `assets/fonts/`. SVG artwork and interface previews are local, so rendering does not depend on external font/image services.

Serve the repository root on any static host. Keep the `assets/`, `services/` and `products/` directories beside `index.html`. A GitHub commit/push saves the source; it does not itself enable GitHub Pages or deploy a public site.
