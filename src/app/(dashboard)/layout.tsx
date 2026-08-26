import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { UserRole, Profile } from '@/types/database.types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    redirect('/login')
  }

  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    profile = data as Profile | null
  }

  const currentUser = {
    name: profile?.name || user?.user_metadata?.name || 'Usuário',
    email: profile?.email || user?.email || 'usuario@estudaai.com',
    role: (profile?.role || user?.user_metadata?.role || 'student') as UserRole,
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col relative overflow-hidden">
      {/* BACKGROUND SUTTLE GLOW */}
      <div className="pointer-events-none absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-indigo-600/10 blur-[130px]" />
      <div className="pointer-events-none absolute bottom-10 left-10 h-80 w-80 rounded-full bg-violet-600/10 blur-[120px]" />

      <Navbar user={currentUser} />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
        {children}
      </main>
    </div>
  )
}
