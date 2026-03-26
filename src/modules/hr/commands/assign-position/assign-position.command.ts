import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export interface AssignPositionQualificationProps {
    key: string;
    type: string;
    value: string;
}

export class AssignPositionCommand extends Command<void> {
    readonly employeeId: string;
    readonly positionKey: string;
    readonly qualifications: AssignPositionQualificationProps[];

    constructor(props: CommandProps<AssignPositionCommand>) {
        super(props);
        this.employeeId = props.employeeId;
        this.positionKey = props.positionKey;
        this.qualifications = props.qualifications;
    }
}
