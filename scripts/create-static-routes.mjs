import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const outputDirectory = 'dist'
const template = await readFile(join(outputDirectory, 'index.html'), 'utf8')
const routes = [
  {
    path: 'home',
    title: 'MeteOlivelli — Il meteo a scuola',
    description: 'MeteOlivelli, il meteo visto da scuola. Temperatura, umidità, pressione e storico della stazione del Liceo Teresio Olivelli di Pavia, quando disponibili.',
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
    .replace(/<title>[^<]*<\/title>/, `<title>${route.title}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${route.description}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="https://meteolivelli.vercel.app/${route.path}" />`)
  await writeFile(join(directory, 'index.html'), html)
}
