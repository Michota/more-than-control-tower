import { Inject } from "@nestjs/common";
import { CommandBus, CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { JourneyRepositoryPort } from "../../database/journey.repository.port.js";
import { JourneyNotFoundError } from "../../domain/journey.errors.js";
import { JOURNEY_REPOSITORY_PORT } from "../../freight.di-tokens.js";
import { RequestJourneyLoadingCommand } from "./request-journey-loading.command.js";

@CommandHandler(RequestJourneyLoadingCommand)
export class RequestJourneyLoadingCommandHandler implements ICommandHandler<RequestJourneyLoadingCommand> {
    constructor(
        @Inject(JOURNEY_REPOSITORY_PORT)
        private readonly journeyRepo: JourneyRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
        private readonly commandBus: CommandBus,
    ) {}

    async execute(cmd: RequestJourneyLoadingCommand): Promise<void> {
        const journey = await this.journeyRepo.findOneById(cmd.journeyId);
        if (!journey) {
            throw new JourneyNotFoundError(cmd.journeyId);
        }

        journey.requestLoading(cmd.loadingDeadline);

        await this.journeyRepo.save(journey);
        await this.uow.commit();

        for (const event of journey.domainEvents) {
            await this.eventBus.publish(event);
        }
        journey.clearEvents();
    }
}
