'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { formatMaterialStatus } from '@/lib/utils'
import { FileText, Trash2, Calendar } from 'lucide-react'
import { deleteMaterial } from '@/app/(dashboard)/teacher/actions'
import { EditMaterialDialog } from '@/components/edit-material-dialog'
import { Material } from '@/types/database.types'

interface MaterialCardProps {
  material: Material
}

export function MaterialCard({ material }: MaterialCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const statusInfo = formatMaterialStatus(material.processing_status)

  const handleDelete = async () => {
    if (confirm(`Deseja realmente excluir o material "${material.title}"?`)) {
      setIsDeleting(true)
      await deleteMaterial(material.id)
      setIsDeleting(false)
    }
  }

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
          {material.description && (
            <CardDescription className="text-xs text-slate-400 line-clamp-2 mt-1">
              {material.description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-2 text-xs text-slate-400 pt-2">
          <p className="flex items-center gap-1.5 font-mono text-slate-300 bg-slate-950/80 p-2 rounded-xl border border-slate-800">
            <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
            <span className="truncate">{material.file_name || 'arquivo.pdf'}</span>
          </p>
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Cadastrado em {new Date(material.created_at).toLocaleDateString('pt-BR')}
          </p>
        </CardContent>
      </div>

      <CardFooter className="flex items-center justify-end gap-1 pt-3 border-t border-slate-800/80 mt-2">
        <EditMaterialDialog material={material} />
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-lg p-2 text-slate-500 hover:bg-rose-950/50 hover:text-rose-400 transition-colors border border-transparent hover:border-rose-900/50"
          title="Excluir Material"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </CardFooter>
    </Card>
  )
}
