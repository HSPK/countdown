import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>

const base: P = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export const IconPlus = (p: P) => <svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>
export const IconCheck = (p: P) => <svg {...base} {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
export const IconEdit = (p: P) => <svg {...base} {...p}><path d="M4 20h4l10.5-10.5a2.121 2.121 0 0 0-3-3L5 17v3z" /><path d="M13.5 6.5l3 3" /></svg>
export const IconTrash = (p: P) => <svg {...base} {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>
export const IconStar = (p: P) => <svg {...base} {...p}><path d="M12 3.5l2.7 5.6 6.2.9-4.5 4.3 1.1 6.1L12 17.6l-5.5 2.9 1-6.1L3 10.1l6.2-.9L12 3.5z" /></svg>
export const IconStarFill = (p: P) => <svg {...base} fill="currentColor" stroke="none" {...p}><path d="M12 3.5l2.7 5.6 6.2.9-4.5 4.3 1.1 6.1L12 17.6l-5.5 2.9 1-6.1L3 10.1l6.2-.9L12 3.5z" /></svg>
export const IconMaximize = (p: P) => <svg {...base} {...p}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
export const IconMinimize = (p: P) => <svg {...base} {...p}><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></svg>
export const IconX = (p: P) => <svg {...base} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>
export const IconChevronLeft = (p: P) => <svg {...base} {...p}><path d="M15 6l-6 6 6 6" /></svg>
export const IconChevronRight = (p: P) => <svg {...base} {...p}><path d="M9 6l6 6-6 6" /></svg>
export const IconChevronDown = (p: P) => <svg {...base} {...p}><path d="M6 9l6 6 6-6" /></svg>
export const IconArrowLeft = (p: P) => <svg {...base} {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
export const IconRepeat = (p: P) => (
  <svg {...base} {...p}>
    <path d="M17 1l4 4-4 4" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <path d="M7 23l-4-4 4-4" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
)
export const IconBell = (p: P) => (
  <svg {...base} {...p}>
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
)
export const IconDownload = (p: P) => (
  <svg {...base} {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M7 10l5 5 5-5" />
    <path d="M12 15V3" />
  </svg>
)
export const IconUpload = (p: P) => (
  <svg {...base} {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M17 8l-5-5-5 5" />
    <path d="M12 3v12" />
  </svg>
)
export const IconLink = (p: P) => (
  <svg {...base} {...p}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
)
export const IconTv = (p: P) => (
  <svg {...base} {...p}>
    <rect x="2" y="6" width="20" height="14" rx="2" />
    <path d="M7 2l5 4 5-4" />
  </svg>
)
export const IconHelp = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2.2-2.5 4" />
    <line x1="12" y1="17" x2="12" y2="17.5" />
  </svg>
)
export const IconExternal = (p: P) => (
  <svg {...base} {...p}>
    <path d="M14 4h6v6M10 14L20 4M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
  </svg>
)
export const IconArrowUp = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
)
export const IconBook = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z" />
    <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5H6.5A2.5 2.5 0 0 0 4 19.5z" />
  </svg>
)
export const IconCalendar = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <line x1="8" y1="3" x2="8" y2="7" />
    <line x1="16" y1="3" x2="16" y2="7" />
  </svg>
)
export const IconHome = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3.5 11.5L12 4.5l8.5 7" />
    <path d="M5.5 10v9.5h13V10" />
    <path d="M10 19.5v-5.5h4v5.5" />
  </svg>
)
export const IconList = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)
export const IconSettings = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)
export const IconMinus = (p: P) => <svg {...base} {...p}><path d="M5 12h14" /></svg>
export const IconAa = (p: P) => (
  <svg {...base} {...p}>
    <text x="4" y="16" fontSize="11" fontWeight="700" fontFamily="system-ui" fill="currentColor" stroke="none">A</text>
    <text x="12" y="16" fontSize="8" fontWeight="700" fontFamily="system-ui" fill="currentColor" stroke="none">a</text>
  </svg>
)
