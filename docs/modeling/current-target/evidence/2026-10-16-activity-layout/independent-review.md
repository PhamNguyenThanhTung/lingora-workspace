# Independent Activity layout acceptance — 2026-10-17

**Verdict: PASS for the eight Activity candidate pages; targeted primary merge permitted.**

Independent reviewer inspected the exact candidate below, all eight native PNG pages and correction/render scripts. This accepts layout maintenance and three source-faithful native endpoint repairs only. It does not approve physical design, downstream diagrams or application implementation.

## Review findings

- ACT-01: final pause decision uses distinct downward Có and east Không exits. Self-report goes downward to declaration while default continues east. Stored-placement-result branches are distinct. The earlier interrupted candidate still had shared pause routing and correct.py referred to nonexistent e_27; executor completed its unfinished correction using e_26 before this final acceptance. Final candidate and refreshed ACT-01 export inspected after regeneration.
- ACT-02: assessment submit/abandon, validation, save failure and successful recommendation paths readable; no new blocker.
- ACT-03: retry correct/incorrect contributions use separate exits; supplementary SRS versus focus-practice routing is readable. Core loop and supplemental return remain distinct.
- ACT-04: curriculum eligibility, assessment/save outcomes and next-level availability paths readable; no new blocker.
- ACT-06: optional enrollment reaches optional validation, not automatic core enrollment. Reinforcement bypass and answer path are distinct; preserved scheduling path does not reschedule reinforcement.
- ACT-07: provision/activation success and failure paths readable; no new blocker.
- ACT-08: correction-loop return occupies its own corridor; exit to submit remains separate. Review return and publish outcomes remain readable.
- ACT-09: assignment leads to clone then Teacher edit; withdrawal leads to preservation/exclusion and bypasses publication. Crossing on the withdrawal bypass is shown with a jump. No false connection to publication/review was observed.

Changed flows were traced to ACT-01/03/06/08/09 canonical PUML. In particular ACT-06 optional enrollment must not visit automatic core enrollment, and ACT-09 assignment must clone rather than withdraw; the three endpoint-attribute repairs restore these source flows without changing the product rules.

## Independently observed checks

Python 3.11 XML assertions, run read-only by reviewer, exited 0:

- Both old candidate and final candidate have 44 pages, same page IDs/names/order.
- Only ACT-01/03/06/08/09 differ from the historical Activity v2 candidate; the remaining 39 candidate pages are XML-identical.
- Every UserObject ID, label, embedded source and wrapper payload is unchanged; object counts unchanged.
- Non-style mxCell attribute differences are exactly ACT-06 e_16 target removal, ACT-06 e_18 source removal, ACT-09 e_12 target action_70 → action_10. No other endpoint/ownership changes.
- Exact final candidate SHA256 matches coordinator handoff.

render.py invokes installed draw.io 32.4.1 native export against candidate.drawio for PNG and SVG on the eight Activity pages. Its one-based page-index selection agrees with the observed exported titles and stdout paths. Native exports, not stale detail crops, were the visual review basis. ACT-01 was inspected again after final regeneration; other page contents and corresponding earlier reviewed exports remain unchanged. The earlier detail crops are not accepted evidence for this final candidate and should be removed if stale.

## Merge boundary

Replace only ACT-01/02/03/04/06/07/08/09 raw diagram blocks in the CURRENT primary, not the whole historical candidate. Coordinator must verify all other 36 primary blocks (accepted DOM plus 35 others) byte-identical and run native validation after merge. This report is pre-merge acceptance, not a claim that merge verification has already run.

## Exact reviewed files (SHA256)

| File | SHA256 |
|---|---|
| `candidate.drawio` | `b953f9469b2375fa1c4cbcb49d8088668d6c46393cbbcb18d921b0e43e633b30` |
| `correct.py` | `a97dd0a7104e4d85463ff2b1f605cb2b0c53dd1157889308192273a59e2036f7` |
| `render.py` | `a7c4cee79f28d8210f9c45737ef2a4a0ba7065aefb5badc43c900a895c1b3440` |
| `ACT-01.png` | `f2924269dc475d8c4a72cd6ebe7ec1a1e4130422fbd46f76fe43e49b9e4d24b9` |
| `ACT-01.svg` | `36c1d8d4a91ad0fd24ad329b8de8531f28ef847a7968472d714805ced6af4b38` |
| `ACT-02.png` | `838c66998bf48e37d96714f2ba6f23ef42d36274faa17bca89e1429a0d894318` |
| `ACT-02.svg` | `932d25bd8da07c54482991ff0a74d54cd507cba122b851ea2d3cbc26d57d8dc8` |
| `ACT-03.png` | `80f13fcdf046847e44167fa94aa4dbf34102467591e2b5b836b8e8b354c1912e` |
| `ACT-03.svg` | `978102827944c28d6fa257a40d9c367f8a7bff77d531a1eaf93205015f22c383` |
| `ACT-04.png` | `44e6c7d95bbb60b0b16ac2ecd6a2cc5de95624535d055d4faf07b3ce8ea91141` |
| `ACT-04.svg` | `f40018be2e736e97877342617f54905def5a249c481a237c3d9d821556f45b98` |
| `ACT-06.png` | `db9451974bef2bc3586d134ba906c46f2ea7d85705bde1335a8a54af560619c4` |
| `ACT-06.svg` | `b19876f0ac0c73c2487be7dfb4260ffa438f66765f8f7252252097c84a9b4bbb` |
| `ACT-07.png` | `883f26292f53de8f503af7ce685c33212fe25e982b4fb466d980b331e1c458a0` |
| `ACT-07.svg` | `77ceb33e905d6734100c781c5168d522bb1b70923dae8c6a05def93e2605d580` |
| `ACT-08.png` | `1fa97292503f6872a3bf1b0a25d1930de67a09b738fe85435661d963c8b72533` |
| `ACT-08.svg` | `6cc5fabbf2cb5d6c373bc418247aa00918f3d5fe4bf7c239c86c01604b83a498` |
| `ACT-09.png` | `f041d9842b45e4e7b066a9df07c96a185075efef3af7e7c4a6d778ecbd978410` |
| `ACT-09.svg` | `feae61ec0a2c08b39be00b6f84f50620abe53c164e82fece7c90ddc7eb9d9f0c` |

No app/runtime tests or physical/database review performed; they are outside this maintenance scope. Native editability relies on retaining the reviewed XML and targeted merge preservation checks.

## Packaging note (coordinator, after review)

- `correct.py`: trailing blank line removed only; packaged SHA256 `cd851e58f51dfbc2878913c0df5772c07362b29608ce46ca77224b700fed4ee0`. Reviewed code bytes excluding trailing whitespace are identical.
- `render.py`: trailing blank line removed only; packaged SHA256 `ef601def0d11e713121fcf85beba0400a767cc807b8db86deaf8102aa579deb5`. Reviewed code bytes excluding trailing whitespace are identical.

The candidate and all reviewed native exports retain the exact hashes above. Script logic is unchanged. Staged whitespace check rerun after this cleanup.
