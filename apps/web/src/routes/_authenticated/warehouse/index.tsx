import { createFileRoute } from "@tanstack/react-router";
import * as m from "@/lib/paraglide/messages";

export const Route = createFileRoute("/_authenticated/warehouse/")({
    component: WarehouseOverview,
});

function WarehouseOverview() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold">{m.sidebar_warehouse()}</h1>
        </div>
    );
}
