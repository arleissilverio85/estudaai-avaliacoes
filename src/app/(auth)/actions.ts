'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UserRole, Profile } from '@/types/database.types'

export type AuthState = {
  error?: string
  success?: boolean
  message?: string
}

export async function login(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirectTo') as string | null

  if (!email || !password) {
    return { error: 'Preencha o e-mail e a senha.' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'E-mail ou senha incorretos.' }
    }
    if (error.message.includes('Email not confirmed')) {
      return { error: 'Por favor, confirme seu e-mail através do link enviado antes de entrar.' }
    }
    return { error: error.message || 'Erro ao realizar login. Verifique suas credenciais.' }
  }

  if (data?.user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle()

    const profile = profileData as Profile | null
    const role = profile?.role || (data.user.user_metadata?.role as UserRole) || 'student'
    
    revalidatePath('/', 'layout')

    if (redirectTo && (redirectTo.startsWith('/teacher') || redirectTo.startsWith('/student'))) {
      redirect(redirectTo)
    } else {
      redirect(role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard')
    }
  }

  return { success: true }
}

export async function register(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string
  const role = (formData.get('role') as UserRole) || 'student'

  if (!name || !email || !password || !role) {
    return { error: 'Por favor, preencha todos os campos obrigatórios.' }
  }

  if (password.length < 6) {
    return { error: 'A senha deve conter no mínimo 6 caracteres.' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
      },
    },
  })

  if (error) {
    if (error.message.includes('User already registered')) {
      return { error: 'Este e-mail já está cadastrado. Faça login ou utilize outro e-mail.' }
    }
    return { error: error.message || 'Erro ao criar conta. Tente novamente.' }
  }

  if (data?.user) {
    // Se o Supabase já iniciou sessão ativa imediatamente (confirmação de email desligada)
    if (data.session) {
      revalidatePath('/', 'layout')
      redirect(role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard')
    } else {
      // Se o Supabase requer confirmação por e-mail
      return {
        success: true,
        message: 'Cadastro realizado com sucesso! Se a confirmação de e-mail estiver ativa, verifique sua caixa de entrada para ativar a conta antes de fazer login.',
      }
    }
  }

  return { success: true, message: 'Cadastro realizado com sucesso!' }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
