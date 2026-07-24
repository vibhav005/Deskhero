import { z } from "zod";

export const signUpSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const magicLinkSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});
export type MagicLinkInput = z.infer<typeof magicLinkSchema>;

export const requestPasswordResetSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;

export const updatePasswordSchema = z.object({
  password: z.string().min(8, "Use at least 8 characters."),
});
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
