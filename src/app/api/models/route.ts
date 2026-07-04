import { NextResponse } from "next/server";
import { fetchModels } from "@/lib/openrouter";

export async function GET() {
  try {
    const models = await fetchModels();
    return NextResponse.json({ models });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch models";
    return NextResponse.json({ error: message, models: [] }, { status: 500 });
  }
}
