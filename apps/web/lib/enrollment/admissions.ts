/** Degree / admissions programmes require CRM application before LMS access. */
export function requiresApplication(program: {
  formDefinitionId: string | null;
}) {
  return Boolean(program.formDefinitionId);
}

/** Tuition checkout in Edith is allowed only after CRM admission (ACTIVE enrollment). */
export function canCheckoutAdmissionsProgram(
  program: { formDefinitionId: string | null },
  enrollment: { status: string } | null | undefined,
) {
  if (!requiresApplication(program)) return true;
  return enrollment?.status === "ACTIVE";
}
