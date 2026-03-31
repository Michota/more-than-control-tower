import { createFileRoute } from "@tanstack/react-router";
import { useHrHttpControllerListEmployees } from "@mtct/api-client";

export const Route = createFileRoute("/test-employees")({
    component: TestEmployeesPage,
});

function TestEmployeesPage() {
    const { data, isLoading, error } = useHrHttpControllerListEmployees();

    if (isLoading) {
        return <div className="p-8">Loading employees...</div>;
    }

    if (error) {
        return <div className="p-8 text-red-500">Error: {error.message}</div>;
    }

    return (
        <div className="mx-auto max-w-4xl p-8">
            <h1 className="mb-4 text-2xl font-bold">Employees ({data?.count ?? 0})</h1>
            <div className="space-y-2">
                {data?.data.map((employee) => (
                    <div key={employee.id} className="rounded border p-4">
                        <p className="font-medium">
                            {employee.firstName} {employee.lastName}
                        </p>
                        <p className="text-muted-foreground text-sm">{employee.email}</p>
                        <p className="text-muted-foreground text-sm">Status: {employee.status}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
