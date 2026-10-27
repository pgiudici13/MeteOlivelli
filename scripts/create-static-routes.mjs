import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const outputDirectory = 'dist'
const template = await readFile(join(outputDirectory, 'index.html'), 'utf8')
const routes = [
  {
    path: 'home',
    title: 'MeteOlivelli | Meteo scolastico a Pavia',
    description: 'Consulta temperatura, umidità, pressione e storico della stazione meteorologica del Liceo Teresio Olivelli di Pavia, quando disponibili.',
  },
  {
    path: 'info',
    title: 'Informazioni su MeteOlivelli — progetto e stazione meteo',
    description: 'Scopri il progetto MeteOlivelli del Liceo Teresio Olivelli di Pavia, la stazione meteorologica scolastica, i dati e il team.',
  },
  {
    path: 'privacy',
    title: 'Privacy e dati — MeteOlivelli',
    description: 'Informativa privacy di MeteOlivelli: dati tecnici, preferenze, strumenti statistici e dati meteorologici pubblici.',
  },
  {
    path: 'gioca',
    title: 'Gioca con il meteo — MeteOlivelli',
    description: 'Dieci domande casuali sulle curiosità del meteo. Mettiti alla prova con MeteOlivelli.',
  },
]

for (const route of routes) {
  const directory = join(outputDirectory, route.path)
  await mkdir(directory, { recursive: true })
  const html = template
    .replace(/    <script type="application\/ld\+json">[\s\S]*?    <\/script>\n/, '')
    .replace(/<title>[^<]*<\/title>/, `<title>${route.title}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${route.description}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${route.title}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${route.description}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="https://meteolivelli.vercel.app/${route.path === 'home' ? '' : route.path}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="https://meteolivelli.vercel.app/${route.path === 'home' ? '' : route.path}" />`)
  await writeFile(join(directory, 'index.html'), html)
}

// 404.html: la piattaforma lo serve con status 404 per le route inesistenti;
// l'app client mostra poi la pagina "Pagina non trovata" brandizzata (SiteRoute).
const notFound = template
  .replace(/    <script type="application\/ld\+json">[\s\S]*?    <\/script>\n/, '')
  .replace(/<title>[^<]*<\/title>/, '<title>Pagina non trovata — MeteOlivelli</title>')
  .replace(/<meta name="description" content="[^"]*"\s*\/>/, '<meta name="description" content="La pagina richiesta non è disponibile. Torna alla home di MeteOlivelli per consultare le misure della stazione." />')
  .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, '<meta property="og:title" content="Pagina non trovata — MeteOlivelli" />')
  .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, '<meta property="og:description" content="La pagina richiesta non è disponibile." />')
  .replace(/\n\s*<meta property="og:url" content="[^"]*"\s*\/>/, '')
  .replace(/\n\s*<link rel="canonical" href="[^"]*"\s*\/>/, '')
  .replace('<meta name="theme-color"', '<meta name="robots" content="noindex" />\n    <meta name="theme-color"')
await writeFile(join(outputDirectory, '404.html'), notFound)
