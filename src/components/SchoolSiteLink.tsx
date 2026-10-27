import type { ReactNode } from 'react'

export const SCHOOL_WEBSITE_URL = 'https://www.liceoolivelli.pv.it/'

export function SchoolSiteLink({ className, children, ariaLabel = 'Sito ufficiale del Liceo Teresio Olivelli, si apre in una nuova scheda' }: { className: string; children: ReactNode; ariaLabel?: string }) {
  return <a
    className={className}
    href={SCHOOL_WEBSITE_URL}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={ariaLabel}
  >{children}</a>
}
