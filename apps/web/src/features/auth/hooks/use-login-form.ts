import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { HTTPError } from "ky";
import { useAuth } from "@/lib/auth";
import { useAppForm } from "@/hooks/use-app-form";
import { loginSchema } from "@/features/auth/validation/login-schema";
import { t } from "@mtct/i18n";
import type { z } from "zod";

export function useLoginForm() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [formError, setFormError] = useState<string | null>(null);

    const form = useAppForm({
        defaultValues: {
            email: "",
            password: "",
        } as z.infer<typeof loginSchema>,
        validators: {
            onSubmit: loginSchema,
        },
        onSubmit: async ({ value }) => {
            setFormError(null);
            try {
                await login(value.email, value.password);
                await navigate({ to: "/" });
            } catch (err) {
                if (err instanceof HTTPError) {
                    const body: { message?: string } = await err.response
                        .json<{ message?: string }>()
                        .catch(() => ({}));
                    const messageKey = body.message ?? "error_auth_invalid_credentials";
                    setFormError(t(messageKey));
                } else {
                    setFormError(t("error_auth_invalid_credentials"));
                }
            }
        },
    });

    return { form, formError };
}
