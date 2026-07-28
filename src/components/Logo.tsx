/**
 * E-Access logo, matching the brand asset:
 * navy (#1B1F4E) rounded-square tile, gold (#E2A600) circle ring,
 * gold "E" set in Asimovian.
 */
const NAVY = "#1B1F4E";
const GOLD = "#E2A600";

export function LogoMark({ size = 40, light = false, mono = false }: { size?: number; light?: boolean; mono?: boolean }) {
  void light;
  const accent = mono ? "#ffffff" : GOLD;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-label="E-Access">
      {/* circular tile, matching the ring */}
      <circle cx="24" cy="24" r="23" fill={NAVY} />
      {/* circle ring */}
      <circle cx="24" cy="24" r="16.5" fill="none" stroke={accent} strokeWidth="2.2" />
      {/* Asimovian E */}
      <text
        x="24"
        y="24.6"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Asimovian, 'Arial Black', sans-serif"
        fontWeight="400"
        fontSize="21"
        fill={accent}
      >
        E
      </text>
    </svg>
  );
}

/** Big hero lockup: navy rounded-square tile with white squared E + Asimovian wordmark. */
export function LogoHero({ size = 64 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-4">
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
        <rect x="1" y="1" width="46" height="46" rx="11" fill={NAVY} />
        <rect x="10" y="10" width="28" height="28" rx="7" fill="none" stroke="#ffffff" strokeWidth="2" />
        <text
          x="24" y="24.8" textAnchor="middle" dominantBaseline="central"
          fontFamily="Asimovian, 'Arial Black', sans-serif" fontSize="17" fill="#ffffff"
        >
          E
        </text>
      </svg>
      <span
        className="text-white"
        style={{ fontFamily: "Asimovian, 'Arial Black', sans-serif", fontSize: size * 0.52, letterSpacing: "0.06em" }}
      >
        E-ACCESS
      </span>
    </span>
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
