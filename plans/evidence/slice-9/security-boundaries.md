# Slice 9 review boundaries

Assets: authenticated subject, current Account role/status, private learner context, provider session, server DB credentials.

| Boundary | Abuse case | Required proof |
| --- | --- | --- |
| Browser → login | Forged role/subject, invalid password, cross-origin POST | Server provider verification, strict input/origin validation, no successful session on failure |
| Cookie → protected loader/API | Forged/expired session; staff identity presented as learner | Fresh provider identity, exact ACTIVE LEARNER Account check; 401 vs 403 |
| Account lifecycle → open session | Disabled Account retains otherwise valid cookie | Next protected request 403; restoration recovers without false success |
| Session → context query/DTO | Learner A asks for B, or database result crosses scope | Reject selectors; subject predicate plus defensive ownership checks; explicit safe projection |
| Context → home | Missing context treated as invalid auth; inconsistent parent accepted | Empty success200 and usable logout; inconsistent scope fails closed |
| Learner identity → staff | Learner reaches catalogue/review/assessment/Teacher resources | Actual staff handler/guard denies role; public staff login denies exact fixture subject |
| Auth response → browser/cache | Refresh cookies or SDK headers dropped; secrets enter client chunks | Cookie/header tests, no-store responses, local and public bundle scan |
| DEV operator → fixture | Partial setup or failed acceptance leaves access behind | Owned UUID only, compensation, finally logout/close, Account→Auth cleanup and read-only residue comparison |

This records intended review checks. Passing results are recorded separately after implementation and execution.
