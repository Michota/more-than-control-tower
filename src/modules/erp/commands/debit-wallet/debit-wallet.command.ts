import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class DebitWalletCommand extends Command<void> {
    readonly employeeId: string;
    readonly amount: string;
    readonly method: string;
    readonly reason: string;
    readonly actorId: string;

    constructor(props: CommandProps<DebitWalletCommand>) {
        super(props);
        this.employeeId = props.employeeId;
        this.amount = props.amount;
        this.method = props.method;
        this.reason = props.reason;
        this.actorId = props.actorId;
    }
}
