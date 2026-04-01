import type { ComponentProps } from "react";

import { useFieldContext } from "@/hooks/use-app-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface FormFieldInputProps extends Omit<ComponentProps<"input">, "value"> {
    label: string;
    description?: string;
}

export default function FormFieldInput({ label, description, ...props }: FormFieldInputProps) {
    const field = useFieldContext<string>();
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

    return (
        <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
            <Input
                {...props}
                id={field.name}
                name={field.name}
                value={field.state.value ?? ""}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={(e) => {
                    props.onBlur?.(e);
                    field.handleBlur();
                }}
                aria-invalid={isInvalid}
                aria-describedby={description ? `${field.name}-desc` : undefined}
            />
            {description && <FieldDescription id={`${field.name}-desc`}>{description}</FieldDescription>}
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
        </Field>
    );
}
