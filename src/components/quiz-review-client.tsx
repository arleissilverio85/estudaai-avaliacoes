'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  HelpCircle,
  CheckCircle2,
  Sparkles,
  Printer,
  Eye,
  EyeOff,
} from 'lucide-react'

interface Option {
  id: string
  option_text: string
  is_correct: boolean
  order_index: number
}

interface Question {
  id: string
  question_text: string
  question_type: string
  order_index: number
  explanation: string | null
  options: Option[]
}

interface QuizReviewClientProps {
  questions: Question[]
  quizTitle: string
}

export function QuizReviewClient({ questions, quizTitle }: QuizReviewClientProps) {
  const [showAnswers, setShowAnswers] = useState(true)

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* BARRA DE FERRAMENTAS DO PROFESSOR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 print:hidden">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">
            Questões da Avaliação ({questions.length})
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAnswers(!showAnswers)}
            className="text-xs font-semibold"
          >
            {showAnswers ? (
              <>
                <EyeOff className="h-3.5 w-3.5 mr-1" />
                Ocultar Gabarito
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5 mr-1" />
                Mostrar Gabarito
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handlePrint}
            className="text-xs font-semibold"
          >
            <Printer className="h-3.5 w-3.5 mr-1" />
            Imprimir Prova
          </Button>
        </div>
      </div>

      {/* CABEÇALHO DE IMPRESSÃO (VISÍVEL APENAS NA IMPRESSÃO) */}
      <div className="hidden print:block mb-8 border-b-2 border-black pb-4 text-black">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold uppercase">{quizTitle}</h1>
            <p className="text-sm">EstudaAí — Plataforma de Avaliações</p>
          </div>
          <div className="text-right text-xs">
            <p>Data: ____/____/________</p>
            <p>Nota: ___________</p>
          </div>
        </div>
        <div className="mt-4 pt-2 border-t border-dashed border-gray-400 flex justify-between text-sm">
          <span>Nome do Aluno: ____________________________________________________</span>
          <span>Turma: ____________</span>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
          <HelpCircle className="mx-auto h-12 w-12 text-slate-600" />
          <h3 className="mt-3 text-base font-bold text-white">Nenhuma questão encontrada</h3>
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((q, qIndex) => (
            <div
              key={q.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-md shadow-black/30 backdrop-blur-md space-y-4 print:border-none print:bg-white print:p-0 print:shadow-none print:text-black print:mb-6"
            >
              {/* ENUNCIADO HUMANO E FORMATADO */}
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600/20 text-sm font-black text-indigo-300 border border-indigo-500/30 shrink-0 print:bg-gray-100 print:text-black print:border-gray-300">
                  {qIndex + 1}
                </span>
                <p className="text-base font-semibold text-white leading-relaxed print:text-black pt-0.5">
                  {q.question_text}
                </p>
              </div>

              {/* ALTERNATIVAS */}
              <div className="grid grid-cols-1 gap-2.5 pt-1 sm:pl-11 print:pl-6">
                {q.options.map((opt, optIndex) => {
                  const letter = String.fromCharCode(65 + optIndex)
                  const isCorrect = opt.is_correct && showAnswers

                  return (
                    <div
                      key={opt.id}
                      className={`flex items-center justify-between rounded-xl p-3 text-sm transition-all print:border-none print:p-1 print:text-black ${
                        isCorrect
                          ? 'border-2 border-emerald-500/80 bg-emerald-950/40 text-emerald-100 shadow-sm'
                          : 'border border-slate-800 bg-slate-950/60 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold print:border print:border-gray-400 ${
                            isCorrect
                              ? 'bg-emerald-500 text-slate-950 font-black'
                              : 'bg-slate-800 text-slate-400 print:bg-white print:text-black'
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="font-medium">{opt.option_text}</span>
                      </div>

                      {isCorrect && (
                        <span className="hidden sm:flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800/60 print:hidden">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Gabarito Correto
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* JUSTIFICATIVA PEDAGÓGICA DA IA (ESTRUTURADA E FORMATADA) */}
              {q.explanation && showAnswers && (
                <div className="sm:ml-11 mt-3 rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-3.5 text-xs text-indigo-200 print:hidden">
                  <p className="font-bold text-indigo-300 mb-1 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                    Justificativa Pedagógica (Fundamentação no Material):
                  </p>
                  <p className="text-slate-300 leading-relaxed">{q.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
