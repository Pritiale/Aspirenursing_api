import type { Career } from "@/lib/supabase";

export type CareerBody = {
  title?: string;
  location?: string;
  department?: string;
  job_type?: string;
  salary?: string;
  about_role?: string;
  responsibilities?: string[];
  requirements?: string[];
  benefits?: string[];
  apply_url?: string;
  status?: string;
  sort_order?: number;
};

const URL_RE = /^https?:\/\/.+/i;
const STATUSES = new Set(["draft", "published", "closed"]);

function cleanList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, 50);
}

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function validateCareer(body: CareerBody, partial = false) {
  const title = cleanText(body.title, 200);
  const location = cleanText(body.location, 200);
  const department = cleanText(body.department, 120);
  const job_type = cleanText(body.job_type, 80);
  const salary = cleanText(body.salary ?? "", 120);
  const about_role = cleanText(body.about_role, 8000);
  const apply_url = cleanText(body.apply_url, 500);
  const responsibilities = cleanList(body.responsibilities);
  const requirements = cleanList(body.requirements);
  const benefits = cleanList(body.benefits);
  const status = cleanText(body.status ?? "draft", 20) || "draft";
  const sort_order =
    typeof body.sort_order === "number" && Number.isFinite(body.sort_order)
      ? Math.trunc(body.sort_order)
      : 0;

  if (!partial || body.title !== undefined) {
    if (!title) return { error: "Title is required." };
  }
  if (!partial || body.location !== undefined) {
    if (!location) return { error: "Location is required." };
  }
  if (!partial || body.department !== undefined) {
    if (!department) return { error: "Department is required." };
  }
  if (!partial || body.job_type !== undefined) {
    if (!job_type) return { error: "Job type is required." };
  }
  if (!partial || body.about_role !== undefined) {
    if (!about_role) return { error: "About this role is required." };
  }
  if (!partial || body.apply_url !== undefined) {
    if (!apply_url || !URL_RE.test(apply_url)) {
      return { error: "A valid apply URL (JotForm link) is required." };
    }
  }
  if (body.status !== undefined && !STATUSES.has(status)) {
    return { error: "Status must be draft, published, or closed." };
  }

  return {
    data: {
      title,
      location,
      department,
      job_type,
      salary: salary || null,
      about_role,
      responsibilities,
      requirements,
      benefits,
      apply_url,
      status,
      sort_order,
    },
  };
}

export function serializeCareer(row: Career) {
  return {
    ...row,
    responsibilities: Array.isArray(row.responsibilities) ? row.responsibilities : [],
    requirements: Array.isArray(row.requirements) ? row.requirements : [],
    benefits: Array.isArray(row.benefits) ? row.benefits : [],
  };
}
