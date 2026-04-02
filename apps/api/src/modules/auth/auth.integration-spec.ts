import { MikroORM } from "@mikro-orm/postgresql";
import { UnauthorizedException } from "@nestjs/common";
import { CommandBus, CqrsModule } from "@nestjs/cqrs";
import { Test, TestingModule } from "@nestjs/testing";
import { TestMikroOrmDatabaseModule } from "../../shared/testing/test-mikro-orm-database.module.js";
import { CreateSystemUserCommand } from "../system/commands/create-system-user/create-system-user.command.js";
import { SuspendSystemUserCommand } from "../system/commands/suspend-system-user/suspend-system-user.command.js";
import { ActivateSystemUserCommand } from "../system/commands/activate-system-user/activate-system-user.command.js";
import { SystemUserRole } from "../system/domain/system-user-role.enum.js";
import { SystemModule } from "../system/system.module.js";
import { AuthModule } from "./auth.module.js";
import { LoginCommand, LoginResult } from "./commands/login/login.command.js";
import { SetPasswordCommand } from "./commands/set-password/set-password.command.js";
import { ChangePasswordCommand } from "./commands/change-password/change-password.command.js";
import { ActivateAccountCommand, ActivateAccountResult } from "./commands/activate-account/activate-account.command.js";
import {
    GenerateActivationTokenCommand,
    GenerateActivationTokenResult,
} from "./commands/generate-activation-token/generate-activation-token.command.js";
import { RefreshTokenCommand, RefreshTokenResult } from "./commands/refresh-token/refresh-token.command.js";
import {
    InvalidCredentialsError,
    AccountNotActivatedError,
    AccountSuspendedError,
    AccountAlreadyActivatedError,
    InvalidActivationTokenError,
} from "./domain/auth.errors.js";

describe("Auth Module — Integration Tests", () => {
    let moduleRef: TestingModule;
    let commandBus: CommandBus;
    let orm: MikroORM;

    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [TestMikroOrmDatabaseModule(), CqrsModule.forRoot(), SystemModule, AuthModule],
        }).compile();

        await moduleRef.init();

        commandBus = moduleRef.get(CommandBus);
        orm = moduleRef.get(MikroORM);

        await orm.schema.refresh();
    });

    afterAll(async () => {
        await orm.close(true);
        await moduleRef.close();
    });

    // ─── Helpers ───────────────────────────────────────────────

    let emailCounter = 0;

    function uniqueEmail(): string {
        return `auth-test-${Date.now()}-${++emailCounter}@example.com`;
    }

    const PASSWORD = "ValidPass1!";

    async function createUser(overrides: { email?: string; roles?: SystemUserRole[] } = {}): Promise<string> {
        return commandBus.execute(
            new CreateSystemUserCommand({
                email: overrides.email ?? uniqueEmail(),
                name: "Test User",
                roles: overrides.roles ?? [SystemUserRole.USER],
            }),
        );
    }

    async function createActivatedUser(email?: string): Promise<{ userId: string; email: string }> {
        const userEmail = email ?? uniqueEmail();
        const userId = await createUser({ email: userEmail });
        await commandBus.execute(new SetPasswordCommand({ userId, password: PASSWORD }));
        return { userId, email: userEmail };
    }

    // ─── Login ───────────────────────────────────────────────

    describe("Login", () => {
        it("returns access and refresh tokens for valid credentials", async () => {
            const { email } = await createActivatedUser();

            const result = await commandBus.execute<LoginCommand, LoginResult>(
                new LoginCommand({ email, password: PASSWORD }),
            );

            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
        });

        it("throws InvalidCredentialsError for wrong password", async () => {
            const { email } = await createActivatedUser();

            await expect(commandBus.execute(new LoginCommand({ email, password: "WrongPass1!" }))).rejects.toThrow(
                InvalidCredentialsError,
            );
        });

        it("throws InvalidCredentialsError for non-existent email", async () => {
            await expect(
                commandBus.execute(new LoginCommand({ email: "nobody@example.com", password: PASSWORD })),
            ).rejects.toThrow(InvalidCredentialsError);
        });

        it("throws AccountNotActivatedError for unactivated user", async () => {
            const email = uniqueEmail();
            await createUser({ email });

            await expect(commandBus.execute(new LoginCommand({ email, password: PASSWORD }))).rejects.toThrow(
                AccountNotActivatedError,
            );
        });

        it("throws AccountSuspendedError for suspended user", async () => {
            const { userId, email } = await createActivatedUser();
            await commandBus.execute(new SuspendSystemUserCommand({ userId }));

            await expect(commandBus.execute(new LoginCommand({ email, password: PASSWORD }))).rejects.toThrow(
                AccountSuspendedError,
            );
        });
    });

    // ─── Activation Token Flow ───────────────────────────────

    describe("Activation Token Flow", () => {
        it("generates activation token for unactivated user", async () => {
            const userId = await createUser();

            const result = await commandBus.execute<GenerateActivationTokenCommand, GenerateActivationTokenResult>(
                new GenerateActivationTokenCommand({ userId }),
            );

            expect(result.activationToken).toBeDefined();
        });

        it("throws AccountAlreadyActivatedError when generating token for activated user", async () => {
            const { userId } = await createActivatedUser();

            await expect(commandBus.execute(new GenerateActivationTokenCommand({ userId }))).rejects.toThrow(
                AccountAlreadyActivatedError,
            );
        });

        it("activates account with valid activation token and returns tokens", async () => {
            const userId = await createUser();
            const { activationToken } = await commandBus.execute<
                GenerateActivationTokenCommand,
                GenerateActivationTokenResult
            >(new GenerateActivationTokenCommand({ userId }));

            const result = await commandBus.execute<ActivateAccountCommand, ActivateAccountResult>(
                new ActivateAccountCommand({ activationToken, password: PASSWORD }),
            );

            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
        });

        it("user can login after activation", async () => {
            const email = uniqueEmail();
            const userId = await createUser({ email });
            const { activationToken } = await commandBus.execute<
                GenerateActivationTokenCommand,
                GenerateActivationTokenResult
            >(new GenerateActivationTokenCommand({ userId }));
            await commandBus.execute(new ActivateAccountCommand({ activationToken, password: PASSWORD }));

            const result = await commandBus.execute<LoginCommand, LoginResult>(
                new LoginCommand({ email, password: PASSWORD }),
            );

            expect(result.accessToken).toBeDefined();
        });

        it("throws AccountAlreadyActivatedError when activating twice", async () => {
            const userId = await createUser();
            const { activationToken } = await commandBus.execute<
                GenerateActivationTokenCommand,
                GenerateActivationTokenResult
            >(new GenerateActivationTokenCommand({ userId }));
            await commandBus.execute(new ActivateAccountCommand({ activationToken, password: PASSWORD }));

            await expect(
                commandBus.execute(new ActivateAccountCommand({ activationToken, password: PASSWORD })),
            ).rejects.toThrow(AccountAlreadyActivatedError);
        });

        it("throws InvalidActivationTokenError for garbage token", async () => {
            await expect(
                commandBus.execute(new ActivateAccountCommand({ activationToken: "garbage", password: PASSWORD })),
            ).rejects.toThrow(InvalidActivationTokenError);
        });
    });

    // ─── Refresh Token ──────────────────────────────────────

    describe("Refresh Token", () => {
        it("returns a new access token for valid refresh token", async () => {
            const { email } = await createActivatedUser();
            const loginResult = await commandBus.execute<LoginCommand, LoginResult>(
                new LoginCommand({ email, password: PASSWORD }),
            );

            const result = await commandBus.execute<RefreshTokenCommand, RefreshTokenResult>(
                new RefreshTokenCommand({ refreshToken: loginResult.refreshToken }),
            );

            expect(result.accessToken).toBeDefined();
        });

        it("throws UnauthorizedException for invalid refresh token", async () => {
            await expect(commandBus.execute(new RefreshTokenCommand({ refreshToken: "garbage" }))).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it("throws UnauthorizedException for suspended user's refresh token", async () => {
            const { userId, email } = await createActivatedUser();
            const loginResult = await commandBus.execute<LoginCommand, LoginResult>(
                new LoginCommand({ email, password: PASSWORD }),
            );
            await commandBus.execute(new SuspendSystemUserCommand({ userId }));

            await expect(
                commandBus.execute(new RefreshTokenCommand({ refreshToken: loginResult.refreshToken })),
            ).rejects.toThrow(UnauthorizedException);
        });

        it("rejects access token used as refresh token", async () => {
            const { email } = await createActivatedUser();
            const loginResult = await commandBus.execute<LoginCommand, LoginResult>(
                new LoginCommand({ email, password: PASSWORD }),
            );

            await expect(
                commandBus.execute(new RefreshTokenCommand({ refreshToken: loginResult.accessToken })),
            ).rejects.toThrow(UnauthorizedException);
        });
    });

    // ─── Change Password ────────────────────────────────────

    describe("Change Password", () => {
        it("allows login with new password after change", async () => {
            const { userId, email } = await createActivatedUser();
            const newPassword = "NewSecure1!";

            await commandBus.execute(new ChangePasswordCommand({ userId, password: newPassword }));

            const result = await commandBus.execute<LoginCommand, LoginResult>(
                new LoginCommand({ email, password: newPassword }),
            );
            expect(result.accessToken).toBeDefined();
        });

        it("old password no longer works after change", async () => {
            const { userId, email } = await createActivatedUser();

            await commandBus.execute(new ChangePasswordCommand({ userId, password: "NewSecure1!" }));

            await expect(commandBus.execute(new LoginCommand({ email, password: PASSWORD }))).rejects.toThrow(
                InvalidCredentialsError,
            );
        });

        it("creates credentials for user that has none", async () => {
            const email = uniqueEmail();
            const userId = await createUser({ email });
            await commandBus.execute(new ActivateSystemUserCommand({ userId }));

            await commandBus.execute(new ChangePasswordCommand({ userId, password: PASSWORD }));

            const result = await commandBus.execute<LoginCommand, LoginResult>(
                new LoginCommand({ email, password: PASSWORD }),
            );
            expect(result.accessToken).toBeDefined();
        });

        it("validates password strength", async () => {
            const { userId } = await createActivatedUser();

            await expect(commandBus.execute(new ChangePasswordCommand({ userId, password: "weak" }))).rejects.toThrow();
        });
    });

    // ─── Set Password (initial activation via CLI) ──────────

    describe("Set Password", () => {
        it("sets password and activates unactivated user", async () => {
            const email = uniqueEmail();
            const userId = await createUser({ email });

            await commandBus.execute(new SetPasswordCommand({ userId, password: PASSWORD }));

            const result = await commandBus.execute<LoginCommand, LoginResult>(
                new LoginCommand({ email, password: PASSWORD }),
            );
            expect(result.accessToken).toBeDefined();
        });

        it("throws AccountAlreadyActivatedError for already activated user", async () => {
            const { userId } = await createActivatedUser();

            await expect(commandBus.execute(new SetPasswordCommand({ userId, password: PASSWORD }))).rejects.toThrow(
                AccountAlreadyActivatedError,
            );
        });

        it("validates password strength", async () => {
            const userId = await createUser();

            await expect(commandBus.execute(new SetPasswordCommand({ userId, password: "short" }))).rejects.toThrow();
        });
    });

    // ─── Full Lifecycle ─────────────────────────────────────

    describe("Full lifecycle", () => {
        it("create user → generate activation token → activate → login → refresh → change password → login with new", async () => {
            const email = uniqueEmail();

            // Create user
            const userId = await createUser({ email });

            // Generate activation token
            const { activationToken } = await commandBus.execute<
                GenerateActivationTokenCommand,
                GenerateActivationTokenResult
            >(new GenerateActivationTokenCommand({ userId }));

            // Activate with password
            const activateResult = await commandBus.execute<ActivateAccountCommand, ActivateAccountResult>(
                new ActivateAccountCommand({ activationToken, password: PASSWORD }),
            );
            expect(activateResult.accessToken).toBeDefined();

            // Login
            const loginResult = await commandBus.execute<LoginCommand, LoginResult>(
                new LoginCommand({ email, password: PASSWORD }),
            );
            expect(loginResult.accessToken).toBeDefined();

            // Refresh
            const refreshResult = await commandBus.execute<RefreshTokenCommand, RefreshTokenResult>(
                new RefreshTokenCommand({ refreshToken: loginResult.refreshToken }),
            );
            expect(refreshResult.accessToken).toBeDefined();

            // Change password
            const newPassword = "Changed99!";
            await commandBus.execute(new ChangePasswordCommand({ userId, password: newPassword }));

            // Login with new password
            const newLoginResult = await commandBus.execute<LoginCommand, LoginResult>(
                new LoginCommand({ email, password: newPassword }),
            );
            expect(newLoginResult.accessToken).toBeDefined();

            // Old password fails
            await expect(commandBus.execute(new LoginCommand({ email, password: PASSWORD }))).rejects.toThrow(
                InvalidCredentialsError,
            );
        });
    });
});
