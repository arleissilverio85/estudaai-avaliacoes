import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function TeacherQuizzesPage() {
  redirect('/teacher/dashboard')
}
