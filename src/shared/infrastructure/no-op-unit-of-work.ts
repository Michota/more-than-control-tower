import { Injectable } from "@nestjs/common";
import { UnitOfWorkPort } from "../ports/unit-of-work.port.js";

@Injectable()
/**
 * No-op implementation of the Unit of Work port for external API adapters.
 */
export class NoOpUnitOfWork implements UnitOfWorkPort {
    async commit(): Promise<void> {
        // External API adapters save immediately in save() — no transaction to commit
    }
}
