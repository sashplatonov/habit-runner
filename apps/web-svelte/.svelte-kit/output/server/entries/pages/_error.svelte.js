import "clsx";
import "@sveltejs/kit/internal";
import "../../chunks/exports.js";
import "../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../chunks/root.js";
import "../../chunks/state.svelte.js";
function _error($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    $$renderer2.push(`<div class="min-h-screen bg-bg-primary flex items-center justify-center"><div class="text-sm text-muted">Page not found. Redirecting…</div></div>`);
  });
}
export {
  _error as default
};
