import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export interface ActivateAccountResult {
    accessToken: string;
    refreshToken: string;
}

export class ActivateAccountCommand extends Command<ActivateAccountResult> {
    readonly activationToken: string;
    readonly password: string;

    constructor(props: CommandProps<ActivateAccountCommand>) {
        super(props);
        this.activationToken = props.activationToken;
        this.password = props.password;
    }
}
