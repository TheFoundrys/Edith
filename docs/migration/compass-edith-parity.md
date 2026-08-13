# Compass to Edith Naming Parity

Reference map between `compass_dev` (the original Skill Compass database) and `edith_dev` (the Edith working database).

## Database environment rule

- `compass_dev` and `edith_dev` are **two separate databases**.
- `compass_dev` is the **reference / source** database. It is read-only and is never modified from Edith.
- Edith never connects to `compass_dev` unless explicitly instructed. All Edith development uses `edith_dev`.
- Schema and field names should stay **compatible** between the two databases.
- The database *name* is intentionally different. That is never a reason to rename a table or a field.

Environment verified at the time of writing: all six env files (`.env`, `.env.example`, `apps/web/.env`, `apps/web/.env.example`, `_archive/web-next/.env`, `_archive/web-next/.env.example`) point at `edith_dev`. No code path connects Edith to `compass_dev`.

## Provenance

Derived from a read-only introspection of `compass_dev`, snapshotted alongside this file as `compass_dev.reference.prisma`. That snapshot is documentation only: it is not a working Prisma schema and must never be used as one. Compared against `apps/web/prisma/schema.prisma` (identical to `database/schema/schema.prisma`).

## 1. Summary

- `compass_dev`: **48 tables**, 33 enums.
- `edith_dev`: **64 tables**, 43 enums.
- **40 table names already identical.**
- **8 Compass tables** map to **7 differently-named Edith tables**.
- **17 Edith tables** have no Compass counterpart.
- **49 Compass columns** have no Edith equivalent. **164 Edith-only columns** exist as additions.
- **7 shadow duplicate column pairs** carry one concept under two names inside Edith, three of them on `TicketMessage` alone.

## 2. Primary keys

**No primary key reconciliation is required.** Every one of the 48 Compass tables and all 64 Edith tables uses a single-column primary key named exactly `id`, typed `String`. Neither database has a composite primary key.

| | compass_dev | edith_dev |
|---|---|---|
| PK column name | `id` (all 48 tables) | `id` (all 64 tables) |
| PK type | `String` | `String` |
| Composite PKs | 0 | 0 |
| Client-side `cuid()` default | 40 tables | 64 tables |

The 8 Compass tables whose `id` has no database default are exactly the 8 renamed ones listed in section 4; the application supplies the id there.

## 3. Table index (all 64 edith_dev tables)

| edith_dev table | PK | compass_dev source | PK | Class |
|---|---|---|---|---|
| `AiPluginSetting` | `id` | none | -- | edith-only |
| `Announcement` | `id` | `Announcement` | `id` | identical |
| `AnnouncementRead` | `id` | `AnnouncementRead` | `id` | identical |
| `Application` | `id` | `AdmissionApplication` | `id` | renamed |
| `ApplicationEvent` | `id` | none | -- | edith-only |
| `Assignment` | `id` | none | -- | edith-only |
| `AssignmentSubmission` | `id` | `AssignmentSubmission` | `id` | identical |
| `AudienceSegment` | `id` | `AudienceSegment` | `id` | identical |
| `AuditLog` | `id` | `AuditLog` | `id` | identical |
| `Badge` | `id` | `Badge` | `id` | identical |
| `BloomsAnalysis` | `id` | `BloomsAnalysis` | `id` | identical |
| `Campus` | `id` | none | -- | edith-only |
| `Certificate` | `id` | `Certificate` | `id` | identical |
| `CertificateTemplate` | `id` | `CertificateTemplate` | `id` | identical |
| `CliftonAssessment` | `id` | `CliftonAssessment` | `id` | identical |
| `Conversation` | `id` | `Conversation` | `id` | identical |
| `ConversationParticipant` | `id` | `ConversationParticipant` | `id` | identical |
| `Coupon` | `id` | `Coupon` | `id` | identical |
| `CourseAssessmentAttempt` | `id` | `CourseAssessmentAttempt` | `id` | identical |
| `CourseMcq` | `id` | `CourseMcq` | `id` | identical |
| `CrmSyncLog` | `id` | none | -- | edith-only |
| `Department` | `id` | none | -- | edith-only |
| `Document` | `id` | none | -- | edith-only |
| `EmailCampaign` | `id` | `EmailCampaign` | `id` | identical |
| `EmailLog` | `id` | `EmailLog` | `id` | identical |
| `EmailTemplate` | `id` | `EmailTemplate` | `id` | identical |
| `Enrollment` | `id` | `Enrollment` | `id` | identical |
| `FormDefinition` | `id` | none | -- | edith-only |
| `FormVersion` | `id` | none | -- | edith-only |
| `ForumCategory` | `id` | `ForumCategory` | `id` | identical |
| `ForumReply` | `id` | `ForumReply` | `id` | identical |
| `ForumThread` | `id` | `ForumThread` | `id` | identical |
| `ForumVote` | `id` | `ForumVote` | `id` | identical |
| `Group` | `id` | `Group` | `id` | identical |
| `GroupMessage` | `id` | `GroupMessage` | `id` | identical |
| `GroupMessageMention` | `id` | `GroupMessageMention` | `id` | identical |
| `Installment` | `id` | `Installment` | `id` | identical |
| `Intake` | `id` | none | -- | edith-only |
| `IpRule` | `id` | `IpRule` | `id` | identical |
| `LessonMcq` | `id` | `LessonMcq` | `id` | identical |
| `LessonMcqAttempt` | `id` | `LessonMcqAttempt` | `id` | identical |
| `LessonProgress` | `id` | none | -- | edith-only |
| `Membership` | `id` | none | -- | edith-only |
| `Message` | `id` | `Message` | `id` | identical |
| `Notification` | `id` | `Notification` | `id` | identical |
| `NotificationPreference` | `id` | `NotificationPreference` | `id` | identical |
| `Organization` | `id` | `Domain` | `id` | renamed |
| `PasswordResetToken` | `id` | none | -- | edith-only |
| `Payment` | `id` | `Transaction` | `id` | renamed |
| `PaymentSettings` | `id` | `PaymentSettings` | `id` | identical |
| `PermissionRole` | `id` | `Role` | `id` | renamed |
| `Program` | `id` | `Course` + `FoundationProgram` | `id` | renamed |
| `ProgramOffer` | `id` | `ProgramOffer` | `id` | identical |
| `ProgramSyllabus` | `id` | none | -- | edith-only |
| `Quiz` | `id` | none | -- | edith-only |
| `QuizAttempt` | `id` | none | -- | edith-only |
| `QuizQuestion` | `id` | none | -- | edith-only |
| `SyllabusLesson` | `id` | `Lesson` | `id` | renamed |
| `SyllabusModule` | `id` | `Module` | `id` | renamed |
| `Ticket` | `id` | `Ticket` | `id` | identical |
| `TicketMessage` | `id` | `TicketMessage` | `id` | identical |
| `User` | `id` | `User` | `id` | identical |
| `UserBadge` | `id` | `UserBadge` | `id` | identical |
| `UserGroup` | `id` | `UserGroup` | `id` | identical |

## 4. Reverse index (all 48 compass_dev tables)

| compass_dev table | PK | edith_dev target | PK | Renamed |
|---|---|---|---|---|
| `AdmissionApplication` | `id` | `Application` | `id` | yes |
| `Announcement` | `id` | `Announcement` | `id` | no |
| `AnnouncementRead` | `id` | `AnnouncementRead` | `id` | no |
| `AssignmentSubmission` | `id` | `AssignmentSubmission` | `id` | no |
| `AudienceSegment` | `id` | `AudienceSegment` | `id` | no |
| `AuditLog` | `id` | `AuditLog` | `id` | no |
| `Badge` | `id` | `Badge` | `id` | no |
| `BloomsAnalysis` | `id` | `BloomsAnalysis` | `id` | no |
| `Certificate` | `id` | `Certificate` | `id` | no |
| `CertificateTemplate` | `id` | `CertificateTemplate` | `id` | no |
| `CliftonAssessment` | `id` | `CliftonAssessment` | `id` | no |
| `Conversation` | `id` | `Conversation` | `id` | no |
| `ConversationParticipant` | `id` | `ConversationParticipant` | `id` | no |
| `Coupon` | `id` | `Coupon` | `id` | no |
| `Course` | `id` | `Program` | `id` | yes |
| `CourseAssessmentAttempt` | `id` | `CourseAssessmentAttempt` | `id` | no |
| `CourseMcq` | `id` | `CourseMcq` | `id` | no |
| `Domain` | `id` | `Organization` | `id` | yes |
| `EmailCampaign` | `id` | `EmailCampaign` | `id` | no |
| `EmailLog` | `id` | `EmailLog` | `id` | no |
| `EmailTemplate` | `id` | `EmailTemplate` | `id` | no |
| `Enrollment` | `id` | `Enrollment` | `id` | no |
| `ForumCategory` | `id` | `ForumCategory` | `id` | no |
| `ForumReply` | `id` | `ForumReply` | `id` | no |
| `ForumThread` | `id` | `ForumThread` | `id` | no |
| `ForumVote` | `id` | `ForumVote` | `id` | no |
| `FoundationProgram` | `id` | `Program` | `id` | yes |
| `Group` | `id` | `Group` | `id` | no |
| `GroupMessage` | `id` | `GroupMessage` | `id` | no |
| `GroupMessageMention` | `id` | `GroupMessageMention` | `id` | no |
| `Installment` | `id` | `Installment` | `id` | no |
| `IpRule` | `id` | `IpRule` | `id` | no |
| `Lesson` | `id` | `SyllabusLesson` | `id` | yes |
| `LessonMcq` | `id` | `LessonMcq` | `id` | no |
| `LessonMcqAttempt` | `id` | `LessonMcqAttempt` | `id` | no |
| `Message` | `id` | `Message` | `id` | no |
| `Module` | `id` | `SyllabusModule` | `id` | yes |
| `Notification` | `id` | `Notification` | `id` | no |
| `NotificationPreference` | `id` | `NotificationPreference` | `id` | no |
| `PaymentSettings` | `id` | `PaymentSettings` | `id` | no |
| `ProgramOffer` | `id` | `ProgramOffer` | `id` | no |
| `Role` | `id` | `PermissionRole` | `id` | yes |
| `Ticket` | `id` | `Ticket` | `id` | no |
| `TicketMessage` | `id` | `TicketMessage` | `id` | no |
| `Transaction` | `id` | `Payment` | `id` | yes |
| `User` | `id` | `User` | `id` | no |
| `UserBadge` | `id` | `UserBadge` | `id` | no |
| `UserGroup` | `id` | `UserGroup` | `id` | no |

The 8 renames, none of which are being reverted (see section 9):

- `AdmissionApplication` to `Application`
- `Course` to `Program`
- `Domain` to `Organization`
- `FoundationProgram` to `Program`
- `Lesson` to `SyllabusLesson`
- `Module` to `SyllabusModule`
- `Role` to `PermissionRole`
- `Transaction` to `Payment`

## 5. Column parity: the 49 Compass columns with no Edith equivalent

Verdicts: **rename** means Edith renamed an existing column and Phase 2 reverts it. **restore** means Edith dropped it and Phase 2 adds it back. **structural** means the difference follows from a table-shape decision that is out of scope. **absent** means there is no Edith equivalent and none is being added.

| compass_dev table.column | Type | Edith table | Verdict | Edith name / note |
|---|---|---|---|---|
| `AssignmentSubmission.courseId` | `String` | `AssignmentSubmission` | **structural** | Edith uses `programId` (nullable) |
| `Certificate.certificateId` | `String` | `Certificate` | **rename** | `certificateCode` |
| `Certificate.courseId` | `String` | `Certificate` | **structural** | Edith uses `programId` |
| `Certificate.issueDate` | `DateTime` | `Certificate` | **rename** | `issuedAt` |
| `CliftonAssessment.topThemes` | `Json` | `CliftonAssessment` | **absent** | no Edith equivalent |
| `CourseAssessmentAttempt.courseId` | `String` | `CourseAssessmentAttempt` | **structural** | Edith uses `programId` |
| `Enrollment.courseId` | `String?` | `Enrollment` | **structural** | Edith uses `programId`; Compass `foundationProgramId` is already kept |
| `ForumThread.courseId` | `String?` | `ForumThread` | **structural** | Edith uses `programId` |
| `LessonMcq.courseId` | `String` | `LessonMcq` | **structural** | Edith uses `programId` |
| `Notification.actionUrl` | `String?` | `Notification` | **rename** | `href` |
| `Notification.message` | `String` | `Notification` | **rename** | `body` |
| `Ticket.transactionId` | `String?` | `Ticket` | **absent** | Edith has no Ticket-to-Payment link |
| `User.password` | `String?` | `User` | **rename** | `passwordHash` |
| `User.resetPasswordToken` | `String?` | `User` | **restore** | dropped by Edith entirely |
| `User.role` | `String` | `User` | **structural** | Edith derives role from the `Membership` join, typed by the `Role` enum |
| `AdmissionApplication.academicDetails` | `Json?` | `Application` | **absent** | collapsed into Edith `answersJson` |
| `AdmissionApplication.addressDetails` | `Json?` | `Application` | **absent** | collapsed into Edith `answersJson` |
| `AdmissionApplication.contactDetails` | `Json?` | `Application` | **absent** | collapsed into Edith `answersJson` |
| `AdmissionApplication.courseSelection` | `Json?` | `Application` | **absent** | collapsed into Edith `answersJson` |
| `AdmissionApplication.documents` | `Json?` | `Application` | **absent** | collapsed into Edith `answersJson` |
| `AdmissionApplication.entranceExamDetails` | `Json?` | `Application` | **absent** | collapsed into Edith `answersJson` |
| `AdmissionApplication.parentDetails` | `Json?` | `Application` | **absent** | collapsed into Edith `answersJson` |
| `AdmissionApplication.personalDetails` | `Json?` | `Application` | **absent** | collapsed into Edith `answersJson` |
| `AdmissionApplication.schoolProgramId` | `String` | `Application` | **absent** | no Edith equivalent |
| `AdmissionApplication.userId` | `String` | `Application` | **structural** | Edith uses `applicantId` |
| `Course.description` | `String` | `Program` | **rename** | `summary` |
| `Course.domainId` | `String?` | `Program` | **structural** | Edith uses `organizationId` |
| `Course.isPublished` | `Boolean` | `Program` | **absent** | Edith models publication as the `ProgramStatus` enum in `status` |
| `Course.price` | `Float` | `Program` | **rename** | `tuitionAmount` |
| `Course.thumbnail` | `String?` | `Program` | **absent** | no Edith equivalent on Program |
| `Course.title` | `String` | `Program` | **rename** | `name` |
| `Course.type` | `CourseType` | `Program` | **rename** | `courseType` |
| `Domain.order` | `Int` | `Organization` | **rename** | `sortOrder` |
| `Domain.title` | `String` | `Organization` | **rename** | `name` |
| `FoundationProgram.admissionFee` | `Float?` | `Program` | **absent** | no Edith equivalent |
| `FoundationProgram.campus` | `String?` | `Program` | **absent** | Edith models campuses as a separate `Campus` table |
| `FoundationProgram.description` | `String` | `Program` | **rename** | `summary` |
| `FoundationProgram.isPublished` | `Boolean` | `Program` | **absent** | Edith models publication as `ProgramStatus` |
| `FoundationProgram.price` | `Float` | `Program` | **rename** | `tuitionAmount` |
| `FoundationProgram.thumbnail` | `String?` | `Program` | **absent** | no Edith equivalent on Program |
| `FoundationProgram.title` | `String` | `Program` | **rename** | `name` |
| `Lesson.content` | `String?` | `SyllabusLesson` | **rename** | `contentBody` |
| `Lesson.courseId` | `String` | `SyllabusLesson` | **structural** | Edith reaches Program via `module.syllabus` |
| `Lesson.duration` | `String?` | `SyllabusLesson` | **rename** | `durationLabel` |
| `Lesson.order` | `Int` | `SyllabusLesson` | **rename** | `sortOrder` |
| `Lesson.type` | `LessonType` | `SyllabusLesson` | **rename** | `lessonType` |
| `Module.courseId` | `String` | `SyllabusModule` | **structural** | Edith inserts a `ProgramSyllabus` layer and uses `syllabusId` |
| `Module.order` | `Int` | `SyllabusModule` | **rename** | `sortOrder` |
| `Transaction.paymentDate` | `DateTime` | `Payment` | **rename** | `paidAt` |

Totals: **17 absent**, **20 rename**, **1 restore**, **11 structural**, summing to 49.

## 6. Phase 2 revert list (18 items)

These are the only changes approved for Phase 2. Table names are untouched. Section 5 lists 21 rename/restore rows, but `Program` has two Compass sources (`Course` and `FoundationProgram`) that agree on `title`, `description` and `price`, so those three collapse into one Edith change each, giving 18 distinct edits.

| # | Edith table | Current Edith name | Revert to Compass name | Risk | Call sites |
|---|---|---|---|---|---|
| 1 | `Certificate` | `certificateCode` | `certificateId` | low | 6 hits / 6 files |
| 2 | `Certificate` | `issuedAt` | `issueDate` | low | 6 hits / 5 files |
| 3 | `Notification` | `body` | `message` | medium | 15 `prisma.notification` sites / 8 files; bare `body` is 169 hits / 41 files, so must be scoped |
| 4 | `Notification` | `href` | `actionUrl` | medium | same 15 sites; bare `href` is 285 hits / 81 files (mostly JSX links), so must be scoped |
| 5 | `Organization` | `name` | `title` | **high** | bare `name` is 797 hits / 146 files; scope strictly to `Organization` |
| 6 | `Organization` | `sortOrder` | `order` | medium | 95 hits / 22 files; scope to 3 tables only |
| 7 | `Payment` | `paidAt` | `paymentDate` | low | 12 hits / 6 files |
| 8 | `Program` | `name` | `title` | **high** | bare `name` is 797 hits / 146 files; scope strictly to `Program` |
| 9 | `Program` | `summary` | `description` | **high** | 204 raw hits / 30 files; must exclude `eligibilitySummary` and the `SyllabusModule` / `SyllabusLesson` `summary` columns |
| 10 | `Program` | `tuitionAmount` | `price` | medium | 143 hits / 24 files |
| 11 | `Program` | `courseType` | `type` | low | 2 hits / 2 files |
| 12 | `SyllabusLesson` | `contentBody` | `content` | medium | 44 hits / 11 files |
| 13 | `SyllabusLesson` | `durationLabel` | `duration` | low | 5 hits / 3 files |
| 14 | `SyllabusLesson` | `lessonType` | `type` | low | 2 hits / 2 files |
| 15 | `SyllabusLesson` | `sortOrder` | `order` | medium | 95 hits / 22 files; scope to 3 tables only |
| 16 | `SyllabusModule` | `sortOrder` | `order` | medium | 95 hits / 22 files; scope to 3 tables only |
| 17 | `User` | `passwordHash` | `password` | **high** | 27 hits / 8 files; see constraint 3 below |
| 18 | `User` | (missing) | `resetPasswordToken` | low | 0; pure addition, `String?` |

The four **high** risk items are high for two different reasons. `passwordHash` is high because it is load-bearing for authentication. The three `name` and `summary` reverts are high purely because those identifiers are extremely common in the codebase, so a careless find-and-replace would corrupt unrelated code. Rename these via type-aware tooling or field-by-field review, not a global text substitution.

### Phase 2 execution constraints

1. **Never use `prisma db push` for these renames.** Prisma implements a column rename as drop-then-create, which would destroy the data. Use hand-authored `ALTER TABLE ... RENAME COLUMN` against `edith_dev` only. The repo has no migrations directory and `package.json` wires `db:push`, so this needs its own script.
2. **Both schema copies must change together**: `apps/web/prisma/schema.prisma` and `database/schema/schema.prisma` are currently identical.
3. **`User.passwordHash` is the highest-risk item.** Edith declares it `NOT NULL` and feeds it straight into `bcrypt.compare` in `apps/web/lib/auth/index.ts`. Compass has it nullable. Rename only; do not relax nullability.
4. **Scope `sortOrder` to `Organization`, `SyllabusModule` and `SyllabusLesson` only.** `QuizQuestion` is Edith-only, and `ForumCategory` already has a real `order` column (see section 7).
5. **Scope `summary` to `Program` only.** Exclude `eligibilitySummary` and the `SyllabusModule` / `SyllabusLesson` `summary` columns, which have no Compass counterpart.
6. `order` is a reserved word in SQL. Prisma quotes identifiers so this is safe, but any raw SQL must quote it.

## 7. Shadow duplicate columns (7 pairs)

Edith carries both the Compass column and an Edith-invented synonym for the same concept, so one concept occupies two columns. This is a live data-integrity hazard: code can write one and read the other. `apps/web/lib/actions/compass-modules.ts` already writes both halves of four pairs by hand to keep them in sync.

Provenance below was checked against the Compass counterpart table, not inferred from the naming style.

| Edith table | Compass column (keep) | Edith-added synonym (redundant) | Notes |
|---|---|---|---|
| `AssignmentSubmission` | `textAnswer` `String?` | `contentBody` `String` | Two free-text answer columns. |
| `Badge` | `icon` `String` | `iconUrl` `String?` | `compass-modules.ts` writes both: `icon: iconUrl ?? ""`. |
| `Conversation` | `name` `String?` | `title` `String?` | Two label columns. |
| `ForumCategory` | `order` `Int` | `sortOrder` `Int` | Two ordering columns. This is why `ForumCategory` is excluded from the `sortOrder` revert in section 6. |
| `TicketMessage` | `message` `String` | `content` `String` | `compass-modules.ts` writes both: `message: content`. |
| `TicketMessage` | `isAdmin` `Boolean` | `isStaff` `Boolean` | `compass-modules.ts` writes both: `isAdmin: isStaff`. |
| `TicketMessage` | `senderId` `String` | `userId` `String` | `compass-modules.ts` writes both from the same session user id. |

`TicketMessage` is the worst case: six columns representing three concepts, all kept in sync only by the application remembering to write both halves of each pair.

One near-miss that is **not** a Compass shadow: `SyllabusLesson` has both `durationMin` `Int?` and `durationLabel` `String?`, but Compass `Lesson` has neither — it has a single `duration`. Both Edith columns are additions, and section 6 item 13 renames `durationLabel` to `duration` to restore the Compass name while `durationMin` stays as an Edith extra.

Resolving these duplicates is not part of Phase 2. They are recorded because writing to only one half of a pair silently produces inconsistent rows.

## 8. Edith-only columns (164 across 42 tables)

Additions Edith made on top of Compass, mostly the CRM integration, the form/intake engine, multi-tenancy and payment plumbing. These are not drift and require no action. For `Program`, the comparison is against the union of `Course` and `FoundationProgram`.

| Edith table | Count | Columns |
|---|---|---|
| `Announcement` | 1 | `organizationId` |
| `Application` | 8 | `answersJson`, `applicantId`, `crmApplicationId`, `crmLeadId`, `formVersionId`, `intakeId`, `organizationId`, `programId` |
| `AssignmentSubmission` | 3 | `assignmentId`, `contentBody`, `programId` |
| `AudienceSegment` | 3 | `isActive`, `organizationId`, `rules` |
| `AuditLog` | 5 | `entityId`, `entityType`, `organizationId`, `userAgent`, `userId` |
| `Badge` | 3 | `iconUrl`, `isActive`, `organizationId` |
| `BloomsAnalysis` | 7 | `analysis`, `content`, `lessonId`, `organizationId`, `programId`, `scores`, `status` |
| `Certificate` | 5 | `certificateCode`, `issuedAt`, `organizationId`, `programId`, `title` |
| `CertificateTemplate` | 3 | `organizationId`, `previewUrl`, `templateJson` |
| `CliftonAssessment` | 4 | `completedAt`, `organizationId`, `results`, `status` |
| `Conversation` | 3 | `lastMessageAt`, `organizationId`, `title` |
| `ConversationParticipant` | 1 | `joinedAt` |
| `Coupon` | 1 | `organizationId` |
| `CourseAssessmentAttempt` | 6 | `answers`, `maxScore`, `metadata`, `organizationId`, `programId`, `startedAt` |
| `CourseMcq` | 3 | `organizationId`, `programId`, `title` |
| `EmailCampaign` | 3 | `audience`, `organizationId`, `templateId` |
| `EmailLog` | 5 | `campaignId`, `errorMessage`, `organizationId`, `providerId`, `toEmail` |
| `EmailTemplate` | 3 | `bodyHtml`, `bodyText`, `organizationId` |
| `Enrollment` | 6 | `crmCallbackAt`, `crmLeadId`, `crmRequestedAt`, `enrolledAt`, `organizationId`, `programId` |
| `ForumCategory` | 4 | `organizationId`, `programId`, `slug`, `sortOrder` |
| `ForumReply` | 1 | `isAnswer` |
| `ForumThread` | 1 | `programId` |
| `Group` | 2 | `isActive`, `organizationId` |
| `GroupMessage` | 1 | `authorId` |
| `Installment` | 3 | `label`, `organizationId`, `userId` |
| `IpRule` | 3 | `ipAddress`, `isActive`, `organizationId` |
| `LessonMcq` | 2 | `organizationId`, `programId` |
| `LessonMcqAttempt` | 2 | `answers`, `maxScore` |
| `Notification` | 2 | `body`, `href` |
| `NotificationPreference` | 5 | `categories`, `emailEnabled`, `organizationId`, `pushEnabled`, `smsEnabled` |
| `Organization` | 5 | `logoUrl`, `name`, `primaryColor`, `sortOrder`, `timezone` |
| `Payment` | 12 | `applicationId`, `enrollmentId`, `failureReason`, `metadataJson`, `organizationId`, `paidAt`, `programId`, `providerOrderId`, `providerPaymentId`, `providerSignature`, `purpose`, `receiptUrl` |
| `PaymentSettings` | 7 | `configJson`, `convenienceFeePercent`, `currency`, `gstPercent`, `organizationId`, `razorpayEnabled`, `stripeEnabled` |
| `PermissionRole` | 1 | `organizationId` |
| `Program` | 20 | `applicationFee`, `campusId`, `capacity`, `category`, `courseType`, `crmCatalogId`, `degreeLevel`, `departmentId`, `eligibilitySummary`, `formDefinitionId`, `imageUrl`, `name`, `organizationId`, `programKind`, `requiredDocs`, `requiresCrmCallback`, `status`, `summary`, `tuitionAmount`, `tuitionCurrency` |
| `ProgramOffer` | 1 | `organizationId` |
| `SyllabusLesson` | 8 | `contentBody`, `contentType`, `durationLabel`, `durationMin`, `isPublished`, `lessonType`, `sortOrder`, `summary` |
| `SyllabusModule` | 3 | `sortOrder`, `summary`, `syllabusId` |
| `Ticket` | 2 | `organizationId`, `paymentId` |
| `TicketMessage` | 3 | `content`, `isStaff`, `userId` |
| `User` | 2 | `passwordHash`, `permissionRoleId` |
| `UserGroup` | 1 | `joinedAt` |

## 9. Enum parity

`compass_dev` has 33 enums, `edith_dev` has 43. 32 names appear in both, and Edith is a **strict superset** in every case where labels differ, so any Compass value casts cleanly into the Edith enum.

| Enum | compass_dev labels | edith_dev labels | Superset |
|---|---|---|---|
| `ApplicationStatus` | 6: `DRAFT`, `SUBMITTED`, `PAYMENT_PENDING`, `PAID`, `LOCKED`, `CHANGE_REQUESTED` | 15: `DRAFT`, `SUBMITTED`, `DOCUMENT_VERIFICATION`, `UNDER_REVIEW`, `INTERVIEW`, `DECISION_PENDING`, `OFFERED`, `REJECTED`, `WAITLISTED`, `FEE_REQUESTED`, `ENROLLED`, `PAYMENT_PENDING`, `PAID`, `LOCKED`, `CHANGE_REQUESTED` | yes |
| `EnrollmentStatus` | 3: `ACTIVE`, `COMPLETED`, `DROPPED` | 5: `PENDING`, `ACTIVE`, `CANCELLED`, `COMPLETED`, `DROPPED` | yes |
| `PaymentProvider` | 3: `STRIPE`, `RAZORPAY`, `UPI` | 5: `MOCK`, `RAZORPAY`, `OFFLINE`, `STRIPE`, `UPI` | yes |
| `PaymentStatus` | 3: `PENDING`, `PAID`, `OVERDUE` | 10: `CREATED`, `PENDING`, `PAID`, `FAILED`, `REFUNDED`, `CANCELLED`, `OVERDUE`, `SUBMITTED`, `ACTION_REQUIRED`, `SUCCESS` | yes |

Compass-only enums: `AssignmentStatus`. `AssignmentStatus` corresponds to Edith `AssignmentSubmissionStatus`, which adds `DRAFT` and `SUBMITTED`.

Edith-only enums (11): `AssignmentSubmissionStatus`, `CrmSyncAction`, `CrmSyncStatus`, `DegreeLevel`, `LessonContentType`, `ProgramCategory`, `ProgramKind`, `ProgramStatus`, `QuizStatus`, `Role`, `SyllabusStatus`.

## 10. Documented, deliberately not changed

### Table names (all 8)

No table is renamed. Two of the eight are not renames at all:

- **`PermissionRole` cannot become `Role`.** Edith already has a `Role` *enum* (`SUPER_ADMIN`, `ADMISSIONS_MANAGER`, `COUNSELOR`, `CONTENT_UPLOADER`, `STUDENT`), and Prisma forbids a model and an enum sharing a name. Compass has no `Role` enum; it uses a free-text `User.role` defaulting to `"learner"`. The schema comment at `apps/web/prisma/schema.prisma` already records this: `// --- Compass PermissionRole (DB table Role) ---`.
- **`Program` is a merge, not a rename.** Edith combined Compass `Course` and `FoundationProgram` into one table discriminated by `programKind` (`COURSE` | `FOUNDATION`). Reverting would be a table split, converting every `programId` foreign key into a nullable `courseId` plus `foundationProgramId` pair across 386 occurrences in 56 files.
- **`Organization` is not really `Domain`.** Compass `Domain` is a marketing grouping (`subtitle`, `icon`, `bgColor`, `gradient`, `heroImage`, `school`) that only joins to `Course`. Edith `Organization` is the multi-tenant root that 37 tables scope by `organizationId`, 602 occurrences in 65 files. Compass has **zero** tenant columns anywhere, so there is no Compass field this drifts from.

### Structural column differences

These 11 differences follow from the table-shape decisions above, so they cannot be reverted without also reverting the table names.

Six tables replace Compass `courseId` with Edith `programId`, all a consequence of the `Course` to `Program` merge: `AssignmentSubmission` (nullable in Edith), `Certificate`, `CourseAssessmentAttempt`, `ForumThread`, `LessonMcq`, and `Enrollment` (which already keeps Compass `foundationProgramId` alongside).

The remaining five:

- `Course.domainId` becomes `Program.organizationId`, following the `Domain` to `Organization` difference.
- `Module.courseId` becomes `SyllabusModule.syllabusId`, because Edith inserts a `ProgramSyllabus` layer where Compass links modules straight to a course.
- `Lesson.courseId` has no Edith column at all; Edith reaches the program through `module.syllabus`.
- `AdmissionApplication.userId` becomes `Application.applicantId`.
- `User.role` (Compass free text, default `"learner"`) becomes a `Membership.role` join typed by the Edith `Role` enum.

### Columns with no Edith equivalent

- `CliftonAssessment.topThemes` (`Json`): no Edith equivalent
- `Ticket.transactionId` (`String?`): Edith has no Ticket-to-Payment link
- `AdmissionApplication.academicDetails` (`Json?`): collapsed into Edith `answersJson`
- `AdmissionApplication.addressDetails` (`Json?`): collapsed into Edith `answersJson`
- `AdmissionApplication.contactDetails` (`Json?`): collapsed into Edith `answersJson`
- `AdmissionApplication.courseSelection` (`Json?`): collapsed into Edith `answersJson`
- `AdmissionApplication.documents` (`Json?`): collapsed into Edith `answersJson`
- `AdmissionApplication.entranceExamDetails` (`Json?`): collapsed into Edith `answersJson`
- `AdmissionApplication.parentDetails` (`Json?`): collapsed into Edith `answersJson`
- `AdmissionApplication.personalDetails` (`Json?`): collapsed into Edith `answersJson`
- `AdmissionApplication.schoolProgramId` (`String`): no Edith equivalent
- `Course.isPublished` (`Boolean`): Edith models publication as the `ProgramStatus` enum in `status`
- `Course.thumbnail` (`String?`): no Edith equivalent on Program
- `FoundationProgram.admissionFee` (`Float?`): no Edith equivalent
- `FoundationProgram.campus` (`String?`): Edith models campuses as a separate `Campus` table
- `FoundationProgram.isPublished` (`Boolean`): Edith models publication as `ProgramStatus`
- `FoundationProgram.thumbnail` (`String?`): no Edith equivalent on Program

## 11. Preventing future drift

The rule that matters going forward: when adding a column to `edith_dev` that already exists in `compass_dev`, use the Compass name. Do not invent a synonym. Every entry in section 5 marked **rename** and every pair in section 7 exists because a synonym was introduced where a Compass name was already available.
