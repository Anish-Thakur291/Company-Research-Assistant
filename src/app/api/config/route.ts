import { NextResponse } from "next/server";
import { isDiscordConfigured } from "@/lib/discord";

export async function GET() {
  return NextResponse.json({
    openrouter: !!process.env.OPENROUTER_API_KEY,
    serper: !!process.env.SERPER_API_KEY,
    discord: isDiscordConfigured(),
  });
}
