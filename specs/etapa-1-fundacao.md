# ESTUDAAÍ — ETAPA 1: FUNDAÇÃO DO SISTEMA

Você é o desenvolvedor responsável por construir o sistema EstudaAí, uma plataforma educacional de criação e aplicação de avaliações em sala de aula.

## OBJETIVO DESTA ETAPA

NÃO tente construir o sistema completo.

Nesta primeira etapa, construa somente a fundação técnica e estrutural do projeto.

Não implementar ainda:

- geração de questões por IA;
- processamento de PDF/DOC/PPT;
- RAG;
- embeddings;
- ranking;
- modo anti-cola;
- APK;
- notificações;
- pagamentos;
- gamificação avançada;
- correção por IA.

A prioridade é criar uma arquitetura limpa, escalável e preparada para receber esses módulos posteriormente.

---

## 1. STACK

Utilize:

- Next.js com App Router
- TypeScript
- Tailwind CSS
- Supabase
- Supabase Auth
- Supabase PostgreSQL
- Supabase Realtime quando necessário
- arquitetura responsiva mobile-first

O projeto deverá funcionar inicialmente como aplicação web/PWA.

Posteriormente poderá existir um APK Android consumindo a mesma API/backend.

NÃO criar código específico de Android nesta etapa.

---

## 2. CONCEITO DO SISTEMA

Existem dois tipos principais de usuários:

### PROFESSOR

Possui:

- conta;
- painel administrativo;
- salas;
- materiais;
- avaliações;
- resultados.

### ALUNO

Possui:

- conta ou identificação de aluno;
- acesso às salas;
- avaliações;
- histórico de tentativas.

A arquitetura deve permitir posteriormente que uma mesma conta possa possuir diferentes permissões.

---

## 3. AUTENTICAÇÃO

Implementar Supabase Auth.

### Login

Campos:

- e-mail
- senha

### Cadastro

Campos:

- nome
- e-mail
- senha
- tipo de usuário

Tipos:

- teacher
- student

Criar também logout.

Proteger as rotas privadas.

Um professor não pode acessar o painel de outro professor.

Um aluno não pode acessar dados administrativos.

---

## 4. ESTRUTURA DE BANCO

Criar as tabelas necessárias para a fundação.

### profiles

Campos sugeridos:

- id
- user_id
- name
- email
- role
- created_at
- updated_at

Onde role pode ser:

- teacher
- student

---

### classrooms

Representa uma sala criada pelo professor.

Campos:

- id
- teacher_id
- name
- description
- join_code
- is_active
- created_at
- updated_at

Exemplo:

Direito Constitucional
Código: DIR4821

O "join_code" deverá ser único.

---

### classroom_students

Relacionamento entre alunos e salas.

Campos:

- id
- classroom_id
- student_id
- joined_at

---

### materials

Representará futuramente os materiais enviados pelo professor.

Nesta etapa NÃO implementar upload.

Criar apenas a estrutura.

Campos:

- id
- teacher_id
- title
- description
- file_name
- file_type
- file_path
- processing_status
- created_at
- updated_at

Status preparados para futuro:

- pending
- processing
- ready
- error

---

### quizzes

Representará futuras avaliações.

Campos:

- id
- teacher_id
- classroom_id
- material_id
- title
- description
- question_type
- question_count
- status
- created_at
- updated_at

Tipos preparados:

- multiple_choice
- true_false
- mixed
- essay

Status:

- draft
- published
- finished

---

### questions

Preparar estrutura para as futuras questões.

Campos:

- id
- quiz_id
- question_text
- question_type
- order_index
- explanation
- created_at

---

### question_options

Preparar alternativas.

Campos:

- id
- question_id
- option_text
- is_correct
- order_index

---

### attempts

Preparar futuras tentativas dos alunos.

Campos:

- id
- quiz_id
- student_id
- status
- score
- started_at
- finished_at
- invalidated_at
- invalidation_reason

Status:

- not_started
- in_progress
- completed
- invalidated

---

### answers

Preparar futuras respostas.

Campos:

- id
- attempt_id
- question_id
- selected_option_id
- answer_text
- is_correct
- answered_at

---

## 5. ROW LEVEL SECURITY

Isso é OBRIGATÓRIO.

Criar políticas RLS no Supabase.

### Professor:

- pode visualizar suas próprias salas;
- criar suas próprias salas;
- editar suas próprias salas;
- visualizar seus próprios materiais;
- visualizar suas próprias avaliações.

### Aluno:

- pode visualizar as salas das quais participa;
- pode visualizar avaliações liberadas para sua sala;
- posteriormente poderá criar suas próprias tentativas.

Nenhum usuário deve conseguir acessar dados de outro usuário simplesmente alterando um ID na URL ou fazendo uma requisição direta.
