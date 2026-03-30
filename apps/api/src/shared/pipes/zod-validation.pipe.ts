import { BadRequestException, PipeTransform } from "@nestjs/common";
import { ZodSchema } from "zod";

export class ZodValidationPipe implements PipeTransform {
    constructor(private readonly schema: ZodSchema) {}

    transform(value: unknown): unknown {
        const result = this.schema.safeParse(value);
        if (!result.success) {
            throw new BadRequestException({
                statusCode: 400,
                code: "VALIDATION_ERROR",
                message: "Validation failed",
                errors: result.error.issues.map((issue) => ({
                    path: issue.path.join("."),
                    message: issue.message,
                })),
            });
        }
        return result.data;
    }
}
