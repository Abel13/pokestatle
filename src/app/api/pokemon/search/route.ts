import { NextResponse } from "next/server";
import { searchPokemon } from "@/lib/db/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const results = searchPokemon(q, 12);
  return NextResponse.json(results);
}
