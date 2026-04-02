import { randomUUID } from "crypto";
import { Command as NestCommand } from "@nestjs/cqrs";
import { ArgumentNotProvidedException } from "../exceptions/index.js";
import { isEmpty } from "es-toolkit/compat";

export type CommandProps<T> = Omit<T, keyof Command<any>> & Partial<Pick<Command<any>, "id" | "metadata">>;

type CommandMetadata = {
    /**
     * Time when the command occurred. Mostly for tracing purposes
     */
    readonly timestamp: number;
};

export class Command<TResult = void> extends NestCommand<TResult> {
    /**
     * Command id, in case if we want to save it
     * for auditing purposes and create a correlation/causation chain
     */
    readonly id: string;

    readonly metadata: CommandMetadata;

    constructor(properties: CommandProps<unknown>) {
        super();
        if (isEmpty(properties)) {
            throw new ArgumentNotProvidedException("Command props should not be empty");
        }
        this.id = properties.id ?? randomUUID();
        this.metadata = {
            timestamp: properties?.metadata?.timestamp ?? Date.now(),
        };
    }
}
