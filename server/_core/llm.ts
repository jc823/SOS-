import { ENV } from "./env";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface LLMOptions {
  messages: Message[];
  model?: string;
  max_tokens?: number;
  temperature?: number;
  response_format?: { type: "json_object" | "json_schema" | "text"; [key: string]: unknown };
}

interface LLMResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function invokeLLM(opts: LLMOptions): Promise<LLMResponse> {
  // Use Anthropic Claude API if key is available, otherwise OpenAI
  if (ENV.anthropicApiKey) {
    return invokeAnthropic(opts);
  }
  if (ENV.openaiApiKey) {
    return invokeOpenAI(opts);
  }
  // Fallback stub for development without API keys
  console.warn("[LLM] No API key configured — returning stub response");
  return {
    choices: [
      {
        message: {
          role: "assistant",
          content: JSON.stringify({ message: "LLM not configured — set ANTHROPIC_API_KEY or OPENAI_API_KEY in .env" }),
        },
        finish_reason: "stop",
      },
    ],
  };
}

async function invokeAnthropic(opts: LLMOptions): Promise<LLMResponse> {
  const systemMsg = opts.messages.find((m) => m.role === "system");
  const userMsgs = opts.messages.filter((m) => m.role !== "system");

  const body = {
    model: opts.model ?? "claude-sonnet-4-6",
    max_tokens: opts.max_tokens ?? 4096,
    system: systemMsg?.content,
    messages: userMsgs.map((m) => ({ role: m.role, content: m.content })),
  };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ENV.anthropicApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as {
    content: Array<{ type: string; text: string }>;
    stop_reason: string;
    usage: { input_tokens: number; output_tokens: number };
  };

  return {
    choices: [
      {
        message: {
          role: "assistant",
          content: data.content.map((c) => c.text).join(""),
        },
        finish_reason: data.stop_reason,
      },
    ],
    usage: {
      prompt_tokens: data.usage.input_tokens,
      completion_tokens: data.usage.output_tokens,
      total_tokens: data.usage.input_tokens + data.usage.output_tokens,
    },
  };
}

async function invokeOpenAI(opts: LLMOptions): Promise<LLMResponse> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ENV.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: opts.model ?? "gpt-4o",
      messages: opts.messages,
      max_tokens: opts.max_tokens ?? 4096,
      temperature: opts.temperature ?? 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${err}`);
  }

  return res.json() as Promise<LLMResponse>;
}
