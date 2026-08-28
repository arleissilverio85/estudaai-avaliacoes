import zlib from 'zlib'

/**
 * Remove caracteres de controle estranhos e normaliza quebras de linha preservando acentuação pt-BR
 */
export function cleanExtractedText(raw: string): string {
  if (!raw) return ''
  return raw
    // Remove caracteres de controle nulos e não-imprimíveis (exceto \n, \r, \t)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
    // Normaliza quebras de linha
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove espaços repetidos excessivos em linhas
    .replace(/[ \t]+/g, ' ')
    // Remove quebras de linha vazias consecutivas excessivas (> 3)
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Extração de texto de PDF de alta fidelidade usando Mozilla PDF.js Legacy (Node.js nativo)
 */
async function extractTextWithPdfJsLegacy(buffer: Buffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const uint8Array = new Uint8Array(buffer)

  const loadingTask = (pdfjs as any).getDocument({
    data: uint8Array,
    useSystemFonts: true,
    disableFontFace: true,
    verbosity: 0,
  })

  const pdfDoc = await loadingTask.promise
  const numPages = pdfDoc.numPages
  const slidePages: string[] = []

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    try {
      const page = await pdfDoc.getPage(pageNum)
      const textContent = await (page as any).getTextContent({
        includeMarkedContent: true,
      })

      const pageTokens = (textContent.items || [])
        .map((item: any) => {
          if (typeof item === 'object' && item !== null) {
            if ('str' in item && typeof item.str === 'string') return item.str
            if ('chars' in item && Array.isArray(item.chars)) {
              return item.chars.map((c: any) => c.c || '').join('')
            }
          }
          return ''
        })
        .filter((str: string) => str && str.trim().length > 0)

      if (pageTokens.length > 0) {
        const pageText = pageTokens.join(' ')
        slidePages.push(`[Slide / Página ${pageNum}]\n${pageText}`)
      }
    } catch (pageErr) {
      console.warn(`Aviso ao ler página ${pageNum} do PDF:`, pageErr)
    }
  }

  return slidePages.join('\n\n')
}

/**
 * Fallback de baixo nível: Descompacta streams FlateDecode do PDF e extrai texto de slides/vetores
 */
function extractTextFromRawPdfStreams(buffer: Buffer): string {
  try {
    const rawPdf = buffer.toString('binary')
    const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g
    const extractedBlocks: string[] = []
    let match: RegExpExecArray | null

    while ((match = streamRegex.exec(rawPdf)) !== null) {
      const streamContent = match[1]
      const streamBuffer = Buffer.from(streamContent, 'binary')

      let decompressed = ''
      try {
        const inflated = zlib.inflateSync(streamBuffer)
        decompressed = inflated.toString('utf-8')
      } catch {
        try {
          const rawInflated = zlib.inflateRawSync(streamBuffer)
          decompressed = rawInflated.toString('utf-8')
        } catch {
          decompressed = streamContent
        }
      }

      if (decompressed && (decompressed.includes('BT') || decompressed.includes('Tj') || decompressed.includes('TJ'))) {
        // Extrai strings entre parênteses: (Texto do slide)
        const textMatches = decompressed.match(/\(([^()]{2,})\)/g)
        if (textMatches) {
          const strings = textMatches
            .map((s) => s.slice(1, -1).replace(/\\([()\\])/g, '$1'))
            .filter((s) => s.trim().length > 1 && !/^[\x00-\x1F]+$/.test(s))

          if (strings.length > 0) {
            extractedBlocks.push(strings.join(' '))
          }
        }
      }
    }

    return extractedBlocks.join('\n')
  } catch (err) {
    console.warn('Fallback de streams brutos falhou:', err)
    return ''
  }
}

/**
 * Extração de texto universal multiformato (PDF, Word, PowerPoint, Excel, TXT)
 */
export async function extractTextFromFile(
  buffer: Buffer,
  fileName: string,
  mimeType?: string
): Promise<string> {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  const cleanName = fileName.replace(/_/g, ' ')

  try {
    // 1. Arquivos de Texto Puro / Markdown / JSON / CSV
    if (
      ext === 'txt' ||
      ext === 'md' ||
      ext === 'json' ||
      ext === 'csv' ||
      mimeType?.includes('text/plain') ||
      mimeType?.includes('text/markdown') ||
      mimeType?.includes('text/csv')
    ) {
      const text = buffer.toString('utf-8')
      const cleaned = cleanExtractedText(text)
      if (cleaned.length >= 10) {
        return cleaned
      }
    }

    // 2. Arquivos PDF (.pdf) - Pipeline Multi-Estágio Robusto
    if (ext === 'pdf' || mimeType?.includes('pdf')) {
      // 2.1 Estágio 1: Mozilla PDF.js Legacy (O mais preciso para slides, PDFs e apostilas)
      try {
        const pdfJsText = await extractTextWithPdfJsLegacy(buffer)
        const cleaned = cleanExtractedText(pdfJsText)
        if (cleaned.length >= 15) {
          return cleaned
        }
      } catch (pdfJsErr) {
        console.warn('PDF.js Legacy falhou, tentando próximo motor:', pdfJsErr)
      }

      // 2.2 Estágio 2: OfficeParser (para apresentações e PDFs do office)
      try {
        const { parseOffice } = await import('officeparser')
        const officeRes = await parseOffice(buffer)
        const officeText =
          typeof officeRes === 'string'
            ? officeRes
            : typeof officeRes?.toText === 'function'
            ? officeRes.toText()
            : ''
        const cleaned = cleanExtractedText(officeText)
        if (cleaned.length >= 15) {
          return cleaned
        }
      } catch (officeErr) {
        console.warn('OfficeParser fallback para PDF falhou:', officeErr)
      }

      // 2.3 Estágio 3: PDFParse v2
      try {
        const { PDFParse } = await import('pdf-parse')
        const parser = new PDFParse({ data: buffer })
        const data = await parser.getText()
        try {
          await parser.destroy()
        } catch {
          // Ignorar
        }
        if (data?.text) {
          const cleaned = cleanExtractedText(data.text)
          if (cleaned.length >= 15) {
            return cleaned
          }
        }
      } catch (pdfParseErr) {
        console.warn('PDFParse v2 falhou:', pdfParseErr)
      }

      // 2.4 Estágio 4: Decompressão de Streams de Slides / Vetores
      try {
        const streamText = extractTextFromRawPdfStreams(buffer)
        const cleaned = cleanExtractedText(streamText)
        if (cleaned.length >= 15) {
          return cleaned
        }
      } catch (streamErr) {
        console.warn('Stream extraction falhou:', streamErr)
      }
    }

    // 3. Apresentações de Slides (.pptx, .ppt, .odp)
    if (ext === 'pptx' || ext === 'ppt' || ext === 'odp' || mimeType?.includes('presentation') || mimeType?.includes('powerpoint')) {
      try {
        const { parseOffice } = await import('officeparser')
        const res = await parseOffice(buffer)
        const officeText =
          typeof res === 'string'
            ? res
            : typeof res?.toText === 'function'
            ? res.toText()
            : ''
        const cleaned = cleanExtractedText(officeText)
        if (cleaned.length >= 10) {
          return cleaned
        }
      } catch (err) {
        console.warn('OfficeParser PPTX warning:', err)
      }
    }

    // 4. Documentos Word (.docx, .doc, .odt)
    if (ext === 'docx' || ext === 'doc' || ext === 'odt' || mimeType?.includes('wordprocessingml.document') || mimeType?.includes('msword')) {
      try {
        const mammothModule = await import('mammoth')
        const mammoth = (mammothModule as any).default || mammothModule
        const result = await mammoth.extractRawText({ buffer })
        if (result?.value) {
          const cleaned = cleanExtractedText(result.value)
          if (cleaned.length >= 10) {
            return cleaned
          }
        }
      } catch (err) {
        console.warn('Mammoth docx parse warning, tentando OfficeParser:', err)
      }

      // Fallback para OfficeParser no Word
      try {
        const { parseOffice } = await import('officeparser')
        const res = await parseOffice(buffer)
        const officeText = typeof res === 'string' ? res : res?.toText?.() || ''
        const cleaned = cleanExtractedText(officeText)
        if (cleaned.length >= 10) {
          return cleaned
        }
      } catch (err) {
        console.warn('OfficeParser Word warning:', err)
      }
    }

    // 5. Planilhas Excel (.xlsx, .xls)
    if (ext === 'xlsx' || ext === 'xls' || mimeType?.includes('spreadsheet')) {
      try {
        const XLSX = await import('xlsx')
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        let fullText = ''
        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName]
          const csvText = XLSX.utils.sheet_to_csv(sheet)
          fullText += `--- Planilha: ${sheetName} ---\n${csvText}\n\n`
        })
        const cleaned = cleanExtractedText(fullText)
        if (cleaned.length >= 10) {
          return cleaned
        }
      } catch (err) {
        console.warn('XLSX parse warning:', err)
      }
    }

    // 6. Fallback final: decodificação limpa UTF-8 / Latin1 para qualquer arquivo
    const rawUtf8 = buffer.toString('utf-8')
    const cleanedUtf8 = cleanExtractedText(rawUtf8)
    const printableRatio = (cleanedUtf8.match(/[a-zA-Z0-9áéíóúãõâêîôûàçÁÉÍÓÚÃÕÂÊÎÔÛÀÇ\s]/g) || []).length / (cleanedUtf8.length || 1)
    if (cleanedUtf8.length >= 20 && printableRatio > 0.65) {
      return cleanedUtf8
    }

    throw new Error(
      `Não foi possível extrair texto legível do arquivo "${cleanName}". O arquivo pode conter apenas imagens escaneadas sem camada de texto OCR ou estar corrompido.`
    )
  } catch (globalError: any) {
    console.error(`Erro ao processar arquivo ${fileName}:`, globalError)
    throw new Error(
      globalError.message ||
        `Falha ao extrair texto do arquivo "${cleanName}". Você também pode copiar e colar o texto ou resumo dos slides diretamente no formulário.`
    )
  }
}


