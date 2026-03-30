import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export interface RefreshTokenResult {
    accessToken: string;
    refreshToken: string;
}

export class RefreshTokenCommand extends Command<RefreshTokenResult> {
    readonly refreshToken: string;

    constructor(props: CommandProps<RefreshTokenCommand>) {
        super(props);
        this.refreshToken = props.refreshToken;
    }
}
