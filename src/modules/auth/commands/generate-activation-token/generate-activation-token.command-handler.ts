import { CommandHandler, ICommandHandler, QueryBus } from "@nestjs/cqrs";
import { GetSystemUserQuery, GetSystemUserResponse } from "../../../../shared/queries/get-system-user.query.js";
import { AccountAlreadyActivatedError } from "../../domain/auth.errors.js";
import { JwtTokenService } from "../../infrastructure/jwt-token.service.js";
import { GenerateActivationTokenCommand, GenerateActivationTokenResult } from "./generate-activation-token.command.js";
import { NotFoundException } from "../../../../libs/exceptions/index.js";

@CommandHandler(GenerateActivationTokenCommand)
export class GenerateActivationTokenCommandHandler implements ICommandHandler<
    GenerateActivationTokenCommand,
    GenerateActivationTokenResult
> {
    constructor(
        private readonly queryBus: QueryBus,
        private readonly jwtTokenService: JwtTokenService,
    ) {}

    async execute(cmd: GenerateActivationTokenCommand): Promise<GenerateActivationTokenResult> {
        const systemUser = await this.queryBus.execute<GetSystemUserQuery, GetSystemUserResponse | null>(
            new GetSystemUserQuery(cmd.userId),
        );

        if (!systemUser) {
            throw new NotFoundException(`User with id ${cmd.userId} not found`);
        }

        if (systemUser.status !== "UNACTIVATED") {
            throw new AccountAlreadyActivatedError();
        }

        return {
            activationToken: this.jwtTokenService.signActivationToken(cmd.userId),
        };
    }
}
