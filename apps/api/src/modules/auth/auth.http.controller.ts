import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UnauthorizedException } from "@nestjs/common";
import type { Request, Response } from "express";
import { CommandBus } from "@nestjs/cqrs";
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { Public } from "../../shared/auth/decorators/public.decorator.js";
import { ActivateAccountCommand, ActivateAccountResult } from "./commands/activate-account/activate-account.command.js";
import { ActivateAccountRequestDto } from "./commands/activate-account/activate-account.request.dto.js";
import { LoginCommand, LoginResult } from "./commands/login/login.command.js";
import { LoginRequestDto } from "./commands/login/login.request.dto.js";
import { RefreshTokenCommand, RefreshTokenResult } from "./commands/refresh-token/refresh-token.command.js";
import {
    GenerateActivationTokenCommand,
    GenerateActivationTokenResult,
} from "./commands/generate-activation-token/generate-activation-token.command.js";
import { GenerateActivationTokenRequestDto } from "./commands/generate-activation-token/generate-activation-token.request.dto.js";
import { ActivationTokenResponseDto } from "./dtos/auth.response.dto.js";
import { setAuthCookies, clearAuthCookies } from "./infrastructure/auth-cookies.js";

@ApiTags("Authentication")
@Controller("auth")
export class AuthHttpController {
    constructor(private readonly commandBus: CommandBus) {}

    @Public()
    @Post("activate")
    @Throttle({ default: { ttl: 60_000, limit: 5 } })
    @ApiOperation({ summary: "Activate account and set password" })
    @ApiCreatedResponse()
    async activateAccount(
        @Body() body: ActivateAccountRequestDto,
        @Res({ passthrough: true }) res: Response,
    ): Promise<{ ok: true }> {
        const tokens = await this.commandBus.execute<ActivateAccountCommand, ActivateAccountResult>(
            new ActivateAccountCommand({
                activationToken: body.activationToken,
                password: body.password,
            }),
        );
        setAuthCookies(res, tokens);
        return { ok: true };
    }

    @Public()
    @Post("login")
    @Throttle({ default: { ttl: 60_000, limit: 5 } })
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Log in with email and password" })
    @ApiOkResponse()
    async login(@Body() body: LoginRequestDto, @Res({ passthrough: true }) res: Response): Promise<{ ok: true }> {
        const tokens = await this.commandBus.execute<LoginCommand, LoginResult>(
            new LoginCommand({
                email: body.email,
                password: body.password,
            }),
        );
        setAuthCookies(res, tokens);
        return { ok: true };
    }

    @Public()
    @Post("refresh")
    @Throttle({ default: { ttl: 60_000, limit: 10 } })
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Refresh access token using cookie or request body" })
    @ApiOkResponse()
    async refreshToken(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
        @Body() body: { refreshToken?: string },
    ): Promise<{ ok: true }> {
        const refreshToken = (req.cookies as Record<string, string>)?.refreshToken ?? body.refreshToken;

        if (!refreshToken) {
            throw new UnauthorizedException("Missing refresh token");
        }

        const tokens = await this.commandBus.execute<RefreshTokenCommand, RefreshTokenResult>(
            new RefreshTokenCommand({ refreshToken }),
        );
        setAuthCookies(res, tokens);
        return { ok: true };
    }

    @Public()
    @Post("logout")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Clear auth cookies" })
    logout(@Res({ passthrough: true }) res: Response): { ok: true } {
        clearAuthCookies(res);
        return { ok: true };
    }

    @Get("session")
    @ApiOperation({ summary: "Check if current session is valid" })
    @ApiOkResponse()
    session(): { authenticated: true } {
        return { authenticated: true };
    }

    @Post("activation-token")
    @ApiOperation({ summary: "Generate activation token for an unactivated user (admin-only)" })
    @ApiCreatedResponse({ type: ActivationTokenResponseDto })
    async generateActivationToken(
        @Body() body: GenerateActivationTokenRequestDto,
    ): Promise<ActivationTokenResponseDto> {
        return this.commandBus.execute<GenerateActivationTokenCommand, GenerateActivationTokenResult>(
            new GenerateActivationTokenCommand({
                userId: body.userId,
            }),
        );
    }
}
