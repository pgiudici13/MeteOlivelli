declare module 'pdfmake/build/pdfmake.js' {
  interface PdfMake {
    addVirtualFileSystem(fonts: Record<string, string>): void
    createPdf(definition: unknown): {
      getBlob(): Promise<Blob>
      download(filename: string): void
    }
  }
  const pdfMake: PdfMake
  export default pdfMake
}

declare module 'pdfmake/build/vfs_fonts.js' {
  const fonts: Record<string, string>
  export default fonts
}
