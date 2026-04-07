

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const universal = {
  "ssr": false,
  "prerender": false
};
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.B2jCxQZz.js","_app/immutable/chunks/BvLInyod.js","_app/immutable/chunks/DMNvjtLl.js","_app/immutable/chunks/C24m4LG9.js","_app/immutable/chunks/Cb6RedRa.js","_app/immutable/chunks/D6wcVHUl.js","_app/immutable/chunks/CrEgX6eK.js","_app/immutable/chunks/D0JXUz8K.js","_app/immutable/chunks/DxR09_y7.js","_app/immutable/chunks/Cq789qoI.js","_app/immutable/chunks/B5eBdpmw.js"];
export const stylesheets = ["_app/immutable/assets/0.DgsEa4FX.css"];
export const fonts = [];
