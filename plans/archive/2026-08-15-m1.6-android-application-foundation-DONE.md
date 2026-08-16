# Task

m1.6-android-application-foundation

## Status

DONE

Allowed values: `DRAFT / REVIEW / APPROVED / IMPLEMENTING / TESTING / DONE / BLOCKED`

## Plan Boundary

This document is **APPROVED**. It authorizes the implementation of the Java Android Views application foundation under `lingora-android/` and testing against the live Supabase Auth and M1.5 FastAPI mock runtime. No work outside the named files, contracts, tests, and stop conditions is authorized.

## Objective

Create the native Android application foundation defined by the canonical architecture and prove that an
authenticated learner session can call both protected M1.5 FastAPI mock inference endpoints without changing
their `/v1/` contract.

M1.6 establishes:

1. A buildable Java 17 Android Views project under `lingora-android/` using package
   `com.pnttung.lingora`, AGP 8.7, Gradle 8.9, `minSdk 24`, and `targetSdk 35`.
2. The approved MVVM package boundaries for remote data, local cache, repositories, domain models, UI, and
   authentication utilities.
3. Supabase Auth session handling for register, password login, one refresh-and-retry after an expired-token
   `401`, and logout/local-session clearing.
4. Separate Retrofit clients for Supabase and the stateless FastAPI AI server. Android sends the Supabase
   access token as `Authorization: Bearer <JWT>` to protected AI calls.
5. Typed Android DTOs matching the canonical `snake_case` request/response and common error envelopes for:
   - `POST /v1/srs/schedule`
   - `POST /v1/chat/roleplay`
   - public diagnostic checks `GET /health/live` and `GET /health/ready`
6. A narrowly scoped authenticated foundation/status flow that demonstrates successful calls to both mock
   inference endpoints. It is connectivity evidence, not the final smart-review, lesson, or roleplay product UI.
7. The approved `vi`/`en` resource structure and recoverable loading, validation, authorization,
   connectivity, timeout, server/model-unavailable, and success states at foundation scope.
8. The Room dependency/build boundary at the exact level approved in Decision M1.6-D4; M1.6 does not invent
   a speculative local schema.

## Canonical Basis

- `docs/00-master-plan.md` §0.2, §0.4, §4.1: mock-first Android integration; M1 gate requires real login and
  calls to both mock endpoints; Android uses DTOs that match the locked contract.
- `docs/01-architecture.md` §1.1, §1.2, §1.5, §1.7, §3.1, §3.2 and M0.5 baseline: Java/MVVM/Retrofit/Room
  boundary, JWT flow, repository layout, versions, security separation, locale behavior, and stateless AI.
- `docs/02-requirements.md`: `P1-FR-001`, foundation portions of `P1-FR-005` and `P1-FR-007`, plus
  `P1-FR-010`, `P1-NFR-001`, `P1-NFR-003`, and `P1-NFR-004`.
- `docs/03-api-contract.md`: exact `/v1/srs/schedule` and `/v1/chat/roleplay` shapes, common error envelope,
  inference metadata, health semantics, `snake_case`, and compatibility rules.
- `docs/05-traceability-matrix.md`: M1.6 is Android foundation/connectivity; due fallback and smart-review
  end-to-end behavior belong to a later approved SRS integration task.
- `DESIGN.md`: design direction is still `SKELETON`; no unapproved brand palette, typography, navigation
  system, dark mode, or decorative visual language may be inferred.
- `HANDOFF.md`: M1.5 is DONE; Android feature code and dependencies remain unauthorized until this plan is
  approved; ADR-006 feature slices remain outside M1.6.
- `plans/archive/2026-08-15-m1.5-fastapi-mock-runtime-DONE.md`: M1.5 runtime and verification baseline.

## Dependencies And Preconditions

### Completed repository dependencies

1. M1.3 Auth/Profile/RLS/Storage/`record_review` foundation is implemented and tested.
2. M1.4 deterministic course/lesson/vocabulary/SRS/scenario seed is implemented and tested.
3. M1.5 stateless FastAPI mock runtime is implemented and tested, including protected SRS/chat endpoints,
   public health endpoints, deterministic mock behavior, JWT validation, and standard errors.

### Required before IMPLEMENTING

1. Human approval of M1.6-D1 through M1.6-D6 below (APPROVED).
2. Java 17 and Android SDK API 35 available (JBR OpenJDK 25 and Android SDK 34/35 at `D:\Android\Sdk` verified).
3. Android AVD `Pixel_6` (API 34) available (Verified).
4. Local configuration providing `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `AI_API_BASE_URL`.

## Scope Included

### Android build foundation

- Create the Gradle wrapper and Java Android Views application with the locked versions and package name.
- Use the canonical dependency set only: Retrofit 2.11.0, Gson converter 2.11.0, OkHttp logging 4.12.0,
  Lifecycle ViewModel/LiveData 2.8.7, Navigation Fragment 2.8.5, Room 2.6.1, Material 1.12.0,
  Security Crypto 1.1.0-alpha06, JUnit 4.13.2, Mockito 5.14.2, and Espresso 3.6.1.
- Do not add Glide, Media3, WorkManager, DI, coroutines/Kotlin, Compose, or any other dependency.

### Auth and session foundation

- Implement register, password login, session restore, refresh-token exchange, one original-request retry,
  and logout/local clearing within the approved Supabase Auth boundary.
- Store access and refresh tokens using EncryptedSharedPreferences (Security Crypto); never log secret material.
- Prevent refresh loops: one `401` triggers at most one refresh and one retry for the failed request.

### FastAPI mock connectivity

- Maintain a separate AI Retrofit base URL (`http://10.0.2.2:8000/`) and attach current access token as Bearer header.
- Exercise `GET /health/live`, `GET /health/ready`, `POST /v1/srs/schedule`, and `POST /v1/chat/roleplay`.
- Parse the common `error` envelope.

### Minimal foundation UI

- Provide Auth entry (`LoginFragment`, `RegisterFragment`) and post-login `FoundationStatusFragment`.
- Resource strings in `vi` (default) and `en`.
- Distinguishable loading, validation, authorization, connectivity, model-unavailable, and success states.

## Explicitly Out Of Scope

- Course, lesson, vocabulary, audio, exercise, progress, profile, daily goal, streak, or reminder UI.
- M2 lesson flow, final `SrsReviewFragment`, final `RoleplayChatFragment`, chat persistence.
- `get_due_srs_cards`, 8-second SRS fallback orchestration, `record_review` calls from Android.
- ADR-006 `GRAMMAR`, word-level `LISTENING`, `dailyGoalMin` UI, local reminder.
- Speculative Room cache entities/DAOs.
- Backend/FastAPI/Prisma schema changes.

## Decisions Approved

- **M1.6-D1:** Groovy Gradle files + Gradle 8.9 wrapper. Read endpoint/key values from ignored `local.properties` into `BuildConfig`.
- **M1.6-D2:** Emulator testing against `http://10.0.2.2:8000/` through a debug-only network security configuration. Release builds cleartext-denied.
- **M1.6-D3:** Supabase GoTrue operations for signup (`/auth/v1/signup`), password grant (`/auth/v1/token?grant_type=password`), refresh grant (`/auth/v1/token?grant_type=refresh_token`), and logout (`/auth/v1/logout`).
- **M1.6-D4:** Room dependency/annotation processor compiled, `data/local/` package marker only (zero speculative entities).
- **M1.6-D5:** `FoundationStatusFragment` for triggering SRS mock and roleplay mock calls with parsed results.
- **M1.6-D6:** Material Views baseline in portrait, system typography, `vi`/`en` strings.

## Files Expected To Change

### Build and configuration
- `lingora-android/settings.gradle`
- `lingora-android/build.gradle`
- `lingora-android/gradle.properties`
- `lingora-android/gradlew`
- `lingora-android/gradlew.bat`
- `lingora-android/gradle/wrapper/gradle-wrapper.jar`
- `lingora-android/gradle/wrapper/gradle-wrapper.properties`
- `lingora-android/app/build.gradle`
- `lingora-android/app/proguard-rules.pro`
- `lingora-android/app/src/main/AndroidManifest.xml`
- `lingora-android/app/src/debug/res/xml/network_security_config.xml`
- `lingora-android/local.properties`
- `lingora-android/.env.example`
- `lingora-android/README.md`
- `ENVIRONMENT.md`

### Application and data foundation
- `lingora-android/app/src/main/java/com/pnttung/lingora/LingoraApp.java`
- `lingora-android/app/src/main/java/com/pnttung/lingora/MainActivity.java`
- `lingora-android/app/src/main/java/com/pnttung/lingora/data/remote/RetrofitProvider.java`
- `lingora-android/app/src/main/java/com/pnttung/lingora/data/remote/SupabaseAuthService.java`
- `lingora-android/app/src/main/java/com/pnttung/lingora/data/remote/AiService.java`
- `lingora-android/app/src/main/java/com/pnttung/lingora/data/remote/dto/auth/LoginRequest.java`
- `lingora-android/app/src/main/java/com/pnttung/lingora/data/remote/dto/auth/SignUpRequest.java`
- `lingora-android/app/src/main/java/com/pnttung/lingora/data/remote/dto/auth/RefreshTokenRequest.java`
- `lingora-android/app/src/main/java/com/pnttung/lingora/data/remote/dto/auth/AuthResponse.java`
- `lingora-android/app/src/main/java/com/pnttung/lingora/data/remote/dto/auth/UserDto.java`
- `lingora-android/app/src/main/java/com/pnttung/lingora/data/remote/dto/common/ApiErrorEnvelope.java`
- `lingora-android/app/src/main/java/com/pnttung/lingora/data/remote/dto/srs/SrsScheduleRequest.java`
- `lingora-android/app/src/main/java/com/pnttung/lingora/data/remote/dto/srs/SrsScheduleItem.java`
- `lingora-android/app/src/main/java/com/pnttung/lingora/data/remote/dto/srs/ReviewHistoryItem.java`
- `lingora-android/app/src/main/java/com/pnttung/lingora/data/remote/dto/srs/SrsScheduleResponse.java`
- `lingora-android/app/src/main/java/com/pnttung/lingora/data/remote/dto/srs/SrsPredictionItem.java`
- `lingora-android/app/src/main/java/com/pnttung/lingora/data/remote/dto/chat/ChatRoleplayRequest.java`
- `lingora-android/app/src/main/java/com/pnttung/lingora/data/remote/dto/chat/ChatMessageHistory.java`
- `lingora-android/app/src/main/java/com/pnttung/lingora/data/remote/dto/chat/ChatRoleplayResponse.java`
- `lingora-android/app/src/main/java/com/pnttung/lingora/data/remote/dto/chat/FeedbackItem.java`
- `lingora-android/app/src/main/java/com/pnttung/lingora/data/remote/dto/health/HealthResponse.java`
- `lingora-android/app/src/main/java/com/pnttung/lingora/data/repository/AuthRepository.java`
- `lingora-android/app/src/main/java/com/pnttung/lingora/data/repository/AiConnectivityRepository.java`
- `lingora-android/app/src/main/java/com/pnttung/lingora/domain/model/AuthSession.java`
- `lingora-android/app/src/main/java/com/pnttung/lingora/util/SessionStore.java`
- `lingora-android/app/src/main/java/com/pnttung/lingora/util/AuthInterceptor.java`
- `lingora-android/app/src/main/java/com/pnttung/lingora/util/TokenAuthenticator.java`
- `lingora-android/app/src/main/java/com/pnttung/lingora/data/local/package-info.java`

### Foundation UI and resources
- `lingora-android/app/src/main/java/com/pnttung/lingora/ui/auth/AuthViewModel.java`
- `lingora-android/app/src/main/java/com/pnttung/lingora/ui/auth/LoginFragment.java`
- `lingora-android/app/src/main/java/com/pnttung/lingora/ui/auth/RegisterFragment.java`
- `lingora-android/app/src/main/java/com/pnttung/lingora/ui/foundation/FoundationStatusViewModel.java`
- `lingora-android/app/src/main/java/com/pnttung/lingora/ui/foundation/FoundationStatusFragment.java`
- `lingora-android/app/src/main/res/layout/activity_main.xml`
- `lingora-android/app/src/main/res/layout/fragment_login.xml`
- `lingora-android/app/src/main/res/layout/fragment_register.xml`
- `lingora-android/app/src/main/res/layout/fragment_foundation_status.xml`
- `lingora-android/app/src/main/res/navigation/nav_graph.xml`
- `lingora-android/app/src/main/res/values/strings.xml`
- `lingora-android/app/src/main/res/values-en/strings.xml`
- `lingora-android/app/src/main/res/values/themes.xml`
- `lingora-android/app/src/main/res/values-night/themes.xml`

### Tests and lifecycle evidence
- `lingora-android/app/src/test/java/com/pnttung/lingora/data/remote/ContractDtoTest.java`
- `lingora-android/app/src/test/java/com/pnttung/lingora/data/repository/AuthRepositoryTest.java`
- `lingora-android/app/src/test/java/com/pnttung/lingora/util/TokenAuthenticatorTest.java`
- `lingora-android/app/src/test/java/com/pnttung/lingora/data/repository/AiConnectivityRepositoryTest.java`
- `plans/current-task.md`
- `logs/test-log.md`
- `logs/development-log.md`
- `logs/decision-log.md`
- `HANDOFF.md`

## Approval

Status: APPROVED

Approved by: Pham Nguyen Thanh Tung
Date: 2026-08-15
