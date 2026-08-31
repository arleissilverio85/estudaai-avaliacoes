'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { formatMaterialStatus } from '@/lib/utils'
import {
  FileText,
  Trash2,
  Calendar,
  Download,
  Sparkles,
  FileSpreadsheet,
  Presentation,
  FileCode,
  School,
  Eye,
  X,
  Copy,
  Check,
} from 'lucide-react'
import { deleteMaterial, getMaterialDownloadUrl } from '@/app/(dashboard)/teacher/actions'
import { EditMaterialDialog } from '@/components/edit-material-dialog'
import { GenerateQuizAiDialog } from '@/components/generate-quiz-ai-dialog'
import { Modal } from '@/components/ui/modal'
import { Material } from '@/types/database.types'

interface MaterialCardProps {
  material: Material & {
    classrooms?: { name: string } | null
  }
  classrooms?: { id: string; name: string }[]
}

export function MaterialCard({ material, classrooms = [] }: MaterialCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const statusInfo = formatMaterialStatus(material.processing_status)

  const handleDelete = async () => {
    if (confirm(`Deseja realmente excluir o material "${material.title}"?`)) {
      setIsDeleting(true)
      await deleteMaterial(material.id)
      setIsDeleting(false)
    }
  }

  const handleDownload = async () => {
    if (!material.file_path) {
      alert('Arquivo físico não disponível para download.')
      return
    }
    try {
      setIsDownloading(true)
      const res = await getMaterialDownloadUrl(material.file_path)
      if (res.url) {
        window.open(res.url, '_blank')
      } else {
        alert(res.error || 'Não foi possível obter o link de download.')
      }
    } catch {
      alert('Erro ao tentar baixar o arquivo.')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleCopyContent = () => {
    if (material.content_text) {
      navigator.clipboard.writeText(material.content_text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getFileIcon = (fileName: string | null) => {
    const ext = fileName?.split('.').pop()?.toLowerCase() || ''
    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv')
      return <FileSpreadsheet className="h-4 w-4 text-emerald-400 shrink-0" />
    if (ext === 'pptx' || ext === 'ppt')
      return <Presentation className="h-4 w-4 text-amber-400 shrink-0" />
    if (ext === 'txt' || ext === 'md')
      return <FileCode className="h-4 w-4 text-cyan-400 shrink-0" />
    return <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
  }

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return null
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const hasContentText = Boolean(material.content_text && material.content_text.length >= 20)
  const wordCount = material.content_text ? material.content_text.trim().split(/\s+/).length : 0
  const classroomName = material.classrooms?.name

  // Lista para o modal de gerar quiz
  const singleMaterialList = [
    {
      id: material.id,
      title: material.title,
      file_name: material.file_name,
      classroom_id: material.classroom_id,
    },
  ]

  return (
    <>
      <Card className="flex flex-col justify-between border-slate-800 bg-slate-900/80 transition-all hover:border-slate-700 hover:shadow-lg">
        <div>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base font-bold text-white line-clamp-1">{material.title}</CardTitle>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border shrink-0 ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>

            {/* TURMA VINCULADA */}
            <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-semibold mt-1">
              <School className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{classroomName ? `Turma: ${classroomName}` : 'Material Geral'}</span>
            </div>

            {material.description && (
              <CardDescription className="text-xs text-slate-400 line-clamp-2 mt-1">
                {material.description}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="space-y-2.5 text-xs text-slate-400 pt-1">
            {/* NOME DO ARQUIVO E TAMANHO */}
            <div className="flex items-center justify-between rounded-xl bg-slate-950/80 p-2.5 border border-slate-800">
              <div className="flex items-center gap-2 truncate">
                {getFileIcon(material.file_name)}
                <span className="font-mono text-slate-200 truncate text-[11px]">
                  {material.file_name || 'arquivo.pdf'}
                </span>
              </div>
              {formatFileSize(material.file_size) && (
                <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">
                  {formatFileSize(material.file_size)}
                </span>
              )}
            </div>

            {/* BADGE DE STATUS IA E PALAVRAS INDEXADAS */}
            <div className="flex items-center justify-between">
              {hasContentText ? (
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-950/50 px-2 py-0.5 rounded-lg border border-emerald-800/40"
                  title="Clique para visualizar o texto extraído"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>{wordCount.toLocaleString('pt-BR')} palavras (IA)</span>
                  <Eye className="h-3 w-3 ml-0.5 opacity-70" />
                </button>
              ) : (
                <span className="text-[11px] text-amber-400 font-semibold">Sem texto indexado</span>
              )}
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(material.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </CardContent>
        </div>

        <CardFooter className="flex items-center justify-between pt-3 border-t border-slate-800/80 mt-2 gap-2">
          <div className="flex items-center gap-1.5">
            {hasContentText && classrooms.length > 0 && (
              <GenerateQuizAiDialog
                classrooms={classrooms}
                materials={singleMaterialList}
                initialClassroomId={material.classroom_id || classrooms[0]?.id}
                initialMaterialId={material.id}
                triggerButton={
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                    title="Gerar avaliação estritamente com base neste material"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Gerar Prova com IA</span>
                  </button>
                }
              />
            )}

            {material.file_path && (
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all border border-slate-700"
                title="Baixar arquivo original"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            <EditMaterialDialog material={material} classrooms={classrooms} />
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-lg p-2 text-slate-500 hover:bg-rose-950/50 hover:text-rose-400 transition-colors border border-transparent hover:border-rose-900/50"
              title="Excluir Material"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </CardFooter>
      </Card>

      {/* MODAL DE VISUALIZAÇÃO DO TEXTO EXTRAÍDO (TRANSPARÊNCIA NOTEBOOKLM) */}
      <Modal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} maxWidth="max-w-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white line-clamp-1">{material.title}</h3>
              <p className="text-xs text-emerald-400 font-mono">
                {wordCount.toLocaleString('pt-BR')} palavras extraídas para geração de provas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsPreviewOpen(false)}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent hover:border-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="my-4 max-h-[60vh] overflow-y-auto rounded-2xl bg-slate-950 p-4 border border-slate-800">
          <pre className="whitespace-pre-wrap font-sans text-xs text-slate-200 leading-relaxed">
            {material.content_text || 'Nenhum texto disponível para este material.'}
          </pre>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-800 shrink-0">
          <button
            type="button"
            onClick={handleCopyContent}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all border border-slate-700"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copiado para Área de Transferência!' : 'Copiar Texto'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPreviewOpen(false)}
            className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 transition-all"
          >
            Fechar
          </button>
        </div>
      </Modal>
    </>
  )
}

