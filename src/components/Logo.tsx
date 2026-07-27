/**
 * E-Access logo — circular badge: dark navy disc, gold ring, gold serif "E" (Fraunces).
 */
export function LogoMark({ size = 40, light = false }: { size?: number; light?: boolean }) {
  const id = `lg${size}${light ? "l" : "d"}`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-label="E-Access">
      <defs>
        <radialGradient id={`${id}bg`} cx="0.5" cy="0.4" r="0.75">
          <stop offset="0" stopColor="#1a1440" />
          <stop offset="0.65" stopColor="#0e0a24" />
          <stop offset="1" stopColor="#080614" />
        </radialGradient>
        <linearGradient id={`${id}gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f0d488" />
          <stop offset="0.5" stopColor="#d9ad45" />
          <stop offset="1" stopColor="#b8860b" />
        </linearGradient>
      </defs>
      {/* soft blue aura */}
      <circle cx="24" cy="24" r="23.5" fill="#2b3cbf" opacity={light ? "0" : "0.25"} />
      {/* disc */}
      <circle cx="24" cy="24" r="21" fill={`url(#${id}bg)`} />
      {/* gold ring */}
      <circle cx="24" cy="24" r="17.5" fill="none" stroke={`url(#${id}gold)`} strokeWidth="1.6" />
      {/* serif E */}
      <text
        x="24"
        y="24"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Fraunces, Georgia, serif"
        fontWeight="600"
        fontSize="21"
        fill={`url(#${id}gold)`}
      >
        E
      </text>
    </svg>
  );
}

export function LogoFull({ light = false, size = 32 }: { light?: boolean; size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} light={light} />
      <span
        className="font-extrabold tracking-[0.18em]"
        style={{ color: light ? "#171717" : "#ffffff", fontSize: size * 0.5 }}
      >
        E-ACCESS
      </span>
    </span>
  );
}
