import type { ReactNode } from 'react'

/* Section heading + content used by HomeTab and AllTab. The header
   sits above the children rows (which carry the actual hairline
   styling). HIG-aligned: uppercase cap title + tabular-nums count
   right slot. Optional trailing slot for buttons (e.g. "Clear"). */
export function ListSection({
  title, count, subtitle, right, children,
}: {
  title: ReactNode
  count?: number
  subtitle?: ReactNode
  right?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="list__section">
      <header className="list__head">
        <h2 className="list__head-title">
          {title}
          {subtitle && <span className="list__head-range">{subtitle}</span>}
        </h2>
        {count !== undefined && <span className="list__head-count">{count}</span>}
        {right && <>
          <span className="list__spacer" />
          {right}
        </>}
      </header>
      {children}
    </section>
  )
}
