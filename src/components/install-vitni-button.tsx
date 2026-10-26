"use client";

import { Download, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function subscribeInstalled(onChange: () => void) {
  const media = window.matchMedia("(display-mode: standalone)");
  window.addEventListener("appinstalled", onChange);
  media.addEventListener("change", onChange);
  return () => {
    window.removeEventListener("appinstalled", onChange);
    media.removeEventListener("change", onChange);
  };
}

function getInstalledSnapshot() {
  return window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

export function InstallVitniButton() {
  const t = useTranslations("install");
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const installed = useSyncExternalStore(subscribeInstalled, getInstalledSnapshot, () => false);
  const [isIOS, setIsIOS] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    };
  }, []);

  if (installed) return null;

  const install = async () => {
    if (promptEvent) {
      await promptEvent.prompt();
      await promptEvent.userChoice;
      setPromptEvent(null);
      return;
    }
    setIsIOS(/iPhone|iPad|iPod/i.test(navigator.userAgent));
    dialogRef.current?.showModal();
  };

  return (
    <>
      <button className="install-vitni-button" onClick={() => void install()} type="button">
        {promptEvent ? <Download aria-hidden="true" /> : <Smartphone aria-hidden="true" />}
        {t("button")}
      </button>
      <dialog className="install-vitni-dialog" ref={dialogRef}>
        <form method="dialog">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2>{t("title")}</h2>
          <p>{isIOS ? t("ios") : t("other")}</p>
          <button type="submit">{t("done")}</button>
        </form>
      </dialog>
    </>
  );
}
