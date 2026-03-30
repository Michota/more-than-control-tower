import z from "zod";
import { ValueObjectWithSchema } from "../../../shared/ddd/value-object-with-schema.abstract.js";

export enum ScheduleType {
    DAYS_OF_WEEK = "DAYS_OF_WEEK",
    DAYS_OF_MONTH = "DAYS_OF_MONTH",
    SPECIFIC_DATES = "SPECIFIC_DATES",
}

const routeScheduleSchema = z.object({
    type: z.enum(ScheduleType),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
    daysOfMonth: z.array(z.number().min(1).max(31)).optional(),
    specificDates: z.array(z.string().date()).optional(),
});

export type RouteScheduleProperties = z.infer<typeof routeScheduleSchema>;

export class RouteSchedule extends ValueObjectWithSchema<RouteScheduleProperties> {
    protected get schema() {
        return routeScheduleSchema;
    }

    get type(): ScheduleType {
        return this.properties.type;
    }

    get daysOfWeek(): number[] | undefined {
        return this.properties.daysOfWeek;
    }

    get daysOfMonth(): number[] | undefined {
        return this.properties.daysOfMonth;
    }

    get specificDates(): string[] | undefined {
        return this.properties.specificDates;
    }

    matchesDate(date: Date): boolean {
        switch (this.type) {
            case ScheduleType.DAYS_OF_WEEK:
                return this.daysOfWeek?.includes(date.getDay()) ?? false;
            case ScheduleType.DAYS_OF_MONTH:
                return this.daysOfMonth?.includes(date.getDate()) ?? false;
            case ScheduleType.SPECIFIC_DATES: {
                const dateStr = date.toISOString().split("T")[0];
                return this.specificDates?.includes(dateStr) ?? false;
            }
        }
    }
}
