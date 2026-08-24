"use client";

import { toAbsolutePublicUrl } from "@/lib/content/qr-url";
import { cn } from "@/lib/utils";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

type QrCodePanelProps = {
  href: string;
  label?: string;
  fileName?: string;
  size?: number;
  className?: string;
  compact?: boolean;
};

function safeFileName(raw: string): string {
  return (
    String(raw || "qr")
      .replace(/[^\w\u0600-\u06FF-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "qr"
  );
}

export function QrCodePanel({
  href,
  label,
  fileName,
  size = 160,
  className,
  compact = false,
}: QrCodePanelProps) {
  const [dataUrl, setDataUrl] = useState("");
  const [error, setError] = useState("");
  const absoluteUrl = toAbsolutePublicUrl(href);

  useEffect(() => {
    let cancelled = false;
    setError("");
    void QRCode.toDataURL(absoluteUrl, {
      width: Math.max(size, 256),
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) {
          setDataUrl("");
          setError("ساخت QR ناموفق بود.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [absoluteUrl, size]);

  function downloadPng() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${safeFileName(fileName || label || href)}.png`;
    a.click();
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-3",
        compact ? "space-y-2" : "space-y-3",
        className,
      )}
    >
      {label ? (
        <p className={cn("font-bold text-slate-900", compact ? "text-xs" : "text-sm")}>{label}</p>
      ) : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={dataUrl}
          alt={label ? `QR ${label}` : "QR code"}
          width={size}
          height={size}
          className="mx-auto rounded-lg border border-slate-100 bg-white"
        />
      ) : !error ? (
        <p className="py-6 text-center text-xs text-slate-400">در حال ساخت QR…</p>
      ) : null}
      <p className="break-all text-left text-[0.65rem] text-slate-500" dir="ltr">
        {absoluteUrl}
      </p>
      <button
        type="button"
        onClick={downloadPng}
        disabled={!dataUrl}
        className={cn(
          "w-full rounded-lg border-2 border-teal-600 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        دانلود PNG
      </button>
    </div>
  );
}
