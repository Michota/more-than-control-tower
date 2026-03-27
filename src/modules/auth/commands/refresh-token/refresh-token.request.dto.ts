import { createZodDto } from "nestjs-zod";
import z from "zod";

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
});

export class RefreshTokenRequestDto extends createZodDto(refreshTokenSchema) {}
