export default function StackmarksLogo(props: { width?: number; height?: number }) {
  const w = props.width ?? 120;
  const h = props.height ?? 32;
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 120 32"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="120" height="32" rx="4" fill="#2dcf89" />
      <text
        x="60"
        y="21"
        textAnchor="middle"
        fill="#000"
        fontSize="12"
        fontFamily="system-ui, sans-serif"
        fontWeight="600"
      >
        Plutus
      </text>
    </svg>
  );
}
