import type { ProgramCategory } from "@prisma/client";
import { cn } from "@/lib/utils";
import {
  resolveCourseVisualTheme,
  type CourseVisualTheme,
} from "@/lib/programs/course-visual";

type CourseVisualIllustrationProps = {
  track?: CourseVisualTheme;
  title?: string;
  domainSlug?: string | null;
  tags?: string[];
  category?: ProgramCategory | null;
  variant?: "hero" | "card";
  className?: string;
};

function SceneBackdrop({ id }: { id: string }) {
  return (
    <>
      <defs>
        <radialGradient id={`${id}-glow-a`} cx="30%" cy="25%" r="55%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-glow-b`} cx="78%" cy="72%" r="45%">
          <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#93c5fd" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-line`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <rect width="360" height="280" fill={`url(#${id}-glow-a)`} />
      <rect width="360" height="280" fill={`url(#${id}-glow-b)`} />
      <g opacity="0.14" stroke="white" strokeWidth="0.6">
        {[40, 80, 120, 160, 200, 240, 280, 320].map((x) => (
          <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="280" />
        ))}
        {[35, 70, 105, 140, 175, 210, 245].map((y) => (
          <line key={`h-${y}`} x1="0" y1={y} x2="360" y2={y} />
        ))}
      </g>
    </>
  );
}

function EducatorsScene({ id }: { id: string }) {
  return (
    <>
      <SceneBackdrop id={id} />
      <g opacity="0.35" stroke={`url(#${id}-line)`} strokeWidth="1.1" fill="none">
        <path d="M92 196 C 92 132, 118 88, 168 74 C 214 62, 248 92, 248 138" />
        <path d="M118 168 C 140 150, 166 142, 196 146" />
        <path d="M132 118 L 156 104 L 176 118 L 156 132 Z" />
      </g>
      <path
        d="M96 198 C 96 126, 126 82, 176 68 C 226 54, 262 88, 262 142 C 262 176, 244 204, 214 218"
        fill="none"
        stroke="white"
        strokeWidth="2"
        opacity="0.42"
      />
      <g opacity="0.55" fill="white">
        <circle cx="148" cy="118" r="3.5" />
        <circle cx="176" cy="102" r="3" />
        <circle cx="204" cy="118" r="3.5" />
        <circle cx="188" cy="148" r="3" />
        <circle cx="156" cy="152" r="2.5" />
      </g>
      <g opacity="0.45" stroke="white" strokeWidth="1">
        <line x1="148" y1="118" x2="176" y2="102" />
        <line x1="176" y1="102" x2="204" y2="118" />
        <line x1="204" y1="118" x2="188" y2="148" />
        <line x1="188" y1="148" x2="156" y2="152" />
        <line x1="156" y1="152" x2="148" y2="118" />
      </g>
      <g transform="translate(228 58)">
        <rect
          x="0"
          y="0"
          width="58"
          height="42"
          rx="8"
          fill="rgba(255,255,255,0.16)"
          stroke="white"
          strokeWidth="1.2"
          opacity="0.95"
        />
        <text
          x="29"
          y="27"
          textAnchor="middle"
          fill="white"
          fontSize="15"
          fontWeight="700"
          fontFamily="var(--font-sans-body, system-ui)"
        >
          AI
        </text>
        <circle cx="8" cy="8" r="2.5" fill="#86efac" opacity="0.9" />
      </g>
      <g transform="translate(54 176)" opacity="0.88">
        <path
          d="M8 28 C 8 18, 16 10, 28 10 L 52 10 C 64 10, 72 18, 72 28 L 72 44 C 72 54, 64 62, 52 62 L 28 62 C 16 62, 8 54, 8 44 Z"
          fill="rgba(255,255,255,0.12)"
          stroke="white"
          strokeWidth="1.2"
        />
        <path d="M24 10 L 40 10 L 40 4 L 24 4 Z" fill="rgba(255,255,255,0.2)" />
        <path d="M18 24 L 62 24" stroke="white" strokeWidth="1" opacity="0.5" />
        <path d="M18 34 L 54 34" stroke="white" strokeWidth="1" opacity="0.35" />
        <path d="M18 44 L 46 44" stroke="white" strokeWidth="1" opacity="0.35" />
      </g>
      <g transform="translate(268 168)" opacity="0.75">
        <rect x="0" y="8" width="44" height="34" rx="4" fill="rgba(255,255,255,0.1)" stroke="white" strokeWidth="1" />
        <path d="M8 0 L 36 0 L 40 8 L 4 8 Z" fill="rgba(255,255,255,0.18)" />
        <path d="M10 20 L 34 20 M10 28 L 28 28" stroke="white" strokeWidth="1" opacity="0.45" />
      </g>
    </>
  );
}

function AiScene({ id }: { id: string }) {
  return (
    <>
      <SceneBackdrop id={id} />
      <circle cx="118" cy="92" r="46" fill="rgba(255,255,255,0.06)" stroke="white" strokeWidth="1.2" opacity="0.55" />
      <circle cx="118" cy="92" r="28" fill="none" stroke="white" strokeWidth="1" opacity="0.35" strokeDasharray="4 5" />
      <g transform="translate(88 62)" opacity="0.9">
        <rect x="0" y="0" width="60" height="60" rx="14" fill="rgba(255,255,255,0.12)" stroke="white" strokeWidth="1.2" />
        <circle cx="30" cy="24" r="10" fill="none" stroke="white" strokeWidth="1.2" />
        <path d="M14 46 C 18 36, 42 36, 46 46" fill="none" stroke="white" strokeWidth="1.2" />
      </g>
      <g transform="translate(210 48)" opacity="0.95">
        <rect x="0" y="0" width="72" height="52" rx="10" fill="rgba(255,255,255,0.14)" stroke="white" strokeWidth="1.2" />
        <text x="36" y="32" textAnchor="middle" fill="white" fontSize="16" fontWeight="700" fontFamily="var(--font-sans-body, system-ui)">
          ML
        </text>
      </g>
      <g opacity="0.5" stroke="white" strokeWidth="1">
        <path d="M148 92 C 170 92, 188 78, 210 74" fill="none" />
        <path d="M148 108 C 176 118, 198 132, 220 148" fill="none" />
        <circle cx="210" cy="74" r="3" fill="white" />
        <circle cx="220" cy="148" r="3" fill="white" />
      </g>
      <g transform="translate(228 156)" opacity="0.82">
        <rect x="0" y="0" width="88" height="56" rx="8" fill="rgba(255,255,255,0.1)" stroke="white" strokeWidth="1" />
        <polyline points="8,42 24,28 40,34 56,18 72,24 80,12" fill="none" stroke="white" strokeWidth="1.4" />
      </g>
    </>
  );
}

function CyberScene({ id }: { id: string }) {
  return (
    <>
      <SceneBackdrop id={id} />
      <path
        d="M180 56 L 228 56 L 244 78 L 244 118 L 228 140 L 180 140 L 164 118 L 164 78 Z"
        fill="rgba(255,255,255,0.1)"
        stroke="white"
        strokeWidth="1.6"
        opacity="0.9"
      />
      <rect x="188" y="88" width="36" height="28" rx="4" fill="none" stroke="white" strokeWidth="1.4" opacity="0.75" />
      <path d="M204 88 L 204 78 C 204 70, 212 64, 220 64 C 228 64, 236 70, 236 78 L 236 88" fill="none" stroke="white" strokeWidth="1.4" opacity="0.75" />
      <g opacity="0.45" stroke="white" strokeWidth="1">
        <circle cx="92" cy="88" r="18" fill="none" />
        <circle cx="92" cy="88" r="8" fill="rgba(255,255,255,0.15)" />
        <circle cx="288" cy="176" r="22" fill="none" />
        <circle cx="288" cy="176" r="10" fill="rgba(255,255,255,0.12)" />
        <line x1="110" y1="88" x2="164" y2="88" />
        <line x1="244" y1="118" x2="266" y2="176" />
      </g>
      <g transform="translate(56 148)" opacity="0.8">
        <rect x="0" y="0" width="92" height="56" rx="8" fill="rgba(255,255,255,0.08)" stroke="white" strokeWidth="1" />
        <path d="M12 40 L 28 24 L 44 32 L 60 18 L 76 28 L 84 16" fill="none" stroke="white" strokeWidth="1.3" />
      </g>
    </>
  );
}

function DataScene({ id }: { id: string }) {
  return (
    <>
      <SceneBackdrop id={id} />
      <g transform="translate(72 56)" opacity="0.88">
        <rect x="0" y="0" width="216" height="120" rx="12" fill="rgba(255,255,255,0.08)" stroke="white" strokeWidth="1.2" />
        <rect x="18" y="72" width="22" height="32" rx="3" fill="rgba(255,255,255,0.22)" />
        <rect x="52" y="52" width="22" height="52" rx="3" fill="rgba(255,255,255,0.32)" />
        <rect x="86" y="36" width="22" height="68" rx="3" fill="rgba(255,255,255,0.42)" />
        <rect x="120" y="48" width="22" height="56" rx="3" fill="rgba(255,255,255,0.28)" />
        <rect x="154" y="28" width="22" height="76" rx="3" fill="rgba(255,255,255,0.48)" />
        <path d="M18 34 L 52 42 L 86 24 L 120 38 L 154 18 L 176 30" fill="none" stroke="white" strokeWidth="1.4" />
      </g>
      <g opacity="0.5" fill="white">
        <circle cx="286" cy="78" r="4" />
        <circle cx="302" cy="98" r="3" />
        <circle cx="274" cy="108" r="3" />
      </g>
    </>
  );
}

function BlockchainScene({ id }: { id: string }) {
  return (
    <>
      <SceneBackdrop id={id} />
      <g transform="translate(68 92)" opacity="0.9">
        {[0, 68, 136, 204].map((x, index) => (
          <g key={x} transform={`translate(${x} 0)`}>
            <rect
              x="0"
              y="0"
              width="52"
              height="52"
              rx="10"
              fill="rgba(255,255,255,0.12)"
              stroke="white"
              strokeWidth="1.2"
            />
            <path
              d="M12 18 L 40 18 M12 26 L 34 26 M12 34 L 38 34"
              stroke="white"
              strokeWidth="1"
              opacity={0.35 + index * 0.08}
            />
            {index < 3 ? (
              <path d="M52 26 L 68 26" stroke="white" strokeWidth="1.2" opacity="0.55" />
            ) : null}
          </g>
        ))}
      </g>
      <circle cx="286" cy="72" r="24" fill="rgba(255,255,255,0.08)" stroke="white" strokeWidth="1.2" opacity="0.7" />
      <path d="M278 72 L 286 64 L 294 72 L 286 80 Z" fill="rgba(255,255,255,0.25)" />
    </>
  );
}

function QuantumScene({ id }: { id: string }) {
  return (
    <>
      <SceneBackdrop id={id} />
      <g transform="translate(180 140)" opacity="0.85">
        <ellipse cx="0" cy="0" rx="78" ry="28" fill="none" stroke="white" strokeWidth="1.2" transform="rotate(-18)" />
        <ellipse cx="0" cy="0" rx="78" ry="28" fill="none" stroke="white" strokeWidth="1.2" transform="rotate(24)" />
        <ellipse cx="0" cy="0" rx="78" ry="28" fill="none" stroke="white" strokeWidth="1.2" transform="rotate(72)" />
        <circle cx="0" cy="0" r="10" fill="rgba(255,255,255,0.28)" stroke="white" strokeWidth="1.2" />
      </g>
      <g opacity="0.55" fill="white">
        <circle cx="92" cy="84" r="3" />
        <circle cx="268" cy="188" r="3" />
        <circle cx="286" cy="62" r="2.5" />
      </g>
    </>
  );
}

function GeneralScene({ id }: { id: string }) {
  return (
    <>
      <SceneBackdrop id={id} />
      <g transform="translate(128 68)" opacity="0.9">
        <path
          d="M52 8 L 8 24 L 8 88 C 8 112, 28 128, 52 136 C 76 128, 96 112, 96 88 L 96 24 Z"
          fill="rgba(255,255,255,0.1)"
          stroke="white"
          strokeWidth="1.4"
        />
        <path d="M8 24 L 52 40 L 96 24" fill="none" stroke="white" strokeWidth="1.2" opacity="0.55" />
        <circle cx="52" cy="78" r="14" fill="none" stroke="white" strokeWidth="1.2" opacity="0.6" />
      </g>
      <g transform="translate(228 148)" opacity="0.75">
        <rect x="0" y="0" width="72" height="48" rx="8" fill="rgba(255,255,255,0.1)" stroke="white" strokeWidth="1" />
        <path d="M12 30 L 28 18 L 42 26 L 58 14" fill="none" stroke="white" strokeWidth="1.3" />
      </g>
    </>
  );
}

function SceneForTheme({ theme, id }: { theme: CourseVisualTheme; id: string }) {
  switch (theme) {
    case "educators":
      return <EducatorsScene id={id} />;
    case "ai":
      return <AiScene id={id} />;
    case "cyber":
      return <CyberScene id={id} />;
    case "data":
      return <DataScene id={id} />;
    case "blockchain":
      return <BlockchainScene id={id} />;
    case "quantum":
      return <QuantumScene id={id} />;
    default:
      return <GeneralScene id={id} />;
  }
}

export function CourseVisualIllustration({
  track,
  title,
  domainSlug,
  tags,
  category,
  variant = "hero",
  className,
}: CourseVisualIllustrationProps) {
  const theme = resolveCourseVisualTheme({
    track,
    title,
    domainSlug,
    tags,
    category,
  });
  const id = `course-visual-${theme}-${variant}`;

  return (
    <svg
      className={cn("course-visual-illustration", className)}
      viewBox="0 0 360 280"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <SceneForTheme theme={theme} id={id} />
    </svg>
  );
}

export type { CourseVisualTheme };
