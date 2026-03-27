import { createZodDto } from "nestjs-zod";
import z from "zod";
import { passwordSchema } from "../../domain/password.schema.js";

export const activateAccountSchema = z.object({
    activationToken: z.string().min(1, "Activation token is required"),
    password: passwordSchema,
});

export class ActivateAccountRequestDto extends createZodDto(activateAccountSchema) {}
