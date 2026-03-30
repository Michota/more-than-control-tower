import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export interface LoginResult {
    accessToken: string;
    refreshToken: string;
}

export class LoginCommand extends Command<LoginResult> {
    readonly email: string;
    readonly password: string;

    constructor(props: CommandProps<LoginCommand>) {
        super(props);
        this.email = props.email;
        this.password = props.password;
    }
}
