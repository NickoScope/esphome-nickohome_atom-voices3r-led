// pwa.js — served by ESPHome web_server (js_include) at /0.js as <script type=module>.
// Runtime injection of iOS "Add to Home Screen" / PWA hints into <head>.
//
// WHY runtime (not static <head>): the ESPHome web_server frontend is a compiled Lit app;
// it does NOT support manifest.json / apple-touch-icon handlers, and arbitrary <head> tags
// can't be added via config. js_include runs in the page context on every load, so we inject
// the tags here. Whether iOS actually HONORS runtime-injected apple meta tags at
// "Add to Home Screen" time is the open experiment of issue #1 — verify on-device.
//
// Verified (ESPHome source, DeepWiki 2026-07-23): js_include -> /0.js, loaded as
// <script type=module>, executes in page context, can manipulate document.head.
// The icon below is a spec-conformant 180x180 PNG (self-verified at generation).

const meta = (name, content) => {
  if (document.querySelector(`meta[name="${name}"]`)) return;
  const m = document.createElement("meta");
  m.name = name;
  m.content = content;
  document.head.appendChild(m);
};

const link = (rel, href, attrs = {}) => {
  if (document.querySelector(`link[rel="${rel}"]`)) return;   // idempotent
  const l = document.createElement("link");
  l.rel = rel;
  l.href = href;
  for (const [k, v] of Object.entries(attrs)) l.setAttribute(k, v);
  document.head.appendChild(l);
};

// iOS standalone launch (no Safari chrome) + Android/standard equivalent.
meta("apple-mobile-web-app-capable", "yes");
meta("mobile-web-app-capable", "yes");
meta("apple-mobile-web-app-status-bar-style", "black-translucent");
meta("apple-mobile-web-app-title", "Atom Voice"); // home-screen label
meta("theme-color", "#0b0f14");

// apple-touch-icon as an inline data: URI (web_server can't serve a separate icon file).
// 180x180 PNG, "Spectrum bars" theme.
const ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALQAAAC0CAIAAACyr5FlAAACBUlEQVR42u3SsRGCUBREUXIDE2rYfuiHguiHgp6BqfMwUZF/Zm4Fu2e63WfpZZMJBIfgEByCQ3AIDsEhOASH4JDgEByCQ3AIDsEhOASH4BAcEhyCQ3AIDsEhOASHvlNl64MDjv/BUVv6nAoHHHDAAQcccMDxVlmrDw444IADDjjggAOO4XGk1j444IADDjjggAMOOOCAAw444IADDjjgOCGOpdIHBxxwwAEHHHDAAQcccMABBxxwwAHHJ3EsqT444IADDjjggAMOOOCAAw444IADDjjggAMOOOCA40o4KjkMDjjggAMOOOCAAw444IADDjjggAMOOOCAAw444IADDjjggAMOOOCAAw444IADDjjgeLan+uCAAw444IADDjjggAMOOOCAAw444IADDjjggAOOkXHslT444IADDjjggAMOOOCAAw444IADDjjggAMOOOCAAw444IADDjjggAMOOEbEkarD4IADDjjggAMOOOCAAw444IADDjjggAMOOOCAAw444IADDjjggAMOOOCAAw444IADDjjggAMOOOCAAw444IADDjjggAMOOOCAAw444IADDjjggAMOOOCAAw444IADDjjggAMOOOCAAw444IADDjjggAMOOOCAAw444IADDjjggAOOK+LQOMEhOASH4BAcgkNwCA7BITgEhwSH4BAcgkM/6QGGPnTMkZU2nAAAAABJRU5ErkJggg==";
link("apple-touch-icon", ICON, { sizes: "180x180" });
