-- ==============================================================================
-- ESTUDAAÍ — ETAPA 1: FUNDAÇÃO DO SISTEMA
-- DATABASE SCHEMA, ENUMS, TRIGGERS & ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- 0. EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS / TIPOS CUSTOMIZADOS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('teacher', 'student');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE material_processing_status AS ENUM ('pending', 'processing', 'ready', 'error');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE quiz_question_type AS ENUM ('multiple_choice', 'true_false', 'mixed', 'essay');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE quiz_status AS ENUM ('draft', 'published', 'finished');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attempt_status AS ENUM ('not_started', 'in_progress', 'completed', 'invalidated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABELAS

-- 2.1. PROFILES (Vinculado a auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.2. CLASSROOMS (Salas de aula criadas pelo professor)
CREATE TABLE IF NOT EXISTS public.classrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    join_code VARCHAR(10) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_classrooms_teacher_id ON public.classrooms(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classrooms_join_code ON public.classrooms(join_code);

-- 2.3. CLASSROOM_STUDENTS (Matrícula dos alunos nas salas)
CREATE TABLE IF NOT EXISTS public.classroom_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (classroom_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_classroom_students_classroom ON public.classroom_students(classroom_id);
CREATE INDEX IF NOT EXISTS idx_classroom_students_student ON public.classroom_students(student_id);

-- 2.4. MATERIALS (Estrutura de materiais didáticos para RAG futuro)
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    file_name TEXT,
    file_type TEXT,
    file_path TEXT,
    processing_status material_processing_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_materials_teacher_id ON public.materials(teacher_id);

-- 2.5. QUIZZES (Avaliações criadas pelo professor)
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
    material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    question_type quiz_question_type NOT NULL DEFAULT 'multiple_choice',
    question_count INTEGER NOT NULL DEFAULT 0,
    status quiz_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_quizzes_classroom_id ON public.quizzes(classroom_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_teacher_id ON public.quizzes(teacher_id);

-- 2.6. QUESTIONS (Questões da avaliação)
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type quiz_question_type NOT NULL DEFAULT 'multiple_choice',
    order_index INTEGER NOT NULL DEFAULT 0,
    explanation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON public.questions(quiz_id);

-- 2.7. QUESTION_OPTIONS (Alternativas das questões)
CREATE TABLE IF NOT EXISTS public.question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    order_index INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_question_options_question_id ON public.question_options(question_id);

-- 2.8. ATTEMPTS (Tentativas de resposta dos alunos)
CREATE TABLE IF NOT EXISTS public.attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status attempt_status NOT NULL DEFAULT 'not_started',
    score NUMERIC(5, 2) DEFAULT NULL,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    invalidated_at TIMESTAMPTZ,
    invalidation_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_attempts_quiz_id ON public.attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student_id ON public.attempts(student_id);

-- 2.9. ANSWERS (Respostas das questões em cada tentativa)
CREATE TABLE IF NOT EXISTS public.answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    selected_option_id UUID REFERENCES public.question_options(id) ON DELETE SET NULL,
    answer_text TEXT,
    is_correct BOOLEAN,
    answered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_answers_attempt_id ON public.answers(attempt_id);

-- ==============================================================================
-- 3. FUNÇÕES E TRIGGERS AUTOMÁTICOS
-- ==============================================================================

-- 3.1. Função para atualizar campo updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers de updated_at
DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_classrooms_updated_at ON public.classrooms;
CREATE TRIGGER tr_classrooms_updated_at
    BEFORE UPDATE ON public.classrooms
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_materials_updated_at ON public.materials;
CREATE TRIGGER tr_materials_updated_at
    BEFORE UPDATE ON public.materials
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_quizzes_updated_at ON public.quizzes;
CREATE TRIGGER tr_quizzes_updated_at
    BEFORE UPDATE ON public.quizzes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3.2. Função Trigger: Criação automática de profile ao registrar em auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_role public.user_role := 'student'::public.user_role;
    v_name TEXT;
    v_email TEXT;
BEGIN
    -- Determinar role
    IF (NEW.raw_user_meta_data->>'role') = 'teacher' THEN
        v_role := 'teacher'::public.user_role;
    ELSE
        v_role := 'student'::public.user_role;
    END IF;

    -- Determinar email
    v_email := COALESCE(NEW.email, '');

    -- Determinar nome
    v_name := COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name',
        CASE WHEN v_email <> '' THEN split_part(v_email, '@', 1) ELSE 'Usuário' END
    );

    -- Inserir perfil de forma resiliente
    BEGIN
        INSERT INTO public.profiles (id, name, email, role)
        VALUES (NEW.id, v_name, v_email, v_role)
        ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name,
            email = EXCLUDED.email,
            role = EXCLUDED.role,
            updated_at = timezone('utc'::text, now());
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
    END;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3.3. Função RPC segura: Ingressar em sala através de join_code
CREATE OR REPLACE FUNCTION public.join_classroom(p_join_code TEXT)
RETURNS JSONB AS $$
DECLARE
    v_classroom RECORD;
    v_student_id UUID;
    v_existing RECORD;
BEGIN
    v_student_id := auth.uid();
    
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Não autorizado';
    END IF;

    -- Buscar sala ativa pelo código
    SELECT id, name, teacher_id, is_active 
    INTO v_classroom
    FROM public.classrooms
    WHERE UPPER(join_code) = UPPER(TRIM(p_join_code));

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Código de sala inválido ou inexistente.');
    END IF;

    IF NOT v_classroom.is_active THEN
        RETURN jsonb_build_object('success', false, 'message', 'Esta sala de aula está desativada no momento.');
    END IF;

    -- Verificar se o professor não está tentando entrar na própria sala como aluno
    IF v_classroom.teacher_id = v_student_id THEN
        RETURN jsonb_build_object('success', false, 'message', 'Você é o professor criador desta sala.');
    END IF;

    -- Verificar se já está matriculado
    SELECT id INTO v_existing
    FROM public.classroom_students
    WHERE classroom_id = v_classroom.id AND student_id = v_student_id;

    IF FOUND THEN
        RETURN jsonb_build_object('success', true, 'message', 'Você já está matriculado nesta sala.', 'classroom_id', v_classroom.id);
    END IF;

    -- Inserir matrícula
    INSERT INTO public.classroom_students (classroom_id, student_id)
    VALUES (v_classroom.id, v_student_id);

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Matrícula realizada com sucesso na sala ' || v_classroom.name,
        'classroom_id', v_classroom.id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.4. Funções Helper RLS com SECURITY DEFINER (Eliminam recursão circular)
CREATE OR REPLACE FUNCTION public.is_classroom_student(p_classroom_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.classroom_students
        WHERE classroom_id = p_classroom_id AND student_id = p_user_id
    );
$$;

CREATE OR REPLACE FUNCTION public.is_classroom_teacher(p_classroom_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.classrooms
        WHERE id = p_classroom_id AND teacher_id = p_user_id
    );
$$;

CREATE OR REPLACE FUNCTION public.is_quiz_teacher(p_quiz_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.quizzes
        WHERE id = p_quiz_id AND teacher_id = p_user_id
    );
$$;

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- 4.1. POLICIES: PROFILES
CREATE POLICY "profiles_select_authenticated"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 4.2. POLICIES: CLASSROOMS
CREATE POLICY "classrooms_select"
    ON public.classrooms FOR SELECT
    USING (
        teacher_id = auth.uid()
        OR
        public.is_classroom_student(id, auth.uid())
    );

CREATE POLICY "classrooms_insert"
    ON public.classrooms FOR INSERT
    WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "classrooms_update"
    ON public.classrooms FOR UPDATE
    USING (teacher_id = auth.uid())
    WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "classrooms_delete"
    ON public.classrooms FOR DELETE
    USING (teacher_id = auth.uid());

-- 4.3. POLICIES: CLASSROOM_STUDENTS
CREATE POLICY "classroom_students_select"
    ON public.classroom_students FOR SELECT
    USING (
        student_id = auth.uid()
        OR
        public.is_classroom_teacher(classroom_id, auth.uid())
    );

CREATE POLICY "classroom_students_insert"
    ON public.classroom_students FOR INSERT
    WITH CHECK (
        student_id = auth.uid()
        OR
        public.is_classroom_teacher(classroom_id, auth.uid())
    );

CREATE POLICY "classroom_students_delete"
    ON public.classroom_students FOR DELETE
    USING (
        student_id = auth.uid()
        OR
        public.is_classroom_teacher(classroom_id, auth.uid())
    );

-- 4.4. POLICIES: MATERIALS
-- Professor gerencia seus próprios materiais
CREATE POLICY "materials_teacher_all"
    ON public.materials FOR ALL
    USING (teacher_id = auth.uid())
    WITH CHECK (teacher_id = auth.uid());

-- 4.5. POLICIES: QUIZZES
-- Professor gerencia seus próprios quizzes
CREATE POLICY "quizzes_teacher_all"
    ON public.quizzes FOR ALL
    USING (teacher_id = auth.uid())
    WITH CHECK (teacher_id = auth.uid());

-- Aluno pode visualizar quizzes publicados nas salas em que está matriculado
CREATE POLICY "quizzes_student_select"
    ON public.quizzes FOR SELECT
    USING (
        status = 'published'
        AND EXISTS (
            SELECT 1 FROM public.classroom_students cs
            WHERE cs.classroom_id = quizzes.classroom_id AND cs.student_id = auth.uid()
        )
    );

-- 4.6. POLICIES: QUESTIONS
-- Professor gerencia questões de seus quizzes
CREATE POLICY "questions_teacher_all"
    ON public.questions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.quizzes q
            WHERE q.id = questions.quiz_id AND q.teacher_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.quizzes q
            WHERE q.id = questions.quiz_id AND q.teacher_id = auth.uid()
        )
    );

-- Aluno pode ler questões de quizzes publicados nas salas em que está matriculado
CREATE POLICY "questions_student_select"
    ON public.questions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.quizzes q
            JOIN public.classroom_students cs ON cs.classroom_id = q.classroom_id
            WHERE q.id = questions.quiz_id
              AND q.status = 'published'
              AND cs.student_id = auth.uid()
        )
    );

-- 4.7. POLICIES: QUESTION_OPTIONS
-- Professor gerencia opções de seus quizzes
CREATE POLICY "question_options_teacher_all"
    ON public.question_options FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.questions q
            JOIN public.quizzes qz ON qz.id = q.quiz_id
            WHERE q.id = question_options.question_id AND qz.teacher_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.questions q
            JOIN public.quizzes qz ON qz.id = q.quiz_id
            WHERE q.id = question_options.question_id AND qz.teacher_id = auth.uid()
        )
    );

-- Aluno pode ler opções de quizzes publicados na sua sala
CREATE POLICY "question_options_student_select"
    ON public.question_options FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.questions q
            JOIN public.quizzes qz ON qz.id = q.quiz_id
            JOIN public.classroom_students cs ON cs.classroom_id = qz.classroom_id
            WHERE q.id = question_options.question_id
              AND qz.status = 'published'
              AND cs.student_id = auth.uid()
        )
    );

-- 4.8. POLICIES: ATTEMPTS
-- Aluno visualiza e gerencia suas próprias tentativas
CREATE POLICY "attempts_student_all"
    ON public.attempts FOR ALL
    USING (student_id = auth.uid())
    WITH CHECK (student_id = auth.uid());

-- Professor visualiza todas as tentativas de seus quizzes
CREATE POLICY "attempts_teacher_select"
    ON public.attempts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.quizzes q
            WHERE q.id = attempts.quiz_id AND q.teacher_id = auth.uid()
        )
    );

-- 4.9. POLICIES: ANSWERS
-- Aluno gerencia respostas de suas próprias tentativas
CREATE POLICY "answers_student_all"
    ON public.answers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.attempts att
            WHERE att.id = answers.attempt_id AND att.student_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.attempts att
            WHERE att.id = answers.attempt_id AND att.student_id = auth.uid()
        )
    );

-- Professor visualiza respostas dos seus alunos
CREATE POLICY "answers_teacher_select"
    ON public.answers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.attempts att
            JOIN public.quizzes q ON q.id = att.quiz_id
            WHERE att.id = answers.attempt_id AND q.teacher_id = auth.uid()
        )
    );
