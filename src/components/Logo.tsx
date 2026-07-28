/**
 * E-Access logo, matching the brand asset:
 * navy (#1B1F4E) rounded-square tile, gold (#E2A600) circle ring,
 * gold "E" set in Asimovian.
 */
const NAVY = "#1B1F4E";
const GOLD = "#E2A600";

export function LogoMark({ size = 40, light = false }: { size?: number; light?: boolean }) {
  void light;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-label="E-Access">
      {/* circular tile, matching the gold ring */}
      <circle cx="24" cy="24" r="23" fill={NAVY} />
      {/* gold circle ring */}
      <circle cx="24" cy="24" r="16.5" fill="none" stroke={GOLD} strokeWidth="2.2" />
      {/* Asimovian E */}
      <text
        x="24"
        y="24.6"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Asimovian, 'Arial Black', sans-serif"
        fontWeight="400"
        fontSize="21"
        fill={GOLD}
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
