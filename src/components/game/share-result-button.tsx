"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { trackShare } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export function ShareResultButton({
  text,
  title,
  challengeId,
  className,
}: {
  text: string;
  title: string;
  challengeId?: number;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyToClipboard() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    if (challengeId != null) {
      trackShare({ method: "clipboard", challengeId });
    }
    setTimeout(() => setCopied(false), 1600);
  }

  async function onShare() {
    const canNativeShare =
      typeof navigator !== "undefined" && typeof navigator.share === "function";
    const isMobile =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 639px)").matches;

    if (canNativeShare && (isMobile || !navigator.clipboard)) {
      try {
        await navigator.share({ title, text });
        if (challengeId != null) {
          trackShare({ method: "native", challengeId });
        }
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Fall through to clipboard
      }
    }

    try {
      await copyToClipboard();
    } catch {
      // Last resort: native share even on desktop if clipboard fails
      if (canNativeShare) {
        try {
          await navigator.share({ title, text });
          if (challengeId != null) {
            trackShare({ method: "native", challengeId });
          }
        } catch {
          // ignore
        }
      }
    }
  }

  return (
    <Button
      type="button"
      size="lg"
      className={cn("h-12 w-full sm:h-10", className)}
      onClick={() => void onShare()}
    >
      {copied ? (
        <Check className="size-4" />
      ) : (
        <>
          <Share2 className="size-4 sm:hidden" />
          <Copy className="hidden size-4 sm:block" />
        </>
      )}
      {copied ? (
        <span>Copied</span>
      ) : (
        <>
          <span className="sm:hidden">Share</span>
          <span className="hidden sm:inline">Share result</span>
        </>
      )}
    </Button>
  );
}
