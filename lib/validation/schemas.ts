import { z } from "zod";

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().email("Enter a valid email address."),
  message: z.string().trim().min(10, "Message must be at least 10 characters."),
  turnstileToken: z.string().min(1, "Complete the security check."),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

export const communitySlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens.");

export const communitySubdomainSchema = communitySlugSchema.refine(
  (value) =>
    ![
      "www",
      "business",
      "account",
      "admin",
      "supplier",
      "api",
      "app",
      "support",
      "partners",
      "assets",
      "static",
      "mail",
    ].includes(value),
  { message: "That subdomain is reserved for system use." },
);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationValues = z.infer<typeof paginationSchema>;
