import * as XLSX from 'xlsx'
import mammoth from 'mammoth'

export async function extractTextFromFile(
  buffer: Buffer,
  fileName: string,
  mimeType?: string
): Promise<string> {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''

  try {
    // 1. Arquivos de Texto Puro / Markdown
    if (ext === 'txt' || ext === 'md' || mimeType?.includes('text/plain') || mimeType?.includes('text/markdown')) {
      return buffer.toString('utf-8')
    }

    // 2. Arquivos PDF
    if (ext === 'pdf' || mimeType?.includes('pdf')) {
      try {
        // Import dinâmico do pdf-parse para evitar problemas de build SSR
        const pdfParse = require('pdf-parse')
        const data = await pdfParse(buffer)
        return data.text || ''
      } catch (err: any) {
        console.warn('Fallback no PDF parser:', err)
        // Fallback usando officeparser se disponível
        try {
          const officeParser = require('officeparser')
          return await officeParser.parseOfficeAsync(buffer)
        } catch {
          return 'Conteúdo textual do PDF não pôde ser extraído completamente.'
        }
      }
    }

    // 3. Arquivos Word (.docx, .doc)
    if (ext === 'docx' || mimeType?.includes('wordprocessingml.document')) {
      try {
        const result = await mammoth.extractRawText({ buffer })
        return result.value || ''
      } catch (err: any) {
        console.warn('Erro ao processar DOCX com mammoth, tentando officeparser:', err)
        const officeParser = require('officeparser')
        return await officeParser.parseOfficeAsync(buffer)
      }
    }

    // 4. Planilhas Excel (.xlsx, .xls, .csv)
    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv' || mimeType?.includes('spreadsheet') || mimeType?.includes('csv')) {
      try {
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        let fullText = ''
        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName]
          const csvText = XLSX.utils.sheet_to_csv(sheet)
          fullText += `--- Planilha: ${sheetName} ---\n${csvText}\n\n`
        })
        return fullText
      } catch (err: any) {
        console.warn('Erro ao processar planilha com XLSX:', err)
      }
    }

    // 5. Apresentações de Slides (.pptx, .ppt) e outros formatos Office
    if (ext === 'pptx' || ext === 'ppt' || mimeType?.includes('presentation')) {
      try {
        const officeParser = require('officeparser')
        return await officeParser.parseOfficeAsync(buffer)
      } catch (err: any) {
        console.warn('Erro ao processar apresentação de slides:', err)
      }
    }

    // 6. Tentativa Genérica via officeparser
    try {
      const officeParser = require('officeparser')
      const text = await officeParser.parseOfficeAsync(buffer)
      if (text && text.trim().length > 0) {
        return text
      }
    } catch {
      // Ignorar
    }

    // Fallback final: string UTF-8
    return buffer.toString('utf-8')
  } catch (globalError: any) {
    console.error(`Erro global ao extrair texto do arquivo ${fileName}:`, globalError)
    return `[Arquivo: ${fileName}] Conteúdo textual não pôde ser completamente extraído: ${globalError.message}`
  }
}
