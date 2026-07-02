import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const LOVABLE_AIG_RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

export function createLovableAiGatewayProvider(lovableApiKey: string, initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  let resolveRunId: (value: string | undefined) => void = () => {};
  let runIdResolved = false;
  const runIdReady = new Promise<string | undefined>((resolve) => {
    resolveRunId = resolve;
  });
  const publishRunId = (value?: string) => {
    const next = value?.trim() || undefined;
    if (!runId && next) runId = next;
    if (!runIdResolved) {
      runIdResolved = true;
      resolveRunId(runId);
    }
  };
  if (runId) publishRunId(runId);

  const provider = createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(LOVABLE_AIG_RUN_ID_HEADER)) {
        headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
      }
      try {
        const res = await fetch(input, { ...init, headers });
        publishRunId(res.headers.get(LOVABLE_AIG_RUN_ID_HEADER) ?? undefined);
        return res;
      } catch (e) {
        publishRunId(undefined);
        throw e;
      }
    },
  });
  return Object.assign(provider, {
    getRunId: () => runId,
    waitForRunId: () => (runId ? Promise.resolve(runId) : runIdReady),
  });
}

export function getAiModel() {
  const lovableKey = process.env.LOVABLE_API_KEY || process.env.VITE_LOVABLE_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  console.log(
    "DEBUG [getAiModel]: process.env.LOVABLE_API_KEY =",
    lovableKey ? `FOUND (len=${lovableKey.length})` : "NOT FOUND",
  );
  console.log(
    "DEBUG [getAiModel]: process.env.GEMINI_API_KEY =",
    geminiKey ? `FOUND (len=${geminiKey.length})` : "NOT FOUND",
  );

  if (lovableKey && lovableKey.trim() !== "") {
    const provider = createLovableAiGatewayProvider(lovableKey);
    return provider("google/gemini-3-flash-preview");
  }

  if (geminiKey && geminiKey.trim() !== "") {
    const google = createGoogleGenerativeAI({
      apiKey: geminiKey,
    });
    return google("gemini-2.5-flash");
  }

  throw new Error(
    "Missing AI API Key. Please configure LOVABLE_API_KEY or VITE_GEMINI_API_KEY in your .env file.",
  );
}
