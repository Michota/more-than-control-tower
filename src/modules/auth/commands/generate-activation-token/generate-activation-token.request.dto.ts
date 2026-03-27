import { createZodDto } from "nestjs-zod";
import z from "zod";

export const generateActivationTokenSchema = z.object({
    userId: z.uuid(),
});

export class GenerateActivationTokenRequestDto extends createZodDto(generateActivationTokenSchema) {}
