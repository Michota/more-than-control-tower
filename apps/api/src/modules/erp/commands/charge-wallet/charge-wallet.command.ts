import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class ChargeWalletCommand extends Command<void> {
    readonly employeeId: string;
    readonly amount: string;
    readonly reason: string;
    readonly actorId: string;

    constructor(props: CommandProps<ChargeWalletCommand>) {
        super(props);
        this.employeeId = props.employeeId;
        this.amount = props.amount;
        this.reason = props.reason;
        this.actorId = props.actorId;
    }
}
