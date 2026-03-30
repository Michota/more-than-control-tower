import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class ActivateSectorCommand extends Command<void> {
    readonly sectorId: string;

    constructor(props: CommandProps<ActivateSectorCommand>) {
        super(props);
        this.sectorId = props.sectorId;
    }
}

export class DeactivateSectorCommand extends Command<void> {
    readonly sectorId: string;

    constructor(props: CommandProps<DeactivateSectorCommand>) {
        super(props);
        this.sectorId = props.sectorId;
    }
}
