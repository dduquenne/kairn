// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const createUserSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  role: z.enum(["admin", "speaker", "attendee"]).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  email: z.string().email("Email invalide").optional(),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères").optional(),
  role: z.enum(["admin", "speaker", "attendee"]).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
