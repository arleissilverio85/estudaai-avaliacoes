'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { submitQuizAttempt, QuizSubmissionResult } from '@/app/(dashboard)/student/actions'
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Trophy,
  RotateCcw,
  BookOpen,
} from 'lucide-react'

interface Option {
  id: string
  option_text: string
  order_index: number
}

interface Question {
  id: string
  question_text: string
  question_type: string
  order_index: number
  options: Option[]
}

interface QuizTakingClientProps {
  quizId: string
  quizTitle: string
  classroomName?: string
  questions: Question[]
}

export function QuizTakingClient({
  quizId,
  quizTitle,
  classroomName,
  questions,
}: QuizTakingClientProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<QuizSubmissionResult | null>(null)

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (result) return // Bloqueia alteração se já entregou
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }))
  }

  const answeredCount = Object.keys(selectedAnswers).length
  const totalCount = questions.length
  const progressPercent = Math.round((answeredCount / totalCount) * 100)

  const handleSubmit = async () => {
    if (answeredCount < totalCount) {
      const confirmSubmit = confirm(
        `Você respondeu ${answeredCount} de ${totalCount} questões. Deseja entregar a prova mesmo assim?`
      )
      if (!confirmSubmit) return
    }

    try {
      setIsSubmitting(true)
      const res = await submitQuizAttempt(quizId, selectedAnswers)
      if (res.success) {
        setResult(res)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        alert(res.error || 'Erro ao enviar respostas.')
      }
    } catch {
      alert('Ocorreu uma falha na conexão ao enviar sua avaliação.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // TELA DE RESULTADO / GABARITO APÓS ENTREGA
  if (result && result.results) {
    const isApproved = (result.score || 0) >= 6.0

    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* CARD DE NOTA E DESEMPENHO */}
        <div
          className={`rounded-3xl border p-6 text-center shadow-2xl backdrop-blur-md sm:p-8 ${
            isApproved
              ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-100'
              : 'border-amber-500/40 bg-amber-950/40 text-amber-100'
          }`}
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900/80 shadow-lg border border-slate-700">
            <Trophy
              className={`h-8 w-8 ${
                isApproved ? 'text-emerald-400' : 'text-amber-400'
              }`}
            />
          </div>

          <h2 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Avaliação Concluída!
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            {quizTitle} • Turma: {classroomName || 'Geral'}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <div className="rounded-2xl bg-slate-900/90 px-6 py-4 border border-emerald-800/60 shadow-md">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Acertos
              </span>
              <p className="font-mono text-3xl font-black text-emerald-400 mt-1">
                {result.correctCount} <span className="text-sm text-slate-400">/ {result.totalQuestions}</span>
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900/90 px-6 py-4 border border-rose-800/60 shadow-md">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center justify-center gap-1">
                <XCircle className="h-3.5 w-3.5" />
                Erros
              </span>
              <p className="font-mono text-3xl font-black text-rose-400 mt-1">
                {(result.totalQuestions || 0) - (result.correctCount || 0)} <span className="text-sm text-slate-400">/ {result.totalQuestions}</span>
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-center gap-3">
            <Link href="/student/dashboard">
              <Button variant="primary" size="md">
                Voltar para Minhas Salas & Histórico
              </Button>
            </Link>
          </div>
        </div>

        {/* GABARITO COMENTADO QUESTÃO POR QUESTÃO */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-400" />
            Gabarito Comentado e Correção
          </h3>

          <div className="space-y-6">
            {result.results.map((q, idx) => (
              <div
                key={q.questionId}
                className={`rounded-2xl border p-6 shadow-md backdrop-blur-md space-y-4 ${
                  q.isCorrect
                    ? 'border-emerald-500/40 bg-slate-900/80'
                    : 'border-rose-500/40 bg-slate-900/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-800 text-xs font-black text-slate-200 border border-slate-700 shrink-0">
                      {idx + 1}
                    </span>
                    <p className="text-base font-bold text-white pt-0.5">{q.questionText}</p>
                  </div>

                  {q.isCorrect ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800/60 shrink-0">
                      <CheckCircle2 className="h-4 w-4" />
                      Acertou
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-950/80 px-2.5 py-1 rounded-lg border border-rose-800/60 shrink-0">
                      <XCircle className="h-4 w-4" />
                      Errou
                    </span>
                  )}
                </div>

                <div className="space-y-2 pl-10">
                  {q.options.map((opt, optIdx) => {
                    const letter = String.fromCharCode(65 + optIdx)
                    const isSelected = opt.id === q.selectedOptionId
                    const isCorrect = opt.isCorrect

                    let style = 'border-slate-800 bg-slate-950/60 text-slate-300'
                    if (isCorrect) {
                      style = 'border-emerald-500/80 bg-emerald-950/40 text-emerald-200 font-semibold'
                    } else if (isSelected && !isCorrect) {
                      style = 'border-rose-500/80 bg-rose-950/40 text-rose-200 font-semibold line-through'
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`flex items-center justify-between rounded-xl border p-3 text-sm ${style}`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold ${
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
                          <span className="text-[11px] font-bold text-emerald-400">
                            (Correta)
                          </span>
                        )}
                        {isSelected && !isCorrect && (
                          <span className="text-[11px] font-bold text-rose-400">
                            (Sua Resposta)
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>

                {q.explanation && (
                  <div className="ml-10 rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-3.5 text-xs text-indigo-200">
                    <p className="font-bold text-indigo-300 mb-1 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                      Explicação Pedagógica:
                    </p>
                    <p className="text-slate-300 leading-relaxed">{q.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // TELA DE REALIZAÇÃO DA AVALIAÇÃO
  return (
    <div className="space-y-6">
      {/* BARRA SUPERIOR DE PROGRESSO */}
      <div className="sticky top-20 z-40 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Progresso
            </span>
            <p className="text-sm font-black text-white">
              {answeredCount} de {totalCount} respondidas ({progressPercent}%)
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            variant="emerald"
            size="md"
            className="font-bold shadow-lg shadow-emerald-600/30"
          >
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            {isSubmitting ? 'Entregando Prova...' : 'Entregar Avaliação'}
          </Button>
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* LISTA DE QUESTÕES */}
      <div className="space-y-6">
        {questions.map((q, qIndex) => {
          const selectedOptionId = selectedAnswers[q.id]
          const isAnswered = Boolean(selectedOptionId)

          return (
            <div
              key={q.id}
              className={`rounded-3xl border bg-slate-900/80 p-6 shadow-xl shadow-black/40 backdrop-blur-md transition-all sm:p-8 ${
                isAnswered
                  ? 'border-indigo-500/50'
                  : 'border-slate-800'
              }`}
            >
              {/* ENUNCIADO */}
              <div className="flex items-start gap-3.5">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-xl text-sm font-black shrink-0 ${
                    isAnswered
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {qIndex + 1}
                </span>
                <p className="text-base font-semibold text-white leading-relaxed pt-0.5">
                  {q.question_text}
                </p>
              </div>

              {/* OPÇÕES CLICÁVEIS */}
              <div className="grid grid-cols-1 gap-3 pt-4 sm:pl-11">
                {q.options.map((opt, optIndex) => {
                  const letter = String.fromCharCode(65 + optIndex)
                  const isSelected = opt.id === selectedOptionId

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(q.id, opt.id)}
                      className={`flex w-full items-center justify-between rounded-2xl p-4 text-left transition-all ${
                        isSelected
                          ? 'border-2 border-indigo-500 bg-indigo-950/60 text-white shadow-md shadow-indigo-500/20'
                          : 'border border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-xl text-xs font-black transition-all ${
                            isSelected
                              ? 'bg-indigo-500 text-white shadow-sm'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="text-sm font-medium">{opt.option_text}</span>
                      </div>

                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all ${
                          isSelected
                            ? 'border-indigo-400 bg-indigo-600 text-white'
                            : 'border-slate-700 bg-slate-900'
                        }`}
                      >
                        {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* BOTÃO FINAL DE ENTREGA */}
      <div className="flex justify-end pt-4 pb-12">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          variant="emerald"
          size="lg"
          className="font-bold shadow-xl shadow-emerald-600/30"
        >
          <CheckCircle2 className="h-5 w-5 mr-2" />
          {isSubmitting ? 'Processando Respostas...' : 'Finalizar e Entregar Avaliação'}
        </Button>
      </div>
    </div>
  )
}
