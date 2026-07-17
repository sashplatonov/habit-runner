export type TooltipPlacement = 'above' | 'below';

type TooltipPositionInput = {
  viewportWidth: number;
  viewportHeight: number;
  triggerLeft: number;
  triggerRight: number;
  triggerTop: number;
  triggerBottom: number;
  contentHeight: number;
};

export type TooltipPosition = {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
  placement: TooltipPlacement;
};

const VIEWPORT_MARGIN = 12;
const TRIGGER_GAP = 10;
const MIN_WIDTH = 320;
const MAX_WIDTH = 480;

export function calculateTooltipPosition({
  viewportWidth,
  viewportHeight,
  triggerLeft,
  triggerRight,
  triggerTop,
  triggerBottom,
  contentHeight
}: TooltipPositionInput): TooltipPosition {
  const availableWidth = Math.max(0, viewportWidth - VIEWPORT_MARGIN * 2);
  const width = Math.min(Math.max(viewportWidth / 3, MIN_WIDTH), MAX_WIDTH, availableWidth);
  const triggerCenter = triggerLeft + (triggerRight - triggerLeft) / 2;
  const left = Math.min(
    Math.max(triggerCenter - width / 2, VIEWPORT_MARGIN),
    Math.max(VIEWPORT_MARGIN, viewportWidth - VIEWPORT_MARGIN - width)
  );

  const availableAbove = Math.max(0, triggerTop - TRIGGER_GAP - VIEWPORT_MARGIN);
  const availableBelow = Math.max(0, viewportHeight - triggerBottom - TRIGGER_GAP - VIEWPORT_MARGIN);
  const desiredHeight = Math.max(0, contentHeight);
  const placement: TooltipPlacement =
    availableAbove >= desiredHeight || availableAbove >= availableBelow ? 'above' : 'below';
  const maxHeight = placement === 'above' ? availableAbove : availableBelow;
  const height = Math.min(desiredHeight, maxHeight);
  const preferredTop = placement === 'above'
    ? triggerTop - TRIGGER_GAP - height
    : triggerBottom + TRIGGER_GAP;
  const top = Math.min(
    Math.max(preferredTop, VIEWPORT_MARGIN),
    Math.max(VIEWPORT_MARGIN, viewportHeight - VIEWPORT_MARGIN - height)
  );

  return { left, top, width, maxHeight, placement };
}
