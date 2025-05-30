import { ConfigEnv, defineConfig, loadEnv } from "vite";
import { ViteEjsPlugin } from "vite-plugin-ejs";
import { version } from "./package.json";
import react from "@vitejs/plugin-react";
import legacy from "@vitejs/plugin-legacy";

export default defineConfig((config: ConfigEnv) => {
	const mode = config.mode || "development";
	const env = loadEnv(mode, process.cwd(), "VITE_");
	const baseUrl = env.VITE_BASE_URL || "/";
	const imaLibUrl = env.VITE_IMA_LIB_URL || "";
	return {
		base: baseUrl,
		build: {
			target: ["es2015"],
			outDir: "dist",
			rollupOptions: {
				input: "index.html",
				output: {
					entryFileNames: "assets/js/[name]-[hash].js",
					chunkFileNames: "assets/js/[name]-[hash].js",
					assetFileNames: "assets/[ext]/[name]-[hash][extname]",
				},
			},
		},
		plugins: [
			react(),
			legacy({
				targets: ["safari >= 6.1, chrome >= 35"],
				modernPolyfills: [
					"es.global-this",
					"es.promise.all-settled",
					"es.array.flat",
					"es.array.flat-map",
					"es.object.has-own",
					"es.object.from-entries",
				],
				additionalLegacyPolyfills: [
					"core-js/stable",
					"regenerator-runtime/runtime",
					"whatwg-fetch",
					"core-js/modules/es.promise",
					"abortcontroller-polyfill/dist/polyfill-patch-fetch",
					"../node_modules/web-streams-polyfill/dist/polyfill.es5.js",
				],
			}),
			ViteEjsPlugin(
				{
					meta: [
						{
							name: "enviroment",
							value: `${mode}`,
						},
						{
							name: "version",
							value: `${version}`,
						},
						{
							name: "imaLib",
							value: `${imaLibUrl}`,
						},
						{
							name: "baseUrl",
							value: `${baseUrl}`,
						},
					],
				},
				{
					ejs: {
						beautify: true,
					},
				},
			),
		],
		server: {
			hmr: true,
			host: true,
			port: 5173,
			allowedHosts: ["mediaset.mplay.it"],
		},
	};
});
