import type {
  AiGenerationClient,
  AiGenerationClientRequest,
  AiGenerationClientResult,
} from "./aiTypes";

interface ClaudeClientConfig {
  apiKey?: string;
  apiUrl?: string;
  model?: string;
  fetchImpl?: typeof fetch;
}

interface ClaudeMessageResponse {
  id?: string;
  model?: string;
  content?: Array<{ type?: string; text?: string }>;
  error?: {
    message?: string;
  };
}

function readRuntimeEnv() {
  return (import.meta.env ?? {}) as Record<string, string | undefined>;
}

async function mapClaudeResponse(
  response: Response,
): Promise<AiGenerationClientResult> {
  let payload: ClaudeMessageResponse;

  try {
    payload = (await response.json()) as ClaudeMessageResponse;
  } catch {
    return {
      ok: false,
      reason: "response",
      error: "Claude returned a non-JSON response.",
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      reason: "response",
      error:
        payload.error?.message ??
        `Claude request failed with status ${response.status}.`,
    };
  }

  const responseText = payload.content
    ?.filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text?.trim() ?? "")
    .filter((text) => text.length > 0)
    .join("\n");

  if (!responseText) {
    return {
      ok: false,
      reason: "response",
      error: "Claude returned no text content to parse into a DashboardSpec.",
    };
  }

  return {
    ok: true,
    model: payload.model ?? "unknown-claude-model",
    requestId: payload.id,
    responseText,
  };
}

export function createClaudeGenerationClient(
  config: ClaudeClientConfig = {},
): AiGenerationClient {
  const apiKey = config.apiKey?.trim();
  const apiUrl = config.apiUrl?.trim() || "https://api.anthropic.com/v1/messages";
  const model = config.model?.trim() || "claude-3-5-sonnet-latest";
  const fetchImpl = config.fetchImpl ?? globalThis.fetch;

  if (!apiKey || typeof fetchImpl !== "function") {
    return {
      availability: {
        status: "unconfigured",
        providerLabel: "Claude",
        reason:
          "Set VITE_DASHFORGE_ANTHROPIC_API_KEY to enable prompt-to-spec generation.",
      },
      async generate() {
        return {
          ok: false,
          reason: "unconfigured",
          error:
            "Claude generation is not configured in this environment.",
        };
      },
    };
  }

  return {
    availability: {
      status: "configured",
      providerLabel: "Claude",
      model,
    },
    async generate(request: AiGenerationClientRequest) {
      try {
        const response = await fetchImpl(apiUrl, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
            "x-api-key": apiKey,
          },
          body: JSON.stringify({
            model,
            max_tokens: 4096,
            temperature: 0.2,
            system: request.systemPrompt,
            messages: [
              {
                role: "user",
                content: request.userPrompt,
              },
            ],
          }),
        });

        return mapClaudeResponse(response);
      } catch (error) {
        return {
          ok: false,
          reason: "network",
          error:
            error instanceof Error
              ? error.message
              : "Claude generation failed before a response was received.",
        };
      }
    },
  };
}

export function createDefaultAiGenerationClient(): AiGenerationClient {
  const env = readRuntimeEnv();

  return createClaudeGenerationClient({
    apiKey: env.VITE_DASHFORGE_ANTHROPIC_API_KEY,
    apiUrl: env.VITE_DASHFORGE_ANTHROPIC_API_URL,
    model: env.VITE_DASHFORGE_ANTHROPIC_MODEL,
  });
}
