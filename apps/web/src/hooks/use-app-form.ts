import { createFormHook, createFormHookContexts } from "@tanstack/react-form";

import FormFieldInput from "@/components/forms/form-field-input";
import FormFieldPasswordInput from "@/components/forms/form-field-password-input";
import FormFieldTextArea from "@/components/forms/form-field-textarea";
import { FormSubmitButton } from "@/components/forms/form-submit-button";

export const { fieldContext, formContext, useFieldContext, useFormContext } = createFormHookContexts();

const { useAppForm } = createFormHook({
    fieldContext,
    formContext,
    fieldComponents: {
        Input: FormFieldInput,
        PasswordInput: FormFieldPasswordInput,
        TextArea: FormFieldTextArea,
    },
    formComponents: {
        SubmitButton: FormSubmitButton,
    },
});

export { useAppForm };
