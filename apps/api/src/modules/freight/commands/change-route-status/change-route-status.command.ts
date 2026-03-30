import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class ActivateRouteCommand extends Command<void> {
    readonly routeId: string;

    constructor(props: CommandProps<ActivateRouteCommand>) {
        super(props);
        this.routeId = props.routeId;
    }
}

export class DeactivateRouteCommand extends Command<void> {
    readonly routeId: string;

    constructor(props: CommandProps<DeactivateRouteCommand>) {
        super(props);
        this.routeId = props.routeId;
    }
}
