import type { ReactNode } from 'react'

export const SCHOOL_WEBSITE_URL = 'https://www.liceoolivelli.pv.it/'

export function SchoolSiteLink({ className, children }: { className: string; children: ReactNode }) {
  return <a
    className={className}
    href={SCHOOL_WEBSITE_URL}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Sito ufficiale del Liceo Teresio Olivelli, si apre in una nuova scheda"
  >{children}</a>
}
