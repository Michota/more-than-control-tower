import { randomUUID } from "crypto";
import { ArgumentNotProvidedException } from "../exceptions";
import { isEmpty } from "es-toolkit/compat";

export type CommandProps<T> = Omit<T, "id" | "metadata"> & Partial<Command>;

type CommandMetadata = {
    /**
     * Time when the command occurred. Mostly for tracing purposes
     */
    readonly timestamp: number;
};

export class Command {
    /**
     * Command id, in case if we want to save it
     * for auditing purposes and create a correlation/causation chain
     */
    readonly id: string;

    readonly metadata: CommandMetadata;

    constructor(properties: CommandProps<unknown>) {
        if (isEmpty(properties)) {
            throw new ArgumentNotProvidedException("Command props should not be empty");
        }
        this.id = properties.id ?? randomUUID();
        this.metadata = {
            timestamp: properties?.metadata?.timestamp ?? Date.now(),
        };
    }
}
