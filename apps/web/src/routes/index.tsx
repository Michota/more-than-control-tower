import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
    component: HomePage,
});

function HomePage() {
    return (
        <div>
            <h1>MTCT</h1>
            <p>More Than Control Tower</p>
        </div>
    );
}
