interface WordmarkProps {
  size?: "sm" | "md" | "lg" | "xl";
  dot?: boolean;
  className?: string;
  forColor?: string;
  mateColor?: string;
}

const SIZE_CLASS: Record<NonNullable<WordmarkProps["size"]>, string> = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-3xl",
};

const DOT_SIZE: Record<NonNullable<WordmarkProps["size"]>, string> = {
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3 h-3",
  xl: "w-3.5 h-3.5",
};

export function Wordmark({
  size = "md",
  dot = true,
  className = "",
  forColor,
  mateColor,
}: WordmarkProps) {
  return (
    <span className={`inline-flex items-center gap-2 font-black tracking-tight ${SIZE_CLASS[size]} ${className}`}>
      {dot && <span className={`${DOT_SIZE[size]} rounded-full bg-primary`} />}
      <span>
        <span style={forColor ? { color: forColor } : undefined} className={forColor ? "" : "text-current"}>FOR</span>
        <span style={mateColor ? { color: mateColor } : undefined} className={mateColor ? "" : "text-primary"}>MATE</span>
      </span>
    </span>
  );
}
