import { hasAdminSession } from "../../../lib/admin-auth";

const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_VISION_MODEL = "qwen/qwen3.6-27b";
const MAX_IMAGES = 5;
const MAX_DATA_URL_LENGTH = 1536 * 1024;
const ALLOWED_IMAGE_DATA_URL = /^data:image\/(jpeg|jpg|png|webp);base64,[a-z0-9+/=]+$/i;

type GroqMessageContent = {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string;
  };
};

type ParsedCustomizationOption = {
  name?: unknown;
  price?: unknown;
};

type ParsedMenuItem = {
  name?: unknown;
  description?: unknown;
  price?: unknown;
  category?: unknown;
  isVegetarian?: unknown;
  isBestseller?: unknown;
  imageUrl?: unknown;
  customizationOptions?: unknown;
};

function jsonError(message: string, status: number) {
  return Response.json({ message }, { status });
}

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asPositiveNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : null;
  if (typeof value !== "string") return null;

  const normalized = value.replace(/[^\d.]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

function normalizeParsedItems(value: unknown) {
  if (!value || typeof value !== "object" || !("items" in value)) return [];

  const items = (value as { items: unknown }).items;
  if (!Array.isArray(items)) return [];

  return items
    .map((item): ParsedMenuItem | null =>
      item && typeof item === "object" ? (item as ParsedMenuItem) : null,
    )
    .filter((item): item is ParsedMenuItem => Boolean(item))
    .map((item) => {
      const customizationOptions = Array.isArray(item.customizationOptions)
        ? item.customizationOptions
            .map((option): ParsedCustomizationOption | null =>
              option && typeof option === "object"
                ? (option as ParsedCustomizationOption)
                : null,
            )
            .filter((option): option is ParsedCustomizationOption => Boolean(option))
            .map((option) => ({
              name: asTrimmedString(option.name),
              price: asPositiveNumber(option.price),
            }))
            .filter((option) => option.name.length > 0 && option.price !== null)
        : [];

      return {
        name: asTrimmedString(item.name),
        description: asTrimmedString(item.description),
        price: asPositiveNumber(item.price),
        category: asTrimmedString(item.category),
        isVegetarian: asBoolean(item.isVegetarian),
        isBestseller: asBoolean(item.isBestseller),
        imageUrl: asTrimmedString(item.imageUrl),
        customizationOptions,
      };
    })
    .filter((item) => item.name.length > 0);
}

export async function POST(request: Request) {
  if (!(await hasAdminSession())) {
    return jsonError("You must be signed in to import a menu.", 401);
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return jsonError("Groq API key is not configured on the server.", 500);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Upload payload must be valid JSON.", 400);
  }

  const images =
    body && typeof body === "object" && "images" in body
      ? (body as { images: unknown }).images
      : null;

  if (!Array.isArray(images) || images.length === 0) {
    return jsonError("Upload at least one menu image.", 400);
  }

  if (images.length > MAX_IMAGES) {
    return jsonError(`Upload no more than ${MAX_IMAGES} images or PDF pages.`, 400);
  }

  if (
    images.some(
      (image) =>
        typeof image !== "string" ||
        image.length > MAX_DATA_URL_LENGTH ||
        !ALLOWED_IMAGE_DATA_URL.test(image),
    )
  ) {
    return jsonError("Uploaded menu pages must be JPEG, PNG, or WebP images under 4 MB each.", 400);
  }

  const content: GroqMessageContent[] = [
    {
      type: "text",
      text:
        "Extract menu items. Return only JSON: " +
        '{"items":[{"name":"","description":"","price":0,"category":"","isVegetarian":false,"isBestseller":false,"imageUrl":"","customizationOptions":[{"name":"","price":0}]}]}. ' +
        "Use numeric prices, infer category headings, use empty strings/false when unknown.",
    },
    ...images.map((url) => ({
      type: "image_url" as const,
      image_url: { url },
    })),
  ];

  const response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_VISION_MODEL,
      messages: [{ role: "user", content }],
      response_format: { type: "json_object" },
      temperature: 0,
      max_completion_tokens: 2048,
      stream: false,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    return jsonError(
      details || "Groq could not parse this menu. Try a clearer image or fewer pages.",
      response.status,
    );
  }

  const completion = await response.json();
  const rawContent = completion?.choices?.[0]?.message?.content;

  if (typeof rawContent !== "string") {
    return jsonError("Groq returned an empty menu parse result.", 502);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    return jsonError("Groq returned malformed JSON for this menu.", 502);
  }

  return Response.json({ items: normalizeParsedItems(parsed) });
}
