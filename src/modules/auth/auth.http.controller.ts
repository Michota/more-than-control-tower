import { Body, Controller, HttpCode, HttpStatus, Post, UsePipes } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Public } from "../../shared/auth/decorators/public.decorator.js";
import { ZodValidationPipe } from "../../shared/pipes/zod-validation.pipe.js";
import { ActivateAccountCommand, ActivateAccountResult } from "./commands/activate-account/activate-account.command.js";
import {
    activateAccountSchema,
    type ActivateAccountRequestDto,
} from "./commands/activate-account/activate-account.request.dto.js";
import { LoginCommand, LoginResult } from "./commands/login/login.command.js";
import { loginSchema, type LoginRequestDto } from "./commands/login/login.request.dto.js";
import { RefreshTokenCommand, RefreshTokenResult } from "./commands/refresh-token/refresh-token.command.js";
import { refreshTokenSchema, type RefreshTokenRequestDto } from "./commands/refresh-token/refresh-token.request.dto.js";
import {
    GenerateActivationTokenCommand,
    GenerateActivationTokenResult,
} from "./commands/generate-activation-token/generate-activation-token.command.js";
import {
    generateActivationTokenSchema,
    type GenerateActivationTokenRequestDto,
} from "./commands/generate-activation-token/generate-activation-token.request.dto.js";
import { AccessTokenResponseDto, ActivationTokenResponseDto, AuthTokensResponseDto } from "./dtos/auth.response.dto.js";

@ApiTags("Authentication")
@Controller("auth")
export class AuthHttpController {
    constructor(private readonly commandBus: CommandBus) {}

    @Public()
    @Post("activate")
    @UsePipes(new ZodValidationPipe(activateAccountSchema))
    @ApiOperation({ summary: "Activate account and set password" })
    @ApiResponse({ status: 201, type: AuthTokensResponseDto })
    async activateAccount(@Body() body: ActivateAccountRequestDto): Promise<AuthTokensResponseDto> {
        return this.commandBus.execute<ActivateAccountCommand, ActivateAccountResult>(
            new ActivateAccountCommand({
                activationToken: body.activationToken,
                password: body.password,
            }),
        );
    }

    @Public()
    @Post("login")
    @HttpCode(HttpStatus.OK)
    @UsePipes(new ZodValidationPipe(loginSchema))
    @ApiOperation({ summary: "Log in with email and password" })
    @ApiResponse({ status: 200, type: AuthTokensResponseDto })
    async login(@Body() body: LoginRequestDto): Promise<AuthTokensResponseDto> {
        return this.commandBus.execute<LoginCommand, LoginResult>(
            new LoginCommand({
                email: body.email,
                password: body.password,
            }),
        );
    }

    @Public()
    @Post("refresh")
    @HttpCode(HttpStatus.OK)
    @UsePipes(new ZodValidationPipe(refreshTokenSchema))
    @ApiOperation({ summary: "Refresh access token" })
    @ApiResponse({ status: 200, type: AccessTokenResponseDto })
    async refreshToken(@Body() body: RefreshTokenRequestDto): Promise<AccessTokenResponseDto> {
        return this.commandBus.execute<RefreshTokenCommand, RefreshTokenResult>(
            new RefreshTokenCommand({
                refreshToken: body.refreshToken,
            }),
        );
    }

    @Post("activation-token")
    @UsePipes(new ZodValidationPipe(generateActivationTokenSchema))
    @ApiOperation({ summary: "Generate activation token for an unactivated user (admin-only)" })
    @ApiResponse({ status: 201, type: ActivationTokenResponseDto })
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
