import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "br.com.renanaugusto.upbeats",
  appName: "UP! BEATS",
  // O app Android empacota o build do site (npm run build:app, base "/").
  webDir: "dist",
  backgroundColor: "#121214",
  server: {
    // Origem https://localhost: o microfone (getUserMedia) exige contexto seguro.
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
