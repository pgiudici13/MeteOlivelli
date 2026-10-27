export function BrandMark() {
  const theme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'

  return <span className="brand-symbol" aria-hidden="true">
    <img className="brand-mark" src={`/brand-mark-${theme}.png`} width={80} height={80} alt="" decoding="async" />
  </span>
}
