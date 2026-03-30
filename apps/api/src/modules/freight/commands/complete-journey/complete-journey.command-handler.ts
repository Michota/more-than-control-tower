import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { JourneyRepositoryPort } from "../../database/journey.repository.port.js";
import { JourneyNotFoundError } from "../../domain/journey.errors.js";
import { JOURNEY_REPOSITORY_PORT } from "../../freight.di-tokens.js";
import { CompleteJourneyCommand } from "./complete-journey.command.js";

@CommandHandler(CompleteJourneyCommand)
export class CompleteJourneyCommandHandler implements ICommandHandler<CompleteJourneyCommand> {
    constructor(
        @Inject(JOURNEY_REPOSITORY_PORT)
        private readonly journeyRepo: JourneyRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: CompleteJourneyCommand): Promise<void> {
        const journey = await this.journeyRepo.findOneById(cmd.journeyId);
        if (!journey) {
            throw new JourneyNotFoundError(cmd.journeyId);
        }

        journey.complete();

        await this.journeyRepo.save(journey);
        await this.uow.commit();

        for (const event of journey.domainEvents) {
            await this.eventBus.publish(event);
        }
        journey.clearEvents();
    }
}
