import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export interface GenerateActivationTokenResult {
    activationToken: string;
}

export class GenerateActivationTokenCommand extends Command<GenerateActivationTokenResult> {
    readonly userId: string;

    constructor(props: CommandProps<GenerateActivationTokenCommand>) {
        super(props);
        this.userId = props.userId;
    }
}
