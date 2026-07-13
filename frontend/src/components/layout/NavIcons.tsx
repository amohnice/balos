'use client';

import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function IconBase({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function DashboardIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 13h6V4H4z" />
      <path d="M14 20h6V4h-6z" />
      <path d="M4 20h6v-3H4z" />
    </IconBase>
  );
}

export function PackageIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3 4.5 7.25 12 11.5l7.5-4.25z" />
      <path d="M4.5 7.5v9L12 21l7.5-4.5v-9" />
      <path d="M12 11.5V21" />
    </IconBase>
  );
}

export function SuppliersIcon(props: IconProps) {
    return (
        <IconBase {...props}>
            <path d="M4 20V9l8-5 8 5v11" />
            <path d="M4 20h5" />
            <path d="M15 20h5" />
            <path d="M9 20v-6h6v6" />
        </IconBase>
    );
}

export function SaleIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 7h13l-1.5 8h-10z" />
      <path d="M6 7 5.4 4H3" />
      <path d="M9 20h.01" />
      <path d="M17 20h.01" />
      <path d="M10 11h5" />
    </IconBase>
  );
}

export function HistoryIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 12a8 8 0 1 0 2.34-5.66" />
      <path d="M4 5v5h5" />
      <path d="M12 8v5l3 2" />
    </IconBase>
  );
}

export function TeamIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M16 19c0-2.2-1.8-4-4-4s-4 1.8-4 4" />
      <path d="M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      <path d="M20 19c0-1.7-1.1-3.1-2.6-3.7" />
      <path d="M17 6.3a2.5 2.5 0 0 1 0 4.4" />
      <path d="M4 19c0-1.7 1.1-3.1 2.6-3.7" />
      <path d="M7 6.3a2.5 2.5 0 0 0 0 4.4" />
    </IconBase>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.04.04a2 2 0 0 1-2.83 2.83l-.04-.04a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V21a2 2 0 0 1-4 0v-.08A1.7 1.7 0 0 0 8.96 19.4a1.7 1.7 0 0 0-1.87.34l-.04.04a2 2 0 1 1-2.83-2.83l.04-.04A1.7 1.7 0 0 0 4.6 15 1.7 1.7 0 0 0 3.08 14H3a2 2 0 0 1 0-4h.08A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.04-.04a2 2 0 1 1 2.83-2.83l.04.04A1.7 1.7 0 0 0 8.96 4.6 1.7 1.7 0 0 0 10 3.08V3a2 2 0 1 1 4 0v.08a1.7 1.7 0 0 0 1.04 1.52 1.7 1.7 0 0 0 1.87-.34l.04-.04a2 2 0 1 1 2.83 2.83l-.04.04A1.7 1.7 0 0 0 19.4 9c.22.63.8 1 1.52 1H21a2 2 0 0 1 0 4h-.08A1.7 1.7 0 0 0 19.4 15z" />
    </IconBase>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
    </IconBase>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </IconBase>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </IconBase>
  );
}
