export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'teacher' | 'student'
export type MaterialProcessingStatus = 'pending' | 'processing' | 'ready' | 'error'
export type QuizQuestionType = 'multiple_choice' | 'true_false' | 'mixed' | 'essay'
export type QuizStatus = 'draft' | 'published' | 'finished'
export type AttemptStatus = 'not_started' | 'in_progress' | 'completed' | 'invalidated'

export type Profile = {
  id: string
  name: string
  email: string
  role: UserRole
  created_at: string
  updated_at: string
}

export type Classroom = {
  id: string
  teacher_id: string
  name: string
  description: string | null
  join_code: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ClassroomStudent = {
  id: string
  classroom_id: string
  student_id: string
  joined_at: string
}

export type Material = {
  id: string
  teacher_id: string
  classroom_id?: string | null
  title: string
  description: string | null
  file_name: string | null
  file_type: string | null
  file_path: string | null
  file_size?: number | null
  content_text?: string | null
  processing_status: MaterialProcessingStatus
  created_at: string
  updated_at: string
}

export type Quiz = {
  id: string
  teacher_id: string
  classroom_id: string
  material_id: string | null
  title: string
  description: string | null
  question_type: QuizQuestionType
  question_count: number
  status: QuizStatus
  created_at: string
  updated_at: string
}

export type Question = {
  id: string
  quiz_id: string
  question_text: string
  question_type: QuizQuestionType
  order_index: number
  explanation: string | null
  created_at: string
}

export type QuestionOption = {
  id: string
  question_id: string
  option_text: string
  is_correct: boolean
  order_index: number
}

export type Attempt = {
  id: string
  quiz_id: string
  student_id: string
  status: AttemptStatus
  score: number | null
  started_at: string | null
  finished_at: string | null
  invalidated_at: string | null
  invalidation_reason: string | null
}

export type Answer = {
  id: string
  attempt_id: string
  question_id: string
  selected_option_id: string | null
  answer_text: string | null
  is_correct: boolean | null
  answered_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile> & { id: string; name: string; email: string }
        Update: Partial<Profile>
      }
      classrooms: {
        Row: Classroom
        Insert: Partial<Classroom> & { teacher_id: string; name: string; join_code: string }
        Update: Partial<Classroom>
      }
      classroom_students: {
        Row: ClassroomStudent
        Insert: Partial<ClassroomStudent> & { classroom_id: string; student_id: string }
        Update: Partial<ClassroomStudent>
      }
      materials: {
        Row: Material
        Insert: Partial<Material> & { teacher_id: string; title: string }
        Update: Partial<Material>
      }
      quizzes: {
        Row: Quiz
        Insert: Partial<Quiz> & { teacher_id: string; classroom_id: string; title: string }
        Update: Partial<Quiz>
      }
      questions: {
        Row: Question
        Insert: Partial<Question> & { quiz_id: string; question_text: string }
        Update: Partial<Question>
      }
      question_options: {
        Row: QuestionOption
        Insert: Partial<QuestionOption> & { question_id: string; option_text: string }
        Update: Partial<QuestionOption>
      }
      attempts: {
        Row: Attempt
        Insert: Partial<Attempt> & { quiz_id: string; student_id: string }
        Update: Partial<Attempt>
      }
      answers: {
        Row: Answer
        Insert: Partial<Answer> & { attempt_id: string; question_id: string }
        Update: Partial<Answer>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      join_classroom: {
        Args: {
          p_join_code: string
        }
        Returns: {
          success: boolean
          message: string
          classroom_id?: string
        }
      }
    }
    Enums: {
      user_role: UserRole
      material_processing_status: MaterialProcessingStatus
      quiz_question_type: QuizQuestionType
      quiz_status: QuizStatus
      attempt_status: AttemptStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
