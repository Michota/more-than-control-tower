import { EntityManager } from "@mikro-orm/core";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MikroOrmUnitOfWork } from "../../shared/infrastructure/mikro-orm-unit-of-work.js";
import { UNIT_OF_WORK_PORT } from "../../shared/ports/tokens.js";
import { AUTH_CREDENTIALS_REPOSITORY_PORT, PASSWORD_HASHER_PORT } from "./auth.di-tokens.js";
import { AuthHttpController } from "./auth.http.controller.js";
import { AuthCredentials } from "./database/auth-credentials.entity.js";
import { AuthCredentialsRepository } from "./database/auth-credentials.repository.js";
import { Argon2PasswordHasher } from "./infrastructure/argon2-password-hasher.js";
import { JwtTokenService } from "./infrastructure/jwt-token.service.js";
import { ActivateAccountCommandHandler } from "./commands/activate-account/activate-account.command-handler.js";
import { LoginCommandHandler } from "./commands/login/login.command-handler.js";
import { RefreshTokenCommandHandler } from "./commands/refresh-token/refresh-token.command-handler.js";
import { GenerateActivationTokenCommandHandler } from "./commands/generate-activation-token/generate-activation-token.command-handler.js";

@Module({
    imports: [MikroOrmModule.forFeature([AuthCredentials]), JwtModule.register({})],
    controllers: [AuthHttpController],
    providers: [
        JwtTokenService,
        ActivateAccountCommandHandler,
        LoginCommandHandler,
        RefreshTokenCommandHandler,
        GenerateActivationTokenCommandHandler,
        {
            provide: AUTH_CREDENTIALS_REPOSITORY_PORT,
            useFactory: (em: EntityManager) => new AuthCredentialsRepository(em),
            inject: [EntityManager],
        },
        {
            provide: PASSWORD_HASHER_PORT,
            useClass: Argon2PasswordHasher,
        },
        {
            provide: UNIT_OF_WORK_PORT,
            useFactory: (em: EntityManager) => new MikroOrmUnitOfWork(em),
            inject: [EntityManager],
        },
    ],
    exports: [JwtModule, JwtTokenService],
})
export class AuthModule {}
