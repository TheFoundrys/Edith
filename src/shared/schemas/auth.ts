import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(128)
  .regex(/[A-Za-z]/, "Password must include a letter")
  .regex(/[0-9]/, "Password must include a number");

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  password: passwordSchema,
  consent: z.boolean().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const resetRequestSchema = z.object({
  email: z.string().trim().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32),
  password: passwordSchema,
  confirmPassword: z.string(),
});
