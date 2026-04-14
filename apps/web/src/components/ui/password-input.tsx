import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as m from "@/lib/paraglide/messages";

function PasswordInput({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
    const [visible, setVisible] = React.useState(false);

    return (
        <div className="relative">
            <Input type={visible ? "text" : "password"} className={cn("pr-9", className)} {...props} />
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-0 h-9 w-9 -translate-y-1/2 cursor-pointer"
                onClick={() => setVisible((v) => !v)}
                tabIndex={-1}
                aria-label={visible ? m.common_hide_password() : m.common_show_password()}
            >
                {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
        </div>
    );
}

export { PasswordInput };
