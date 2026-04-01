import { Languages } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/hooks/use-locale";
import { useLoginForm } from "@/features/auth/hooks/use-login-form";
import * as m from "@/lib/paraglide/messages";

const localeLabels: Record<string, () => string> = {
    pl: m.locale_pl,
    en: m.locale_en,
};

export function LoginPage() {
    const { locale, setLocale } = useLocale();
    const { form, formError } = useLoginForm();

    const nextLocale = locale === "pl" ? "en" : "pl";

    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">{m.auth_login_title()}</CardTitle>
                    <CardAction>
                        <Button variant="ghost" size="sm" onClick={() => void setLocale(nextLocale, { reload: false })}>
                            <Languages className="size-4" />
                            {localeLabels[nextLocale]?.()}
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
