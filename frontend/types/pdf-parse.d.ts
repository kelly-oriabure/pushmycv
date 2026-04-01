declare module 'pdf-parse/lib/pdf-parse.js' {
  type PDFParse = (dataBuffer: Buffer | Uint8Array) => Promise<{
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: unknown;
    text: string;
    version: string;
  }>;
  const pdfParse: PDFParse;
  export default pdfParse;
}
