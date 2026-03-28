import { Command, CommandProps } from "../../../../libs/cqrs/command.js";
import { ScheduleType } from "../../domain/route-schedule.value-object.js";

export interface EditRouteScheduleProps {
    type: ScheduleType;
    daysOfWeek?: number[];
    daysOfMonth?: number[];
    specificDates?: string[];
}

export interface EditRouteStopProps {
    customerId: string;
    customerName: string;
    address: {
        country: string;
        postalCode: string;
        state: string;
        city: string;
        street: string;
    };
    sequence: number;
}

export class EditRouteCommand extends Command<void> {
    readonly routeId: string;
    readonly name?: string;
    readonly vehicleIds?: string[];
    readonly representativeIds?: string[];
    readonly stops?: EditRouteStopProps[];
    readonly schedule?: EditRouteScheduleProps;

    constructor(props: CommandProps<EditRouteCommand>) {
        super(props);
        this.routeId = props.routeId;
        this.name = props.name;
        this.vehicleIds = props.vehicleIds;
        this.representativeIds = props.representativeIds;
        this.stops = props.stops;
        this.schedule = props.schedule;
    }
}
