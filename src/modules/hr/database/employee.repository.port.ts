import { RepositoryPort } from "../../../libs/ports/repository.port.js";
import { EmployeeAggregate } from "../domain/employee.aggregate.js";
import type { QualificationFilter } from "../../../shared/queries/find-employees-by-qualification.query.js";

export interface EmployeeRepositoryPort extends RepositoryPort<EmployeeAggregate> {
    findByUserId(userId: string): Promise<EmployeeAggregate | null>;
    existsByUserId(userId: string): Promise<boolean>;
    findByEmail(email: string): Promise<EmployeeAggregate | null>;
    findByPhone(phone: string): Promise<EmployeeAggregate | null>;
    findByPositionAndQualifications(positionKey: string, filters: QualificationFilter[]): Promise<EmployeeAggregate[]>;
}
