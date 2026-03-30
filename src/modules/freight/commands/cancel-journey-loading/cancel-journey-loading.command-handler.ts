import { Inject } from "@nestjs/common";
import { CommandBus, CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import { CancelTransferRequestsByRequesterCommand } from "../../../../shared/commands/cancel-transfer-requests-by-requester.command.js";
import type { JourneyRepositoryPort } from "../../database/journey.repository.port.js";
import { JourneyNotFoundError } from "../../domain/journey.errors.js";
import { JOURNEY_REPOSITORY_PORT } from "../../freight.di-tokens.js";
import { CancelJourneyLoadingCommand } from "./cancel-journey-loading.command.js";

@CommandHandler(CancelJourneyLoadingCommand)
export class CancelJourneyLoadingCommandHandler implements ICommandHandler<CancelJourneyLoadingCommand> {
    constructor(
        @Inject(JOURNEY_REPOSITORY_PORT)
        private readonly journeyRepo: JourneyRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly commandBus: CommandBus,
    ) {}

    async execute(cmd: CancelJourneyLoadingCommand): Promise<void> {
        const journey = await this.journeyRepo.findOneById(cmd.journeyId);
        if (!journey) {
            throw new JourneyNotFoundError(cmd.journeyId);
        }

        journey.cancelLoading();

        await this.journeyRepo.save(journey);
        await this.uow.commit();

        // Cascade: cancel all pending stock transfer requests created for this journey
        await this.commandBus.execute(
            new CancelTransferRequestsByRequesterCommand({
                requestedBy: `freight:journey:${journey.id as string}`,
            }),
        );
    }
}
