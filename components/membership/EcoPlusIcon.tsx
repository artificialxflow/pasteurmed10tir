/** آیکن اکوپلاس — صرفه اقتصادی (نه نماد اکوسیستم) */
export function EcoPlusIcon({
  className = "h-12 w-12",
}: {
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center justify-center ${className}`} aria-hidden>
      <svg
        viewBox="0 0 64 64"
        className="h-full w-full"
        role="img"
        aria-label="اکوپلاس"
      >
        <circle cx="32" cy="32" r="30" fill="#d1fae5" stroke="#059669" strokeWidth="2" />
        <circle cx="32" cy="34" r="14" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
        <text
          x="32"
          y="39"
          textAnchor="middle"
          fontSize="14"
          fontWeight="bold"
          fill="#92400e"
          fontFamily="Tahoma,sans-serif"
        >
          %
        </text>
        <path
          d="M18 22h8l-4 8h6"
          fill="none"
          stroke="#047857"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="44" cy="20" r="6" fill="#10b981" />
        <text x="44" y="23" textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">
          +
        </text>
      </svg>
    </span>
  );
}