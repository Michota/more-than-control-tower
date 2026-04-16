import type { ComponentProps } from "react";

import { useFieldContext } from "@/hooks/use-app-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";

interface FormFieldPasswordInputProps extends Omit<ComponentProps<"input">, "value" | "type"> {
    label: string;
    description?: string;
}

export default function FormFieldPasswordInput({ label, description, ...props }: FormFieldPasswordInputProps) {
    const field = useFieldContext<string>();
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

    return (
        <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
            <PasswordInput
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
