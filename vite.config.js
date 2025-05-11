import { defineConfig } from "vite";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";
import path from "path";

export default defineConfig(({ mode }) => {
    const isProduction = mode === "production";

    return {
        css: {
            postcss: {
                plugins: [
                    autoprefixer(),
                    isProduction && cssnano(),
                ].filter(Boolean),
            },
        },
        build: {
            outDir: "static",
            emptyOutDir: false,
            rollupOptions: {
                input: path.resolve(__dirname, "static/assets/scss/custom.scss"),
                output: {
                    assetFileNames: (assetInfo) => {
                        if (assetInfo.name === "custom.css") {
                            return "assets/css/custom.css";
                        }
                        return "assets/css/[name].[ext]";
                    },
                },
            },
        },
        server: {
            // Configure Cross-Origin Resource Sharing (CORS)
            // `true` allows requests from any origin. Useful for local development when
            // your frontend and backend might be on different ports/domains.
            cors: true,

            // Specify which IP addresses the server should listen on.
            // '0.0.0.0' means listen on all available network interfaces (e.g., localhost, and your local network IP).
            // This allows you to access the dev server from other devices on your local network.
            host: '0.0.0.0',

            // Configure Hot Module Replacement (HMR)
            hmr: {
                // Specify the host for the HMR websocket connection.
                // This is important when `server.host` is '0.0.0.0' and you're accessing
                // the dev server from another device on the network.
                // It tells the client (browser) the exact IP address to connect to for HMR updates.
                host: '192.168.1.147'
            },
        },
    };
});