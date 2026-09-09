import type { NextConfig } from "next";

/**
 * Map Supabase/Vercel integration aliases (incl. STORAGE_ prefix) into the
 * NEXT_PUBLIC_* names the browser client expects.
 */
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.STORAGE_NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.STORAGE_SUPABASE_URL ||
  "";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.STORAGE_NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.STORAGE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  "";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  env: {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
  },
  images: {
    remotePatterns: [
      // Path includes `sprites@master` (no slash before @) — `/sprites/**` does NOT match.
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
        pathname: "/gh/PokeAPI/**",
      },
      // Keep GitHub for backward compatibility during migration
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/PokeAPI/**",
      },
    ],
  },
  serverExternalPackages: ["better-sqlite3", "postgres"],
};

export default nextConfig;
