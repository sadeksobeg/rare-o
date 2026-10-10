/** RTL-safe horizontal scroll helpers */

export function getScrollStart(el: HTMLElement): number {
  const dir = getComputedStyle(el).direction;
  if (dir === "rtl") {
    // In RTL, scrollLeft behavior differs by engine; normalize to "distance from start"
    return Math.abs(el.scrollLeft);
  }
  return el.scrollLeft;
}

export function setScrollStart(el: HTMLElement, value: number) {
  const dir = getComputedStyle(el).direction;
  if (dir === "rtl") {
    el.scrollLeft = -value;
    if (el.scrollLeft === 0 && value !== 0) {
      // Chromium positive RTL scrollLeft
      el.scrollLeft = value;
    }
    return;
  }
  el.scrollLeft = value;
}
