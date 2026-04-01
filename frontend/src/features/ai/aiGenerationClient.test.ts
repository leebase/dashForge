import { describe, expect, it, vi } from "vitest";

import { createClaudeGenerationClient } from "./aiGenerationClient";

describe("aiGenerationClient", () => {
  it("reports an unconfigured client when no API key is available", async () => {
    const client = createClaudeGenerationClient({
      apiKey: "",
      fetchImpl: vi.fn(),
    });

    expect(client.availability).toMatchObject({
      status: "unconfigured",
      providerLabel: "Claude",
    });

    await expect(
      client.generate({
        systemPrompt: "system",
        userPrompt: "user",
      }),
    ).resolves.toMatchObject({
      ok: false,
      reason: "unconfigured",
    });
  });

  it("extracts text content from a Claude-style response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        id: "msg_123",
        model: "claude-test",
        content: [{ type: "text", text: "{\"id\":\"spec-1\"}" }],
      }),
    });
    const client = createClaudeGenerationClient({
      apiKey: "test-key",
      model: "claude-test",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await expect(
      client.generate({
        systemPrompt: "system",
        userPrompt: "user",
      }),
    ).resolves.toMatchObject({
      ok: true,
      model: "claude-test",
      responseText: "{\"id\":\"spec-1\"}",
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
