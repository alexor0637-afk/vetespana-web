// Tipos mínimos del módulo del runtime de Cloudflare para enviar emails desde el Worker
// (así no hace falta @cloudflare/workers-types).
declare module 'cloudflare:email' {
  export class EmailMessage {
    constructor(from: string, to: string, raw: string | ReadableStream)
  }
}
