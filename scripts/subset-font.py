"""Genera la variante Inter latina e gli intervalli CSS dal font originale.

Strumento opzionale per rigenerare gli asset; richiede FontTools con supporto WOFF2,
senza dipendenze Python nel runtime o nell'installazione npm del sito.
"""
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont


def unicode_ranges(points):
    groups = []
    for point in sorted(points):
        if groups and point == groups[-1][1] + 1:
            groups[-1][1] = point
        else:
            groups.append([point, point])
    return ', '.join(f'U+{start:04X}' if start == end else f'U+{start:04X}-{end:04X}' for start, end in groups)


root = Path(__file__).resolve().parent.parent
font = TTFont(root / 'public/fonts/InterVariable.woff2')
original_points = set(font.getBestCmap())
# Italiano e latino di base, punteggiatura, euro e frecce usati nella UI.
latin = set(range(0x100)) | set(range(0x2000, 0x2070)) | set(range(0x2190, 0x219A))
latin |= {0x0131, 0x0152, 0x0153, 0x02BB, 0x02BC, 0x02C6, 0x02DA, 0x02DC,
          0x0304, 0x0308, 0x0329, 0x20AC, 0x2122, 0x2212, 0x2215, 0xFEFF, 0xFFFD}
# Includere anche i simboli effettivi (tema, quiz, ricarica) previene il download
# dell'originale per un solo carattere. Nuovi alfabeti restano nel fallback.
for source in (root / 'src').rglob('*'):
    if source.suffix in {'.ts', '.tsx'}:
        latin |= {ord(character) for character in source.read_text(encoding='utf-8')}
latin &= original_points
options = subset.Options()
options.name_IDs = ['*']
subsetter = subset.Subsetter(options=options)
subsetter.populate(unicodes=latin)
subsetter.subset(font)
font.flavor = 'woff2'
font.save(root / 'public/fonts/InterVariable-latin.woff2')


def face(filename, points):
    return f"""@font-face {{
  font-family: Inter;
  src: url('/fonts/{filename}') format('woff2');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
  unicode-range: {unicode_ranges(points)};
}}
"""


css = '/* Generato da scripts/subset-font.py; originale e variante sotto SIL OFL 1.1. */\n'
css += face('InterVariable.woff2', original_points - latin)
css += face('InterVariable-latin.woff2', latin)
(root / 'src/inter-font.css').write_text(css, encoding='utf-8')
