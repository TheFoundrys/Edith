import assert from "node:assert/strict";
import test from "node:test";
import {
  crmApplicationsHref,
  crmApplyHref,
  getCrmAppOrigin,
} from "../lib/crm/urls";

test("CRM app origin strips the API prefix", () => {
  const previousApp = process.env.CRM_APP_URL;
  const previousBase = process.env.CRM_BASE_URL;
  delete process.env.CRM_APP_URL;
  process.env.CRM_BASE_URL = "https://dev-crm.thefoundrys.com/api/v1";
  assert.equal(getCrmAppOrigin(), "https://dev-crm.thefoundrys.com");
  assert.equal(
    crmApplicationsHref(),
    "https://dev-crm.thefoundrys.com/applications",
  );
  assert.equal(
    crmApplicationsHref("app-1"),
    "https://dev-crm.thefoundrys.com/applications/app-1",
  );
  assert.match(crmApplyHref({ programSlug: "bsc-ai" }), /program=bsc-ai/);
  assert.match(crmApplyHref({ programSlug: "bsc-ai" }), /source=edith/);
  if (previousApp === undefined) delete process.env.CRM_APP_URL;
  else process.env.CRM_APP_URL = previousApp;
  if (previousBase === undefined) delete process.env.CRM_BASE_URL;
  else process.env.CRM_BASE_URL = previousBase;
});
