import z from "zod";
import { AggregateRoot } from "../../../libs/ddd/aggregate-root.abstract.js";
import { type EntityProps } from "../../../libs/ddd/entities/entity.abstract.js";
import { CodeType } from "./code-type.enum.js";

const codeSchema = z.object({
    goodId: z.uuid(),
    type: z.enum(CodeType),
    value: z.string().min(1),
});

export type CodeProperties = z.infer<typeof codeSchema>;

export class CodeAggregate extends AggregateRoot<CodeProperties> {
    static create(properties: CodeProperties): CodeAggregate {
        const code = new CodeAggregate({ properties });
        code.validate();
        return code;
    }

    static reconstitute(props: EntityProps<CodeProperties>): CodeAggregate {
        return new CodeAggregate(props);
    }

    validate(): void {
        codeSchema.parse(this.properties);
    }

    get goodId(): string {
        return this.properties.goodId;
    }

    get type(): CodeType {
        return this.properties.type;
    }

    get value(): string {
        return this.properties.value;
    }
}
