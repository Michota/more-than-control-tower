import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { ActivityRepositoryPort } from "../../database/activity.repository.port.js";
import { ACTIVITY_REPOSITORY_PORT } from "../../erp.di-tokens.js";
import { ListActivitiesQuery, type ListActivitiesResponse, type ActivityListItem } from "./list-activities.query.js";

@QueryHandler(ListActivitiesQuery)
export class ListActivitiesQueryHandler implements IQueryHandler<ListActivitiesQuery, ListActivitiesResponse> {
    constructor(
        @Inject(ACTIVITY_REPOSITORY_PORT)
        private readonly activityRepo: ActivityRepositoryPort,
    ) {}

    async execute(): Promise<ListActivitiesResponse> {
        const activities = await this.activityRepo.findAll();

        return activities.map(
            (activity): ActivityListItem => ({
                id: activity.id as string,
                name: activity.properties.name,
                description: activity.properties.description,
            }),
        );
    }
}
