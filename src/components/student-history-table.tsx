'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { deleteStudentAttempt } from '@/app/(dashboard)/student/actions'
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Trash2,
  Eye,
  School,
  FileCheck,
  Calendar,
  Sparkles,
  AlertTriangle,
} from 'lucide-react'

export interface StudentHistoryItem {
  id: string
  quizId: string
  quizTitle: string
  classroomName: string
  score: number
  totalQuestions: number
  correctAnswers: number
  wrongAnswers: number
  finishedAt: string
}

interface StudentHistoryTableProps {
  history: StudentHistoryItem[]
}

export function StudentHistoryTable({ history }: StudentHistoryTableProps) {
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = (attemptId: string, quizTitle: string) => {
    const confirmDelete = window.confirm(
      `Deseja realmente remover a avaliação "${quizTitle}" do seu histórico?`
    )
    if (!confirmDelete) return

    setDeletingId(attemptId)
    startTransition(async () => {
      const res = await deleteStudentAttempt(attemptId)
      if (!res.success) {
        alert(res.error || 'Erro ao apagar do histórico.')
      }
      setDeletingId(null)
    })
  }

  // Cálculos de resumo
  const totalCompleted = history.length
  const averageScore =
    totalCompleted > 0
      ? (history.reduce((acc, curr) => acc + curr.score, 0) / totalCompleted).toFixed(1)
      : '0.0'
  const highestScore =
    totalCompleted > 0 ? Math.max(...history.map((h) => h.score)).toFixed(1) : '0.0'

  if (history.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/40 p-8 text-center">
        <FileCheck className="mx-auto h-10 w-10 text-slate-600" />
        <h4 className="mt-2 text-sm font-bold text-slate-200">Nenhuma avaliação realizada ainda</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Entre em uma das suas salas de aula e realize as provas liberadas pelo seu professor. Seu histórico de notas e acertos aparecerá aqui!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* CARDS DE RESUMO DO ALUNO */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Provas Concluídas
              </span>
              <p className="font-mono text-2xl font-black text-white">{totalCompleted}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Média das Suas Notas
              </span>
              <p className="font-mono text-2xl font-black text-emerald-400">{averageScore} / 10.0</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Sua Maior Nota
              </span>
              <p className="font-mono text-2xl font-black text-amber-400">{highestScore} / 10.0</p>
            </div>
          </div>
        </div>
      </div>

      {/* TABELA DE HISTÓRICO */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 shadow-xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-xs font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Avaliação & Sala</th>
                <th className="py-3.5 px-4 text-center">Sua Nota</th>
                <th className="py-3.5 px-4 text-center">Acertos / Erros</th>
                <th className="py-3.5 px-4 text-center">Realizada em</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {history.map((item) => {
                const isApproved = item.score >= 6.0
                const isCurrentDeleting = deletingId === item.id && isPending

                return (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-slate-800/40"
                  >
                    {/* AVALIAÇÃO & TURMA */}
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-white text-sm">{item.quizTitle}</p>
                        <p className="text-xs text-indigo-400 flex items-center gap-1 mt-0.5 font-medium">
                          <School className="h-3 w-3" />
                          {item.classroomName}
                        </p>
                      </div>
                    </td>

                    {/* NOTA */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`font-mono text-sm font-black px-3 py-1 rounded-xl border ${
                          isApproved
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                            : 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                        }`}
                      >
                        {item.score.toFixed(1)} / 10.0
                      </span>
                    </td>

                    {/* ACERTOS / ERROS */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold">
                        <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-800/60">
                          <CheckCircle2 className="h-3 w-3" />
                          {item.correctAnswers}
                        </span>
                        <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-lg border border-rose-800/60">
                          <XCircle className="h-3 w-3" />
                          {item.wrongAnswers}
                        </span>
                      </div>
                    </td>

                    {/* DATA */}
                    <td className="py-3.5 px-4 text-center text-xs text-slate-400 font-mono">
                      {new Date(item.finishedAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* AÇÕES (VER / APAGAR) */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/student/quizzes/${item.quizId}`}>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 px-2.5 text-xs font-bold gap-1"
                            title="Ver Prova / Gabarito"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Ver Prova</span>
                          </Button>
                        </Link>

                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(item.id, item.quizTitle)}
                          disabled={isCurrentDeleting}
                          className="h-8 px-2 text-xs font-bold gap-1 text-rose-400 hover:bg-rose-950/80 border border-rose-900/60 bg-rose-950/40"
                          title="Remover do Histórico"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>{isCurrentDeleting ? 'Apagando...' : 'Apagar'}</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
