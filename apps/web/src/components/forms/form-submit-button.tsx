import type { ReactNode } from "react";

import { useFormContext } from "@/hooks/use-app-form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface FormSubmitButtonProps {
    children?: ReactNode;
    className?: string;
}

export function FormSubmitButton({ children = "Zapisz", className }: FormSubmitButtonProps) {
    const form = useFormContext();

    return (
        <form.Subscribe
            selector={(state) => ({
                canSubmit: state.canSubmit,
                isSubmitting: state.isSubmitting,
            })}
        >
            {({ canSubmit, isSubmitting }) => (
                <Button type="submit" disabled={!canSubmit || isSubmitting} className={className}>
                    {isSubmitting && <Loader2 className="animate-spin" />}
                    {children}
                </Button>
            )}
        </form.Subscribe>
    );
}
