"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const RepairRequest = dynamic(() => import("@/components/repair-request").then((module) => module.RepairRequest), {
  loading: () => (
    <p className="repair-request-loading" role="status">
      Vitni is getting the repair form ready…
    </p>
  ),
});

export function DeferredRepairRequest() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const Observer = Reflect.get(window, "IntersectionObserver") as typeof IntersectionObserver | undefined;
    if (!Observer) {
      const fallback = window.setTimeout(() => setShouldLoad(true), 0);
      return () => window.clearTimeout(fallback);
    }

    const observer = new Observer(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setShouldLoad(true);
        observer.disconnect();
      },
      { rootMargin: "700px 0px" },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sectionRef}>
      {shouldLoad ? (
        <RepairRequest />
      ) : (
        <p className="repair-request-loading" role="status">
          The repair form will be ready as you reach it.
        </p>
      )}
    </div>
  );
}
