'use client'

import { useState } from 'react'
import { Users, Clock, CheckCircle2, XCircle, FileText } from 'lucide-react'
import { StudentAttemptModal, AttemptDetailQuestion } from '@/components/student-attempt-modal'

export interface StudentWithAttempts {
  id: string
  name: string
  email: string
  joinedAt: string
  attempts: {
    attemptId: string
    quizId: string
    quizTitle: string
    score: number
    totalQuestions: number
    correctAnswers: number
    wrongAnswers: number
    finishedAt: string
    questions: AttemptDetailQuestion[]
  }[]
}

interface ClassroomStudentsTableProps {
  students: StudentWithAttempts[]
  classroomName: string
  quizzes: { id: string; title: string }[]
}

export function ClassroomStudentsTable({
  students,
  classroomName,
  quizzes,
}: ClassroomStudentsTableProps) {
  const [selectedQuizId, setSelectedQuizId] = useState<string>('all')

  return (
    <div className="space-y-4">
      {/* SELETOR DE PROVA SE HOUVER MAIS DE UMA */}
      {quizzes.length > 1 && (
        <div className="flex items-center gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold text-slate-300">Visualizar Resultados da Prova:</span>
          <select
            value={selectedQuizId}
            onChange={(e) => setSelectedQuizId(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-100 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">Todas as Provas da Turma</option>
            {quizzes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {students.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/40 p-10 text-center">
          <Users className="mx-auto h-10 w-10 text-slate-600" />
          <h4 className="mt-2 text-sm font-bold text-slate-200">Nenhum aluno entrou nesta sala ainda</h4>
          <p className="text-xs text-slate-400 mt-1">
            Compartilhe o código de entrada com a turma para que os alunos possam se matricular.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 shadow-xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-xs font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3.5 px-4">Aluno</th>
                  <th className="py-3.5 px-4">Status da Prova</th>
                  <th className="py-3.5 px-4 text-center">Acertos</th>
                  <th className="py-3.5 px-4 text-center">Erros</th>
                  <th className="py-3.5 px-4 text-right">Gabarito do Aluno</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {students.map((student) => {
                  const studentAttempts = student.attempts.filter((att) => {
                    if (selectedQuizId === 'all') return true
                    return att.quizId === selectedQuizId
                  })

                  const latestAttempt = studentAttempts[0]
                  const hasDoneQuiz = Boolean(latestAttempt)

                  return (
                    <tr
                      key={student.id}
                      className="transition-colors hover:bg-slate-800/40"
                    >
                      {/* NOME E EMAIL DO ALUNO */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 font-bold text-xs border border-indigo-500/30 shrink-0">
                            {student.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{student.name}</p>
                            <p className="text-xs text-slate-400">{student.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* STATUS DA AVALIAÇÃO */}
                      <td className="py-3.5 px-4">
                        {hasDoneQuiz ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/60">
                              <CheckCircle2 className="h-3 w-3" />
                              Avaliação Entregue
                            </span>
                            <p className="text-[10px] text-slate-400 truncate max-w-xs">
                              {latestAttempt.quizTitle}
                            </p>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-800/40">
                            <Clock className="h-3 w-3" />
                            Ainda não realizou
                          </span>
                        )}
                      </td>

                      {/* ACERTOS */}
                      <td className="py-3.5 px-4 text-center">
                        {hasDoneQuiz ? (
                          <span className="inline-flex items-center gap-1 font-mono text-sm font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-800/60">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {latestAttempt.correctAnswers} <span className="text-xs text-emerald-300/70 font-normal">/ {latestAttempt.totalQuestions}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600 font-mono">-</span>
                        )}
                      </td>

                      {/* ERROS */}
                      <td className="py-3.5 px-4 text-center">
                        {hasDoneQuiz ? (
                          <span className="inline-flex items-center gap-1 font-mono text-sm font-bold text-rose-400 bg-rose-950/60 px-2.5 py-0.5 rounded-lg border border-rose-800/60">
                            <XCircle className="h-3.5 w-3.5" />
                            {latestAttempt.wrongAnswers}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600 font-mono">-</span>
                        )}
                      </td>

                      {/* BOTÃO VER RESPOSTAS DO ALUNO */}
                      <td className="py-3.5 px-4 text-right">
                        {hasDoneQuiz ? (
                          <StudentAttemptModal
                            studentName={student.name}
                            studentEmail={student.email}
                            quizTitle={latestAttempt.quizTitle}
                            score={latestAttempt.score}
                            correctCount={latestAttempt.correctAnswers}
                            totalCount={latestAttempt.totalQuestions}
                            finishedAt={latestAttempt.finishedAt}
                            questions={latestAttempt.questions}
                          />
                        ) : (
                          <span className="text-xs text-slate-600">Sem respostas</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
