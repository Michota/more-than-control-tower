import { RequiredEntityData } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { Mapper } from "../../../libs/ddd/mapper.interface.js";
import { EntityId } from "../../../libs/ddd/entities/entity-id.js";
import { GetEmployeeResponse } from "../../../shared/queries/get-employee.query.js";
import { EmployeeAggregate } from "../domain/employee.aggregate.js";
import { EmployeeStatus } from "../domain/employee-status.enum.js";
import { PositionAssignment as DomainPositionAssignment } from "../domain/position-assignment.value-object.js";
import { PermissionOverride as DomainPermissionOverride } from "../domain/permission-override.value-object.js";
import { PermissionOverrideState } from "../domain/permission-override-state.enum.js";
import { Employee } from "./employee.entity.js";

@Injectable()
export class EmployeeMapper implements Mapper<EmployeeAggregate, RequiredEntityData<Employee>, GetEmployeeResponse> {
    toDomain(record: Employee): EmployeeAggregate {
        const positionAssignments = record.positionAssignments.getItems().map(
            (pa) =>
                new DomainPositionAssignment({
                    positionKey: pa.positionKey,
                    assignedAt: pa.assignedAt,
                }),
        );

        const permissionOverrides = record.permissionOverrides.getItems().map(
            (po) =>
                new DomainPermissionOverride({
                    permissionKey: po.permissionKey,
                    state: po.state as PermissionOverrideState,
                }),
        );

        return EmployeeAggregate.reconstitute({
            id: record.id as EntityId,
            properties: {
                userId: record.userId ?? undefined,
                firstName: record.firstName,
                lastName: record.lastName,
                email: record.email ?? undefined,
                phone: record.phone ?? undefined,
                status: record.status as EmployeeStatus,
                positionAssignments,
                permissionOverrides,
            },
        });
    }

    toPersistence(domain: EmployeeAggregate): RequiredEntityData<Employee> {
        return {
            id: domain.id as string,
            userId: domain.userId ?? null,
            firstName: domain.firstName,
            lastName: domain.lastName,
            email: domain.email ?? null,
            phone: domain.phone ?? null,
            status: domain.status,
            positionAssignments: domain.positionAssignments.map((pa) => ({
                positionKey: pa.positionKey,
                assignedAt: pa.assignedAt,
            })) as RequiredEntityData<Employee>["positionAssignments"],
            permissionOverrides: domain.permissionOverrides.map((po) => ({
                permissionKey: po.permissionKey,
                state: po.state,
            })) as RequiredEntityData<Employee>["permissionOverrides"],
        };
    }

    toResponse(employee: EmployeeAggregate): GetEmployeeResponse {
        return {
            id: employee.id,
            userId: employee.userId,
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            phone: employee.phone,
            status: employee.status,
            positionAssignments: employee.positionAssignments.map((pa) => ({
                positionKey: pa.positionKey,
                assignedAt: pa.assignedAt.toISOString(),
            })),
        };
    }
}
