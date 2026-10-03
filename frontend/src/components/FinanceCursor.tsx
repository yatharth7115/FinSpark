import { useEffect, useRef } from "react";

/** A small market-marker cursor. Touch, text entry and reduced motion use native cursors. */
export default function FinanceCursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (
      !matchMedia("(pointer:fine) and (prefers-reduced-motion:no-preference)")
        .matches
    )
      return;
    const move = (event: PointerEvent) => {
      const cursor = ref.current;
      if (!cursor) return;
      const target = event.target instanceof Element ? event.target : null;
      const interactive = target?.closest('button,a,[role="tab"]');
      const typing = target?.closest("input,select,textarea");
      cursor.style.setProperty("--cursor-x", `${event.clientX}px`);
      cursor.style.setProperty("--cursor-y", `${event.clientY}px`);
      cursor.classList.toggle("cursor-visible", !typing);
      cursor.classList.toggle("cursor-interactive", !!interactive);
      const workspace = target?.closest(".workbench") as HTMLElement | null;
      if (workspace) {
        const bounds = workspace.getBoundingClientRect();
        workspace.style.setProperty(
          "--pointer-x",
          `${event.clientX - bounds.left}px`,
        );
        workspace.style.setProperty(
          "--pointer-y",
          `${event.clientY - bounds.top}px`,
        );
      }
      const card = target?.closest(
        ".registry-card,.requirement-row,.source-section,.mapped-adapter",
      ) as HTMLElement | null;
      if (card) {
        const bounds = card.getBoundingClientRect();
        card.style.setProperty("--hover-x", `${event.clientX - bounds.left}px`);
        card.style.setProperty("--hover-y", `${event.clientY - bounds.top}px`);
      }
    };
    const hide = () => ref.current?.classList.remove("cursor-visible");
    const press = () => ref.current?.classList.add("cursor-pressed");
    const release = () => ref.current?.classList.remove("cursor-pressed");
    window.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", hide);
    window.addEventListener("blur", hide);
    window.addEventListener("pointerdown", press);
    window.addEventListener("pointerup", release);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", hide);
      window.removeEventListener("blur", hide);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
    };
  }, []);
  return (
    <div className="finance-cursor" ref={ref} aria-hidden="true">
      <div className="cursor-frame" />
      <div className="cursor-bars">
        <i />
        <i />
        <i />
      </div>
      <span className="cursor-label">EXPLORE</span>
    </div>
  );
}
