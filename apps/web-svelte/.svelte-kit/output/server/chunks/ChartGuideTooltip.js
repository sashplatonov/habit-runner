import { e as attr_style, d as stringify, f as escape_html, k as ensure_array_like } from "./root.js";
function formatHabitLabel(habit) {
  return habit.icon ? `${habit.icon} ${habit.name}` : habit.name;
}
function ChartGuideTooltip($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      title,
      subtitle,
      items = [],
      variant = "bars",
      open = false,
      position,
      onClose,
      children
    } = $$props;
    if (open && position) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="fixed inset-0 z-40"></div> <div class="fixed z-50 min-w-[160px] max-w-[280px] rounded-xl border border-border bg-bg-card px-4 py-3 shadow-2xl"${attr_style(`left: ${stringify(Math.min(position.x, window.innerWidth - 300))}px; top: ${stringify(Math.max(8, position.y - 20))}px;`)}>`);
      if (title) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<p class="text-xs font-semibold text-foreground mb-0.5">${escape_html(title)}</p>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (subtitle) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<p class="text-[10px] font-mono text-muted mb-2">${escape_html(subtitle)}</p>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (variant === "bars") {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="space-y-1.5"><!--[-->`);
        const each_array = ensure_array_like(items);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let item = each_array[$$index];
          $$renderer2.push(`<div class="flex items-center justify-between gap-2"><div class="flex items-center gap-1.5">`);
          if (item.color) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<span class="inline-block h-2 w-2 rounded-full"${attr_style(`background-color: ${stringify(item.color)}`)}></span>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--> <span class="text-[11px] text-foreground">${escape_html(item.label)}</span></div> <span class="text-[11px] font-mono text-muted">${escape_html(item.value)}</span></div>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      } else if (variant === "line") {
        $$renderer2.push("<!--[1-->");
        $$renderer2.push(`<div class="space-y-1"><!--[-->`);
        const each_array_1 = ensure_array_like(items);
        for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
          let item = each_array_1[$$index_1];
          $$renderer2.push(`<div class="flex items-center justify-between gap-3"><span class="text-[11px] text-foreground truncate">${escape_html(item.label)}</span> <span class="text-[11px] font-mono text-muted">${escape_html(item.value)}</span></div>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      } else if (variant === "grid") {
        $$renderer2.push("<!--[2-->");
        $$renderer2.push(`<div class="grid grid-cols-2 gap-x-3 gap-y-1"><!--[-->`);
        const each_array_2 = ensure_array_like(items);
        for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
          let item = each_array_2[$$index_2];
          $$renderer2.push(`<div class="text-[11px] text-muted">${escape_html(item.label)}</div> <div class="text-[11px] font-mono text-foreground text-right">${escape_html(item.value)}</div>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<div class="flex gap-3"><!--[-->`);
        const each_array_3 = ensure_array_like(items);
        for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
          let item = each_array_3[$$index_3];
          $$renderer2.push(`<div class="flex flex-col items-center gap-0.5">`);
          if (item.color) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<div class="h-6 w-3 rounded-sm"${attr_style(`background-color: ${stringify(item.color)}; opacity: 0.7`)}></div>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--> <span class="text-[10px] text-muted">${escape_html(item.label)}</span> <span class="text-[10px] font-mono text-foreground">${escape_html(item.value)}</span></div>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]--> `);
      if (children) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="mt-2 border-t border-border pt-2">`);
        children($$renderer2);
        $$renderer2.push(`<!----></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  ChartGuideTooltip as C,
  formatHabitLabel as f
};
