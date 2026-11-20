import { z } from "zod";

// ====================== AUTH ======================
export const schemaRegister = z.object({
    firstName: z.string().min(2, "Prénom requis"),
    lastName: z.string().min(2, "Nom requis"),
    email: z.string().email("Email invalide"),
    password: z.string().min(6, "6 caractères minimum"),
});
export type RegisterFormData = z.infer<typeof schemaRegister>;

export const schemaLogin = z.object({
    email: z.string().email("Email invalide"),
    password: z.string().min(6, "Mot de passe requis"),
});
export type LoginFormData = z.infer<typeof schemaLogin>;
