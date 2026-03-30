import { AggregateRoot } from "../../../libs/ddd/aggregate-root.abstract.js";
import { EntityProps } from "../../../libs/ddd/entities/entity.abstract.js";
import z from "zod";

const authCredentialsSchema = z.object({
    userId: z.uuid(),
    passwordHash: z.string().min(1),
});

export type AuthCredentialsProperties = z.infer<typeof authCredentialsSchema>;

export class AuthCredentialsAggregate extends AggregateRoot<AuthCredentialsProperties> {
    static create(properties: AuthCredentialsProperties): AuthCredentialsAggregate {
        const credentials = new AuthCredentialsAggregate({ properties });
        credentials.validate();
        return credentials;
    }

    static reconstitute(props: EntityProps<AuthCredentialsProperties>): AuthCredentialsAggregate {
        return new AuthCredentialsAggregate(props);
    }

    validate(): void {
        authCredentialsSchema.parse(this.properties);
    }

    changePassword(newPasswordHash: string): void {
        Object.assign(this.properties, { passwordHash: newPasswordHash });
        this.validate();
    }

    get userId(): string {
        return this.properties.userId;
    }

    get passwordHash(): string {
        return this.properties.passwordHash;
    }
}
