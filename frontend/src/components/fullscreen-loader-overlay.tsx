"use client";

import { ActionLoader } from "@/components/action-loader";

type FullscreenLoaderOverlayProps = {
  visible: boolean;
  word: string | null;
};

export function FullscreenLoaderOverlay({
  visible,
  word,
}: FullscreenLoaderOverlayProps) {
  if (!visible || !word) {
    return null;
  }

  return (
    <div className="loader-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="loader-overlay__panel">
        <ActionLoader word={word} />
      </div>
    </div>
  );
}
