import assert from "node:assert/strict";
import test from "node:test";
import { parseAdmissionCallbackStatus } from "../lib/crm/admission-status";
import {
  canCheckoutAdmissionsProgram,
  requiresApplication,
} from "../lib/enrollment/admissions";

test("requiresApplication is true when formDefinitionId is set", () => {
  assert.equal(requiresApplication({ formDefinitionId: "form-1" }), true);
  assert.equal(requiresApplication({ formDefinitionId: null }), false);
});

test("canCheckoutAdmissionsProgram allows tuition only after ACTIVE enrollment", () => {
  const degree = { formDefinitionId: "form-1" };
  const content = { formDefinitionId: null };

  assert.equal(canCheckoutAdmissionsProgram(content, null), true);
  assert.equal(canCheckoutAdmissionsProgram(degree, null), false);
  assert.equal(
    canCheckoutAdmissionsProgram(degree, { status: "PENDING" }),
    false,
  );
  assert.equal(
    canCheckoutAdmissionsProgram(degree, { status: "ACTIVE" }),
    true,
  );
});

test("parseAdmissionCallbackStatus maps CRM outcomes", () => {
  assert.equal(parseAdmissionCallbackStatus("enrolled"), "ADMIT");
  assert.equal(parseAdmissionCallbackStatus("ADMITTED"), "ADMIT");
  assert.equal(parseAdmissionCallbackStatus("approved"), "ADMIT");
  assert.equal(parseAdmissionCallbackStatus("REJECTED"), "REJECT");
  assert.equal(parseAdmissionCallbackStatus("declined"), "REJECT");
  assert.equal(parseAdmissionCallbackStatus("pending"), null);
});
