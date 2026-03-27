import z from "zod";

export const activateAccountSchema = z.object({
    activationToken: z.string().min(1, "Activation token is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

export type ActivateAccountRequestDto = z.infer<typeof activateAccountSchema>;
