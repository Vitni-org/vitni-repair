"use client";

import { Check, Download, LoaderCircle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

type OfflineReply = { ok: boolean; saved?: boolean; removed?: boolean; imagesSaved?: number; imagesFailed?: number; error?: string };

function sendWorkerMessage<T extends OfflineReply>(message: Record<string, unknown>): Promise<T> {
  if (!("serviceWorker" in navigator)) return Promise.reject(new Error("Offline guide saving is not supported in this browser."));
  return navigator.serviceWorker.ready.then(
    (registration) =>
      new Promise((resolve, reject) => {
        const worker = navigator.serviceWorker.controller || registration.active;
        if (!worker) {
          reject(new Error("Vitni’s offline storage is not ready yet. Refresh this page and try again."));
          return;
        }
        const channel = new MessageChannel();
        const timeout = window.setTimeout(() => {
          channel.port1.close();
          reject(new Error("Offline storage took too long. Please try again."));
        }, 20_000);
        channel.port1.onmessage = (event: MessageEvent<T>) => {
          window.clearTimeout(timeout);
          channel.port1.close();
          resolve(event.data);
        };
        worker.postMessage(message, [channel.port2]);
      }),
  );
}

export function SaveGuideOffline({ slug }: { slug: string }) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let cancelled = false;
    void navigator.serviceWorker.ready.then(async () => {
      try {
        const reply = await sendWorkerMessage<OfflineReply>({ type: "CHECK_GUIDE_OFFLINE", slug });
        if (!cancelled && reply.ok) setSaved(Boolean(reply.saved));
      } catch {
        // The button remains available; the user can retry when the worker is ready.
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const toggle = async () => {
    setBusy(true);
    setMessage("");
    try {
      if (saved) {
        const reply = await sendWorkerMessage<OfflineReply>({ type: "REMOVE_GUIDE_OFFLINE", slug });
        if (!reply.ok) throw new Error(reply.error || "This guide could not be removed from offline storage.");
        setSaved(false);
        setMessage("Removed from this device’s offline storage.");
      } else {
        const images = Array.from(document.querySelectorAll<HTMLImageElement>("[data-offline-guide-image]"))
          .map((image) => image.currentSrc || image.src)
          .filter(Boolean);
        const reply = await sendWorkerMessage<OfflineReply>({
          type: "SAVE_GUIDE_OFFLINE",
          slug,
          images,
        });
        if (!reply.ok) throw new Error(reply.error || "This guide could not be saved offline.");
        setSaved(true);
        setMessage(
          reply.imagesFailed
            ? `Guide saved. ${reply.imagesSaved || 0} illustration${reply.imagesSaved === 1 ? "" : "s"} saved; some were unavailable.`
            : "Guide and available illustrations saved on this device.",
        );
      }
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Offline storage is unavailable right now.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="offline-guide-action">
      <button
        aria-label={saved ? "Remove this guide from offline storage" : "Save this guide offline"}
        aria-pressed={saved}
        disabled={busy}
        onClick={toggle}
        type="button"
      >
        {busy ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : saved ? <Check aria-hidden="true" /> : <Download aria-hidden="true" />}
        {busy ? "Saving guide…" : saved ? "Saved offline" : "Save this guide offline"}
        {saved && !busy ? <Trash2 aria-hidden="true" className="offline-guide-action__remove" /> : null}
      </button>
      <span className="offline-guide-action__note">
        Text and available illustrations stay on this device. Photo analysis needs an internet connection.
      </span>
      <span aria-live="polite" className="offline-guide-action__status">
        {message}
      </span>
    </div>
  );
}
