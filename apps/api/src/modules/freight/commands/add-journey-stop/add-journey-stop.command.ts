import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class AddJourneyStopCommand extends Command<void> {
    readonly journeyId: string;
    readonly customerId: string;
    readonly customerName: string;
    readonly address: {
        country: string;
        postalCode: string;
        state: string;
        city: string;
        street: string;
    };
    readonly sequence: number;

    constructor(props: CommandProps<AddJourneyStopCommand>) {
        super(props);
        this.journeyId = props.journeyId;
        this.customerId = props.customerId;
        this.customerName = props.customerName;
        this.address = props.address;
        this.sequence = props.sequence;
    }
}
