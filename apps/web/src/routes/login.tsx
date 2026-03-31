import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { HTTPError } from "ky";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import * as m from "@/lib/paraglide/messages";

export const Route = createFileRoute("/login")({
    component: LoginPage,
});

function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    const form = useForm({
        defaultValues: { email: "", password: "" },
        onSubmit: async ({ value }) => {
            setError(null);
            try {
                await login(value.email, value.password);
                await navigate({ to: "/" });
            } catch (err) {
                if (err instanceof HTTPError && err.response.status === 401) {
                    setError(m.auth_invalid_credentials());
                } else {
                    setError(m.auth_invalid_credentials());
                }
            }
        },
    });

    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">{m.auth_login_title()}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            void form.handleSubmit();
                        }}
                        className="flex flex-col gap-4"
                    >
                        <form.Field
                            name="email"
                            validators={{
                                onBlur: ({ value }) => {
                                    if (!value) {
                                        return m.auth_email_label();
                                    }
                                    return undefined;
                                },
                            }}
                        >
                            {(field) => (
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="email">{m.auth_email_label()}</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                    />
                                </div>
                            )}
                        </form.Field>

                        <form.Field name="password">
                            {(field) => (
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="password">{m.auth_password_label()}</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        autoComplete="current-password"
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                    />
                                </div>
                            )}
                        </form.Field>

                        {error && <p className="text-destructive text-sm">{error}</p>}

                        <form.Subscribe selector={(state) => state.isSubmitting}>
                            {(isSubmitting) => (
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {m.auth_login_button()}
                                </Button>
                            )}
                        </form.Subscribe>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
