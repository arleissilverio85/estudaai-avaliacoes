'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { formatMaterialStatus } from '@/lib/utils'
import { FileText, Trash2, Calendar, Download, Sparkles, FileSpreadsheet, Presentation, FileCode, School } from 'lucide-react'
import { deleteMaterial, getMaterialDownloadUrl } from '@/app/(dashboard)/teacher/actions'
import { EditMaterialDialog } from '@/components/edit-material-dialog'
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

  const getFileIcon = (fileName: string | null) => {
    const ext = fileName?.split('.').pop()?.toLowerCase() || ''
    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') return <FileSpreadsheet className="h-4 w-4 text-emerald-400 shrink-0" />
    if (ext === 'pptx' || ext === 'ppt') return <Presentation className="h-4 w-4 text-amber-400 shrink-0" />
    if (ext === 'txt' || ext === 'md') return <FileCode className="h-4 w-4 text-cyan-400 shrink-0" />
    return <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
  }

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return null
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const hasContentText = Boolean(material.content_text && material.content_text.length > 20)
  const classroomName = material.classrooms?.name

  return (
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

          {/* BADGE DE STATUS IA */}
          <div className="flex items-center justify-between">
            {hasContentText ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" />
                Indexado para IA
              </span>
            ) : (
              <span className="text-[11px] text-slate-500">Sem texto indexado</span>
            )}
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(material.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </CardContent>
      </div>

      <CardFooter className="flex items-center justify-between pt-3 border-t border-slate-800/80 mt-2">
        {material.file_path ? (
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-950/60 hover:text-white transition-all border border-indigo-500/30"
            title="Baixar arquivo no celular ou PC"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Baixar Arquivo</span>
          </button>
        ) : (
          <span />
        )}

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
  )
}
