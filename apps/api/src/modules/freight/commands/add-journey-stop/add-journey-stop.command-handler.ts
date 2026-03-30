import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { JourneyRepositoryPort } from "../../database/journey.repository.port.js";
import { JourneyStop } from "../../domain/journey-stop.value-object.js";
import { JourneyNotFoundError } from "../../domain/journey.errors.js";
import { JOURNEY_REPOSITORY_PORT } from "../../freight.di-tokens.js";
import { AddJourneyStopCommand } from "./add-journey-stop.command.js";

@CommandHandler(AddJourneyStopCommand)
export class AddJourneyStopCommandHandler implements ICommandHandler<AddJourneyStopCommand> {
    constructor(
        @Inject(JOURNEY_REPOSITORY_PORT)
        private readonly journeyRepo: JourneyRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,
    ) {}

    async execute(cmd: AddJourneyStopCommand): Promise<void> {
        const journey = await this.journeyRepo.findOneById(cmd.journeyId);
        if (!journey) {
            throw new JourneyNotFoundError(cmd.journeyId);
        }

        journey.addStop(
            new JourneyStop({
                customerId: cmd.customerId,
                customerName: cmd.customerName,
                address: cmd.address,
                orderIds: [],
                sequence: cmd.sequence,
            }),
        );

        await this.journeyRepo.save(journey);
        await this.uow.commit();
    }
}
