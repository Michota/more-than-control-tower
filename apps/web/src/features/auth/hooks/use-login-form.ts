import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { HTTPError } from "ky";
import { useAuth } from "@/lib/auth";
import { useAppForm } from "@/hooks/use-app-form";
import { loginSchema } from "@/features/auth/validation/login-schema";
import * as m from "@/lib/paraglide/messages";
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
                if (err instanceof HTTPError && err.response.status === 401) {
                    setFormError(m.auth_invalid_credentials());
                } else {
                    setFormError(m.auth_invalid_credentials());
                }
            }
        },
    });

    return { form, formError };
}
