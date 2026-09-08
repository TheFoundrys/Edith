# Edith — Intelligent Platform Features

**Edith — Map Your Future.**  
A product of The Foundrys.

Paths below are live application routes. On a deployed instance they sit on the public origin (for example `https://your-domain/student/dashboard`). `:id`, `:slug`, and similar tokens are identifiers for a specific record.

---

## Learning & Personalisation

| Feature | Route |
|---------|--------|
| Continue-learning intelligence | `/student/dashboard` · `/student/my-courses` · `/student/my-courses/:course-id` |
| Learning progress intelligence | `/student/progress` · `/student/dashboard` · `/admin/syllabus/:programId/progress` |
| Weekly learning activity tracking | `/student/dashboard` |
| Learning streak system | `/student/dashboard` · `/student/achievements` |
| Intelligent course recommendations | `/student/recommendations` · `/student/dashboard` · `/student/enroll` |
| Interest / tag-based programme matching | `/student/recommendations` · `/courses?q=` |
| Similar-programme recommendations | `/student/recommendations` |
| AI in-lesson tutor | `/student/learning/:course-id/lessons/:lesson-id` |
| Context-aware AI tutor (lesson / syllabus) | `/student/learning/:course-id/lessons/:lesson-id` |

Related: `/student/learning/:course-id` (course outline) · `/student/deadlines` · `/admin/plugins/ai`

---

## Edith Personality Profile

| Feature | Route |
|---------|--------|
| Unified aptitude + quantitative + qualitative assessment | `/personality-profile` · `/student/personality-profile` |
| Single-sitting assessment experience | `/student/personality-profile` |
| Section-level assessment progression | `/student/personality-profile/take/:section` |
| Cross-section personality / aptitude analysis | `/student/personality-profile/report` |
| Automatically generated personality report | `/student/personality-profile/report` |
| Career / self-insight report generation | `/student/personality-profile/report` |

Related: `/enroll/edith-personality-profile` · `/courses/edith-personality-profile` · `/checkout?course=edith-personality-profile`

---

## Credentials

| Feature | Route |
|---------|--------|
| Automatic programme-completion certificates | `/student/certificates` |
| Unique credential verification codes | `/verify/:certificateId` · `/student/certificates/:certificate-id` |
| Personal certificate gallery | `/student/certificates` |
| Printable credential experience | `/student/certificates/:certificate-id` |

Related: `/student/achievements` (streaks, completions, certificates together)

---

## Admissions Intelligence

| Feature | Route |
|---------|--------|
| Dynamic application form engine | `/admin/forms` · `/admin/forms/:id` · `/student/applications/:id` |
| Conditional application questions | `/admin/forms/:id` · `/student/applications/:id` |
| Versioned application forms | `/admin/forms/:id` |
| Programme-specific forms | `/admin/programs/:id` · `/admin/forms/:id` |
| Configurable application lifecycle | `/admin/applications` · `/admin/applications/:id` |
| Application state enforcement | `/admin/applications/:id` |
| Application document verification workflow | `/admin/applications/:id` |
| CRM-gated enrollment | `/enroll/:slug` · `/student/my-courses` · `/admin/programs/:id` |
| CRM approval before learning access | `/student/my-courses` · `/student/learning/:course-id` |
| Application-to-enrollment state machine | `/student/applications` · `/student/applications/:id` · `/admin/applications/:id` |

Related: `/student/applications` (learner inbox) · `/admin/enrollments`

---

## Cohort & Intake Intelligence

| Feature | Route |
|---------|--------|
| Multiple intakes per programme | `/admin/programs/:id` · `/courses/:slug/intakes` |
| Capacity-controlled intakes | `/admin/programs/:id` |
| Application-window control | `/admin/programs/:id` |
| Public intake availability | `/courses/:slug` · `/courses/:slug/intakes` |
| Intake-specific enrollment handling | `/enroll/:slug` · `/student/applications` |

---

## Programme Intelligence

| Feature | Route |
|---------|--------|
| Visual syllabus builder | `/admin/syllabus` · `/admin/syllabus/:programId` |
| Module / lesson publishing control | `/admin/syllabus/:programId` |
| Per-lesson visibility | `/admin/syllabus/:programId` |
| Programme-level learner progress intelligence | `/admin/syllabus/:programId/progress` |
| Programme-specific CRM gating | `/admin/programs/:id` |
| Programme-specific merchandising metadata | `/admin/programs` · `/admin/programs/new` · `/admin/programs/:id` |

Related public catalogue: `/courses` · `/courses/:slug`

---

## AI Content Creation

| Feature | Route |
|---------|--------|
| AI assignment generation from syllabus | `/admin/assignments/new` · `/admin/assignments/:id` |
| AI quiz generation from syllabus | `/admin/quizzes/new` · `/admin/quizzes/:id` |
| Context-aware content authoring | `/admin/assignments/:id` · `/admin/quizzes/:id` · `/admin/syllabus/:programId` |
| Organisation-controlled AI | `/admin/plugins/ai` |
| Configurable AI provider / model | `/admin/plugins/ai` |
| AI connection testing | `/admin/plugins/ai` |
| Offline / mock AI mode | `/admin/plugins/ai` |

Learner-facing tutor: `/student/learning/:course-id/lessons/:lesson-id`

---

## Advanced Access Control

| Feature | Route |
|---------|--------|
| Capability-based permissions | `/admin/members/roles` · `/admin/members/roles?view=permissions` |
| Custom permission matrix | `/admin/members/roles` |
| Permission labels | `/admin/members/roles` · `/admin/members` |
| Role + capability hybrid authorization | `/admin/members` · `/admin/members/roles` |
| Organisation-scoped access control | `/admin/members` · `/login` |
| Membership-based learning access | `/admin/members` · `/student/my-courses` |
| Automatic access expiry / suspension | `/admin/members` |

Related: `/admin/members/invites` · `/admin/members/activity` · `/admin/members/groups`

---

## CRM-Aware Enrollment

| Feature | Route |
|---------|--------|
| Outbound application sync | `/admin/applications/:id` (CRM IDs and sync log) |
| Application status sync | `/admin/applications/:id` |
| CRM approval / rejection callback | `POST /api/crm/enrollment-callback` |
| CRM-controlled learning unlock | `/student/my-courses` · `/student/learning/:course-id` · `/payment/success` |
| CRM sync audit trail | `/admin/applications/:id` |
| Environment-configurable CRM adapters | `/admin/programs/:id` (`requiresCrmCallback`, CRM catalog ID) |

---

## Commerce Intelligence

| Feature | Route |
|---------|--------|
| Personalised pricing offers | `/admin/offers` |
| Coupon rules | `/admin/coupons` |
| Application-fee + programme-fee unified payment stack | `/checkout` · `/student/payment` · `/student/applications/:id` · `/admin/payments` |
| GST-aware pricing | `/admin/payment-settings` |
| Offline payment reconciliation through UTR | `/admin/applications/:id` |
| Automated invoice generation | `/student/payment` · `/student/payment/invoices/:paymentId` · `/admin/payments` · `/admin/payments/invoices/:paymentId` |
| Payment-state-aware enrollment | `/enroll/:slug` · `/checkout` · `/payment/success` · `/payment/failed` · `/student/my-courses` |

Related: `POST /api/payments/razorpay/webhook`

---

## Form & Workflow Engine

| Feature | Route |
|---------|--------|
| No-code form builder | `/admin/forms` · `/admin/forms/:id` |
| Conditional logic engine | `/admin/forms/:id` · `/student/applications/:id` |
| Draft → publish form versioning | `/admin/forms/:id` |
| Reusable forms across programmes | `/admin/forms/:id` · `/admin/programs/:id` |
| Configurable application workflow | `/admin/applications` · `/admin/applications/:id` |
| Enforced workflow transitions | `/admin/applications/:id` |

---

## Platform Extensibility

| Feature | Route |
|---------|--------|
| Public programme catalogue API | `GET /api/catalog/courses` · `GET /api/catalog/courses/:slug` · `GET /api/catalog/filters` · `GET /api/catalog/categories` · `GET /api/catalog/dump` |
| Admin programme management API | `GET/POST /api/catalog/admin/courses` · `GET/PATCH /api/catalog/admin/courses/:id` · `PATCH /api/catalog/admin/courses/:id/status` |
| CRM adapter architecture | `POST /api/crm/enrollment-callback` |
| Payment webhook architecture | `POST /api/payments/razorpay/webhook` |
| Enrollment callback architecture | `POST /api/crm/enrollment-callback` |
| Health / monitoring endpoint | `GET /api/health` |

---

## Quick map by workspace

| Workspace | Entry |
|-----------|--------|
| Public catalogue | `/` · `/courses` · `/personality-profile` |
| Learner | `/student/dashboard` |
| Admissions & forms | `/admin/applications` · `/admin/forms` |
| Programmes & syllabus | `/admin/programs` · `/admin/syllabus` |
| People & access | `/admin/members` · `/admin/members/roles` |
| Commerce | `/admin/payments` · `/admin/payment-settings` |
| AI | `/admin/plugins/ai` |
| Leadership | `/admin` · `/admin/enrollments` · `/admin/analytics/enrollments` |

---

*Edith — Map Your Future.*
