# EstudaAí — Plataforma de Avaliações Educacionais

Plataforma educacional para criação e aplicação de avaliações em sala de aula.

## 🚀 Etapa 1: Fundação do Sistema

A etapa 1 estabelece a arquitetura limpa, tipada e com segurança estrita a nível de banco de dados (Row Level Security):

- **Next.js (App Router)** com TypeScript e Tailwind CSS
- **Supabase Auth** com papéis de usuário (`teacher` e `student`)
- **Supabase PostgreSQL** com 9 tabelas estruturais e triggers de perfil/updated_at
- **Row Level Security (RLS)** rigoroso para isolamento de dados
- **Painéis Mobile-first** para Professor e Aluno

---

## 🛠️ Configuração e Execução

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar o Banco de Dados no Supabase
1. Acesse o seu painel do Supabase ([supabase.com](https://supabase.com))
2. Abra o **SQL Editor** do projeto.
3. Copie todo o conteúdo do arquivo [`supabase/schema.sql`](./supabase/schema.sql) e execute.
4. O script criará:
   - Os tipos ENUM (`user_role`, `material_processing_status`, `quiz_question_type`, `quiz_status`, `attempt_status`)
   - As 9 tabelas estruturais (`profiles`, `classrooms`, `classroom_students`, `materials`, `quizzes`, `questions`, `question_options`, `attempts`, `answers`)
   - Triggers de atualização de perfil e `updated_at`
   - Função RPC `join_classroom(p_join_code)`
   - Todas as políticas RLS para professores e alunos

### 3. Variáveis de Ambiente
Crie ou edite o arquivo `.env.local` na raiz com as chaves do seu projeto Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

### 4. Executar em Desenvolvimento
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 📁 Estrutura de Pastas

```
├── supabase/
│   └── schema.sql                 # DDL completo + Triggers + RLS Policies
├── src/
│   ├── app/
│   │   ├── (auth)/                # Login, Cadastro e Server Actions de Auth
│   │   ├── (dashboard)/
│   │   │   ├── teacher/           # Painel do Professor (Salas, Materiais, Avaliações)
│   │   │   └── student/           # Painel do Aluno (Minhas Salas, Provas)
│   │   └── page.tsx               # Landing Page
│   ├── components/
│   │   ├── ui/                    # Componentes base (Button, Input, Badge, Card)
│   │   ├── navbar.tsx             # Navbar com sessão e navegação por papel
│   │   ├── classroom-card.tsx     # Card de sala com cópia de código
│   │   ├── create-classroom-dialog.tsx
│   │   └── join-classroom-dialog.tsx
│   ├── lib/
│   │   ├── supabase/              # Clientes Supabase SSR (client, server, middleware)
│   │   └── utils.ts               # Gerador de Join Code e helpers
│   └── types/
│       └── database.types.ts      # Tipos TypeScript do Banco de Dados
├── middleware.ts                  # Proteção de rotas e sincronização de sessão
```
