/**
 * Remove caracteres de controle estranhos e normaliza quebras de linha
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

export async function extractTextFromFile(
  buffer: Buffer,
  fileName: string,
  mimeType?: string
): Promise<string> {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''

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
      if (cleaned.length >= 20) {
        return cleaned
      }
    }

    // 2. Arquivos PDF (.pdf)
    if (ext === 'pdf' || mimeType?.includes('pdf')) {
      // 2.1 Tentativa primária com PDFParse v2 (Dynamic Import)
      try {
        const { PDFParse } = await import('pdf-parse')
        const parser = new PDFParse({ data: buffer })
        const data = await parser.getText()
        try {
          await parser.destroy()
        } catch {
          // Ignore destroy errors
        }

        if (data?.text) {
          const cleaned = cleanExtractedText(data.text)
          if (cleaned.length >= 20) {
            return cleaned
          }
        }
      } catch (pdfErr) {
        console.warn('PDFParse falhou, tentando fallback com OfficeParser:', pdfErr)
      }

      // 2.2 Fallback de PDF via OfficeParser (Dynamic Import)
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
        if (cleaned.length >= 20) {
          return cleaned
        }
      } catch (officeErr) {
        console.warn('OfficeParser fallback para PDF falhou:', officeErr)
      }
    }

    // 3. Documentos Word (.docx)
    if (ext === 'docx' || mimeType?.includes('wordprocessingml.document')) {
      try {
        const mammothModule = await import('mammoth')
        const mammoth = (mammothModule as any).default || mammothModule
        const result = await mammoth.extractRawText({ buffer })
        if (result?.value) {
          const cleaned = cleanExtractedText(result.value)
          if (cleaned.length >= 20) {
            return cleaned
          }
        }
      } catch (err) {
        console.warn('Mammoth docx parse warning, tentando OfficeParser:', err)
      }
    }

    // 4. Planilhas Excel (.xlsx, .xls)
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
        if (cleaned.length >= 20) {
          return cleaned
        }
      } catch (err) {
        console.warn('XLSX parse warning:', err)
      }
    }

    // 5. Apresentações de Slides (.pptx, .ppt) e outros formatos Office (.doc, .odt, .odp)
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
      if (cleaned.length >= 20) {
        return cleaned
      }
    } catch (err) {
      console.warn('OfficeParser generic parse warning:', err)
    }

    // 6. Fallback final: decodificação limpa UTF-8 para arquivos baseados em texto
    const rawText = buffer.toString('utf-8')
    const cleaned = cleanExtractedText(rawText)
    const printableRatio = (cleaned.match(/[a-zA-Z0-9áéíóúãõâêîôûàçÁÉÍÓÚÃÕÂÊÎÔÛÀÇ\s]/g) || []).length / (cleaned.length || 1)
    if (cleaned.length >= 30 && printableRatio > 0.75) {
      return cleaned
    }

    throw new Error(
      `Não foi possível extrair texto legível do arquivo "${fileName}". Certifique-se de que o arquivo não está protegido por senha, corrompido ou composto apenas por imagens escaneadas sem texto selecionável.`
    )
  } catch (globalError: any) {
    console.error(`Erro ao processar arquivo ${fileName}:`, globalError)
    throw new Error(
      globalError.message ||
        `Falha ao extrair texto do arquivo "${fileName}". Tente salvar como PDF com texto selecionável ou colar o texto diretamente.`
    )
  }
}


