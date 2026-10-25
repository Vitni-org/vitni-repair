"use client";

import { useEffect } from "react";

export function PwaRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
        console.warn("Vitni offline cache could not be enabled.", error);
      });
    }
  }, []);

  return null;
}
