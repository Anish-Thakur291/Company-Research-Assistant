import { runResearch } from "@/lib/research";
import type { ProgressEvent } from "@/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  const { query, model } = await request.json();

  if (!query || typeof query !== "string") {
    return new Response(JSON.stringify({ error: "Query is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: ProgressEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        await runResearch(query, model || "openai/gpt-4o-mini", send);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Research failed";
        send({ type: "error", step: "error", error: message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
