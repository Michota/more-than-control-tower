import type { ComponentProps } from "react";

import { useFieldContext } from "@/hooks/use-app-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

interface FormFieldTextAreaProps extends Omit<ComponentProps<"textarea">, "value"> {
    label: string;
    description?: string;
}

export default function FormFieldTextArea({ label, description, ...props }: FormFieldTextAreaProps) {
    const field = useFieldContext<string>();
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

    return (
        <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
            {description && <FieldDescription id={`${field.name}-desc`}>{description}</FieldDescription>}
            <Textarea
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
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
        </Field>
    );
}
