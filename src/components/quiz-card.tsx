'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { formatQuizStatus } from '@/lib/utils'
import { School, Trash2, Calendar, HelpCircle, Users, ArrowRight, Sparkles } from 'lucide-react'
import { deleteQuiz } from '@/app/(dashboard)/teacher/actions'
import { EditQuizDialog } from '@/components/edit-quiz-dialog'
import { Quiz } from '@/types/database.types'

interface QuizCardProps {
  quiz: Quiz & {
    classrooms?: { name: string } | null
    attempts?: { count: number }[]
  }
  classrooms: { id: string; name: string }[]
}

export function QuizCard({ quiz, classrooms }: QuizCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const statusInfo = formatQuizStatus(quiz.status)
  const attemptCount = quiz.attempts?.[0]?.count || 0

  const handleDelete = async () => {
    if (confirm(`Deseja realmente excluir a avaliação "${quiz.title}"?`)) {
      setIsDeleting(true)
      await deleteQuiz(quiz.id)
      setIsDeleting(false)
    }
  }

  return (
    <Card className="group flex flex-col justify-between border-slate-800 bg-slate-900/80 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10">
      <div>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-bold text-white line-clamp-1 group-hover:text-indigo-300 transition-colors">
              {quiz.title}
            </CardTitle>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border shrink-0 ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          <CardDescription className="text-xs flex items-center gap-1 mt-1 text-indigo-400 font-medium">
            <School className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{quiz.classrooms?.name || 'Sala Geral'}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 text-xs text-slate-400 pt-1">
          {quiz.description && (
            <p className="line-clamp-2 text-slate-300">{quiz.description}</p>
          )}

          {/* ESTATÍSTICAS / HISTÓRICO GERADO */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-950/80 p-2.5 border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-300">
              <HelpCircle className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span>{quiz.question_count} questões</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Users className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>{attemptCount} tentativas</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Criada em {new Date(quiz.created_at).toLocaleDateString('pt-BR')}
          </p>
        </CardContent>
      </div>

      <CardFooter className="flex items-center justify-between pt-3 border-t border-slate-800/80 mt-2">
        <Link
          href={`/teacher/quizzes/${quiz.id}`}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-100 hover:bg-indigo-600 hover:text-white transition-all border border-slate-700 shadow-sm"
        >
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          Ver Questões
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        <div className="flex items-center gap-1">
          <EditQuizDialog quiz={quiz} classrooms={classrooms} />
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-lg p-2 text-slate-500 hover:bg-rose-950/50 hover:text-rose-400 transition-colors border border-transparent hover:border-rose-900/50"
            title="Excluir Avaliação"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </CardFooter>
    </Card>
  )
}
