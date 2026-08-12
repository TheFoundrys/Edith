import { Router } from "express";
import {
  requireAuth,
  requireCapability,
  requireStudent,
  requireStaff,
  type AuthedRequest,
} from "../../src/backend/middleware/auth.js";
import * as compass from "../../src/backend/services/compass.service.js";
import { isStaffRole } from "../../src/shared/constants/roles.js";

export const compassRouter = Router();

compassRouter.get("/overview", requireAuth, requireStaff, async (req: AuthedRequest, res) => {
  const overview = await compass.adminOverview(req.user!.organizationId);
  res.json(overview);
});

compassRouter.get("/announcements", requireAuth, async (req: AuthedRequest, res) => {
  const forStudent = req.user!.role === "STUDENT";
  const items = await compass.listAnnouncements(req.user!.organizationId, forStudent);
  res.json({ announcements: items });
});

compassRouter.post(
  "/announcements",
  requireAuth,
  requireCapability("manageContent"),
  async (req: AuthedRequest, res) => {
    const title = String(req.body.title || "").trim();
    const body = String(req.body.body || "").trim();
    if (!title || !body) {
      res.status(400).json({ error: "Title and body required" });
      return;
    }
    const item = await compass.createAnnouncement(req.user!, { title, body, priority: req.body.priority });
    res.status(201).json({ announcement: item });
  },
);

compassRouter.get(
  "/coupons",
  requireAuth,
  requireCapability("managePricing"),
  async (req: AuthedRequest, res) => {
    res.json({ coupons: await compass.listCoupons(req.user!.organizationId) });
  },
);

compassRouter.post(
  "/coupons",
  requireAuth,
  requireCapability("managePricing"),
  async (req: AuthedRequest, res) => {
    const code = String(req.body.code || "").trim();
    if (!code) {
      res.status(400).json({ error: "Code required" });
      return;
    }
    const coupon = await compass.createCoupon(req.user!, {
      code,
      type: req.body.type,
      value: Number(req.body.value || 0),
      expiresAt: req.body.expiresAt || new Date(Date.now() + 30 * 864e5).toISOString(),
      maxUses: req.body.maxUses,
    });
    res.status(201).json({ coupon });
  },
);

compassRouter.get("/tickets", requireAuth, async (req: AuthedRequest, res) => {
  const staff = isStaffRole(req.user!.role);
  res.json({ tickets: await compass.listTickets(req.user!, staff) });
});

compassRouter.post("/tickets", requireAuth, requireStudent, async (req: AuthedRequest, res) => {
  const subject = String(req.body.subject || "").trim();
  if (!subject) {
    res.status(400).json({ error: "Subject required" });
    return;
  }
  const ticket = await compass.createTicket(req.user!, {
    subject,
    category: req.body.category,
    priority: req.body.priority,
  });
  res.status(201).json({ ticket });
});

compassRouter.get("/tickets/:id", requireAuth, async (req: AuthedRequest, res) => {
  const staff = isStaffRole(req.user!.role);
  const ticket = await compass.getTicket(req.user!, req.params.id, staff);
  if (!ticket) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ticket });
});

compassRouter.post("/tickets/:id/messages", requireAuth, async (req: AuthedRequest, res) => {
  const content = String(req.body.content || "").trim();
  if (!content) {
    res.status(400).json({ error: "Content required" });
    return;
  }
  const staff = isStaffRole(req.user!.role);
  const result = await compass.addTicketMessage(req.user!, req.params.id, content, staff);
  if ("error" in result) {
    res.status(404).json(result);
    return;
  }
  res.json(result);
});

compassRouter.get("/badges", requireAuth, requireCapability("manageContent"), async (req: AuthedRequest, res) => {
  res.json({ badges: await compass.listBadges(req.user!.organizationId) });
});

compassRouter.post("/badges", requireAuth, requireCapability("manageContent"), async (req: AuthedRequest, res) => {
  const name = String(req.body.name || "").trim();
  if (!name) {
    res.status(400).json({ error: "Name required" });
    return;
  }
  const badge = await compass.createBadge(req.user!, {
    name,
    description: req.body.description,
    iconUrl: req.body.iconUrl,
  });
  res.status(201).json({ badge });
});

compassRouter.get("/forums/categories", requireAuth, async (req: AuthedRequest, res) => {
  res.json({ categories: await compass.listForumCategories(req.user!.organizationId) });
});

compassRouter.post(
  "/forums/categories",
  requireAuth,
  requireCapability("manageContent"),
  async (req: AuthedRequest, res) => {
    const name = String(req.body.name || "").trim();
    const slug = String(req.body.slug || name)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");
    if (!name) {
      res.status(400).json({ error: "Name required" });
      return;
    }
    const category = await compass.createForumCategory(req.user!, {
      name,
      slug,
      description: req.body.description,
    });
    res.status(201).json({ category });
  },
);

compassRouter.get(
  "/payment-settings",
  requireAuth,
  requireCapability("managePricing"),
  async (req: AuthedRequest, res) => {
    res.json({ settings: await compass.getPaymentSettings(req.user!.organizationId) });
  },
);

compassRouter.put(
  "/payment-settings",
  requireAuth,
  requireCapability("managePricing"),
  async (req: AuthedRequest, res) => {
    const settings = await compass.upsertPaymentSettings(req.user!, req.body);
    res.json({ settings });
  },
);

compassRouter.get(
  "/email-templates",
  requireAuth,
  requireCapability("manageContent"),
  async (req: AuthedRequest, res) => {
    res.json({ templates: await compass.listEmailTemplates(req.user!.organizationId) });
  },
);

compassRouter.post(
  "/email-templates",
  requireAuth,
  requireCapability("manageContent"),
  async (req: AuthedRequest, res) => {
    const name = String(req.body.name || "").trim();
    const subject = String(req.body.subject || "").trim();
    if (!name || !subject) {
      res.status(400).json({ error: "Name and subject required" });
      return;
    }
    const template = await compass.createEmailTemplate(req.user!, {
      name,
      subject,
      bodyHtml: req.body.bodyHtml,
      bodyText: req.body.bodyText,
    });
    res.status(201).json({ template });
  },
);

compassRouter.get(
  "/offers",
  requireAuth,
  requireCapability("managePricing"),
  async (req: AuthedRequest, res) => {
    res.json({ offers: await compass.listOffers(req.user!.organizationId) });
  },
);

compassRouter.get("/applications", requireAuth, async (req: AuthedRequest, res) => {
  const staff = isStaffRole(req.user!.role);
  res.json({ applications: await compass.listApplications(req.user!, staff) });
});

compassRouter.get("/assignments", requireAuth, async (req: AuthedRequest, res) => {
  res.json({ assignments: await compass.listAssignments(req.user!.organizationId) });
});

compassRouter.get("/quizzes", requireAuth, async (req: AuthedRequest, res) => {
  res.json({ quizzes: await compass.listQuizzes(req.user!.organizationId) });
});

compassRouter.get("/certificates/me", requireAuth, requireStudent, async (req: AuthedRequest, res) => {
  res.json({ certificates: await compass.listCertificates(req.user!) });
});

compassRouter.put("/profile", requireAuth, requireStudent, async (req: AuthedRequest, res) => {
  const name = String(req.body.name || "").trim();
  if (name.length < 2) {
    res.status(400).json({ error: "Name is required." });
    return;
  }
  const user = await compass.updateStudentProfile(req.user!, { ...req.body, name });
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      username: user.username,
      headline: user.headline,
      bio: user.bio,
      theme: user.theme,
      careerPath: user.careerPath,
    },
  });
});
