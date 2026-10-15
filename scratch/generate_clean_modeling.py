"""
Script to author all 36 clean, authoritative PlantUML diagrams for docs/modeling/current-target/src/
Strictly following ADR-030 to ADR-035, requirements, and current use-case specifications.
"""
from pathlib import Path

SRC = Path("docs/modeling/current-target/src")
SRC.mkdir(parents=True, exist_ok=True)

DIAGRAMS = {}

# ==============================================================================
# A. SYSTEM LEVEL
# ==============================================================================

DIAGRAMS["SYS-01-current-context.puml"] = """@startuml
!include ../style.puml
title SYS-01 | CURRENT | System Context (Repository Reality)
footer Observed repository artifacts at 2026-10-10; live deployment unverified

actor "Learner" as Learner
actor "Admin / Staff" as Admin

rectangle "Lingora Platform (CURRENT Artifacts)" {
  component "Learner Web Platform\\n(lingora-web)\\n[Next.js 15, SSR Auth Foundation]" as WebApp
  component "Admin Workspace\\n(lingora-admin)\\n[Prisma 6, Migrations, Seeds — NO WEB APP]" as AdminApp
}

cloud "Supabase Cloud\\n(PostgreSQL 15 + GoTrue + Storage)" as Supabase

Learner --> WebApp : HTTP / Login, Register, Home shell
Admin ..> AdminApp : CLI / seed & test scripts
WebApp --> Supabase : Auth SSR & Session Cookies
AdminApp --> Supabase : Prisma CLI & Migrations

note bottom of AdminApp
  No Admin web application exists in the repository.
  Workspace contains only Prisma, migrations, and seed scripts.
end note
note bottom of Supabase
  LIVE DB UNVERIFIED: No live connection or catalog inspection yet.
  SQL migrations and Prisma schema disagree on roles and tables.
end note
@enduml
"""

DIAGRAMS["SYS-02-target-context.puml"] = """@startuml
!include ../style.puml
title SYS-02 | TARGET | System Context (ADR-030–035 Baseline)
footer Approved logical architecture; physical realization deferred

actor "Learner" as Learner
actor "Teacher" as Teacher
actor "Admin" as Admin

rectangle "Lingora Platform (TARGET)" {
  component "Learner Web Application\\n[Next.js 15 BFF & Client]\\nStudy, Placement, Lessons, SRS, Progress" as LearnerWeb
  component "Admin & Content Studio\\n[Next.js 15 Portal]\\nGovernance, Authoring, Moderation, Provisioning" as AdminWeb
}

cloud "Managed Backend Infrastructure\\n(Supabase / PostgreSQL 15 + Auth + Storage)" as Backend

Learner --> LearnerWeb : Learn, practice, submit, review
Teacher --> AdminWeb : Author assigned content, preview, submit
Admin --> AdminWeb : Provision, assign, review, approve, publish, audit

LearnerWeb --> Backend : Server-authoritative queries, grading & updates
AdminWeb --> Backend : Governed authoring, publishing & audit access

note bottom of LearnerWeb
  Three single business roles (ADR-034).
  Staff cannot use staff accounts for learning.
  No AI microservice runtime in Phase 2 MVP.
end note
@enduml
"""

DIAGRAMS["SYS-03-current-components.puml"] = """@startuml
!include ../style.puml
title SYS-03 | CURRENT | Component & Package Boundaries
footer Observed codebase structure in checkout

package "lingora-web/ (Learner Web Platform)" {
  component "Auth Service & Server Actions\\n(login, register, logout)" as AuthActions
  component "Supabase SSR Session Boundary\\n(httpOnly cookies, middleware)" as SessionBnd
  component "i18n Foundation\\n(vi / en static catalogs)" as I18n
  component "UI Shell & Query Provider\\n(React 19, Tailwind CSS 4)" as UIShell
}

package "lingora-admin/ (Data & Admin Boundary)" {
  component "Prisma Schema (18 models, 6 roles)" as PrismaSchema
  component "SQL Migrations (001, 002, 003 — 17 tables, 2 roles)" as SqlMigrations
  component "Seed Scripts & Security Test Harness" as SeedScripts
}

cloud "Supabase External Services" {
  component "GoTrue Auth" as GoTrue
  component "PostgreSQL Database" as Postgres
  component "Storage Buckets (avatars, audio)" as Storage
}

AuthActions --> GoTrue : signInWithPassword, signUp, signOut
SessionBnd --> GoTrue : getUser() validation on '/'
PrismaSchema ..> Postgres : ORM declaration (unverified deploy)
SqlMigrations ..> Postgres : SQL DDL & RLS (unverified deploy)

note bottom of "lingora-web/ (Learner Web Platform)"
  NO learning runtime, NO placement engine, NO lesson execution,
  NO SRS runner, and NO audit logging implemented in web code.
end note
@enduml
"""

DIAGRAMS["SYS-04-target-components.puml"] = """@startuml
!include ../style.puml
title SYS-04 | TARGET | Logical Component Architecture
footer Two application deployables + managed database & storage; no extraneous microservices

package "Learner Web Application (Deployable)" {
  component "Learner Web UI\\n(Lesson Player, Placement, SRS Review, Progress)" as LearnerUI
  component "Learner In-Process Backend / BFF" {
    component "Auth & Session Guard" as LearnerAuthGuard
    component "Learning Engine\\n(Sequential curriculum, Lesson completion)" as LearnEngine
    component "Assessment Engine\\n(Placement, Level-up, Reassessment)" as AssessEngine
    component "SRS Engine (Policy B)\\n(Deterministic intervals, Idempotency)" as SrsEngine
    component "Streak Evaluator\\n(Account-global, Local timezone)" as StreakEngine
  }
}

package "Admin & Studio Application (Deployable)" {
  component "Admin & Studio UI\\n(Assignment, Studio Editor, Review Desk, Audit Log)" as AdminUI
  component "Admin In-Process Backend / BFF" {
    component "Staff RBAC & Disable Guard" as AdminAuthGuard
    component "Teacher Provisioning Service" as ProvisionService
    component "Content Governance Engine\\n(Clone-to-Draft, SoD checks, Atomic replace)" as ContentGovEngine
    component "Audit Log Reader" as AuditReader
  }
}

database "PostgreSQL Database (Managed)" as DB
storage "Storage Buckets (Media / Avatars)" as Buckets

LearnerUI --> LearnerAuthGuard
LearnerAuthGuard --> LearnEngine
LearnerAuthGuard --> AssessEngine
LearnerAuthGuard --> SrsEngine
LearnerAuthGuard --> StreakEngine

AdminUI --> AdminAuthGuard
AdminAuthGuard --> ProvisionService
AdminAuthGuard --> ContentGovEngine
AdminAuthGuard --> AuditReader

LearnEngine --> DB : Read content, write progress
AssessEngine --> DB : Secret grading, write immutable result
SrsEngine --> DB : Trusted card state & review history
ContentGovEngine --> DB : Revisions, assignments, publications
AuditReader --> DB : Read append-only security logs
LearnerUI --> Buckets : Read public media (audio)
@enduml
"""

# ==============================================================================
# B. USE CASES
# ==============================================================================

DIAGRAMS["UC-01-target-overall.puml"] = """@startuml
!include ../style.puml
title UC-01 | TARGET | Overall Use Case Map (3 Roles Baseline)
footer Authentication and active status are preconditions, not included use cases; UC-03 deferred

actor "Learner" as Learner
actor "Teacher" as Teacher
actor "Admin" as Admin

rectangle "Lingora Platform" {
  package "Learner Domain" {
    usecase "UC-01: Register & Manage Profile" as UC01
    usecase "UC-02: Select Language Context" as UC02
    usecase "UC-04: Browse Curriculum & Units" as UC04
    usecase "UC-05: Learn Lesson & Practice" as UC05
    usecase "UC-06: Take Placement Assessment" as UC06
    usecase "UC-07: Practice Spaced Repetition (SRS)" as UC07
    usecase "UC-08: View Progress, Streaks & Evidence" as UC08
    usecase "UC-09: Take Level-up Assessment" as UC09
    usecase "UC-10: Take Reassessment" as UC10
  }

  package "Teacher Domain" {
    usecase "UC-11: View Assigned Worklist" as UC11
    usecase "UC-12: Author & Edit Assigned Content" as UC12
    usecase "UC-13: Preview & Submit for Review" as UC13
  }

  package "Admin Domain" {
    usecase "UC-14: Provision & Manage Teachers" as UC14
    usecase "UC-15: Manage Curriculum & Assignments" as UC15
    usecase "UC-16: Review, Approve & Publish Content" as UC16
    usecase "UC-17: View Audit Logs & Reports" as UC17
  }
}

Learner --> UC01
Learner --> UC02
Learner --> UC04
Learner --> UC05
Learner --> UC06
Learner --> UC07
Learner --> UC08
Learner --> UC09
Learner --> UC10

Teacher --> UC11
Teacher --> UC12
Teacher --> UC13

Admin --> UC14
Admin --> UC15
Admin --> UC16
Admin --> UC17

note right of UC06
  Placement gives starting recommendation.
  Level-up gates advancement.
  Reassessment records proficiency evidence.
end note
@enduml
"""

DIAGRAMS["UC-02-target-learner.puml"] = """@startuml
!include ../style.puml
title UC-02 | TARGET | Learner Use Cases
footer Governed by ADR-031, ADR-032, ADR-033, ADR-035

actor "Learner" as Learner

rectangle "Learner Experience" {
  usecase "Self-Register & Setup Account" as UC_Reg
  usecase "Manage Learning Contexts\\n(Max 2 ACTIVE, PAUSED retains state)" as UC_Ctx
  usecase "Select Starting Point\\n(Placement Test, Self-Report, or Default)" as UC_Start
  usecase "Learn Lesson & Formative Exercises\\n(Unlimited retry, formative feedback)" as UC_Learn
  usecase "Review Due SRS Cards\\n(Policy B, Server calculated)" as UC_SRS
  usecase "Take Level-up Exam\\n(Requires curriculum gate, >= 80% to pass)" as UC_LevelUp
  usecase "Take Periodic Reassessment\\n(Produces immutable proficiency evidence)" as UC_Reassess
  usecase "View Progress, Streak & Test Evidence" as UC_Progress
}

Learner --> UC_Reg
Learner --> UC_Ctx
Learner --> UC_Start
Learner --> UC_Learn
Learner --> UC_SRS
Learner --> UC_LevelUp
Learner --> UC_Reassess
Learner --> UC_Progress

note bottom of UC_Learn
  Completion requires valid submission of core exercises.
  Completion does NOT depend on accuracy/score threshold.
end note
note bottom of UC_SRS
  Client sends valid self-rating / recall outcome.
  Server computes stages [1, 3, 7, 14, 30] days.
end note
@enduml
"""

DIAGRAMS["UC-03-target-teacher.puml"] = """@startuml
!include ../style.puml
title UC-03 | TARGET | Teacher Use Cases
footer Governed by ADR-034 (Business Roles & Responsibilities)

actor "Teacher" as Teacher

rectangle "Content Authoring Desk" {
  usecase "Activate Provisioned Account" as UC_Act
  usecase "View Assigned Worklist\\n(Only assigned lessons/items)" as UC_Worklist
  usecase "Draft & Edit Lesson Content\\n(Permitted only in DRAFT or CHANGES_REQUESTED)" as UC_Edit
  usecase "Preview Formatted Lesson & Exercises" as UC_Prev
  usecase "Submit Revision for Admin Review\\n(Transitions to IN_REVIEW)" as UC_Sub
  usecase "View Review Feedback & History" as UC_Hist
}

Teacher --> UC_Act
Teacher --> UC_Worklist
Teacher --> UC_Edit
Teacher --> UC_Prev
Teacher --> UC_Sub
Teacher --> UC_Hist

note bottom of Teacher
  INVARIANTS:
  - Teacher cannot publish or approve content.
  - Teacher cannot author outside assigned lessons.
  - Teacher cannot use staff account to study as Learner.
end note
@enduml
"""

DIAGRAMS["UC-04-target-admin.puml"] = """@startuml
!include ../style.puml
title UC-04 | TARGET | Admin Use Cases
footer Governed by ADR-034 & ADR-035

actor "Admin" as Admin

rectangle "Administration & Governance Desk" {
  usecase "Provision & Disable/Re-enable Teachers" as UC_Prov
  usecase "Manage Curriculum Structure & Config" as UC_Curric
  usecase "Create Requirement & Assign to Teacher\\n(One responsible Teacher per Lesson)" as UC_Assign
  usecase "Review Submitted Content Revision" as UC_Rev
  usecase "Request Changes\\n(Returns to CHANGES_REQUESTED)" as UC_Chg
  usecase "Approve Revision\\n(Transitions to APPROVED)" as UC_Appr
  usecase "Publish Approved Revision\\n(Transitions to PUBLISHED; atomic replacement)" as UC_Pub
  usecase "Archive or Withdraw Content Revision" as UC_Arch
  usecase "Inspect Security & Governance Audit Logs" as UC_Audit
}

Admin --> UC_Prov
Admin --> UC_Curric
Admin --> UC_Assign
Admin --> UC_Rev
Admin --> UC_Chg
Admin --> UC_Appr
Admin --> UC_Pub
Admin --> UC_Arch
Admin --> UC_Audit

note bottom of Admin
  INVARIANTS:
  - Admin cannot author lesson or exercise content directly.
  - Admin cannot publish unapproved drafts (no bypass).
  - Every publication and privileged action generates an audit event.
end note
@enduml
"""

# ==============================================================================
# C. ACTIVITIES
# ==============================================================================

DIAGRAMS["ACT-01-learner-onboarding.puml"] = """@startuml
!include ../style.puml
title ACT-01 | TARGET | Learner Onboarding & Context Selection
footer Governed by ADR-031 & ADR-032

start
:Learner completes registration & email verification;
:Learner logs in (Default Profile created);
:Learner selects target Language to study;
if (Active contexts count < 2?) then (yes)
  :Create new LearningContext in ACTIVE state;
else (no)
  :Prompt Learner to pause an existing active context\\nor proceed with context in PAUSED state;
endif
:Choose starting point pathway;
if (Pathway chosen?) then (Take Placement Assessment)
  :Initiate Placement Assessment (diagnostic item bank);
  :Receive recommended starting level;
  :Set starting level in context;
elseif (Self-Report Proficiency)
  :Learner selects claimed starting level\\n(Marked self-reported / unverified);
else (Default Start)
  :Route to Unit 1 (A1 baseline);
endif
:Compute initial DerivedLearningPlan deterministically;
:Display Learner Course Dashboard;
stop
@enduml
"""

DIAGRAMS["ACT-02-placement-assessment.puml"] = """@startuml
!include ../style.puml
title ACT-02 | TARGET | Placement Assessment Execution
footer Diagnostic purpose only; server grading; no certification

start
:Learner starts Placement Assessment;
:Server retrieves pinned diagnostic items;
note right: Correct answers/rubric stripped before client delivery
repeat
  :Learner answers question item;
  :Client buffers answer locally;
repeat while (More items and time remaining?) is (yes)
->no;
if (Valid submission completed?) then (yes)
  :Submit responses to Server boundary;
  :Server verifies submission token & grades authoritatively;
  :Server records CompletedResult & Evidence to LearningContext;
  :Server evaluates configured placement rules;
  :Return aggregate score & recommended starting level;
  note right: Never return per-item answer keys
else (Abandoned / Incomplete)
  :Session terminates;
  :Record zero completed result;
  :Default context to baseline Unit 1;
endif
stop
@enduml
"""

DIAGRAMS["ACT-03-lesson-learning.puml"] = """@startuml
!include ../style.puml
title ACT-03 | TARGET | Lesson Learning & Exercise Completion
footer Completion is distinct from performance; formative retry allowed

start
:Learner opens available Lesson;
:Display Lesson Content & Vocabulary\\n(Definitions, examples, static audio);
:Learner begins Lesson Exercises (5 core types);
repeat
  :Learner submits exercise attempt;
  :Server checks answer against secret key;
  :Server returns formative feedback (Correct / Try Again);
  if (Answer correct?) then (yes)
    :Move to next exercise;
  else (no)
    :Allow unlimited retry without penalty score reduction;
  endif
repeat while (All required core exercises answered?) is (no)
->yes;
:Learner submits Lesson completion;
:Server validates all core exercises answered;
:Server records UserProgress (status: COMPLETED, completedAt: now);
:Derive latest performance score for display;
:Qualify account-global daily streak\\n(if first qualifying activity today);
:Unlock next sequential lesson in Unit;
stop
@enduml
"""

DIAGRAMS["ACT-04-level-up-assessment.puml"] = """@startuml
!include ../style.puml
title ACT-04 | TARGET | Level-up Assessment Execution
footer Curriculum gate + Assessment threshold required to advance

start
:Learner requests Level-up Assessment;
:Server checks Curriculum Gate\\n(All required lessons in current level COMPLETED?);
if (Curriculum gate met?) then (yes)
  :Present Level-up Assessment items;
  :Learner completes and submits exam;
  :Server grades exam authoritatively;
  :Record immutable CompletedResult;
  if (Exam score >= Configured Pass Threshold?) then (yes)
    :Unlock next Course Level / Curriculum;
    :Record level advancement evidence;
    :Display congratulations & aggregate outcome;
  else (no)
    :Keep next level locked;
    :Allow retake after optional cooldown period;
    :Suggest reviewing specific lesson units;
  endif
else (no)
  :Reject request: Prompt to complete prerequisite lessons;
endif
stop
@enduml
"""

DIAGRAMS["ACT-05-reassessment.puml"] = """@startuml
!include ../style.puml
title ACT-05 | TARGET | Periodic Reassessment Execution
footer Generates proficiency evidence only; does not automatically unlock curriculum

start
:Learner initiates Reassessment from Profile;
:Server verifies eligibility / cooldown period;
:Present standardized assessment items;
:Learner answers and submits responses;
:Server grades authoritatively against locked rubric;
:Record immutable AssessmentResult & Evidence;
note right
  Evidence is appended to context history.
  Reassessment does NOT bypass curriculum gates.
  Progress and completion counts remain unchanged.
end note
:Display aggregate proficiency assessment feedback;
stop
@enduml
"""

DIAGRAMS["ACT-06-srs-review.puml"] = """@startuml
!include ../style.puml
title ACT-06 | TARGET | Spaced Repetition (SRS) Review Flow
footer Deterministic Policy B; client sends recall rating; server computes interval

start
:Learner opens Vocabulary Review queue;
:Server fetches due UserVocabSrs cards for user;
if (Due cards available?) then (yes)
  repeat
    :Display card prompt / audio / sentence;
    :Learner reveals card flipped back;
    :Learner inputs self-rating / recall outcome;
    :Client sends card ID + recall outcome;
    :Server validates rating against allowed scale;
    if (Recall outcome: Remembered?) then (yes)
      :Server advances Policy B stage (capped at 30 days)\\nIntervals: 1 -> 3 -> 7 -> 14 -> 30 days;
    else (Not Remembered)
      :Server resets Policy B to Stage 1 (1 day);
    endif
    :Server calculates next due date = now + interval;
    :Update UserVocabSrs card state;
    :Append record to SrsReviewHistory;
    :Qualify account streak (if not already qualified today);
  repeat while (More due cards in queue?) is (yes)
  ->no;
  :Display review session summary;
else (no)
  :Display 'All caught up' state;
endif
stop
@enduml
"""

DIAGRAMS["ACT-07-teacher-provisioning.puml"] = """@startuml
!include ../style.puml
title ACT-07 | TARGET | Teacher Account Provisioning
footer Admin provisions Teacher; strictly one role per account

start
:Admin enters Teacher email & profile info;
:Server verifies email uniqueness across all roles;
:Create Auth User with role = TEACHER & status = PENDING;
:Emit security audit event: TEACHER_PROVISIONED;
:Send activation invite to Teacher email;
:Teacher receives invite & sets password;
:Teacher account status updates to ACTIVE;
note right
  Admin can DISABLE teacher anytime.
  Disabled teacher is rejected at next request.
  Admin can later RE-ENABLE teacher.
end note
stop
@enduml
"""

DIAGRAMS["ACT-08-content-governance.puml"] = """@startuml
!include ../style.puml
title ACT-08 | TARGET | Content Authoring, Review & Publishing
footer Agile SoD: Teacher authors -> Admin reviews, approves, and publishes

start
:Admin creates Assignment for a Lesson;
:Admin assigns 1 responsible Teacher;
:Teacher opens assigned Lesson in Studio;
:Teacher edits draft content & exercises;
:Teacher previews formatted lesson;
:Teacher submits revision for review (Status: IN_REVIEW);
:Admin receives notification & inspects revision;
if (Revision meets curriculum standards?) then (Approved)
  :Admin approves revision (Status: APPROVED);
  :Admin publishes revision (Status: PUBLISHED);
  :Atomic replacement: new revision becomes active;
  :Lesson becomes accessible to Learners in Unit;
  :Emit audit event: LESSON_PUBLISHED;
else (Changes Requested)
  :Admin records review feedback (Status: CHANGES_REQUESTED);
  :Teacher receives feedback, revises draft, and resubmits;
endif
stop
@enduml
"""

DIAGRAMS["ACT-09-revision-replacement.puml"] = """@startuml
!include ../style.puml
title ACT-09 | TARGET | Revision Replacement (Clone-to-Draft v2)
footer Published lessons are never edited in place; replacements are atomic

start
:Published Lesson needs update;
:Admin creates new Assignment with clone-to-draft;
:System clones active revision to new DRAFT with supersedes_id;
:Teacher updates draft content in Studio;
:Teacher submits draft (Status: IN_REVIEW);
:Admin reviews and approves (Status: APPROVED);
:Admin triggers publication;
partition "Atomic Replacement Transaction" {
  :Verify new revision is APPROVED;
  :Set new revision status = PUBLISHED & active = true;
  :Set previous revision active = false (status: ARCHIVED);
  :Emit security audit log: REVISION_REPLACED;
}
note right
  Learner historical progress, results, and streak
  remain intact and linked to lesson identity.
  Learners are not forced to redo completed lessons.
end note
stop
@enduml
"""

# ==============================================================================
# D. STATES
# ==============================================================================

DIAGRAMS["STA-01-account-status.puml"] = """@startuml
!include ../style.puml
title STA-01 | TARGET | Account Lifecycle & Status
footer Governed by ADR-034 & ADR-035; next-request disable enforcement

[*] --> PENDING : Provisioned by Admin (Teacher/Staff)\\nor Self-Registered (Learner)
PENDING --> ACTIVE : Email confirmed / Password set
ACTIVE --> DISABLED : Admin disables account
DISABLED --> ACTIVE : Admin re-enables account
ACTIVE --> [*] : Account deletion / GDPR request

note right of DISABLED
  When account is DISABLED:
  Server rejects requests on NEXT invocation,
  even if existing JWT token is not expired.
end note
@enduml
"""

DIAGRAMS["STA-02-assignment-lifecycle.puml"] = """@startuml
!include ../style.puml
title STA-02 | TARGET | Assignment Lifecycle
footer Assignment tracks responsibility; distinct from content revision status

[*] --> ASSIGNED : Admin assigns Lesson to Teacher
ASSIGNED --> IN_PROGRESS : Teacher opens and edits draft
IN_PROGRESS --> SUBMITTED : Teacher submits for review
SUBMITTED --> IN_PROGRESS : Admin requests changes
SUBMITTED --> CLOSED : Admin approves and publishes revision
ASSIGNED --> REASSIGNED : Admin reassigns to another Teacher
IN_PROGRESS --> REASSIGNED : Admin reassigns to another Teacher
REASSIGNED --> [*]
CLOSED --> [*]
@enduml
"""

DIAGRAMS["STA-03-content-revision-lifecycle.puml"] = """@startuml
!include ../style.puml
title STA-03 | TARGET | Content Revision Lifecycle
footer Governed by ADR-034 & ADR-035; immutable publication

[*] --> DRAFT : Cloned from active or created new
DRAFT --> IN_REVIEW : Teacher submits revision
IN_REVIEW --> CHANGES_REQUESTED : Admin requests revisions
CHANGES_REQUESTED --> IN_REVIEW : Teacher resubmits
IN_REVIEW --> APPROVED : Admin approves content
APPROVED --> PUBLISHED : Admin publishes to learners
PUBLISHED --> ARCHIVED : Superseded by newer approved revision
PUBLISHED --> WITHDRAWN : Emergency defect withdrawal by Admin
ARCHIVED --> [*]
WITHDRAWN --> [*]

note right of PUBLISHED
  Published revisions are IMMUTABLE.
  Edits require cloning to a new DRAFT.
  Learners only see PUBLISHED revisions.
end note
@enduml
"""

# ==============================================================================
# E. DOMAIN MODEL
# ==============================================================================

DIAGRAMS["DOM-01-core-domain-model.puml"] = """@startuml
!include ../style.puml
title DOM-01 | TARGET | Core Domain Model
footer Logical responsibilities & relationships; physical schema deferred

hide circle
hide empty members

class User {
  id: UUID
  email: String
  role: Role (ADMIN | TEACHER | LEARNER)
  status: AccountStatus (ACTIVE | DISABLED)
}

class Profile {
  displayName: String
  nativeLanguage: String
  timezone: String (IANA)
  streakCount: Integer
  lastStreakDate: Date
}

class LearningContext {
  languageCode: String
  status: ContextStatus (ACTIVE | PAUSED)
  startingLevel: String
  studyGoalMinutes: Integer
}

class Language {
  code: String
  name: String
}

class Course {
  id: UUID
  title: String
  languageCode: String
}

class Unit {
  id: UUID
  courseId: UUID
  orderIndex: Integer
  title: String
}

class Lesson {
  id: UUID
  unitId: UUID
  orderIndex: Integer
}

class ContentRevision {
  id: UUID
  lessonId: UUID
  version: Integer
  status: ContentStatus
  supersedesId: UUID
}

class Exercise {
  id: UUID
  revisionId: UUID
  type: ExerciseType
  orderIndex: Integer
  learnerSafePayload: JSON
  protectedGradingSecret: JSON
}

class Assignment {
  id: UUID
  lessonId: UUID
  teacherId: UUID
  status: AssignmentStatus
}

class UserProgress {
  userId: UUID
  lessonId: UUID
  status: ProgressStatus
  completedAt: Timestamp
  latestScore: Integer
}

class SrsCard {
  userId: UUID
  vocabularyId: UUID
  stage: Integer (1..5)
  intervalDays: Integer
  dueAt: Timestamp
}

class AssessmentResult {
  id: UUID
  userId: UUID
  contextId: UUID
  purpose: AssessmentPurpose
  score: Integer
  outcomeRecommendation: String
  createdAt: Timestamp
}

class SecurityAuditEvent {
  id: UUID
  actorId: UUID
  action: String
  resourceType: String
  resourceId: String
  timestamp: Timestamp
  details: JSON
}

User "1" *-- "1" Profile
User "1" *-- "0..*" LearningContext
LearningContext --> Language : studies
Course --> Language : offered in
Course "1" *-- "0..*" Unit : contains
Unit "1" *-- "0..*" Lesson : groups
Lesson "1" *-- "0..*" ContentRevision : versions
ContentRevision "1" *-- "0..*" Exercise : contains
Lesson "1" *-- "0..*" Assignment : governs
Assignment --> User : assigned Teacher
User "1" -- "0..*" UserProgress : tracks
User "1" -- "0..*" SrsCard : owns
LearningContext "1" -- "0..*" AssessmentResult : records
User "1" -- "0..*" SecurityAuditEvent : logs

note bottom of Unit
  Unit is a logical grouping concept.
  Physical table realization is deferred to schema reconciliation.
end note
note bottom of Exercise
  Learner payload != grading secret.
  Grading key is hidden from generic learner reads.
end note
@enduml
"""

# ==============================================================================
# F. DATA MODELS / ERD
# ==============================================================================

DIAGRAMS["DATA-01-current-migration-erd.puml"] = """@startuml
!include ../style.puml
title DATA-01 | CURRENT | Migration History ERD (SQL 001..003)
footer 17 application tables; 2 roles (LEARNER, ADMIN); chat residue; NO units table

entity languages {
  * code : text <<PK>>
  --
  name : text
  is_learnable : boolean
}

entity profiles {
  * id : uuid <<PK, FK auth.users>>
  --
  role : role_enum (LEARNER | ADMIN)
  email : text
  timezone : text
  streak_count : int
}

entity courses {
  * id : uuid <<PK>>
  --
  * language_code : text <<FK languages>>
  title : text
}

entity lessons {
  * id : uuid <<PK>>
  --
  * course_id : uuid <<FK courses>>
  title : text
  order_index : int
}

entity exercises {
  * id : uuid <<PK>>
  --
  * lesson_id : uuid <<FK lessons>>
  payload : jsonb
  order_index : int
}

entity user_progress {
  * user_id : uuid <<PK, FK profiles>>
  * lesson_id : uuid <<PK, FK lessons>>
  --
  status : text
  score : int
  completed_at : timestamptz
}

entity user_vocab_srs {
  * user_id : uuid <<PK, FK profiles>>
  * vocabulary_id : uuid <<PK, FK vocabularies>>
  --
  interval_days : float
  ease_factor : float
  due_date : timestamptz
}

entity chat_sessions {
  * id : uuid <<PK>>
  --
  * user_id : uuid <<FK profiles>>
}

courses }o--|| languages
lessons }o--|| courses
exercises }o--|| lessons
user_progress }o--|| profiles
user_progress }o--|| lessons
user_vocab_srs }o--|| profiles
chat_sessions }o--|| profiles

note bottom of lessons
  CRITICAL ARTIFACT GAP:
  Migration 001 connects lessons DIRECTLY to courses.
  There is NO 'units' table in ordered SQL migrations.
end note
@enduml
"""

DIAGRAMS["DATA-02-current-prisma-model.puml"] = """@startuml
!include ../style.puml
title DATA-02 | CURRENT | Prisma Schema Model (schema.prisma)
footer 18 models; 6 roles; Unit table declared; AuditLog declared

entity Language {
  * code : String <<PK>>
}

entity Profile {
  * id : String <<PK>>
  role : Role (6 values)
  assignedRoles : Role[]
}

entity Course {
  * id : String <<PK>>
  languageCode : String <<FK Language>>
}

entity Unit {
  * id : String <<PK>>
  courseId : String <<FK Course>>
  orderIndex : Int
}

entity Lesson {
  * id : String <<PK>>
  courseId : String <<FK Course>>
  unitId : String <<FK Unit, Optional>>
  status : ContentStatus (6 values)
}

entity Exercise {
  * id : String <<PK>>
  lessonId : String <<FK Lesson>>
  payload : Json
}

entity AuditLog {
  * id : String <<PK>>
  actorId : String <<FK Profile>>
  action : String
}

Course }o--|| Language
Unit }o--|| Course
Lesson }o--|| Course
Lesson }o--o| Unit
Exercise }o--|| Lesson
AuditLog }o--|| Profile

note bottom of Unit
  MISMATCH WITH MIGRATIONS:
  Prisma declares 'Unit' and 'AuditLog',
  but SQL migrations 001..003 DO NOT create them.
  Prisma declares 6 roles; SQL migration has only 2 roles.
end note
@enduml
"""

DIAGRAMS["DATA-03-target-logical-erd.puml"] = """@startuml
!include ../style.puml
title DATA-03 | TARGET | Target Logical Data Model
footer Governed by ADR-030–035; physical tables and names deferred

entity "User" as User {
  * id : UUID <<PK>>
  --
  role : Role (LEARNER | TEACHER | ADMIN)
  status : AccountStatus (ACTIVE | DISABLED)
  email : String
}

entity "Profile" as Profile {
  * user_id : UUID <<PK, FK User>>
  --
  timezone : String
  streak_count : Integer
  last_streak_date : Date
}

entity "LearningContext" as LearningContext {
  * id : UUID <<PK>>
  --
  * user_id : UUID <<FK User>>
  * language_code : String <<FK Language>>
  status : ContextStatus (ACTIVE | PAUSED)
}

entity "Course" as Course {
  * id : UUID <<PK>>
  --
  * language_code : String <<FK Language>>
}

entity "LogicalUnit" as Unit {
  * id : UUID <<PK>>
  --
  * course_id : UUID <<FK Course>>
  order_index : Integer
}

entity "Lesson" as Lesson {
  * id : UUID <<PK>>
  --
  * unit_id : UUID <<FK LogicalUnit>>
  order_index : Integer
}

entity "ContentRevision" as ContentRevision {
  * id : UUID <<PK>>
  --
  * lesson_id : UUID <<FK Lesson>>
  version : Integer
  status : ContentStatus
  supersedes_id : UUID
}

entity "Exercise" as Exercise {
  * id : UUID <<PK>>
  --
  * revision_id : UUID <<FK ContentRevision>>
  learner_payload : JSONB
  grading_secret : JSONB
}

entity "UserProgress" as UserProgress {
  * context_id : UUID <<PK, FK LearningContext>>
  * lesson_id : UUID <<PK, FK Lesson>>
  --
  status : ProgressStatus (COMPLETED)
  latest_score : Integer
  completed_at : Timestamp
}

entity "SrsCard" as SrsCard {
  * user_id : UUID <<PK, FK User>>
  * vocabulary_id : UUID <<PK>>
  --
  stage : Integer (1..5)
  interval_days : Integer
  due_at : Timestamp
}

entity "AssessmentResult" as AssessmentResult {
  * id : UUID <<PK>>
  --
  * context_id : UUID <<FK LearningContext>>
  purpose : Purpose (PLACEMENT | LEVEL_UP | REASSESSMENT)
  score : Integer
  outcome : JSONB
}

entity "SecurityAuditEvent" as Audit {
  * id : UUID <<PK>>
  --
  actor_id : UUID <<FK User>>
  action : String
  timestamp : Timestamp
  details : JSONB
}

User ||--|| Profile
User ||--o{ LearningContext
Course ||--o{ Unit
Unit ||--o{ Lesson
Lesson ||--o{ ContentRevision
ContentRevision ||--o{ Exercise
LearningContext ||--o{ UserProgress
Lesson ||--o{ UserProgress
User ||--o{ SrsCard
LearningContext ||--o{ AssessmentResult
User ||--o{ Audit

note bottom of Unit
  LogicalUnit represents curriculum grouping.
  Physical table realization will be evaluated during schema reconciliation.
end note
@enduml
"""

# ==============================================================================
# G. SEQUENCES
# ==============================================================================

DIAGRAMS["SEQ-01-login-authorization.puml"] = """@startuml
!include ../style.puml
title SEQ-01 | TARGET | Login & Server-Authoritative Authorization
footer Governed by ADR-035; trusted subject and status validation

autonumber
actor User
boundary "Browser Client" as Client
control "Server Auth Guard" as Guard
database "PostgreSQL DB" as DB

User -> Client : Submit email + password
Client -> Guard : POST /api/auth/login
Guard -> DB : Authenticate credentials (GoTrue)
DB --> Guard : auth.uid() + session token
Guard -> DB : SELECT role, status FROM profiles WHERE id = auth.uid()
DB --> Guard : role, status
alt Account is DISABLED
  Guard --> Client : 403 Forbidden ("Account is disabled")
else Account is ACTIVE
  Guard -> Guard : Set secure httpOnly session cookies
  Guard --> Client : 200 OK (redirect to authorized dashboard)
end
@enduml
"""

DIAGRAMS["SEQ-02-teacher-provisioning.puml"] = """@startuml
!include ../style.puml
title SEQ-02 | TARGET | Admin Provisions Teacher Account
footer Governed by ADR-034 (Agile SoD)

autonumber
actor Admin
boundary "Admin Studio UI" as Client
control "Admin Backend" as Server
database "PostgreSQL DB" as DB

Admin -> Client : Enter Teacher details (email, name)
Client -> Server : POST /api/admin/teachers/provision
Server -> Server : Verify Admin session & role
Server -> DB : Check email uniqueness across all roles
alt Email already exists
  Server --> Client : 409 Conflict ("Email in use")
else Email valid
  Server -> DB : INSERT auth.users (email) & profile (role: TEACHER, status: PENDING)
  Server -> DB : INSERT security_audit_events (TEACHER_PROVISIONED)
  Server --> Client : 201 Created (Invite sent)
end
@enduml
"""

DIAGRAMS["SEQ-03-assignment-authoring-submit.puml"] = """@startuml
!include ../style.puml
title SEQ-03 | TARGET | Content Assignment, Authoring & Submission
footer Governed by ADR-034; single assigned Teacher authoring

autonumber
actor Admin
actor Teacher
control "Server Governance Engine" as Server
database "PostgreSQL DB" as DB

Admin -> Server : Create Assignment (Lesson X, Teacher Y)
Server -> DB : INSERT assignments (status: ASSIGNED)
Teacher -> Server : Open assigned Lesson
Server -> DB : Verify Teacher Y is currently assigned
DB --> Server : Authorized (Assignment valid)
Server --> Teacher : Load Draft editor
Teacher -> Server : Save Draft content & exercises
Server -> DB : UPDATE content_revisions (status: DRAFT)
Teacher -> Server : Submit for review
Server -> DB : UPDATE content_revisions (status: IN_REVIEW)
Server -> DB : UPDATE assignments (status: SUBMITTED)
Server -> DB : INSERT workflow_history (SUBMITTED)
Server --> Teacher : 200 OK (Submitted for Admin review)
@enduml
"""

DIAGRAMS["SEQ-04-review-approve-publish.puml"] = """@startuml
!include ../style.puml
title SEQ-04 | TARGET | Content Review, Approval & Publication
footer Governed by ADR-034 & ADR-035; publish-only-after-approval

autonumber
actor Admin
control "Server Governance Engine" as Server
database "PostgreSQL DB" as DB

Admin -> Server : Open submitted revision for review
Server -> DB : Fetch revision items & exercises
Server --> Admin : Display content review desk
alt Changes Requested
  Admin -> Server : Submit review feedback
  Server -> DB : UPDATE content_revisions (status: CHANGES_REQUESTED)
  Server -> DB : INSERT workflow_history (CHANGES_REQUESTED)
else Content Approved & Published
  Admin -> Server : Approve revision
  Server -> DB : UPDATE content_revisions (status: APPROVED)
  Admin -> Server : Publish approved revision
  Server -> DB : UPDATE content_revisions (status: PUBLISHED)
  Server -> DB : Atomic switch: set active version pointer
  Server -> DB : INSERT security_audit_events (LESSON_PUBLISHED)
  Server --> Admin : 200 OK (Published to Learners)
end
@enduml
"""

DIAGRAMS["SEQ-05-revision-replacement.puml"] = """@startuml
!include ../style.puml
title SEQ-05 | TARGET | Atomic Replacement of Published Content
footer Clone-to-draft v2; active version replaces old version atomically

autonumber
actor Admin
control "Server Engine" as Server
database "PostgreSQL DB" as DB

Admin -> Server : Trigger publish of new APPROVED revision
Server -> DB : BEGIN TRANSACTION
Server -> DB : SELECT active revision for Lesson X (Revision V1)
Server -> DB : UPDATE content_revisions SET status = 'ARCHIVED' WHERE id = V1
Server -> DB : UPDATE content_revisions SET status = 'PUBLISHED' WHERE id = V2
Server -> DB : UPDATE lessons SET active_revision_id = V2 WHERE id = Lesson X
Server -> DB : INSERT security_audit_events (REVISION_REPLACED, details: V1 -> V2)
Server -> DB : COMMIT TRANSACTION
Server --> Admin : 200 OK (Revision V2 active; historical progress preserved)
@enduml
"""

DIAGRAMS["SEQ-06-lesson-exercise-submission.puml"] = """@startuml
!include ../style.puml
title SEQ-06 | TARGET | Lesson Exercise Submission & Grading
footer Server-authoritative grading; secret grading key never exposed

autonumber
actor Learner
boundary "Learner UI" as Client
control "Learning Engine" as Server
database "PostgreSQL DB" as DB

Learner -> Client : Select answer for Exercise item
Client -> Server : POST /api/lessons/{id}/exercises/{exId}/attempt
note over Client, Server
  Payload contains only: exerciseId, learnerAnswer
  Client DOES NOT grade the item.
end note
Server -> DB : Fetch protected grading secret for exId
DB --> Server : gradingSecret (correct option / regex)
Server -> Server : Evaluate learnerAnswer against gradingSecret
alt Answer Correct
  Server --> Client : 200 OK { correct: true, feedback: "Great job!" }
else Answer Incorrect
  Server --> Client : 200 OK { correct: false, feedback: "Try again!" }
  Learner -> Client : Retry without score penalty
end
@enduml
"""

DIAGRAMS["SEQ-07-assessment-submission.puml"] = """@startuml
!include ../style.puml
title SEQ-07 | TARGET | Assessment Submission (Placement / Level-up)
footer Server grading; immutable result; aggregate feedback only (no answer keys)

autonumber
actor Learner
boundary "Learner UI" as Client
control "Assessment Engine" as Server
database "PostgreSQL DB" as DB

Learner -> Client : Submit completed assessment exam
Client -> Server : POST /api/assessments/submit (attemptId, answers[])
Server -> DB : Verify submission token & fetch locked assessment rubric
DB --> Server : Assessment rubric & answers
Server -> Server : Calculate authoritative total score
Server -> DB : INSERT assessment_results (purpose, score, recommendation)
Server -> DB : UPDATE learning_contexts (update starting level or unlock gate)
Server --> Client : 200 OK { totalScore, recommendation, passed }
note over Client, Server
  Aggregate outcome returned only.
  Per-item correctness and answer keys are NEVER exposed.
end note
@enduml
"""

DIAGRAMS["SEQ-08-srs-review.puml"] = """@startuml
!include ../style.puml
title SEQ-08 | TARGET | SRS Review Submission & Idempotent Schedule
footer Policy B [1,3,7,14,30]; client sends recall outcome; server computes due date

autonumber
actor Learner
boundary "Learner UI" as Client
control "SRS Engine" as Server
database "PostgreSQL DB" as DB

Learner -> Client : Rate card (Recall outcome: Remembered / Not Remembered)
Client -> Server : POST /api/srs/review (cardId, recallOutcome, operationId)
Server -> DB : Verify ownership & check if operationId already recorded
alt Same operationId already recorded
  Server --> Client : 200 OK (Return recorded schedule; idempotent, no duplicate effect)
else New review operation
  Server -> DB : Fetch current card stage
  Server -> Server : Compute Policy B interval:
  note right Server
    Not Remembered -> Stage 1 (1 day)
    Remembered -> Stage + 1 (1 -> 3 -> 7 -> 14 -> 30 days)
    dueAt = now + intervalDays
  end note
  Server -> DB : UPDATE user_vocab_srs (stage, interval_days, due_at)
  Server -> DB : INSERT srs_review_history (cardId, recallOutcome, reviewedAt)
  Server -> DB : Conditionally increment streak for today
  Server --> Client : 200 OK { nextDueAt, intervalDays }
end
@enduml
"""

DIAGRAMS["SEQ-09-disable-account-enforcement.puml"] = """@startuml
!include ../style.puml
title SEQ-09 | TARGET | Immediate Disable Enforcement
footer Governed by ADR-035; Next-request enforcement regardless of JWT expiry

autonumber
actor Admin
actor "Teacher / Learner" as TargetUser
control "Server Auth Boundary" as Server
database "PostgreSQL DB" as DB

Admin -> Server : POST /api/admin/users/{id}/disable
Server -> DB : UPDATE profiles SET status = 'DISABLED' WHERE id = targetId
Server -> DB : INSERT security_audit_events (ACCOUNT_DISABLED)
Server --> Admin : 200 OK (Account disabled)

note over TargetUser, Server: Target user makes subsequent request with valid JWT
TargetUser -> Server : GET /api/lessons/active (Bearer token)
Server -> DB : SELECT status FROM profiles WHERE id = auth.uid()
DB --> Server : status = 'DISABLED'
Server --> TargetUser : 403 Forbidden ("Account is disabled. Contact administrator.")
@enduml
"""

# ==============================================================================
# H. SECURITY / DFD
# ==============================================================================

DIAGRAMS["SEC-01-target-trust-boundary-dfd.puml"] = """@startuml
!include ../style.puml
title SEC-01 | TARGET | Trust Boundary & Data Flow Diagram (DFD Level 1)
footer Governed by ADR-035; clear separation of untrusted client and trusted backend

actor "Learner Client\\n(Untrusted Browser)" as LearnerClient
actor "Staff Client\\n(Untrusted Browser)" as StaffClient

rectangle "Trusted Server Boundary (Next.js BFF / API)" {
  component "Session & Subject Guard\\n(Derive auth.uid(), verify status)" as AuthGuard
  component "RBAC & SoD Validator\\n(Check role & assignment scope)" as RbacGuard
  component "Grading Engine\\n(Protected grading secrets)" as GradingEngine
  component "SRS Scheduler\\n(Policy B deterministic)" as SrsScheduler
  component "Audit Logger\\n(Append-only emitter)" as AuditLogger
}

database "PostgreSQL Database" {
  storage "Public / Learner Data\\n(Lessons, Curricula, Vocab)" as PublicStore
  storage "Protected Secrets\\n(Exercise Answer Keys, Exam Rubrics)" as SecretStore
  storage "User State\\n(Progress, SRS Cards, Contexts)" as UserStore
  storage "Security Audit Store\\n(Append-only, Admin read only)" as AuditStore
}

LearnerClient --> AuthGuard : Untrusted answers & recall ratings
StaffClient --> AuthGuard : Untrusted draft edits & commands

AuthGuard --> RbacGuard : Validated subject & role
RbacGuard --> GradingEngine : Exercise / exam attempt
GradingEngine --> SecretStore : Query secret answers (never sent to client)
GradingEngine --> UserStore : Write immutable result & progress
RbacGuard --> SrsScheduler : Validated recall outcome
SrsScheduler --> UserStore : Write server-computed interval
RbacGuard --> PublicStore : Fetch authorized lesson content
RbacGuard --> AuditLogger : Privileged action (publish, disable, provision)
AuditLogger --> AuditStore : Append audit event

note bottom of SecretStore
  Learner payload != grading secret.
  Generic reads never expose answer keys.
end note
@enduml
"""

# ==============================================================================
# I. DEPLOYMENT
# ==============================================================================

DIAGRAMS["DEP-01-current-deployment.puml"] = """@startuml
!include ../style.puml
title DEP-01 | CURRENT | Deployment Environment (Observed Reality)
footer Observed repository checkout at 2026-10-10

node "Learner Environment" {
  artifact "Next.js 15 Web App\\n(Port 3000)\\nAuth & UI Shell only" as WebNode
}

node "Developer / Local Workspace" {
  artifact "Prisma CLI & Seed Harness\\n(lingora-admin workspace)" as AdminNode
}

cloud "Supabase Cloud Project (ap-southeast-1)" {
  database "PostgreSQL 15" as DBNode
  component "GoTrue Auth Service" as AuthNode
  storage "Supabase Storage" as StorageNode
}

WebNode --> AuthNode : HTTPS / Auth SSR
WebNode --> DBNode : Unused (No product queries implemented)
AdminNode --> DBNode : DATABASE_URL / Migrations & seeds

note bottom of DBNode
  LIVE DB UNVERIFIED.
  Catalog and applied migration state not verified.
end note
@enduml
"""

DIAGRAMS["DEP-02-target-deployment.puml"] = """@startuml
!include ../style.puml
title DEP-02 | TARGET | Target Deployment Architecture
footer Two web application deployables + managed Supabase infrastructure

node "Learner Web Deployable" {
  artifact "Next.js 15 Web App\\n(SSR + BFF + Client)\\nDomain: learn.lingora.com" as LearnerWebDeploy
}

node "Admin & Studio Deployable" {
  artifact "Next.js 15 Admin Portal\\n(Studio + Moderation + Ops)\\nDomain: admin.lingora.com" as AdminWebDeploy
}

cloud "Managed Infrastructure (Supabase ap-southeast-1)" {
  database "PostgreSQL 15 Database\\n(RLS, Triggers, Functions)" as SupabaseDB
  component "GoTrue Auth Engine" as SupabaseAuth
  storage "Storage Buckets\\n(Static audio media, avatars)" as SupabaseStorage
}

LearnerWebDeploy --> SupabaseAuth : JWT & Auth verification
LearnerWebDeploy --> SupabaseDB : Server-side connection pool / RLS
LearnerWebDeploy --> SupabaseStorage : Static audio asset CDN

AdminWebDeploy --> SupabaseAuth : Staff authentication & session
AdminWebDeploy --> SupabaseDB : Governed CMS queries & audit log

note bottom of SupabaseDB
  No separate microservice cluster.
  Application logic runs in Next.js backend;
  Data protection enforced via Server BFF + RLS.
end note
@enduml
"""

# Write all diagrams
for filename, content in DIAGRAMS.items():
    p = SRC / filename
    p.write_text(content.strip() + "\\n", encoding="utf-8")
    print(f"Created: {p.name}")

print(f"\\nSuccessfully authored {len(DIAGRAMS)} clean PlantUML source files in {SRC}.")
