interface IconProps {
  className?: string;
}

const baseProps = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconGrid({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className} aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </svg>
  );
}

export function IconMapFold({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className} aria-hidden="true">
      <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z" />
      <path d="M9 4v14" />
      <path d="M15 6v14" />
    </svg>
  );
}

export function IconSwap({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className} aria-hidden="true">
      <path d="M3 7h14" />
      <path d="M13 3l4 4-4 4" />
      <path d="M21 17H7" />
      <path d="M11 13l-4 4 4 4" />
    </svg>
  );
}

export function IconGate({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className} aria-hidden="true">
      <path d="M3 12h10" />
      <path d="M9 8l4 4-4 4" />
      <path d="M13 5h5a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-5" />
    </svg>
  );
}

export function IconClipboard({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className} aria-hidden="true">
      <rect x="5" y="4" width="14" height="18" rx="2" />
      <path d="M9 4h6v3H9z" />
      <path d="M9 13l2 2 4-4" />
    </svg>
  );
}

export function IconChart({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className} aria-hidden="true">
      <path d="M4 20V9" />
      <path d="M10 20V5" />
      <path d="M16 20v-7" />
      <path d="M22 20v-11" />
    </svg>
  );
}

export function IconUsers({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className} aria-hidden="true">
      <path d="M16 11a3 3 0 1 0-6 0" />
      <path d="M5 21a7 7 0 0 1 14 0" />
      <path d="M7 10a3 3 0 1 0-6 0" />
      <path d="M1 21a5 5 0 0 1 8-4" />
    </svg>
  );
}

export function IconSettings({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V21a2 2 0 0 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H3a2 2 0 0 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V3a2 2 0 0 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H21a2 2 0 0 1 0 4h-.2a1 1 0 0 0-.9.6z" />
    </svg>
  );
}
