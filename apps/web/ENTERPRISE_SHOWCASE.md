# Edith — Enterprise Learning Platform
## Client Feature Showcase

**Edith** is The Foundrys’ enterprise learning and admissions platform for deep-tech education — AI, cybersecurity, data, blockchain, and quantum programmes. Built for institutions that need a unified experience from discovery to enrollment, learning, certification, and ongoing learner engagement.

---

## At a glance

| Pillar | What it delivers |
|--------|------------------|
| **Learner experience** | Branded portal, course discovery, learning player, progress, certificates |
| **Admissions & enrollment** | Dynamic applications, workflow, payments, CRM sync |
| **Content & curriculum** | Syllabus builder, multimedia lessons, assessments |
| **Commerce** | Course fees, application fees, offers, coupons, payment gateway |
| **Governance** | Role-based access, capability matrix, org-scoped data |
| **Intelligence** | AI-assisted authoring, in-lesson tutor, analytics dashboards |
| **Integrations** | CRM, payment webhooks, catalog API |

---

## 1. Branded digital front door

A polished public experience that represents your institution professionally and converts interest into enrollment.

- **Marketing homepage** — Hero, live platform stats, featured programmes, testimonials, social proof, and clear calls to action
- **Unified brand experience** — Consistent header, footer, and visual identity across marketing, auth, and logged-in workspaces
- **Programme catalogue** — Searchable, filterable course browser (category, duration, experience level, keywords)
- **Rich course landing pages** — Outcomes, curriculum preview, pricing, intakes, capacity, hybrid/on-campus details, and track-themed visuals
- **Legal & trust** — Privacy policy and terms of service pages
- **Mobile-responsive design** — Optimised layouts for desktop, tablet, and mobile

---

## 2. Learner portal (LMS)

A complete learning environment for enrolled students — not just content hosting, but progress, motivation, and completion.

### Dashboard & engagement
- Personalised dashboard with continue-learning prompts
- Cross-course progress tracking and completion percentages
- Weekly study goals, learning hours, and streak tracking
- Assignment deadline reminders
- Achievement highlights and earned certificates
- Intelligent course recommendations based on interests and history

### Learning delivery
- Structured course outlines (modules → activities/lessons)
- **Multi-format content:** rich text, embedded video, external resources
- Lesson completion tracking with resume-from-last-lesson
- Full learning navigation (outline, previous/next, course hub)

### Credentials
- **Automatic certificate issuance** on programme completion
- Verifiable certificate view with unique credential code
- Certificate gallery for the learner

### Assessments
- Assignments with due dates and submission workflow
- Multiple-choice quizzes with instant scoring
- Unified assessments hub for everything due

### Learner account
- Profile management (bio, headline, preferences)
- In-app notifications
- Organisation announcements / messaging centre
- Support ticket creation and conversation history

---

## 3. Admissions & enrollment

End-to-end enrollment — from first interest to confirmed seat — with workflow control for admissions teams.

### Self-service enrollment
- Guest browse → sign in → enroll flow with return URL preservation
- **Free and paid programmes** with integrated checkout
- Enrollment status transparency (active, payment pending, awaiting approval)
- My Courses hub with progress and quick actions

### Formal applications
- **Dynamic application forms** — configurable sections and field types (text, files, dates, selections, conditional logic)
- Save draft, review, and submit with attestation
- Document upload and verification workflow
- Full application status lifecycle (draft → submitted → review → offer → fee → enrolled)
- Application fee collection integrated with payment gateway

### Intake & cohort management
- Multiple intakes per programme with capacity and application windows
- Active/inactive intake control
- Cohort-oriented programme configuration

---

## 4. Admin & operations workspace

Enterprise-grade back office for programme owners, admissions, content teams, and leadership.

### Executive dashboard
- Real-time KPIs: enrollments, revenue, users, active programmes
- Enrollment trend charts (period-over-period)
- Programme category and role distribution analytics
- Recent enrollments and programme activity feeds
- System health overview

### Programme management
- Create and manage programmes (certificate, degree pathways, faculty development, etc.)
- Publish / archive lifecycle
- Pricing, capacity, campus, department, and CRM configuration
- Learning outcomes, tags, specialisation, and merchandising metadata
- Programme imagery and brochure assets
- Intake creation and scheduling

### Curriculum authoring
- **Syllabus builder** — sections and activities with drag-free reordering
- Draft → publish workflow for curriculum
- Per-activity visibility control
- Learner progress reports per programme
- Multimedia and markdown lesson content

### Assessment authoring
- Assignment creation with due dates and programme scoping
- Quiz builder with multiple-choice questions
- **AI-assisted draft generation** for assignments and quizzes (optional)

### Admissions operations
- Application inbox with search and filters
- Full applicant record review
- Status transitions with audit trail and notes
- Document verify / unverify
- Offline payment recording (UTR / reference)
- CRM reference IDs and sync visibility

### Forms studio
- Visual form builder for admission and inquiry forms
- Versioned forms (draft and published)
- Attach forms to programmes

### Member & access management
- Member directory with roles and groups
- **Enterprise RBAC** — Super Admin, Admissions, Counsellor, Content Author, Student
- **Customisable capability matrix** — fine-grained permissions per role (pricing, programmes, content, applications, forms, AI, members)
- Custom permission roles
- Membership expiry management (individual and bulk)

### Communications
- Organisation-wide announcements (priority, pin, scheduling)
- Email template library (foundation for campaigns)
- Forum categories for community structure

### Commerce administration
- **Coupons** — percentage/fixed discounts with expiry and usage limits
- **Custom offers** — personalised pricing per applicant/programme
- Payment settings — currency, tax (GST), convenience fees, gateway configuration

### Support
- Ticket inbox for staff
- Status management and threaded replies
- Student-facing ticket portal

### Recognition
- Badge creation and manual award (extensible for gamification programmes)

---

## 5. Commerce & payments

Monetisation built in — not bolted on.

- **Razorpay integration** — secure checkout for course fees and application fees
- Payment webhooks for reliable confirmation
- Free programme enrollment path
- Payment success / failure flows with clear learner guidance
- Payment centre for outstanding fees
- Revenue tracking on admin dashboard
- Application fee workflow tied to admission states
- Offline payment capture for bank transfers / UTR reconciliation

---

## 6. CRM & enterprise integrations

Connect Edith to your existing sales and admissions stack.

- **CRM lead sync** on application submit and enrollment events
- Application status sync to CRM
- **Inbound enrollment callback** — CRM approves or rejects pending enrollments before learning unlocks
- CRM-gated programmes for regulated or high-touch admissions
- Full CRM sync logging for audit and troubleshooting
- Adapter support for CentraCRM / Foundrys CRM (configurable)

---

## 7. Artificial intelligence

Optional AI layer — institution-controlled, plugin-based.

- **Org-level AI configuration** — enable/disable, choose provider, set model and credentials
- **AI lesson tutor** — contextual Q&A inside the learning player for enrolled students
- **AI content assistant** — draft assignments and quizzes from syllabus context
- Mock/offline mode for demos and development environments
- OpenAI-compatible provider support for production deployments

---

## 8. Security, access & compliance foundations

Enterprise expectations for who can do what — and what data they see.

- Secure credential-based authentication
- Password reset workflow
- Route-level access control (staff vs student separation)
- Organisation-scoped data isolation (multi-tenant ready)
- Capability-based authorization beyond simple roles
- Session invalidation after environment changes
- Document storage for application evidence
- Application and enrollment event audit trails

---

## 9. Catalog & API layer

For integrations, partners, and future channels.

- **Public catalog API** — list, filter, search, and retrieve programme details
- Category and filter metadata endpoints
- Full catalog dump for indexing or external mirrors
- **Admin catalog API** — programmatic programme create, update, and publish
- Health check endpoint for monitoring

---

## 10. Programme domains supported

Edith is configured for deep-tech and professional education portfolios:

- AI & machine learning programmes
- Cybersecurity
- Data science & analytics
- Blockchain
- Quantum computing
- Faculty development (FDP)
- Foundation and certificate pathways
- Hybrid, on-campus, and online delivery modes

Each programme supports rich merchandising, track-based visual identity, and catalogue discovery tuned to learner intent.

---

## 11. Why enterprises choose Edith

| Enterprise need | Edith delivers |
|-----------------|----------------|
| Single platform for marketing + LMS + admissions | Unified learner and staff workspaces |
| Controlled rollout of new programmes | Draft/publish workflows for programmes and curriculum |
| Admissions team productivity | Workflow-driven applications with CRM sync |
| Revenue from courses and fees | Integrated payments and commerce admin |
| Content team efficiency | Syllabus builder + optional AI drafting |
| Governance at scale | RBAC + customisable capability matrix |
| Brand consistency | Fully branded Edith experience end-to-end |
| Extensibility | REST catalog API, CRM webhooks, payment webhooks |

---

## 12. Deployment-ready capabilities summary

**Included in current platform:**

- Public marketing site and course catalogue  
- Student LMS (learning, progress, assessments, certificates)  
- Admin workspace (programmes, syllabus, admissions, members)  
- Dynamic forms and application workflow  
- Enrollment and checkout (free + paid)  
- Razorpay payment integration  
- CRM sync and enrollment callback  
- AI tutor and AI authoring (configurable)  
- Role-based access with capability matrix  
- Analytics dashboard  
- Support tickets and announcements  
- Coupons, offers, and payment settings  
- Catalog REST API  

---

*Edith — Map Your Future.*  
*Powered by The Foundrys.*
