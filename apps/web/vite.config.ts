import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
    plugins: [
        tailwindcss(),
        TanStackRouterVite(),
        react(),
        paraglideVitePlugin({
            project: "../../packages/i18n/project.inlang",
            outdir: "./src/lib/paraglide",
        }),
        VitePWA({
            registerType: "autoUpdate",
            manifest: {
                name: "MTCT",
                short_name: "MTCT",
                start_url: "/",
                display: "standalone",
                background_color: "#ffffff",
                theme_color: "#ffffff",
                icons: [
                    {
                        src: "manifest-icon-192.maskable.png",
                        sizes: "192x192",
                        type: "image/png",
                        purpose: "any",
                    },
                    {
                        src: "manifest-icon-512.maskable.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "any",
                    },
                    {
                        src: "manifest-icon-512.maskable.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "maskable",
                    },
                ],
            },
        }),
    ],
    resolve: {
        alias: {
            "~": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        port: 4200,
        proxy: {
            "/api": {
                target: "http://localhost:3000",
                changeOrigin: true,
            },
        },
    },
});
