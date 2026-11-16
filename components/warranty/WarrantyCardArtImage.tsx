import { WARRANTY_CARD_ART_DEFAULT } from "@/lib/warranty/art";
import { cn } from "@/lib/utils";

/** mock گارانتی عمودی — بدون برش، وسط‌چین */
export const WARRANTY_CARD_FRAME_CLASS =
  "mx-auto w-full max-w-[240px] aspect-[2/3] rounded-2xl border border-slate-200 bg-white object-contain shadow-md";

export const WARRANTY_CARD_FRAME_COMPACT_CLASS =
  "mx-auto w-full max-w-[200px] aspect-[2/3] rounded-xl border border-slate-200 bg-white object-contain shadow-sm";

export const WARRANTY_CARD_LIGHTBOX_CLASS =
  "mx-auto max-h-[min(80vh,640px)] w-auto max-w-full object-contain";

export function WarrantyCardArtImage({
  src,
  alt,
  className,
  compact,
  onError,
}: {
  src: string;
  alt: string;
  className?: string;
  compact?: boolean;
  onError?: () => void;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={cn(
        compact ? WARRANTY_CARD_FRAME_COMPACT_CLASS : WARRANTY_CARD_FRAME_CLASS,
        className,
      )}
      onError={onError}
    />
  );
}

export function warrantyCardImgFallback() {
  return WARRANTY_CARD_ART_DEFAULT;
}