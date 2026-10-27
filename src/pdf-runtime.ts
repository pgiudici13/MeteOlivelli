// pdfmake e i font (~1,8 MB) sono richiesti solo al primo export PDF, mai nel bundle
// iniziale: gli chunk grandi del build sono voluti e restano lazy. AUD-14: caricare
// prima o ridurre i font degraderebbe le funzionalità senza benefici per l’accesso.
export async function createPdfBlob(definition: unknown): Promise<Blob> {
  const [{ default: pdfMake }, { default: fonts }] = await Promise.all([
    import('pdfmake/build/pdfmake.js'),
    import('pdfmake/build/vfs_fonts.js'),
  ])
  pdfMake.addVirtualFileSystem(fonts)
  return pdfMake.createPdf(definition).getBlob()
}
