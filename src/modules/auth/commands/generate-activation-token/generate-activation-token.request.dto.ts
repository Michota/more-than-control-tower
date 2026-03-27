import z from "zod";

export const generateActivationTokenSchema = z.object({
    userId: z.uuid(),
});

export type GenerateActivationTokenRequestDto = z.infer<typeof generateActivationTokenSchema>;
