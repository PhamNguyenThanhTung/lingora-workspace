-- M1.3 additive security migration.
-- Approved scope: Auth/Profile lifecycle, grants, RLS, Storage PA2 and record_review.

-- ---------------------------------------------------------------------------
-- Auth/Profile lifecycle and trusted validation
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_auth_user_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id)
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION public.is_valid_iana_timezone(p_timezone text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_timezone_names AS tz
    WHERE tz.name = p_timezone
  );
$$;

REVOKE ALL ON FUNCTION public.is_valid_iana_timezone(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.validate_profile_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.daily_goal_min < 0 THEN
    RAISE EXCEPTION 'daily_goal_min must be non-negative' USING ERRCODE = '22023';
  END IF;

  IF NOT public.is_valid_iana_timezone(NEW.timezone) THEN
    RAISE EXCEPTION 'timezone must be a valid IANA timezone' USING ERRCODE = '22023';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_profile_write() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER profiles_validate_write
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.validate_profile_write();

CREATE OR REPLACE FUNCTION public.handle_auth_user_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_display_name text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_display_name := NULLIF(pg_catalog.btrim(COALESCE(NEW.raw_user_meta_data ->> 'display_name', '')), '');

    INSERT INTO public.profiles (
      id,
      email,
      display_name,
      role,
      ui_locale,
      native_lang_code,
      daily_goal_min,
      streak_count,
      timezone
    ) VALUES (
      NEW.id,
      NEW.email,
      v_display_name,
      'LEARNER'::public."Role",
      'vi',
      'vi',
      15,
      0,
      'Asia/Ho_Chi_Minh'
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.profiles
    SET email = NEW.email
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_auth_user_change() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER lingora_auth_user_change
AFTER INSERT OR UPDATE OF email ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_change();

-- ---------------------------------------------------------------------------
-- Trusted helpers and chat ordering
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles AS p
    WHERE p.id = auth.uid()
      AND p.role = 'ADMIN'::public."Role"
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.prepare_chat_session_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '28000';
  END IF;
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.prepare_chat_session_insert() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER chat_sessions_set_owner
BEFORE INSERT ON public.chat_sessions
FOR EACH ROW EXECUTE FUNCTION public.prepare_chat_session_insert();

CREATE OR REPLACE FUNCTION public.prepare_chat_message_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_owner uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '28000';
  END IF;

  SELECT cs.user_id INTO v_owner
  FROM public.chat_sessions AS cs
  WHERE cs.id = NEW.session_id
  FOR UPDATE;

  IF v_owner IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'chat session not found or not owned' USING ERRCODE = '42501';
  END IF;

  IF NEW.role <> 'USER'::public."ChatRole" THEN
    RAISE EXCEPTION 'authenticated clients may create USER messages only' USING ERRCODE = '42501';
  END IF;

  NEW.sequence_number := COALESCE((
    SELECT MAX(cm.sequence_number)
    FROM public.chat_messages AS cm
    WHERE cm.session_id = NEW.session_id
  ), 0) + 1;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.prepare_chat_message_insert() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER chat_messages_allocate_sequence
BEFORE INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.prepare_chat_message_insert();

-- ---------------------------------------------------------------------------
-- record_review: owner checked, row locked and atomic
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.record_review(
  p_srs_card_id uuid,
  p_is_correct boolean,
  p_recall_probability double precision,
  p_recommended_interval_days double precision
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_previous_interval double precision;
  v_timezone text;
  v_last_date date;
  v_today date;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '28000';
  END IF;
  IF p_srs_card_id IS NULL OR p_is_correct IS NULL THEN
    RAISE EXCEPTION 'required review input is null' USING ERRCODE = '22004';
  END IF;
  IF p_recall_probability IS NULL OR p_recall_probability < 0 OR p_recall_probability > 1 THEN
    RAISE EXCEPTION 'recall_probability must be between 0 and 1' USING ERRCODE = '22023';
  END IF;
  IF p_recommended_interval_days IS NULL OR p_recommended_interval_days < 0 THEN
    RAISE EXCEPTION 'recommended_interval_days must be non-negative' USING ERRCODE = '22023';
  END IF;

  SELECT s.interval_days
  INTO v_previous_interval
  FROM public.user_vocab_srs AS s
  WHERE s.id = p_srs_card_id
    AND s.user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SRS card not found or not owned' USING ERRCODE = '42501';
  END IF;

  SELECT p.timezone, p.last_qualifying_activity_date
  INTO v_timezone, v_last_date
  FROM public.profiles AS p
  WHERE p.id = v_user_id
  FOR UPDATE;

  IF NOT FOUND OR NOT public.is_valid_iana_timezone(v_timezone) THEN
    RAISE EXCEPTION 'profile timezone is missing or invalid' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.review_logs (id, srs_card_id, is_correct, interval_days, reviewed_at)
  VALUES (pg_catalog.gen_random_uuid(), p_srs_card_id, p_is_correct, v_previous_interval, pg_catalog.clock_timestamp());

  UPDATE public.user_vocab_srs
  SET recall_probability = p_recall_probability,
      interval_days = p_recommended_interval_days,
      next_review_at = pg_catalog.clock_timestamp() + (p_recommended_interval_days * INTERVAL '1 day'),
      last_reviewed_at = pg_catalog.clock_timestamp(),
      review_count = review_count + 1,
      lapse_count = lapse_count + CASE WHEN p_is_correct THEN 0 ELSE 1 END
  WHERE id = p_srs_card_id;

  v_today := (pg_catalog.clock_timestamp() AT TIME ZONE v_timezone)::date;

  UPDATE public.profiles
  SET streak_count = CASE
        WHEN v_last_date = v_today THEN streak_count
        WHEN v_last_date = v_today - 1 THEN streak_count + 1
        ELSE 1
      END,
      last_qualifying_activity_date = CASE
        WHEN v_last_date = v_today THEN last_qualifying_activity_date
        ELSE v_today
      END
  WHERE id = v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_review(uuid, boolean, double precision, double precision) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_review(uuid, boolean, double precision, double precision) TO authenticated;

-- ---------------------------------------------------------------------------
-- Grants: anonymous denied, authenticated access is operation/column specific
-- ---------------------------------------------------------------------------

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public._prisma_migrations FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE
  public.languages,
  public.courses,
  public.course_translations,
  public.lessons,
  public.lesson_translations,
  public.vocabularies,
  public.vocabulary_translations,
  public.lesson_vocabulary,
  public.exercises,
  public.chat_scenarios,
  public.chat_scenario_translations,
  public.profiles,
  public.user_progress,
  public.user_vocab_srs,
  public.review_logs,
  public.chat_sessions,
  public.chat_messages
TO authenticated;

GRANT INSERT, UPDATE, DELETE ON TABLE
  public.languages,
  public.courses,
  public.course_translations,
  public.lessons,
  public.lesson_translations,
  public.vocabularies,
  public.vocabulary_translations,
  public.lesson_vocabulary,
  public.exercises,
  public.chat_scenarios,
  public.chat_scenario_translations
TO authenticated;

GRANT UPDATE (display_name, avatar_url, ui_locale, native_lang_code, daily_goal_min, timezone)
ON public.profiles TO authenticated;

GRANT INSERT (id, scenario_id, started_at, ended_at, updated_at),
      UPDATE (ended_at, updated_at),
      DELETE
ON public.chat_sessions TO authenticated;

GRANT INSERT (id, session_id, role, content, created_at)
ON public.chat_messages TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS for all application tables
-- ---------------------------------------------------------------------------

ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabularies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vocab_srs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_scenario_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY languages_authenticated_read ON public.languages FOR SELECT TO authenticated USING (true);
CREATE POLICY languages_admin_insert ON public.languages FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY languages_admin_update ON public.languages FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY languages_admin_delete ON public.languages FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY courses_visible_read ON public.courses FOR SELECT TO authenticated USING (is_published OR public.is_admin());
CREATE POLICY courses_admin_insert ON public.courses FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY courses_admin_update ON public.courses FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY courses_admin_delete ON public.courses FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY course_translations_visible_read ON public.course_translations FOR SELECT TO authenticated USING (
  public.is_admin() OR EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_translations.course_id AND c.is_published)
);
CREATE POLICY course_translations_admin_insert ON public.course_translations FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY course_translations_admin_update ON public.course_translations FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY course_translations_admin_delete ON public.course_translations FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY lessons_visible_read ON public.lessons FOR SELECT TO authenticated USING (
  public.is_admin() OR (is_published AND EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.is_published))
);
CREATE POLICY lessons_admin_insert ON public.lessons FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY lessons_admin_update ON public.lessons FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY lessons_admin_delete ON public.lessons FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY lesson_translations_visible_read ON public.lesson_translations FOR SELECT TO authenticated USING (
  public.is_admin() OR EXISTS (
    SELECT 1 FROM public.lessons l JOIN public.courses c ON c.id = l.course_id
    WHERE l.id = lesson_translations.lesson_id AND l.is_published AND c.is_published
  )
);
CREATE POLICY lesson_translations_admin_insert ON public.lesson_translations FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY lesson_translations_admin_update ON public.lesson_translations FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY lesson_translations_admin_delete ON public.lesson_translations FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY lesson_vocabulary_visible_read ON public.lesson_vocabulary FOR SELECT TO authenticated USING (
  public.is_admin() OR EXISTS (
    SELECT 1 FROM public.lessons l JOIN public.courses c ON c.id = l.course_id
    WHERE l.id = lesson_vocabulary.lesson_id AND l.is_published AND c.is_published
  )
);
CREATE POLICY lesson_vocabulary_admin_insert ON public.lesson_vocabulary FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY lesson_vocabulary_admin_update ON public.lesson_vocabulary FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY lesson_vocabulary_admin_delete ON public.lesson_vocabulary FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY exercises_visible_read ON public.exercises FOR SELECT TO authenticated USING (
  public.is_admin() OR EXISTS (
    SELECT 1 FROM public.lessons l JOIN public.courses c ON c.id = l.course_id
    WHERE l.id = exercises.lesson_id AND l.is_published AND c.is_published
  )
);
CREATE POLICY exercises_admin_insert ON public.exercises FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY exercises_admin_update ON public.exercises FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY exercises_admin_delete ON public.exercises FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY vocabularies_visible_read ON public.vocabularies FOR SELECT TO authenticated USING (
  public.is_admin() OR EXISTS (
    SELECT 1
    FROM public.lesson_vocabulary lv
    JOIN public.lessons l ON l.id = lv.lesson_id
    JOIN public.courses c ON c.id = l.course_id
    WHERE lv.vocabulary_id = vocabularies.id AND l.is_published AND c.is_published
  )
);
CREATE POLICY vocabularies_admin_insert ON public.vocabularies FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY vocabularies_admin_update ON public.vocabularies FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY vocabularies_admin_delete ON public.vocabularies FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY vocabulary_translations_visible_read ON public.vocabulary_translations FOR SELECT TO authenticated USING (
  public.is_admin() OR EXISTS (
    SELECT 1
    FROM public.lesson_vocabulary lv
    JOIN public.lessons l ON l.id = lv.lesson_id
    JOIN public.courses c ON c.id = l.course_id
    WHERE lv.vocabulary_id = vocabulary_translations.vocabulary_id AND l.is_published AND c.is_published
  )
);
CREATE POLICY vocabulary_translations_admin_insert ON public.vocabulary_translations FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY vocabulary_translations_admin_update ON public.vocabulary_translations FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY vocabulary_translations_admin_delete ON public.vocabulary_translations FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY profiles_own_read ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY profiles_own_safe_update ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY user_progress_own_read ON public.user_progress FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY user_vocab_srs_own_read ON public.user_vocab_srs FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY review_logs_own_read ON public.review_logs FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_vocab_srs s WHERE s.id = review_logs.srs_card_id AND s.user_id = auth.uid())
);

CREATE POLICY chat_scenarios_visible_read ON public.chat_scenarios FOR SELECT TO authenticated USING (is_published OR public.is_admin());
CREATE POLICY chat_scenarios_admin_insert ON public.chat_scenarios FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY chat_scenarios_admin_update ON public.chat_scenarios FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY chat_scenarios_admin_delete ON public.chat_scenarios FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY chat_scenario_translations_visible_read ON public.chat_scenario_translations FOR SELECT TO authenticated USING (
  public.is_admin() OR EXISTS (SELECT 1 FROM public.chat_scenarios s WHERE s.id = chat_scenario_translations.scenario_id AND s.is_published)
);
CREATE POLICY chat_scenario_translations_admin_insert ON public.chat_scenario_translations FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY chat_scenario_translations_admin_update ON public.chat_scenario_translations FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY chat_scenario_translations_admin_delete ON public.chat_scenario_translations FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY chat_sessions_own_read ON public.chat_sessions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY chat_sessions_own_insert ON public.chat_sessions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY chat_sessions_own_update ON public.chat_sessions FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY chat_sessions_own_delete ON public.chat_sessions FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY chat_messages_own_read ON public.chat_messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.chat_sessions s WHERE s.id = chat_messages.session_id AND s.user_id = auth.uid())
);
CREATE POLICY chat_messages_own_insert ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (
  role = 'USER'::public."ChatRole" AND EXISTS (
    SELECT 1 FROM public.chat_sessions s WHERE s.id = chat_messages.session_id AND s.user_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------------
-- Supabase Storage PA2: one private bucket, direct authenticated access + RLS
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lingora-media',
  'lingora-media',
  false,
  10485760,
  ARRAY['audio/mpeg', 'audio/wav', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY lingora_avatar_select ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'lingora-media'
  AND (storage.foldername(name))[1] = 'profiles'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY lingora_avatar_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'lingora-media'
  AND (storage.foldername(name))[1] = 'profiles'
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND array_length(storage.foldername(name), 1) = 2
  AND metadata ->> 'mimetype' IN ('image/jpeg', 'image/png', 'image/webp')
  AND COALESCE((metadata ->> 'size')::bigint, 0) <= 5242880
);

CREATE POLICY lingora_avatar_delete ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'lingora-media'
  AND (storage.foldername(name))[1] = 'profiles'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY lingora_vocabulary_audio_select ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'lingora-media'
  AND (storage.foldername(name))[1] = 'vocabulary'
  AND array_length(storage.foldername(name), 1) = 2
  AND (
    public.is_admin()
    OR CASE
      WHEN (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN EXISTS (
        SELECT 1
        FROM public.lesson_vocabulary lv
        JOIN public.lessons l ON l.id = lv.lesson_id
        JOIN public.courses c ON c.id = l.course_id
        WHERE lv.vocabulary_id = ((storage.foldername(name))[2])::uuid
          AND l.is_published
          AND c.is_published
      )
      ELSE false
    END
  )
);

CREATE POLICY lingora_vocabulary_audio_admin_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'lingora-media'
  AND public.is_admin()
  AND (storage.foldername(name))[1] = 'vocabulary'
  AND array_length(storage.foldername(name), 1) = 2
  AND (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND metadata ->> 'mimetype' IN ('audio/mpeg', 'audio/wav')
  AND COALESCE((metadata ->> 'size')::bigint, 0) <= 10485760
);

CREATE POLICY lingora_vocabulary_audio_admin_delete ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'lingora-media'
  AND public.is_admin()
  AND (storage.foldername(name))[1] = 'vocabulary'
);

-- No UPDATE policy is created on storage.objects: replacement must insert a new object name.
