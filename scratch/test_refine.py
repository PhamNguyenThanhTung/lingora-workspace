import subprocess
from PIL import Image

puml_template = """@startuml
!include c:/Users/PC/lingora/docs/diagrams/lingora-modeling/src/_style.puml
hide empty members
skinparam nodesep 50
skinparam ranksep 40

skinparam class {
  BackgroundColor<<CURRENT>> #FFFFFF
  BorderColor<<CURRENT>> #334155
  BorderThickness<<CURRENT>> 1.5

  BackgroundColor<<TARGET>> #F8FAFC
  BorderColor<<TARGET>> #475569
  BorderThickness<<TARGET>> 1.5
  BorderStyle<<TARGET>> dashed
}

skinparam enum {
  BackgroundColor #FFFFFF
  BorderColor #334155
  BorderThickness 1.5
  HeaderBackgroundColor #F8FAFC
}

enum Role <<enumeration>> {
  ADMINISTRATOR
  LESSON_CREATOR
  MODERATOR
  ORGANIZATIONAL_MANAGER
  OPERATIONS_STAFF
  LEARNER
}

class Profile <<CURRENT>> {
  + id: UUID
  + email: String
  + role: Role
  + streak_count: Integer
  + daily_goal_min: Integer
}

class UserProgress <<CURRENT>> {
  + id: UUID
  + user_id: UUID
  + lesson_id: UUID
  + status: ProgressStatus
  + score: Integer
}

note bottom of UserProgress
  Theo dõi tiến độ học bài;
  tách rời khỏi năng lực CEFR.
  - Retry: trần 70% credit.
  - Cooldown: Khóa 24h (< 95%).
end note

enum AssessmentPurpose <<TARGET>> {
  PLACEMENT
  JUMP
  LEVEL_ADVANCEMENT
}

enum Cefr <<enumeration>> {
  A1
  A2
  B1
  B2
  C1
  C2
}

class AssessmentResult <<TARGET>> {
  + id: UUID
  + user_id: UUID
  + purpose: AssessmentPurpose
  + raw_score: Integer
  + evaluated_cefr: Cefr
  + starting_unit_index: Integer
  + completed_at: Timestamp
}

class SkillProfile <<TARGET>> {
  + id: UUID
  + user_id: UUID
  + verified_cefr: Cefr
  + verified_starting_unit: Integer
}
note bottom of SkillProfile
  Năng lực kiểm chứng 4 chiều:
  Vocab, Grammar, Reading, Listening.
  Nâng Level qua Level Advancement Test.
end note

class UserVocabSrs <<CURRENT>> {
  + id: UUID
  + user_id: UUID
  + vocabulary_id: UUID
  + interval_days: Float
  + ease_factor: Float
  + next_review_at: Timestamp
}

class ReviewLog <<CURRENT>> {
  + id: UUID
  + srs_card_id: UUID
  + is_correct: Boolean
  + reviewed_at: Timestamp
}

class AuditLog <<CURRENT>> {
  + id: UUID
  + actor_id: UUID
  + action: String
  + entity_type: String
  + entity_id: UUID
}

' Column 1: Role, UserProgress
Role -[hidden]down-> UserProgress

' Column 2: Profile, UserVocabSrs, ReviewLog, AuditLog
Profile -[hidden]down-> UserVocabSrs
UserVocabSrs -[hidden]down-> ReviewLog
ReviewLog -[hidden]down-> AuditLog

' Column 3: AssessmentResult, SkillProfile
AssessmentResult -[hidden]down-> SkillProfile

' Column 4: AssessmentPurpose, Cefr
AssessmentPurpose -[hidden]down-> Cefr

' Horizontal alignment
Role -[hidden]right-> Profile
Profile -[hidden]right-> AssessmentResult
AssessmentResult -[hidden]right-> AssessmentPurpose

' Relations
Profile "1" -left- "1" Role : assigned
Profile "1" -- "0..*" UserProgress : tracks
Profile "1" -down- "0..*" UserVocabSrs : practices
UserVocabSrs "1" *-down- "0..*" ReviewLog : records
Profile "1" -- "0..*" AuditLog : triggers

Profile "1" -right- "0..*" AssessmentResult : evaluated by [TARGET]
AssessmentResult "1" -down- "0..1" SkillProfile : derives [TARGET]
AssessmentResult ..> AssessmentPurpose : purpose [TARGET]
AssessmentResult ..> Cefr : evaluates [TARGET]
SkillProfile ..> Cefr : verified level [TARGET]

@enduml
"""

with open("c:/Users/PC/lingora/scratch/layout_refine.puml", "w", encoding="utf-8") as f:
    f.write(puml_template)

cmd = [
    r"C:\Users\PC\scoop\apps\openjdk17\current\bin\java.exe",
    "-DPLANTUML_LIMIT_SIZE=16384",
    "-jar",
    r"C:\Users\PC\scoop\apps\plantuml\current\plantuml.jar",
    "-o", "c:/Users/PC/lingora/scratch",
    "c:/Users/PC/lingora/scratch/layout_refine.puml"
]
subprocess.run(cmd, check=True)

img = Image.open("c:/Users/PC/lingora/scratch/layout_refine.png")
print("Refined Size:", img.size, "Ratio:", img.size[0] / img.size[1])
