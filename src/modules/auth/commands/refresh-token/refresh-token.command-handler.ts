import { UnauthorizedException } from "@nestjs/common";
import { CommandHandler, ICommandHandler, QueryBus } from "@nestjs/cqrs";
import { GetSystemUserQuery, GetSystemUserResponse } from "../../../../shared/queries/get-system-user.query.js";
import { JwtTokenService } from "../../infrastructure/jwt-token.service.js";
import { RefreshTokenCommand, RefreshTokenResult } from "./refresh-token.command.js";

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenCommandHandler implements ICommandHandler<RefreshTokenCommand, RefreshTokenResult> {
    constructor(
        private readonly queryBus: QueryBus,
        private readonly jwtTokenService: JwtTokenService,
    ) {}

    async execute(cmd: RefreshTokenCommand): Promise<RefreshTokenResult> {
        let userId: string;
        try {
            const payload = this.jwtTokenService.verifyRefreshToken(cmd.refreshToken);
            userId = payload.sub;
        } catch {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        const systemUser = await this.queryBus.execute<GetSystemUserQuery, GetSystemUserResponse | null>(
            new GetSystemUserQuery(userId),
        );

        if (!systemUser || systemUser.status !== "activated") {
            throw new UnauthorizedException("User account is not active");
        }

        return {
            accessToken: this.jwtTokenService.signAccessToken(userId),
        };
    }
}
