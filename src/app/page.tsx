import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  GraduationCap,
  School,
  UserCheck,
  ShieldCheck,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle,
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      {/* HEADER / NAVBAR DA LANDING */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              Estuda<span className="text-indigo-600">Aí</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="font-semibold text-slate-700">
                Entrar
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm" className="font-semibold shadow-sm">
                Criar Conta
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            {/* BADGE DESTAQUE */}
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-3.5 py-1 text-xs font-bold text-indigo-700 shadow-sm mb-6">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>Etapa 1: Fundação Arquitetural Concluída</span>
            </div>

            <h1 className="mx-auto max-w-4xl text-4xl font-black tracking-tight text-slate-900 sm:text-6xl sm:leading-[1.15]">
              Criação e Aplicação de Avaliações em Sala de Aula com{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Alta Performance
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base text-slate-600 sm:text-lg">
              A plataforma educacional moderna para professores gerenciarem turmas e provas dinâmicas, e alunos acessarem avaliações com total praticidade.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" variant="primary" className="w-full sm:w-auto font-bold text-base px-8 shadow-lg shadow-indigo-200">
                  Começar Gratuitamente
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto font-bold text-base px-8">
                  Acessar Minha Conta
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* PROPOSTA DE VALOR POR PAPEL */}
        <section className="bg-white border-y border-slate-200/80 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Desenvolvido para Professores e Alunos
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Controle de acesso granular baseado em Row Level Security (RLS) no Supabase.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {/* CARD PROFESSOR */}
              <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-slate-50/50 p-8 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md">
                <div className="space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
                    <School className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Para Professores</h3>
                  <ul className="space-y-2.5 text-sm text-slate-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                      Criação de salas com código de acesso único (ex: DIR4821)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                      Gestão de turmas e visualização dos alunos matriculados
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                      Estruturação de materiais pedagógicos e avaliações
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                      Painel exclusivo e protegido contra acesso de outros docentes
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-200">
                  <Link href="/register?role=teacher">
                    <Button variant="outline" className="w-full justify-center font-bold">
                      Cadastrar como Professor
                    </Button>
                  </Link>
                </div>
              </div>

              {/* CARD ALUNO */}
              <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-slate-50/50 p-8 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md">
                <div className="space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-200">
                    <UserCheck className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Para Alunos</h3>
                  <ul className="space-y-2.5 text-sm text-slate-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                      Entrada rápida na sala através do código da disciplina
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                      Acesso centralizado a todas as turmas em que está matriculado
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                      Visualização de provas e quizzes liberados pelo professor
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                      Ambiente mobile-first limpo e focado no aprendizado
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-200">
                  <Link href="/register?role=student">
                    <Button variant="outline" className="w-full justify-center font-bold">
                      Cadastrar como Aluno
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-xs text-slate-500">
            EstudaAí © {new Date().getFullYear()} — Plataforma de Avaliações Educacionais.
          </p>
        </div>
      </footer>
    </div>
  )
}
