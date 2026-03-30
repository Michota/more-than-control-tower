import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class ArchiveRouteCommand extends Command<void> {
    readonly routeId: string;

    constructor(props: CommandProps<ArchiveRouteCommand>) {
        super(props);
        this.routeId = props.routeId;
    }
}
