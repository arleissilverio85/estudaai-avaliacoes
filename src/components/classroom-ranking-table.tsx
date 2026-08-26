'use client'

import { useState } from 'react'
import { Trophy, Medal, CheckCircle2, XCircle, Users, Clock, ArrowUpDown, Filter } from 'lucide-react'

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

  // Ordenar por maior nota primeiro e menor tempo/mais recente
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score
    }
    return b.correctAnswers - a.correctAnswers
  })

  // Métricas calculadas da turma
  const totalSubmissions = sortedEntries.length
  const averageScore = totalSubmissions > 0
    ? (sortedEntries.reduce((acc, curr) => acc + curr.score, 0) / totalSubmissions).toFixed(1)
    : '0.0'
  const highestScore = totalSubmissions > 0
    ? Math.max(...sortedEntries.map((e) => e.score)).toFixed(1)
    : '0.0'

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black text-xs shadow-sm">
          🥇 1º
        </span>
      )
    }
    if (index === 1) {
      return (
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-400/20 text-slate-200 border border-slate-400/40 font-black text-xs shadow-sm">
          🥈 2º
        </span>
      )
    }
    if (index === 2) {
      return (
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-700/20 text-amber-500 border border-amber-700/40 font-black text-xs shadow-sm">
          🥉 3º
        </span>
      )
    }
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-800 text-slate-400 border border-slate-700 font-bold text-xs">
        {index + 1}º
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* BARRA DE ESTATÍSTICAS DA TURMA */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-md">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Total de Provas Realizadas
          </span>
          <p className="font-mono text-2xl font-black text-indigo-400 mt-1">
            {totalSubmissions} entregas
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-md">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Média da Turma
          </span>
          <p className="font-mono text-2xl font-black text-emerald-400 mt-1">
            {averageScore} / 10.0
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-md">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Maior Pontuação
          </span>
          <p className="font-mono text-2xl font-black text-amber-400 mt-1">
            {highestScore} / 10.0
          </p>
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

      {/* TABELA DE CLASSIFICAÇÃO / RANKING */}
      {sortedEntries.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/40 p-10 text-center">
          <Trophy className="mx-auto h-10 w-10 text-slate-600" />
          <h4 className="mt-2 text-sm font-bold text-slate-200">Nenhum aluno realizou a prova ainda</h4>
          <p className="text-xs text-slate-400 mt-1">
            Assim que os alunos da turma {classroomName} concluírem o teste, o ranking, notas, acertos e erros aparecerão aqui em tempo real.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 shadow-xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-xs font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3.5 px-4 text-center w-16">Posição</th>
                  <th className="py-3.5 px-4">Aluno</th>
                  <th className="py-3.5 px-4">Avaliação</th>
                  <th className="py-3.5 px-4 text-center">Nota Final</th>
                  <th className="py-3.5 px-4 text-center">Acertos / Erros</th>
                  <th className="py-3.5 px-4 text-right">Data de Entrega</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sortedEntries.map((entry, index) => (
                  <tr
                    key={entry.attemptId}
                    className={`transition-colors hover:bg-slate-800/40 ${
                      index === 0
                        ? 'bg-amber-500/5'
                        : index === 1
                        ? 'bg-slate-400/5'
                        : index === 2
                        ? 'bg-amber-700/5'
                        : ''
                    }`}
                  >
                    {/* POSIÇÃO */}
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

                    {/* NOTA FINAL */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`font-mono text-base font-black px-2.5 py-1 rounded-xl border ${
                          entry.score >= 6.0
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                            : 'bg-rose-950/60 text-rose-400 border-rose-800/60'
                        }`}
                      >
                        {entry.score.toFixed(1)}
                      </span>
                    </td>

                    {/* ACERTOS / ERROS */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold">
                        <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-800/60">
                          <CheckCircle2 className="h-3 w-3" />
                          {entry.correctAnswers}
                        </span>
                        <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-lg border border-rose-800/60">
                          <XCircle className="h-3 w-3" />
                          {entry.wrongAnswers}
                        </span>
                      </div>
                    </td>

                    {/* DATA */}
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
