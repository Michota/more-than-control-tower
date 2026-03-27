import { createZodDto } from "nestjs-zod";
import z from "zod";

export const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(1, "Password is required"),
});

export class LoginRequestDto extends createZodDto(loginSchema) {}
