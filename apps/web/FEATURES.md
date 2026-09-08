# Edith (Foundryxs) — Current Feature Inventory

**Product:** Edith — Map Your Future.  
**Organisation:** The Foundrys  
**Last updated:** August 2026  
**Scope:** `apps/web` — all routes, actions, APIs, and integrations currently implemented.

---

## Table of contents

1. [Platform overview](#1-platform-overview)
2. [User roles & permissions](#2-user-roles--permissions)
3. [Marketing & public site](#3-marketing--public-site)
4. [Authentication & account security](#4-authentication--account-security)
5. [Student LMS](#5-student-lms)
6. [Enrollment & payments (student)](#6-enrollment--payments-student)
7. [Admissions & applications (student)](#7-admissions--applications-student)
8. [Admin / staff workspace](#8-admin--staff-workspace)
9. [Payments & commerce](#9-payments--commerce)
10. [CRM & external integrations](#10-crm--external-integrations)
11. [AI features](#11-ai-features)
12. [REST API](#12-rest-api)
13. [UI & platform infrastructure](#13-ui--platform-infrastructure)
14. [Data model (entities)](#14-data-model-entities)
15. [Partial / stub / not yet wired](#15-partial--stub--not-yet-wired)

---

## 1. Platform overview

| Area | Routes (approx.) | Description |
|------|------------------|-------------|
| Marketing | 10+ | Public catalogue, course landing, legal, checkout shells |
| Auth | 4 | Login, register, forgot/reset password |
| Student LMS | 30+ | Dashboard, learning, assessments, applications, support |
| Admin | 30+ | Programs, syllabus, admissions, members, commerce, AI |
| API | 13 | Catalog, auth, payments webhook, CRM callback, health |

**Tech stack (high level):** Next.js App Router, NextAuth credentials, Prisma, server actions, Razorpay (optional), local file storage for uploads.

---

## 2. User roles & permissions

### 2.1 Built-in roles

| Role | Label | Domain | Typical use |
|------|-------|--------|-------------|
| `SUPER_ADMIN` | Super Administrator | Admin | Full org control, system keys, audit, staff access |
| `ADMISSIONS_MANAGER` | Academic Dean / Head | Academic | Catalog, syllabi, admissions, exams, faculty allocation |
| `BURSAR` | Bursar & Finance | Finance | Tuition, scholarships, refunds, payment reconciliation |
| `COUNSELOR` | Admissions Staff | Intake | Applications, intakes, counselling follow-ups |
| `CONTENT_UPLOADER` | Lead Faculty / Teachers | Faculty | Catalog, syllabi, curriculum, examination materials |
| `STUDENT` | Student | Learning | Learning workspace only |

Staff = any role except `STUDENT`. Middleware blocks staff from `/student/*` and students from `/admin/*`.

### 2.2 Capabilities (fine-grained)

| Capability | What it gates |
|------------|---------------|
| `managePricing` | Coupons, offers, payments, program pricing fields (Bursar) |
| `managePrograms` | Create/edit/publish programs, intakes (Dean and Faculty) |
| `manageContent` | Syllabus, assignments, quizzes, announcements, badges, forums (Dean and Faculty) |
| `manageApplications` | Application inbox, review, tickets (Dean and Admissions Staff) |
| `manageForms` | Form builder, form versions (Dean and Admissions Staff) |
| `manageAiPlugins` | AI plugin configuration (Super Administrator) |
| `manageMembers` | Members table, role assignment, expiry (Super Administrator and Dean) |
| `learnAsStudent` | Student LMS access |

Capabilities are stored per org in a **capability matrix** (`PermissionRole` rows). Defaults come from code; Super Admin can customise via **Admin → Members → Roles & access**.

### 2.3 Permission roles (custom)

- Create / rename / delete custom permission role labels (non-system roles)
- Assign multiple permission roles to a member
- Toggle individual capabilities per role
- Reset role to default capability set
- Legacy redirect: `/admin/roles` → `/admin/members/roles`

### 2.4 Session & route protection

- JWT session via NextAuth
- Stale session recovery: `/api/auth/clear-stale` (after DB reseed)
- Protected routes: `/admin/*`, `/student/*`, `/enroll/*`, `/checkout`
- Logged-in users redirected away from auth pages to their workspace
- `callbackUrl` preserved through login/register for deep links (e.g. enroll flow)

---

## 3. Marketing & public site

### 3.1 Homepage (`/`)

- Full-viewport hero with brand headline and CTAs
- Session-aware CTA: Browse courses / Continue learning / Sign in
- Live stats from database (learners, instructors, courses, certificates, satisfaction estimate)
- Social proof row (recent enrollment avatars)
- Feature bar (instructors, hybrid courses, certificates, community)
- Featured courses showcase (top courses by track priority + enrollment count)
- Bestseller / New badges on featured cards
- AI-style course visual illustrations per track
- Stats bar
- Testimonials infinite slider (curated static content)
- CTA band (register or dashboard)
- Vintage / film-grain / emblem visual layers
- Skip-to-content accessibility link
- Unified site header and full marketing footer on all pages

### 3.2 Site header (all public & workspace pages)

- Edith brand mark / wordmark
- Nav links: **Courses**, **Programs** (redirects to courses)
- Header search → `/courses?q=…`
- Login + Sign up buttons (guest)
- Workspace button when logged in (student dashboard or admin)
- Responsive layout (links collapse on mobile)
- Sticky header on inner pages; overlay header on homepage hero

### 3.3 Site footer

- Brand + tagline
- Link groups: Platform, Resources, Company
- Newsletter signup form (**UI only — no backend persistence**)
- Privacy, Terms, Contact mailto
- Max-width aligned with header grid

### 3.4 Course catalogue (`/courses`)

- Grid of published programs (single source of truth via catalog service)
- **Course Finder filters:**
  - Suite (program category)
  - Duration bucket
  - Experience tier
  - Text search (`q`)
- Filter index built from live published catalog
- Result count (“Showing X of Y”)
- Empty state when no matches
- Course cards: track illustration, duration, department, campus, pricing hints, category

### 3.5 Course detail / landing (`/courses/[slug]`)

- Breadcrumbs: Courses → category → title
- Hero: title, description, stats (learners, level, certificate)
- Quick facts: format, start date, duration, certificate
- Track-themed hero illustration
- **What you'll learn** — learning outcomes grid
- **The Edith Way** — methodology modules (syllabus sections without lessons, or all sections when no lesson modules exist)
- **Course curriculum** — accordion of published syllabus modules with published lessons
- **What you'll get** / **Career outcomes** panels
- Sidebar pricing card with enrollment CTAs
- Open intakes list (name + close date)
- Enrollment state–aware CTAs:
  - Guest → Sign in / Create account (with `callbackUrl`)
  - Student → Enroll now
  - Active enrollment → Go to my course
  - Pending CRM → View enrollment status
  - Pending payment → Complete payment
  - Staff → Staff workspace link
- Bottom CTA band (mirrors sidebar actions)

### 3.6 Redirects & aliases

- `/programs` → `/courses`
- `/programs/[slug]` → `/courses/[slug]`

### 3.7 Legal pages

- `/legal/privacy` — Privacy policy (static)
- `/legal/terms` — Terms of service (static)

### 3.8 Brand / dev pages

- `/logo` — Logo and emblem motion demo page

---

## 4. Authentication & account security

### 4.1 Login (`/login`)

- Email + password (credentials provider)
- Redirect: staff → `/admin`, student → `/student/dashboard`
- Optional `callbackUrl` for return after auth
- Branded auth shell layout

### 4.2 Registration (`/register`)

- Name, email, password (strength validation)
- Terms & privacy consent checkbox
- Creates user + `STUDENT` membership
- Can be disabled via `ALLOW_PUBLIC_REGISTRATION=false`
- Preserves `callbackUrl`

### 4.3 Forgot password (`/forgot-password`)

- Email input → hashed reset token stored in DB
- **Production:** no email delivery (token logged only)
- **Development:** reset URL returned in response for testing

### 4.4 Reset password (`/reset-password?token=…`)

- Token validation
- New password with rules
- Token invalidation after use

### 4.5 Password change (student)

- `/student/settings` — change password with current password verification

---

## 5. Student LMS

### 5.1 Workspace shell

- Sidebar navigation (capability-free; all enrolled students)
- **Learn group:** Dashboard, My Learning, Courses (enroll), Certificates, Assessments
- **Community group:** Forums, Messages (announcements), Settings
- User menu with profile link
- Unified Edith header above sidebar
- Vintage workspace backdrop
- Sign out

**Implemented but not in sidebar:** Notifications, Tickets, Payment, Progress, Submissions, Applications, Profile sub-routes (reachable via links/URLs)

### 5.2 Dashboard (`/student/dashboard`)

- Personalised greeting
- Overall progress percentage across active courses
- Completed course count
- **Continue learning** hero card (next lesson deep link + course art)
- Per-course progress track with % bars
- **Weekly study goal** widget
- Hours this week, total hours, streak days
- Active-day activity chart
- **Assignment deadlines** widget
- **Achievements** (certificates, streak milestones, recent completions)
- **Recommended for you** horizontal scroll (catalog recommendations)
- Link to browse programs / enroll
- Link to customise (settings)

### 5.3 My courses (`/student/my-courses`)

- Grid of enrollments: ACTIVE + PENDING (CRM + payment due)
- LMS course cards with progress, continue links
- Pending CRM badge and status panel
- Payment due badge with link to checkout
- “Outline coming soon” for unpublished syllabus
- Link to browse catalog

### 5.4 Course hub (`/student/my-courses/[course-id]`)

- Course title, description, campus/department
- Progress bar (% activities complete)
- Module/section summary with completion counts
- Continue learning / Full outline buttons
- Pending CRM blocking panel when applicable
- All courses back link

### 5.5 Enroll catalog (`/student/enroll`)

- Published courses not yet enrolled
- Uses same catalog service as public `/courses`
- Recommended courses track
- Links to public catalog and per-course enroll/checkout

### 5.6 Learning player

#### Course outline (`/student/learning/[course-id]`)

- Module → lesson tree (published syllabus only)
- Continue button to next incomplete lesson
- Requires ACTIVE enrollment

#### Lesson player (`/student/learning/[course-id]/lessons/[lesson-id]`)

- **Content types:**
  - `RICH_TEXT` — markdown rendering
  - `VIDEO_URL` — YouTube/Vimeo embed
  - `EXTERNAL_LINK` — outbound link
- Mark complete / mark incomplete toggle
- Previous / next lesson navigation
- **AI lesson tutor chat** (when org AI plugin enabled)
- Auto-certificate trigger when all lessons complete

#### Legacy redirects

- `/student/learn/*` → `/student/learning/*`

### 5.7 Progress (`/student/progress`)

- Per-enrollment completion bars
- Activity counts (done / total)

### 5.8 Assessments hub (`/student/assessments`)

- Combined list of open assignments + available quizzes
- Deep links to each item

### 5.9 Assignments

| Route | Features |
|-------|----------|
| `/student/assignments` | List published assignments for enrolled programs, due dates, submission status |
| `/student/assignments/[assignment-id]` | Read brief, text submission (min 10 chars), one-time submit lock |
| `/student/submissions` | History of submitted assignments with grades when graded |

**Note:** Standalone assignments are text-only in UI (no file upload on assignment submit).

### 5.10 Quizzes

| Route | Features |
|-------|----------|
| `/student/quizzes` | List published quizzes for enrolled programs |
| `/student/quizzes/[id]` | MCQ form, immediate score on submit, single-attempt flow |

### 5.11 Certificates

| Route | Features |
|-------|----------|
| `/student/certificates` | List earned certificates |
| `/student/certificates/[certificate-id]` | Printable-style view with unique certificate code |

- **Auto-issued** when all published syllabus lessons are marked complete
- No PDF export or template designer UI

### 5.12 Profile & settings

| Route | Features |
|-------|----------|
| `/student/profile` | Name, phone, username, headline, bio, theme, career path |
| `/student/settings` | Change password |

### 5.13 Notifications (`/student/notifications`)

- In-app notification list
- Mark single read / mark all read
- Created on enrollment confirmation and other events
- Action URLs deep-link to relevant pages

### 5.14 Announcements (`/student/announcements`)

- Org announcements (sidebar label: “Messages”)
- Pinned, priority, expiry filtering
- Read state tracking

### 5.15 Forums (`/student/forums`)

- List forum categories
- List recent threads
- Create new thread (category ID field — minimal UX)
- **No thread detail / reply UI** (partial)

### 5.16 Support tickets

| Route | Features |
|-------|----------|
| `/student/tickets` | Create ticket (subject, message, category), list own tickets |
| `/student/tickets/[id]` | Thread view, reply to ticket |

### 5.17 Recommendations engine

- Track/category/tag affinity scoring
- Jaccard similarity between courses
- Experience tier matching
- Used on dashboard and enroll page

### 5.18 Study stats engine

- Weekly hours, total hours, streak days computed from lesson completions
- Default 15 min credited when lesson has no duration set
- Active-day chart on dashboard

---

## 6. Enrollment & payments (student)

### 6.1 Enroll page (`/enroll/[slug]`)

- Requires student login
- Shows course fee (free or priced)
- Free → one-click enroll button
- Paid → link to checkout
- CRM requirement notice when `requiresCrmCallback`
- Pending CRM status panel
- Pending payment resume panel
- Redirect to my course if already ACTIVE

### 6.2 Checkout (`/checkout?course=slug`)

- Paid: Razorpay popup or mock one-click pay
- Free: confirm enrollment button
- Terms link
- Redirect if already enrolled

### 6.3 Payment result pages

| Route | Features |
|-------|----------|
| `/payment/success` | Success message, enrollment reference, links to dashboard / learning / CRM pending status |
| `/payment/failed` | Failure message, retry guidance |

### 6.4 Payment center (`/student/payment`)

- Lists paid courses awaiting checkout completion
- Links to checkout and enroll review

### 6.5 Enrollment states handled in UI

| State | Behaviour |
|-------|-----------|
| Not enrolled | Enroll / Sign in CTAs |
| ACTIVE | Continue learning, my courses |
| PENDING + CRM | Awaiting CRM confirmation panels |
| PENDING + unpaid | Payment due, resume checkout |
| CANCELLED | Checkout can re-open enrollment |

### 6.6 Free enrollment

- Immediate ACTIVE enrollment
- Or PENDING + CRM callback when program requires it
- Enrollment confirmation notification

---

## 7. Admissions & applications (student)

### 7.1 Applications list (`/student/applications`)

- User's applications with status badges and timeline labels
- **Open for applications** — programs with published form + active intake
- Start application button (intake picker when multiple intakes)

### 7.2 Application detail (`/student/applications/[id]`)

- Multi-section dynamic form driven by published form schema
- Field types: text, email, phone, select, date, textarea, checkbox, **file upload**
- Conditional fields (`showIf` rules)
- Section navigation + progress stepper
- Save draft
- Review mode before submit
- Attestation confirm dialog on submit
- Status timeline (events)
- Read-only after submission
- **Application fee payment panel** when status is fee-requested (Razorpay or mock)
- Document upload to local storage

### 7.3 Application workflow statuses

15 states with enforced transitions, e.g.:

`DRAFT` → `SUBMITTED` → review states → `OFFERED` / `FEE_REQUESTED` → `PAID` → `ENROLLED` → `LOCKED` / `REJECTED` / etc.

Labels surfaced in UI via `APPLICATION_STATUS_LABELS`.

---

## 8. Admin / staff workspace

### 8.1 Admin overview (`/admin`)

- Stat cards: enrollments, revenue, users, courses (from DB)
- Enrollment line chart (this week vs last week)
- Donut charts: program categories, member roles
- Recent enrollments table
- Recent courses table
- System overview panel (storage/uptime-style metrics)
- Insights banner with change %
- **Export Report button — UI only, no export action** (stub)

### 8.2 Programs (`/admin/programs`)

| Route | Features |
|-------|----------|
| List | Cards: status, category, price, intake count, application count, syllabus status, edit/syllabus/view live links |
| `/new` | Create program: category, degree, campus, department, pricing, CRM fields, form attachment, etc. |
| `/[id]` | Edit all core fields, publish/archive, image upload + preview |

**Program detail fields include:**

- Title, slug, summary, eligibility, category, degree level
- Price, application fee, currency, capacity
- Campus, department, application form
- Required documents list
- CRM catalog ID, `requiresCrmCallback` toggle
- Compass extended fields: SKU, tags, learning outcomes, hybrid flags, brochure URL, entrance exam flag, duration, location, specialization, domain slug
- **Intake management:** create, toggle active/inactive, capacity, application open/close dates
- Pricing fields gated by `managePricing` capability
- Next steps checklist (syllabus, intakes, publish)

### 8.3 Syllabus (`/admin/syllabus`)

| Route | Features |
|-------|----------|
| List | All programs with syllabus status, section counts, create/edit/progress links |
| `/[programId]` | Full syllabus editor |
| `/[programId]/progress` | Per-learner completion % across published lessons |

**Syllabus editor features:**

- Create / edit title and description
- Publish / unpublish / archive syllabus
- **Sections (modules):** create, edit, delete, reorder (up/down)
- **Activities (lessons):** create, edit, delete, reorder
- Lesson content types: Rich text, Video URL, External link
- Per-lesson publish toggle (“Visible to enrolled students”)
- Duration in minutes
- Markdown hint for rich text
- Draft status badge + publish guidance

### 8.4 Assignments (`/admin/assignments`)

| Route | Features |
|-------|----------|
| List | All assignments |
| `/new`, `/[id]` | Title, description, due date, publish flag, program picker |
| | **AI draft generation** (topic + difficulty) when AI plugin enabled |

**Note:** Grading server action exists; **no dedicated admin grading UI**.

### 8.5 Quizzes (`/admin/quizzes`)

| Route | Features |
|-------|----------|
| List | All quizzes |
| `/new`, `/[id]` | Manual MCQ editor (questions + options + correct answer) |
| | **AI quiz draft** from syllabus outline |
| | Publish / archive status |

### 8.6 Forms (`/admin/forms`)

| Route | Features |
|-------|----------|
| List | All forms, version status, programs attached, create button |
| `/[id]` | Visual section/field builder |
| | All field types supported in student application |
| | Save draft version, publish version |
| | Attach form to program |

### 8.7 Applications inbox (`/admin/applications`)

| Route | Features |
|-------|----------|
| List | Search, filter by status/program, pagination |
| `/[id]` | Full application review |

**Application review features:**

- Applicant answers grouped by form section
- Status transition with allowed-state enforcement + notes
- Event timeline
- Document list with verify / unverify actions
- CRM lead ID and application ID display
- CRM sync log preview
- Offline fee recording (UTR/reference) when offered or fee-requested
- Payment history

### 8.8 Members (`/admin/members`)

- Tabs: **All**, **Members**, **Groups**
- Pagination, sort (account name, recent, expiry)
- Add member (email invite flow)
- Set staff enum role (Super Administrator, Academic Dean, Bursar, Admissions Staff, Lead Faculty, Student)
- Assign custom permission roles
- Set membership expiry (individual + bulk)
- Remove members
- Groups tab: lists DB groups (**read-only — limited group management**)

### 8.9 Roles & access (`/admin/members/roles`)

- View/edit capability matrix per role
- Create/update/delete custom permission roles
- Reset to defaults
- Permissions view: `?view=permissions`

### 8.10 Announcements (`/admin/announcements`)

- Create announcement: title, body, priority, pin, publish now
- List all announcements

### 8.11 Email templates (`/admin/email-templates`)

- Create template: name, subject, HTML body
- List templates
- **No send/campaign UI, no edit/delete in UI** (partial)

### 8.12 Forums (`/admin/forums`)

- Create forum category: name, slug, description
- List categories with thread counts

### 8.13 Badges (`/admin/badges`)

- Create badge (name, description, icon)
- Manually award badge to student by user ID
- **No student-facing badges gallery** (partial)

### 8.14 Support tickets (`/admin/tickets`)

| Route | Features |
|-------|----------|
| List | Org-wide ticket inbox |
| `/[id]` | Update status, staff reply, message thread |

### 8.15 Coupons (`/admin/coupons`)

- Create coupon: code, value, type (percentage/fixed), scope, expiry, max uses
- List coupons with usage counts
- **Not applied in student checkout UI yet** (admin + DB only)

### 8.16 Offers (`/admin/offers`)

- Custom priced offers per student/program (admissions pricing)

### 8.17 Payment settings (`/admin/payment-settings`)

- Default currency
- GST percentage
- Convenience fee percentage
- Enable/disable Razorpay
- Enable/disable Stripe (**toggle only — no Stripe adapter in code**)

### 8.18 AI plugins (`/admin/plugins/ai`)

- Select plugin: Mock (offline) or OpenAI-compatible
- Enable/disable org-wide
- Configure API key, base URL, model
- Test connection action

---

## 9. Payments & commerce

### 9.1 Payment adapters

| Adapter | When used |
|---------|-----------|
| **Mock** | Default in dev; `PAYMENT_ADAPTER=mock` or `ALLOW_MOCK_PAYMENTS=true` |
| **Razorpay** | Production; order creation, client checkout, signature verify, webhook |

### 9.2 Course fee flow

1. Student starts checkout → PENDING enrollment + payment record
2. Razorpay order or mock order created
3. On success → payment PAID, enrollment ACTIVE (or PENDING if CRM required)
4. Notification sent to student
5. Revalidation of dashboard, my courses, learning paths

### 9.3 Application fee flow

- Triggered when application reaches fee-requested / offered states
- Student: Razorpay or mock instant pay on application detail
- Admin: mark paid offline with UTR on review page
- Status integration with application workflow

### 9.4 Webhooks

- `POST /api/payments/razorpay/webhook` — verifies signature, completes course or application payments on `payment.captured`

### 9.5 Pricing helpers

- `coursePrice()` — price, else application fee, else free
- `isFreeCourse()` — boolean check
- Currency formatting (INR default in seed)

---

## 10. CRM & external integrations

### 10.1 CRM adapters

| Adapter | Behaviour |
|---------|-----------|
| **Mock** | Default; logs payloads, returns synthetic lead IDs |
| **CentraCRM / Foundrys / OneCRM** | Upsert lead, sync application status, counselor lookup, catalog ID matching |

All syncs logged to `CrmSyncLog`.

### 10.2 Outbound CRM sync

- On application submit
- On application status change
- On enrollment when `requiresCrmCallback` (free or paid)

### 10.3 Inbound CRM webhook

- `POST /api/crm/enrollment-callback` (Bearer secret)
- **Approve** → activate PENDING enrollment
- **Reject** → cancel enrollment

### 10.4 CRM-gated programs

- `requiresCrmCallback` flag on program
- Enrollment stays PENDING until CRM approves
- UI surfaces “Awaiting CRM confirmation” across my courses, course landing, payment success

---

## 11. AI features

### 11.1 Plugins

| Plugin | Description |
|--------|-------------|
| **Mock** | Deterministic local responses, no network |
| **OpenAI-compatible** | Real LLM via configurable base URL, model, API key |

Org settings stored in `AiPluginSetting`; configured in admin.

### 11.2 AI-powered features (when enabled)

| Feature | Location |
|---------|----------|
| Assignment draft generation | Admin assignment editor |
| Quiz draft generation | Admin quiz editor |
| Lesson tutor chat | Student lesson player |
| Connection test | Admin AI settings |

### 11.3 Schema-only AI models (no UI)

- `BloomsAnalysis`, `CourseMcq`, `LessonMcq`
- AI MCQ generation status enums
- Compass-ported assessment attempt tables

---

## 12. REST API

### 12.1 Public catalog

| Endpoint | Description |
|----------|-------------|
| `GET /api/catalog/courses` | Paginated published courses + filters (suite, duration, experience, category, q, sort) |
| `GET /api/catalog/courses/[slug]` | Single course detail |
| `GET /api/catalog/categories` | Category list |
| `GET /api/catalog/filters` | Available Course Finder filter options |
| `GET /api/catalog/dump` | Full catalog dump for indexing/mirroring |

### 12.2 Admin catalog API

| Endpoint | Capability | Description |
|----------|------------|-------------|
| `GET/POST /api/catalog/admin/courses` | `managePrograms` | List / create courses |
| `GET/PATCH /api/catalog/admin/courses/[id]` | `managePrograms` | Read / update course |
| `PATCH /api/catalog/admin/courses/[id]/status` | `managePrograms` | Publish / archive |

### 12.3 Auth & ops

| Endpoint | Description |
|----------|-------------|
| `GET/POST /api/auth/[...nextauth]` | NextAuth handlers |
| `GET /api/auth/clear-stale` | Clear invalid session cookie + redirect |
| `GET /api/health` | `{ status: "ok", uptime }` |

### 12.4 Integrations

| Endpoint | Description |
|----------|-------------|
| `POST /api/payments/razorpay/webhook` | Razorpay payment events |
| `POST /api/crm/enrollment-callback` | CRM enrollment approval/rejection |

---

## 13. UI & platform infrastructure

### 13.1 Layout shells

- Marketing shell (header + footer + optional peak art)
- Auth shell (login/register)
- Password page shell (forgot/reset)
- App shell (header + sidebar + footer for student/admin)
- Workspace sidebar (collapsible, icon mode, nav icons per route)

### 13.2 Shared UI components

- Buttons (variants: primary, secondary, ghost, danger; loading state)
- Inputs, labels, textareas, selects, field errors
- Badges (success, warning, danger, info, neutral)
- Panels, page headers, empty states
- Breadcrumbs, pagination, tabs
- Toasts / confirm dialogs
- Dropdown menus
- Sheet, sidebar (shadcn-style), tooltip, toggle, separator
- Infinite slider (homepage testimonials)
- LMS stat cards, metrics rail, section wrappers, page intro
- Admin: stat cards, donut charts, enrollment chart, recent tables, capability matrix editor

### 13.3 Visual / brand system

- Track-themed course illustrations (AI, cyber, data, quantum, blockchain, educators, general)
- Course visual tone classes per theme
- Vintage backdrop layers
- Film grain layer
- Peak art / emblem art for marketing and auth
- Brand mark / wordmark component
- CSS design tokens: home grid, course landing, LMS dashboard, admin dashboard themes

### 13.4 Catalog & program metadata

- Program categories and labels
- Catalog duration / experience / mode helpers
- Course Finder filter parsing and matching
- Track inference from title, tags, domain slug, category
- Admin course serialization for API
- Publish catalog script (seed/publish tooling)

### 13.5 File storage

- Local disk uploads for application documents
- Program image upload and preview
- Stored under `uploads/` via `lib/storage.ts`

### 13.6 Workflows

- Application status state machine with `canTransition()` enforcement
- CRM status mapping helpers

### 13.7 Members utilities

- Membership expiry labels and expired checks
- Bulk expiry actions

---

## 14. Data model (entities)

### 14.1 Core EDITH (actively used)

`Organization`, `User`, `Membership`, `MembershipRole`, `PermissionRole`, `Campus`, `Department`, `Program`, `Intake`, `Enrollment`, `ProgramSyllabus`, `SyllabusModule`, `SyllabusLesson`, `LessonProgress`, `FormDefinition`, `FormVersion`, `Application`, `ApplicationEvent`, `Document`, `Payment`, `Assignment`, `AssignmentSubmission`, `Quiz`, `QuizQuestion`, `QuizAttempt`, `Certificate`, `Notification`, `CrmSyncLog`, `AiPluginSetting`, `PasswordResetToken`

### 14.2 Compass-ported (schema exists; varying UI coverage)

`Announcement`, `AnnouncementRead`, `Badge`, `UserBadge`, `ForumCategory`, `ForumThread`, `ForumReply`, `ForumVote`, `Ticket`, `TicketMessage`, `Coupon`, `ProgramOffer`, `PaymentSettings`, `EmailTemplate`, `EmailCampaign`, `EmailLog`, `CertificateTemplate`, `Installment`, `Conversation`, `Message`, `Group`, `UserGroup`, `GroupMessage`, `AudienceSegment`, `AuditLog`, `IpRule`, `NotificationPreference`, `CliftonAssessment`, `BloomsAnalysis`, `CourseMcq`, `LessonMcq`, `CourseAssessmentAttempt`, `LessonMcqAttempt`

---

## 15. Partial / stub / not yet wired

| Feature | Status |
|---------|--------|
| Newsletter signup | UI-only; no list/backend |
| Password reset email | Token created; no email in production |
| Mock CRM / Mock payments / Mock AI | Dev defaults |
| Forum thread detail & replies (student) | Create/list only |
| Student badges gallery | Admin award only |
| Email campaigns / sends | DB schema only |
| Coupons at checkout | Admin create only |
| Stripe payments | Admin toggle only; no adapter |
| Installments | DB schema only |
| Assignment grading UI (admin) | Server logic partial; no UI |
| Direct messaging / group chat | DB schema only |
| Clifton / Bloom's assessments | DB schema only |
| AI MCQ course/lesson assessments | DB schema only |
| Certificate template designer | DB schema only |
| Admin dashboard Export Report | Button stub |
| Campus / department CRUD pages | Selected on programs; no standalone admin |
| Intake selection on direct enroll | Intakes displayed; not stored on enrollment |
| Capacity enforcement on enroll | Shown in UI; not enforced in checkout |
| Application form vs direct enroll | Two parallel paths; not fully unified |
| UPI / offline student self-serve payment | Limited; admin offline form on applications |
| Groups management (admin) | List only |
| Email template edit/delete | Create + list only |

---

## Route index (quick reference)

### Public / marketing
`/`, `/courses`, `/courses/[slug]`, `/programs`, `/programs/[slug]`, `/enroll/[slug]`, `/checkout`, `/payment/success`, `/payment/failed`, `/legal/privacy`, `/legal/terms`, `/logo`

### Auth
`/login`, `/register`, `/forgot-password`, `/reset-password`

### Student
`/student/dashboard`, `/student/my-courses`, `/student/my-courses/[course-id]`, `/student/enroll`, `/student/learning/[course-id]`, `/student/learning/[course-id]/lessons/[lesson-id]`, `/student/progress`, `/student/assessments`, `/student/assignments`, `/student/assignments/[assignment-id]`, `/student/submissions`, `/student/quizzes`, `/student/quizzes/[id]`, `/student/certificates`, `/student/certificates/[certificate-id]`, `/student/applications`, `/student/applications/[id]`, `/student/forums`, `/student/announcements`, `/student/notifications`, `/student/tickets`, `/student/tickets/[id]`, `/student/payment`, `/student/profile`, `/student/settings`

### Admin
`/admin`, `/admin/programs`, `/admin/programs/new`, `/admin/programs/[id]`, `/admin/syllabus`, `/admin/syllabus/[programId]`, `/admin/syllabus/[programId]/progress`, `/admin/assignments`, `/admin/assignments/new`, `/admin/assignments/[id]`, `/admin/quizzes`, `/admin/quizzes/new`, `/admin/quizzes/[id]`, `/admin/forms`, `/admin/forms/[id]`, `/admin/applications`, `/admin/applications/[id]`, `/admin/members`, `/admin/members/roles`, `/admin/announcements`, `/admin/email-templates`, `/admin/forums`, `/admin/badges`, `/admin/tickets`, `/admin/tickets/[id]`, `/admin/coupons`, `/admin/offers`, `/admin/payment-settings`, `/admin/plugins/ai`, `/admin/roles` (redirect)

---

*This document reflects the codebase as of August 2026. For implementation details, see route files under `app/`, server actions under `lib/actions/`, and the Prisma schema at `prisma/schema.prisma`.*
