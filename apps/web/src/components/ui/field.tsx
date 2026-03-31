import * as React from "react";
import { useMemo } from "react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

function Field({ className, ...props }: React.ComponentProps<"div"> & { "data-invalid"?: boolean }) {
    return <div role="group" data-slot="field" className={cn("flex flex-col gap-2", className)} {...props} />;
}

function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
    return (
        <Label
            data-slot="field-label"
            className={cn("group-data-[disabled=true]/field:opacity-50", className)}
            {...props}
        />
    );
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
    return (
        <p
            data-slot="field-description"
            className={cn("text-muted-foreground text-sm leading-normal", className)}
            {...props}
        />
    );
}

function FieldError({
    className,
    children,
    errors,
    ...props
}: React.ComponentProps<"div"> & {
    errors?: Array<{ message?: string } | string | undefined>;
}) {
    const content = useMemo(() => {
        if (children) {
            return children;
        }

        if (!errors?.length) {
            return null;
        }

        const messages = errors.map((e) => (typeof e === "string" ? e : e?.message)).filter(Boolean);

        if (messages.length === 0) {
            return null;
        }

        if (messages.length === 1) {
            return messages[0];
        }

        return (
            <ul className="ml-4 flex list-disc flex-col gap-1">
                {messages.map((msg, i) => (
                    <li key={i}>{msg}</li>
                ))}
            </ul>
        );
    }, [children, errors]);

    if (!content) {
        return null;
    }

    return (
        <div role="alert" data-slot="field-error" className={cn("text-destructive text-sm", className)} {...props}>
            {content}
        </div>
    );
}

export { Field, FieldLabel, FieldDescription, FieldError };
