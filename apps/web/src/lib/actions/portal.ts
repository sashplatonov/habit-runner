import type { Action } from 'svelte/action';

function resolveTarget(target?: HTMLElement | string | null) {
  if (typeof document === 'undefined') {
    return null;
  }
  if (!target || target === 'body') {
    return document.body;
  }
  if (typeof target === 'string') {
    return document.querySelector<HTMLElement>(target);
  }
  return target;
}

export const portal: Action<HTMLElement, HTMLElement | string | null | undefined> = (node, target) => {
  let currentTarget = resolveTarget(target);
  currentTarget?.appendChild(node);

  return {
    update(nextTarget) {
      if (currentTarget?.contains(node)) {
        currentTarget.removeChild(node);
      }
      currentTarget = resolveTarget(nextTarget);
      currentTarget?.appendChild(node);
    },
    destroy() {
      if (currentTarget?.contains(node)) {
        currentTarget.removeChild(node);
      }
    }
  };
};