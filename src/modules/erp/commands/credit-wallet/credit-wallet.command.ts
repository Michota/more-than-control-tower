import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class CreditWalletCommand extends Command<void> {
    readonly employeeId: string;
    readonly amount: string;
    readonly currency: string;
    readonly method: string;
    readonly reason: string;
    readonly actorId: string;

    constructor(props: CommandProps<CreditWalletCommand>) {
        super(props);
        this.employeeId = props.employeeId;
        this.amount = props.amount;
        this.currency = props.currency;
        this.method = props.method;
        this.reason = props.reason;
        this.actorId = props.actorId;
    }
}
