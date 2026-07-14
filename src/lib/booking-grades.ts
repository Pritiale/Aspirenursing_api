const SERVICE_GRADES: Record<
  string,
  { required: boolean; fixed?: number; options?: number[] }
> = {
  "registered-nurses": { required: true, options: [1, 2] },
  "registered-nurse-in-charge": { required: true, options: [3, 5] },
  "clinical-care-coordinator": { required: true, fixed: 4 },
  "after-hours-supervisor": { required: true, fixed: 5 },
  "enrolled-nurses": { required: false },
  "personal-care-assistants": { required: false },
};

export function resolveApiGrade(
  serviceId: string,
  grade?: number | null,
): { ok: true; grade: number | null } | { ok: false; error: string } {
  const config = SERVICE_GRADES[serviceId];

  if (!config) {
    return grade == null
      ? { ok: true, grade: null }
      : { ok: false, error: "Grade is not applicable for this service." };
  }

  if (config.fixed != null) {
    return { ok: true, grade: config.fixed };
  }

  if (!config.required) {
    return { ok: true, grade: null };
  }

  if (grade == null || !Number.isInteger(grade)) {
    return { ok: false, error: "A valid grade is required for this service." };
  }

  if (!config.options?.includes(grade)) {
    return { ok: false, error: "Invalid grade for this service." };
  }

  return { ok: true, grade };
}
