import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ortWasmShim = path.join(__dirname, "lib", "onnxruntime-web-wasm-shim.js")

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["192.168.1.115"],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    resolveAlias: {
      "onnxruntime-web/wasm": "./lib/onnxruntime-web-wasm-shim.js",
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "onnxruntime-web/wasm": ortWasmShim,
    }

    return config
  },
}

export default nextConfig
