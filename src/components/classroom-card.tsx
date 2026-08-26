'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Copy, Check, Users, FileCheck, ArrowRight, Trash2 } from 'lucide-react'
import { deleteClassroom } from '@/app/(dashboard)/teacher/actions'
import { EditClassroomDialog } from '@/components/edit-classroom-dialog'

interface ClassroomCardProps {
  classroom: {
    id: string
    name: string
    description: string | null
    join_code: string
    is_active: boolean
    created_at: string
    student_count?: number
    quiz_count?: number
  }
  isTeacher?: boolean
}

export function ClassroomCard({ classroom, isTeacher = false }: ClassroomCardProps) {
  const [copied, setCopied] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const copyCode = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(classroom.join_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm(`Deseja realmente remover a sala "${classroom.name}" e todos os vínculos de alunos e provas?`)) {
      setIsDeleting(true)
      await deleteClassroom(classroom.id)
      setIsDeleting(false)
    }
  }

  const detailUrl = isTeacher
    ? `/teacher/classrooms/${classroom.id}`
    : `/student/classrooms/${classroom.id}`

  return (
    <Card className="group relative flex flex-col justify-between overflow-hidden border-slate-800 bg-slate-900/80 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10">
      <div>
        <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
              {classroom.name}
            </CardTitle>
            {classroom.description && (
              <CardDescription className="line-clamp-2 text-xs text-slate-400">
                {classroom.description}
              </CardDescription>
            )}
          </div>
          {classroom.is_active ? (
            <Badge variant="success" className="text-[10px]">Ativa</Badge>
          ) : (
            <Badge variant="default" className="text-[10px]">Inativa</Badge>
          )}
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {/* CÓDIGO DE ENTRADA */}
          <div className="flex items-center justify-between rounded-xl bg-slate-950/80 p-2.5 border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Código:
              </span>
              <span className="font-mono text-sm font-extrabold text-indigo-400 tracking-wider">
                {classroom.join_code}
              </span>
            </div>
            <button
              onClick={copyCode}
              title="Copiar código"
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all border border-slate-800 hover:border-slate-700"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>

          {/* MÉTRICAS */}
          <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-slate-500" />
              <span>{classroom.student_count ?? 0} alunos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileCheck className="h-4 w-4 text-slate-500" />
              <span>{classroom.quiz_count ?? 0} avaliações</span>
            </div>
          </div>
        </CardContent>
      </div>

      <CardFooter className="flex items-center justify-between pt-3 border-t border-slate-800/80">
        {isTeacher && (
          <div className="flex items-center gap-1">
            <EditClassroomDialog classroom={classroom} />
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-lg p-2 text-slate-500 hover:bg-rose-950/50 hover:text-rose-400 transition-colors border border-transparent hover:border-rose-900/50"
              title="Excluir Sala"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}

        <Link
          href={detailUrl}
          className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-100 hover:bg-indigo-600 hover:text-white transition-all border border-slate-700 shadow-sm group-hover:bg-indigo-600 group-hover:border-indigo-500/50"
        >
          Acessar Sala
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </CardFooter>
    </Card>
  )
}
