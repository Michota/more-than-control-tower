import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export interface AvailabilityEntryInput {
    date: string;
    startTime: string;
    endTime: string;
}

export class SetAvailabilityCommand extends Command<void> {
    readonly employeeId: string;
    readonly entries: AvailabilityEntryInput[];
    readonly setByManager: boolean;

    constructor(props: CommandProps<SetAvailabilityCommand>) {
        super(props);
        this.employeeId = props.employeeId;
        this.entries = props.entries;
        this.setByManager = props.setByManager;
    }
}
