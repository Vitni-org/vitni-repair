"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { DotLottie as DotLottieInstance } from "@lottiefiles/dotlottie-web";

type VitniMascotProps = {
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

export function VitniMascot({ className, imageClassName, priority = false }: VitniMascotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animationReady, setAnimationReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let player: DotLottieInstance | undefined;
    let disposed = false;
    let loading = false;

    const startAnimation = async () => {
      if (disposed || reducedMotion.matches || player || loading) return;
      loading = true;
      try {
        const { DotLottie } = await import("@lottiefiles/dotlottie-web");
        if (disposed || reducedMotion.matches) return;
        DotLottie.setWasmUrl("/dotlottie-player.wasm");
        player = new DotLottie({
          canvas,
          src: "/animations/vitni-repair-v4.json",
          autoplay: true,
          loop: true,
          renderConfig: { autoResize: true, devicePixelRatio: 1.25 },
        });
        player.addEventListener("render", () => {
          if (!disposed) setAnimationReady(true);
        });
        player.addEventListener("loadError", () => {
          if (!disposed) setAnimationReady(false);
        });
      } catch {
        if (!disposed) setAnimationReady(false);
      } finally {
        loading = false;
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) player?.pause();
      else if (!reducedMotion.matches) player?.play();
    };
    const onMotionChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        player?.pause();
        setAnimationReady(false);
      } else {
        if (player) player.play();
        else void startAnimation();
      }
    };

    void startAnimation();
    document.addEventListener("visibilitychange", onVisibilityChange);
    reducedMotion.addEventListener("change", onMotionChange);

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reducedMotion.removeEventListener("change", onMotionChange);
      player?.destroy();
    };
  }, []);

  return (
    <div className={className}>
      <Image src="/images/vitni.svg" alt="" aria-hidden="true" className={imageClassName} width={320} height={360} priority={priority} />
      <canvas
        aria-hidden="true"
        className={animationReady ? "absolute inset-0 size-full" : "absolute inset-0 size-full opacity-0"}
        height={360}
        ref={canvasRef}
        width={320}
      />
    </div>
  );
}
