'use client'

import { useState } from 'react'
import { publishQuiz, unpublishQuiz } from '@/app/(dashboard)/teacher/actions'
import { Button } from '@/components/ui/button'
import { Send, EyeOff, CheckCircle2 } from 'lucide-react'
import { QuizStatus } from '@/types/database.types'

interface PublishQuizButtonProps {
  quizId: string
  currentStatus: QuizStatus
}

export function PublishQuizButton({ quizId, currentStatus }: PublishQuizButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isPublished = currentStatus === 'published'

  const handleToggle = async () => {
    setIsLoading(true)
    if (isPublished) {
      await unpublishQuiz(quizId)
    } else {
      await publishQuiz(quizId)
    }
    setIsLoading(false)
  }

  return (
    <Button
      onClick={handleToggle}
      disabled={isLoading}
      variant={isPublished ? 'secondary' : 'emerald'}
      size="sm"
      className="font-bold shadow-md"
    >
      {isPublished ? (
        <>
          <EyeOff className="h-4 w-4 mr-1.5" />
          Mudar para Rascunho
        </>
      ) : (
        <>
          <Send className="h-4 w-4 mr-1.5" />
          Publicar para a Turma
        </>
      )}
    </Button>
  )
}
