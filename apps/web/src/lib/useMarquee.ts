"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

type MarqueeOptions = {
  /** Auto-scroll speed in pixels per second. */
  speed?: number;
  /** How long the row waits after the visitor touches it before it starts drifting again (ms). */
  resumeDelay?: number;
};

/**
 * Turns a horizontally scrollable row into an endless, self-moving carousel that the visitor can still scroll by hand.
 *
 * The row must contain three identical groups side by side. It starts on the middle group; drifting right (or the visitor
 * scrolling) past the third group, or left past the first, jumps back by exactly one group, so the loop has no seam.
 * It stops drifting while the pointer is over it, while a finger is down, while it has keyboard focus and while it is being
 * dragged, and carries on a moment after the visitor lets go. It only runs while on screen. With reduced motion it does
 * not move on its own (the page hides the repeated groups and the row is a plain scrollable list).
 */
export function useMarquee(ref: RefObject<HTMLElement | null>, { speed = 36, resumeDelay = 2200 }: MarqueeOptions = {}) {
  useEffect(() => {
    const row = ref.current;
    if (!row || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const group = () => row.scrollWidth / 3;
    let position = group();
    row.scrollLeft = position;

    let frame = 0;
    let last = 0;
    let visible = false;
    let hovering = false;
    let touching = false;
    let focused = false;
    let dragging = false;
    let resumeAt = 0;
    let lastSet = row.scrollLeft;
    const holdFor = (ms = resumeDelay) => { resumeAt = performance.now() + ms; };

    const wrap = () => {
      const width = group();
      if (!width) return;
      if (row.scrollLeft >= width * 2) row.scrollLeft -= width;
      else if (row.scrollLeft <= 0) row.scrollLeft += width;
    };

    const tick = (time: number) => {
      const dt = last ? Math.min(time - last, 64) : 0;
      last = time;
      if (!hovering && !touching && !focused && !dragging && time >= resumeAt && !document.hidden) {
        position += (speed * dt) / 1000;
        if (position >= group() * 2) position -= group();
        row.scrollLeft = position;
        lastSet = row.scrollLeft;
      } else {
        position = row.scrollLeft; // follow wherever the visitor has taken it
      }
      frame = requestAnimationFrame(tick);
    };

    const start = () => { if (!frame) { last = 0; frame = requestAnimationFrame(tick); } };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start(); else stop();
    });
    observer.observe(row);

    // anything that moved the row other than our own drift is the visitor: wrap the loop and wait before drifting on
    const onScroll = () => {
      if (Math.abs(row.scrollLeft - lastSet) > 1.5) holdFor();
      wrap();
      lastSet = row.scrollLeft;
    };

    let dragStartX = 0;
    let dragStartLeft = 0;
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      dragging = true;
      dragStartX = event.clientX;
      dragStartLeft = row.scrollLeft;
      row.setPointerCapture(event.pointerId);
      row.dataset.dragging = "true";
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      row.scrollLeft = dragStartLeft - (event.clientX - dragStartX);
    };
    const endDrag = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      delete row.dataset.dragging;
      holdFor();
      if (row.hasPointerCapture(event.pointerId)) row.releasePointerCapture(event.pointerId);
    };

    const onEnter = (event: PointerEvent) => { if (event.pointerType === "mouse") hovering = true; };
    const onLeave = (event: PointerEvent) => { if (event.pointerType === "mouse") { hovering = false; holdFor(600); } };
    const onTouchStart = () => { touching = true; };
    const onTouchEnd = () => { touching = false; holdFor(); };
    const onWheel = () => holdFor();
    const onFocusIn = () => { focused = true; };
    const onFocusOut = () => { focused = false; holdFor(); };

    row.addEventListener("scroll", onScroll, { passive: true });
    row.addEventListener("pointerdown", onPointerDown);
    row.addEventListener("pointermove", onPointerMove);
    row.addEventListener("pointerup", endDrag);
    row.addEventListener("pointercancel", endDrag);
    row.addEventListener("pointerenter", onEnter);
    row.addEventListener("pointerleave", onLeave);
    row.addEventListener("touchstart", onTouchStart, { passive: true });
    row.addEventListener("touchend", onTouchEnd, { passive: true });
    row.addEventListener("touchcancel", onTouchEnd, { passive: true });
    row.addEventListener("wheel", onWheel, { passive: true });
    row.addEventListener("focusin", onFocusIn);
    row.addEventListener("focusout", onFocusOut);

    // keep the loop centred if the layout changes width (rotation, resize)
    const resize = new ResizeObserver(() => { position = row.scrollLeft; wrap(); });
    resize.observe(row);

    return () => {
      stop();
      observer.disconnect();
      resize.disconnect();
      row.removeEventListener("scroll", onScroll);
      row.removeEventListener("pointerdown", onPointerDown);
      row.removeEventListener("pointermove", onPointerMove);
      row.removeEventListener("pointerup", endDrag);
      row.removeEventListener("pointercancel", endDrag);
      row.removeEventListener("pointerenter", onEnter);
      row.removeEventListener("pointerleave", onLeave);
      row.removeEventListener("touchstart", onTouchStart);
      row.removeEventListener("touchend", onTouchEnd);
      row.removeEventListener("touchcancel", onTouchEnd);
      row.removeEventListener("wheel", onWheel);
      row.removeEventListener("focusin", onFocusIn);
      row.removeEventListener("focusout", onFocusOut);
    };
  }, [ref, speed, resumeDelay]);
}
