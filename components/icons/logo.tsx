import clsx from "clsx";

/**
 * Celjoe wordmark — built from path geometry so it can be used
 * inside OG image generation (which forbids <text> nodes).
 */
export default function LogoIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Celjoe Store"
      viewBox="0 0 220 32"
      {...props}
      className={clsx("h-6 w-auto", props.className)}
    >
      {/* C */}
      <path
        d="M22 4 C10 4 4 12 4 16 C4 20 10 28 22 28 L22 24 C14 24 10 20 10 16 C10 12 14 8 22 8 Z"
        fill="currentColor"
      />
      {/* E */}
      <path
        d="M32 4 L32 28 L52 28 L52 24 L38 24 L38 18 L50 18 L50 14 L38 14 L38 8 L52 8 L52 4 Z"
        fill="currentColor"
      />
      {/* L */}
      <path
        d="M58 4 L58 28 L78 28 L78 24 L64 24 L64 4 Z"
        fill="currentColor"
      />
      {/* O */}
      <path
        d="M104 16 C104 8 98 4 92 4 C86 4 80 8 80 16 C80 24 86 28 92 28 C98 28 104 24 104 16 Z M86 16 C86 12 89 9 92 9 C95 9 98 12 98 16 C98 20 95 23 92 23 C89 23 86 20 86 16 Z"
        fill="currentColor"
      />
      {/* J */}
      <path
        d="M112 4 L112 22 C112 26 115 28 120 28 C125 28 128 26 128 22 L128 4 L122 4 L122 22 C122 23 121 24 120 24 C119 24 118 23 118 22 L118 4 Z"
        fill="currentColor"
      />
      {/* E */}
      <path
        d="M134 4 L134 28 L154 28 L154 24 L140 24 L140 18 L152 18 L152 14 L140 14 L140 8 L154 8 L154 4 Z"
        fill="currentColor"
      />
    </svg>
  );
}
