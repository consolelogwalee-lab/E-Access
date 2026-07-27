export function LogoMark({ size = 40, light = false }: { size?: number; light?: boolean }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-xl border"
      style={{
        width: size,
        height: size,
        background: light ? "#ffffff" : "#040315",
        borderColor: light ? "#e5e5e5" : "#C9A227",
      }}
    >
      <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 20 20" fill="none">
        <rect
          x="1.5"
          y="1.5"
          width="17"
          height="17"
          rx="4"
          stroke={light ? "#040315" : "#C9A227"}
          strokeWidth="1.6"
        />
        <path
          d="M6.5 6.2h7M6.5 10h5.5M6.5 13.8h7"
          stroke={light ? "#040315" : "#C9A227"}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path d="M6.5 6.2v7.6" stroke={light ? "#040315" : "#C9A227"} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
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
