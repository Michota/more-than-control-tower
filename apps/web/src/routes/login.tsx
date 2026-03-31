import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { HTTPError } from "ky";
import { z } from "zod";
import { Languages } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useAppForm } from "@/hooks/use-app-form";
import { useLocale } from "@/hooks/use-locale";
import * as m from "@/lib/paraglide/messages";

export const Route = createFileRoute("/login")({
    component: LoginPage,
});

const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(1),
});

const localeLabels: Record<string, string> = {
    pl: "PL",
    en: "EN",
};

function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const { locale, setLocale } = useLocale();
    const [formError, setFormError] = useState<string | null>(null);

    const nextLocale = locale === "pl" ? "en" : "pl";

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

    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">{m.auth_login_title()}</CardTitle>
                    <CardAction>
                        <Button variant="ghost" size="sm" onClick={() => void setLocale(nextLocale, { reload: false })}>
                            <Languages className="size-4" />
                            {localeLabels[nextLocale]}
                        </Button>
                    </CardAction>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            void form.handleSubmit();
                        }}
                        className="flex flex-col gap-4"
                    >
                        <form.AppField name="email">
                            {(field) => <field.Input label={m.auth_email_label()} type="email" autoComplete="email" />}
                        </form.AppField>

                        <form.AppField name="password">
                            {(field) => (
                                <field.Input
                                    label={m.auth_password_label()}
                                    type="password"
                                    autoComplete="current-password"
                                />
                            )}
                        </form.AppField>

                        {formError && <p className="text-destructive text-sm">{formError}</p>}

                        <form.AppForm>
                            <form.SubmitButton className="w-full">{m.auth_login_button()}</form.SubmitButton>
                        </form.AppForm>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
