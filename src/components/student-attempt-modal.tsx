'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import {
  FileText,
  X,
  CheckCircle2,
  XCircle,
  Sparkles,
  Trophy,
  User,
  Calendar,
} from 'lucide-react'

export interface AttemptDetailQuestion {
  questionId: string
  questionText: string
  explanation: string | null
  selectedOptionText: string | null
  correctOptionText: string | null
  isCorrect: boolean
  options: {
    id: string
    optionText: string
    isCorrect: boolean
  }[]
}

export interface StudentAttemptModalProps {
  studentName: string
  studentEmail: string
  quizTitle: string
  score: number
  correctCount: number
  totalCount: number
  finishedAt: string
  questions: AttemptDetailQuestion[]
}

export function StudentAttemptModal({
  studentName,
  studentEmail,
  quizTitle,
  score,
  correctCount,
  totalCount,
  finishedAt,
  questions,
}: StudentAttemptModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isApproved = score >= 6.0

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600/20 px-3 py-1.5 text-xs font-bold text-indigo-300 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-500/30"
      >
        <FileText className="h-3.5 w-3.5" />
        Ver Respostas
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} maxWidth="max-w-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{studentName}</h3>
                  <p className="text-xs text-slate-400">{studentEmail}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent hover:border-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* RESUMO DO DESEMPENHO DO ALUNO */}
            <div className="mt-6 rounded-2xl bg-slate-950/80 p-4 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Avaliação
                </span>
                <p className="text-xs font-bold text-white mt-0.5 truncate">{quizTitle}</p>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Nota do Aluno
                </span>
                <p
                  className={`font-mono text-lg font-black mt-0.5 ${
                    isApproved ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {score.toFixed(1)} / 10.0
                </p>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Acertos / Total
                </span>
                <p className="font-mono text-lg font-black text-white mt-0.5">
                  {correctCount} <span className="text-xs text-slate-500">de {totalCount}</span>
                </p>
              </div>
            </div>

            {/* LISTAGEM DAS QUESTÕES E RESPOSTAS MARCADAS */}
            <div className="mt-6 space-y-5">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-indigo-400" />
                Respostas Marcadas pelo Aluno ({questions.length} questões)
              </h4>

              {questions.map((q, idx) => (
                <div
                  key={q.questionId}
                  className={`rounded-2xl border p-4 shadow-sm backdrop-blur-md space-y-3 ${
                    q.isCorrect
                      ? 'border-emerald-500/30 bg-emerald-950/20'
                      : 'border-rose-500/30 bg-rose-950/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-800 text-xs font-black text-slate-200 border border-slate-700 shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-sm font-bold text-white pt-0.5">{q.questionText}</p>
                    </div>

                    {q.isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800/60 shrink-0">
                        <CheckCircle2 className="h-3 w-3" />
                        Acertou
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded-md border border-rose-800/60 shrink-0">
                        <XCircle className="h-3 w-3" />
                        Errou
                      </span>
                    )}
                  </div>

                  {/* OPÇÕES DA QUESTÃO */}
                  <div className="space-y-1.5 pl-8">
                    {q.options.map((opt, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx)
                      const isSelected = opt.optionText === q.selectedOptionText
                      const isCorrect = opt.isCorrect

                      let badgeStyle = 'border-slate-800 bg-slate-950/60 text-slate-300'
                      if (isCorrect) {
                        badgeStyle = 'border-emerald-500/80 bg-emerald-950/60 text-emerald-200 font-semibold'
                      } else if (isSelected && !isCorrect) {
                        badgeStyle = 'border-rose-500/80 bg-rose-950/60 text-rose-200 font-semibold line-through'
                      }

                      return (
                        <div
                          key={opt.id}
                          className={`flex items-center justify-between rounded-xl border p-2.5 text-xs ${badgeStyle}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold ${
                                isCorrect
                                  ? 'bg-emerald-500 text-slate-950 font-black'
                                  : isSelected
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {letter}
                            </span>
                            <span>{opt.optionText}</span>
                          </div>

                          {isCorrect && (
                            <span className="text-[10px] font-bold text-emerald-400">
                              (Gabarito Correto)
                            </span>
                          )}
                          {isSelected && !isCorrect && (
                            <span className="text-[10px] font-bold text-rose-400">
                              (Marcada pelo Aluno)
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* JUSTIFICATIVA PEDAGÓGICA */}
                  {q.explanation && (
                    <div className="ml-8 rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-2.5 text-xs text-indigo-200">
                      <p className="font-bold text-indigo-300 text-[11px] mb-0.5 flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-indigo-400" />
                        Justificativa:
                      </p>
                      <p className="text-slate-300 text-[11px] leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end pt-4 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setIsOpen(false)}
              >
                Fechar
              </Button>
            </div>
      </Modal>
    </>
  )
}
