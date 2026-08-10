import { z } from "zod";

import { PLATFORM_ROLE_KEYS } from "@/types/user";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be at most 72 characters.")
  .regex(/[A-Za-z]/, "Password must include a letter.")
  .regex(/[0-9]/, "Password must include a number.");

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
  turnstileToken: z.string().min(1, "Complete the security check."),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required.").max(80),
    lastName: z.string().trim().min(1, "Last name is required.").max(80),
    email: z.string().trim().email("Enter a valid email address."),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password."),
    turnstileToken: z.string().min(1, "Complete the security check."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type RegisterValues = z.infer<typeof registerSchema>;

export const magicLinkSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  turnstileToken: z.string().min(1, "Complete the security check."),
});

export type MagicLinkValues = z.infer<typeof magicLinkSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  turnstileToken: z.string().min(1, "Complete the security check."),
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(80),
  lastName: z.string().trim().min(1, "Last name is required.").max(80),
  displayName: z.string().trim().min(1, "Display name is required.").max(120),
  preferredLocale: z.enum(["en-CA", "en-US", "fr-CA"]),
  preferredCurrency: z.enum(["CAD", "USD"]),
});

export type UpdateProfileValues = z.infer<typeof updateProfileSchema>;

export const platformRoleKeySchema = z.enum(PLATFORM_ROLE_KEYS);

export const safeRedirectPathSchema = z
  .string()
  .trim()
  .refine((value) => value.startsWith("/") && !value.startsWith("//"), {
    message: "Redirect must be a relative path.",
  });
