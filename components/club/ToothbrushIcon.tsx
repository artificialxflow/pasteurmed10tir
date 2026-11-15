export function ToothbrushIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      aria-hidden
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="6" y="4" width="8" height="18" rx="3" fill="currentColor" opacity="0.9" />
      <rect x="14" y="8" width="14" height="4" rx="1.5" fill="currentColor" />
      <rect x="14" y="13" width="14" height="3" rx="1" fill="currentColor" opacity="0.85" />
      <rect x="14" y="17" width="14" height="3" rx="1" fill="currentColor" opacity="0.7" />
      <rect x="14" y="21" width="10" height="3" rx="1" fill="currentColor" opacity="0.55" />
    </svg>
  );
}