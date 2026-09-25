import { NextRequest } from "next/server";
import { evaluatePreLLMGuardrail } from "@/lib/vaathi/guardrails";
import { checkSemanticCache } from "@/lib/vaathi/cache";
import { executeSinglePassVaathi } from "@/lib/vaathi/agent";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const latestMessage = messages[messages.length - 1]?.content || "";

    // PIPELINE STEP 1: Pre-LLM Guardrail Check (0 Tokens Spent!)
    const guardrail = evaluatePreLLMGuardrail(latestMessage);
    if (guardrail.intercepted && guardrail.content) {
      return createSSEResponse({
        content: guardrail.content,
        toolsUsed: []
      });
    }

    // PIPELINE STEP 2: Semantic Response Cache Check (0 Tokens Spent, 0ms Latency!)
    const cacheHit = checkSemanticCache(latestMessage);
    if (cacheHit) {
      return createSSEResponse({
        content: cacheHit.answer,
        toolsUsed: cacheHit.toolsUsed || []
      });
    }

    // PIPELINE STEP 3: Multi-Tier Failover (1st: Groq Qwen, 2nd: Google Gemini)
    const candidateModels = [
      // 1st: Groq Models (Ultra-fast inference & reasoning)
      process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
      // 2nd: Google Gemini (Secondary resilient enterprise failover)
      process.env.GEMINI_MODEL || "gemini-flash-latest"
    ];

    let result: { content: string; toolsUsed: string[] } | null = null;
    let lastErr: any;

    for (const modelName of candidateModels) {
      try {
        result = await executeSinglePassVaathi(messages, modelName);
        break; // Success!
      } catch (err: any) {
        lastErr = err;
        const isTransientOrUnavailable =
          err.status === 429 ||
          err.status === 404 ||
          String(err).includes("429") ||
          String(err).includes("Rate limit") ||
          String(err).includes("Quota exceeded") ||
          String(err).includes("model_not_found") ||
          String(err).includes("does not exist") ||
          String(err).includes("decommissioned");
        if (isTransientOrUnavailable) {
          console.warn(`Model ${modelName} unavailable (${err.message || err}), trying fallback model...`);
          continue;
        }
        throw err;
      }
    }

    if (!result) {
      throw lastErr || new Error("All AI service models are currently busy. Please retry in a few seconds.");
    }

    return createSSEResponse(result);

  } catch (error: any) {
    console.error("Vaathi API route error:", error);
    const errorMessage = error.message || String(error) || "An unexpected error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/** Helper to format SSE Stream Response */
function createSSEResponse(payload: { content: string; toolsUsed: string[] }) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      if (payload.toolsUsed && payload.toolsUsed.length > 0) {
        const toolData = JSON.stringify({ type: "tools_used", tools: payload.toolsUsed });
        controller.enqueue(encoder.encode(`data: ${toolData}\n\n`));
      }

      if (payload.content) {
        const contentData = JSON.stringify({ type: "content", content: payload.content });
        controller.enqueue(encoder.encode(`data: ${contentData}\n\n`));
      }

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
