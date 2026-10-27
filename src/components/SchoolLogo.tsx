type SchoolLogoProps = {
  footer?: boolean
}

export function SchoolLogo({ footer = false }: SchoolLogoProps) {
  return <img
    src="/logo-liceo-scientifico-stem-olivelli-pavia-220.png"
    srcSet="/logo-liceo-scientifico-stem-olivelli-pavia-220.png 220w, /logo-liceo-scientifico-stem-olivelli-pavia-420.png 420w, /logo-liceo-scientifico-stem-olivelli-pavia.png 1041w"
    sizes={footer ? '180px' : '(max-width: 344px) 58vw, 200px'}
    width={1041}
    height={359}
    alt="Liceo Olivelli — Scientifico + STEM"
    decoding="async"
    loading={footer ? 'lazy' : undefined}
  />
}
