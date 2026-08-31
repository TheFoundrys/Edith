import { cn } from "@/lib/utils";

/** Edith shield watermark for course / continue banners — brand ink, not empty gradient. */
export function CourseBannerArt({ className }: { className?: string }) {
  return (
    <svg
      className={cn("lms-banner-art", className)}
      viewBox="0 0 200 208"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M 9 23 L 100 8 L 191 23 C 191 100 171 160 100 200 C 29 160 9 100 9 23 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        opacity="0.35"
      />
      <path
        d="M 17 29 L 100 16 L 183 29 C 183 101 164 156 100 191 C 36 156 17 101 17 29 Z"
        fill="currentColor"
        opacity="0.06"
      />
      <ellipse
        cx="132"
        cy="118"
        rx="14"
        ry="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.22"
      />
      <path
        d="M 118 118 C 118 108 124 102 132 102 C 140 102 146 108 146 118 C 146 128 140 134 132 134 C 124 134 118 128 118 118"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.6"
        opacity="0.18"
      />
      <path
        d="M 64 78 L 72 62 M 76 78 L 84 62 M 88 78 L 96 62"
        stroke="currentColor"
        strokeWidth="0.6"
        strokeLinecap="round"
        opacity="0.2"
      />
      <rect
        x="58"
        y="132"
        width="28"
        height="20"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.65"
        opacity="0.18"
      />
    </svg>
  );
}
