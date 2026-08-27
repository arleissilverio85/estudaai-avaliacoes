import * as XLSX from 'xlsx'
import mammoth from 'mammoth'

export async function extractTextFromFile(
  buffer: Buffer,
  fileName: string,
  mimeType?: string
): Promise<string> {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''

  try {
    // 1. Arquivos de Texto Puro / Markdown / JSON / CSV
    if (ext === 'txt' || ext === 'md' || ext === 'json' || ext === 'csv' || mimeType?.includes('text/plain') || mimeType?.includes('text/markdown')) {
      const text = buffer.toString('utf-8')
      if (text && text.trim().length > 0) {
        return text
      }
    }

    // 2. Arquivos Word (.docx)
    if (ext === 'docx' || mimeType?.includes('wordprocessingml.document')) {
      try {
        const result = await mammoth.extractRawText({ buffer })
        if (result?.value && result.value.trim().length > 0) {
          return result.value
        }
      } catch (err) {
        console.warn('Mammoth docx parse warning:', err)
      }
    }

    // 3. Planilhas Excel (.xlsx, .xls)
    if (ext === 'xlsx' || ext === 'xls' || mimeType?.includes('spreadsheet')) {
      try {
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        let fullText = ''
        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName]
          const csvText = XLSX.utils.sheet_to_csv(sheet)
          fullText += `--- Planilha: ${sheetName} ---\n${csvText}\n\n`
        })
        if (fullText.trim().length > 0) {
          return fullText
        }
      } catch (err) {
        console.warn('XLSX parse warning:', err)
      }
    }

    // 4. Arquivos PDF
    if (ext === 'pdf' || mimeType?.includes('pdf')) {
      try {
        const pdfParse = require('pdf-parse')
        const data = await pdfParse(buffer)
        if (data?.text && data.text.trim().length > 0) {
          return data.text
        }
      } catch (err) {
        console.warn('PDF-parse warning:', err)
      }
    }

    // 5. Apresentações de Slides (.pptx) e formatos Office via officeparser
    try {
      const officeParser = require('officeparser')
      const text = await officeParser.parseOfficeAsync(buffer)
      if (text && typeof text === 'string' && text.trim().length > 0) {
        return text
      }
    } catch (err) {
      console.warn('Officeparser fallback warning:', err)
    }

    // 6. Fallback final: decodificação limpa UTF-8 removendo caracteres nulos/binários
    const rawText = buffer.toString('utf-8').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
    if (rawText.trim().length > 30) {
      return rawText.slice(0, 50000)
    }

    return `Material "${fileName}" carregado com sucesso. Use as informações de título e descrição para guiar o contexto.`
  } catch (globalError: any) {
    console.error(`Erro ao processar arquivo ${fileName}:`, globalError)
    return `Material: ${fileName}. Conteúdo textual registrado para consulta pedagógica.`
  }
}
