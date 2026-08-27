'use client'

import { useState } from 'react'
import { Trophy, CheckCircle2, XCircle, Filter, Users, Award } from 'lucide-react'

export interface RankingEntry {
  attemptId: string
  studentId: string
  studentName: string
  studentEmail: string
  classroomName: string
  quizId: string
  quizTitle: string
  score: number
  totalQuestions: number
  correctAnswers: number
  wrongAnswers: number
  finishedAt: string
}

interface ClassroomRankingTableProps {
  entries: RankingEntry[]
  classroomName: string
  quizzes?: { id: string; title: string }[]
}

export function ClassroomRankingTable({
  entries,
  classroomName,
  quizzes = [],
}: ClassroomRankingTableProps) {
  const [selectedQuizFilter, setSelectedQuizFilter] = useState<string>('all')

  const filteredEntries = entries.filter((e) => {
    if (selectedQuizFilter === 'all') return true
    return e.quizId === selectedQuizFilter
  })

  // Ordenar prioritariamente por maior número de ACERTOS e menor data/mais rápido
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    if (b.correctAnswers !== a.correctAnswers) {
      return b.correctAnswers - a.correctAnswers
    }
    return new Date(a.finishedAt).getTime() - new Date(b.finishedAt).getTime()
  })

  // Métricas da turma
  const totalSubmissions = sortedEntries.length
  const maxCorrect = totalSubmissions > 0
    ? Math.max(...sortedEntries.map((e) => e.correctAnswers))
    : 0

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/50 font-black text-xs shadow-md shadow-amber-500/10">
          🥇 1º Lugar
        </span>
      )
    }
    if (index === 1) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-300/20 text-slate-200 border border-slate-400/50 font-black text-xs shadow-md">
          🥈 2º Lugar
        </span>
      )
    }
    if (index === 2) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-700/20 text-amber-400 border border-amber-700/50 font-black text-xs shadow-md">
          🥉 3º Lugar
        </span>
      )
    }
    return (
      <span className="inline-flex items-center justify-center h-7 w-7 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 font-bold text-xs">
        {index + 1}º
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* CARDS DE ESTATÍSTICAS DA TURMA (SEM NOTAS, FOCO EM ACERTOS E ENTREGAS) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Provas Entregues
              </span>
              <p className="font-mono text-2xl font-black text-white mt-0.5">
                {totalSubmissions} {totalSubmissions === 1 ? 'aluno' : 'alunos'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Maior Pontuação de Acertos (1º Lugar)
              </span>
              <p className="font-mono text-2xl font-black text-emerald-400 mt-0.5">
                {maxCorrect} acertos
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FILTRO POR PROVA */}
      {quizzes.length > 1 && (
        <div className="flex items-center gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
          <Filter className="h-4 w-4 text-indigo-400 ml-1" />
          <span className="text-xs font-bold text-slate-300">Filtrar por Avaliação:</span>
          <select
            value={selectedQuizFilter}
            onChange={(e) => setSelectedQuizFilter(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-100 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">Todas as Avaliações da Turma</option>
            {quizzes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* TABELA DE CLASSIFICAÇÃO / RANKING (1º, 2º, 3º LUGAR) */}
      {sortedEntries.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/40 p-10 text-center">
          <Trophy className="mx-auto h-10 w-10 text-slate-600" />
          <h4 className="mt-2 text-sm font-bold text-slate-200">Nenhum aluno realizou a prova ainda</h4>
          <p className="text-xs text-slate-400 mt-1">
            Assim que os alunos da turma {classroomName} concluírem o teste, o ranking com as posições (1º, 2º e 3º lugar), acertos e erros aparecerão aqui em tempo real.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 shadow-xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-xs font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3.5 px-4 text-center">Posição</th>
                  <th className="py-3.5 px-4">Aluno</th>
                  <th className="py-3.5 px-4">Avaliação</th>
                  <th className="py-3.5 px-4 text-center">Acertos</th>
                  <th className="py-3.5 px-4 text-center">Erros</th>
                  <th className="py-3.5 px-4 text-right">Data de Entrega</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sortedEntries.map((entry, index) => (
                  <tr
                    key={entry.attemptId}
                    className={`transition-colors hover:bg-slate-800/40 ${
                      index === 0
                        ? 'bg-amber-500/10'
                        : index === 1
                        ? 'bg-slate-400/10'
                        : index === 2
                        ? 'bg-amber-700/10'
                        : ''
                    }`}
                  >
                    {/* POSIÇÃO NO RANKING */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex justify-center">{getRankBadge(index)}</div>
                    </td>

                    {/* ALUNO */}
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-white text-sm">{entry.studentName}</p>
                        <p className="text-xs text-slate-400">{entry.studentEmail}</p>
                      </div>
                    </td>

                    {/* AVALIAÇÃO */}
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-200 text-xs line-clamp-1">
                        {entry.quizTitle}
                      </span>
                    </td>

                    {/* ACERTOS */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1.5 font-mono text-sm font-black text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-xl border border-emerald-700/60">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        {entry.correctAnswers} <span className="text-xs text-emerald-300/70 font-normal">/ {entry.totalQuestions}</span>
                      </span>
                    </td>

                    {/* ERROS */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1.5 font-mono text-sm font-bold text-rose-400 bg-rose-950/80 px-3 py-1 rounded-xl border border-rose-800/60">
                        <XCircle className="h-4 w-4 text-rose-400" />
                        {entry.wrongAnswers}
                      </span>
                    </td>

                    {/* DATA DE ENTREGA */}
                    <td className="py-3.5 px-4 text-right text-xs text-slate-400 font-mono">
                      {new Date(entry.finishedAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
