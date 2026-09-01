import { hasAdminSession } from "../../../lib/admin-auth";
import { inflateRawSync } from "node:zlib";

const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_VISION_MODEL = "qwen/qwen3.6-27b";
const MAX_IMAGES = 5;
const MAX_DATA_URL_LENGTH = 1536 * 1024;
const MAX_DOCX_BYTES = 8 * 1024 * 1024;
const MAX_DOCUMENT_TEXT_LENGTH = 24000;
const ALLOWED_IMAGE_DATA_URL = /^data:image\/(jpeg|jpg|png|webp);base64,[a-z0-9+/=]+$/i;
const ALLOWED_DOCX_DATA_URL =
  /^data:application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document;base64,[a-z0-9+/=]+$/i;

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

type ZipEntry = {
  name: string;
  compressedSize: number;
  uncompressedSize: number;
  compressionMethod: number;
  localHeaderOffset: number;
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

function extractJsonObject(value: string) {
  const trimmed = value.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    return extractJsonObject(fencedMatch[1]);
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start !== -1 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return trimmed;
}

async function parseGroqResponse(response: Response) {
  const completion = await response.json();
  const rawContent = completion?.choices?.[0]?.message?.content;

  if (typeof rawContent !== "string") {
    throw new Error("Groq returned an empty menu parse result.");
  }

  return JSON.parse(extractJsonObject(rawContent));
}

async function requestGroqMenuParse({
  apiKey,
  content,
  strictJson,
}: {
  apiKey: string;
  content: GroqMessageContent[];
  strictJson: boolean;
}) {
  return fetch(GROQ_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_VISION_MODEL,
      messages: [{ role: "user", content }],
      ...(strictJson ? { response_format: { type: "json_object" } } : {}),
      temperature: 0,
      max_completion_tokens: 2048,
      stream: false,
    }),
  });
}

function decodeXmlEntities(value: string) {
  return value.replace(/&(?:#(\d+)|#x([a-f0-9]+)|amp|lt|gt|quot|apos);/gi, (entity, decimal, hex) => {
    if (decimal) return String.fromCodePoint(Number(decimal));
    if (hex) return String.fromCodePoint(Number.parseInt(hex, 16));

    switch (entity.toLowerCase()) {
      case "&amp;":
        return "&";
      case "&lt;":
        return "<";
      case "&gt;":
        return ">";
      case "&quot;":
        return '"';
      case "&apos;":
        return "'";
      default:
        return entity;
    }
  });
}

function getZipEntries(buffer: Buffer) {
  const eocdSignature = 0x06054b50;
  const centralDirectorySignature = 0x02014b50;
  const minEocdOffset = Math.max(0, buffer.length - 65557);
  let eocdOffset = -1;

  for (let index = buffer.length - 22; index >= minEocdOffset; index -= 1) {
    if (buffer.readUInt32LE(index) === eocdSignature) {
      eocdOffset = index;
      break;
    }
  }

  if (eocdOffset === -1) {
    throw new Error("This DOCX file could not be opened.");
  }

  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  const entries: ZipEntry[] = [];
  let offset = centralDirectoryOffset;

  for (let entryIndex = 0; entryIndex < entryCount; entryIndex += 1) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== centralDirectorySignature) {
      throw new Error("This DOCX file has an unreadable ZIP directory.");
    }

    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraFieldLength = buffer.readUInt16LE(offset + 30);
    const fileCommentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const nameStart = offset + 46;
    const nameEnd = nameStart + fileNameLength;

    entries.push({
      name: buffer.toString("utf8", nameStart, nameEnd),
      compressedSize,
      uncompressedSize,
      compressionMethod,
      localHeaderOffset,
    });

    offset = nameEnd + extraFieldLength + fileCommentLength;
  }

  return entries;
}

function readZipEntry(buffer: Buffer, entry: ZipEntry) {
  const localHeaderSignature = 0x04034b50;
  const offset = entry.localHeaderOffset;

  if (offset + 30 > buffer.length || buffer.readUInt32LE(offset) !== localHeaderSignature) {
    throw new Error("This DOCX file has an unreadable document entry.");
  }

  const fileNameLength = buffer.readUInt16LE(offset + 26);
  const extraFieldLength = buffer.readUInt16LE(offset + 28);
  const dataStart = offset + 30 + fileNameLength + extraFieldLength;
  const dataEnd = dataStart + entry.compressedSize;

  if (dataEnd > buffer.length) {
    throw new Error("This DOCX file ended before the document text could be read.");
  }

  const compressed = buffer.subarray(dataStart, dataEnd);

  if (entry.compressionMethod === 0) return compressed;
  if (entry.compressionMethod === 8) {
    const inflated = inflateRawSync(compressed);

    if (inflated.length !== entry.uncompressedSize) {
      throw new Error("This DOCX file contains unexpected document data.");
    }

    return inflated;
  }

  throw new Error("This DOCX file uses an unsupported ZIP compression method.");
}

function extractWordTextFromXml(xml: string) {
  const output: string[] = [];
  const tokenPattern =
    /<w:t\b[^>]*>([\s\S]*?)<\/w:t>|<w:tab\b[^>]*\/>|<w:br\b[^>]*\/>|<\/w:p>|<\/w:tc>|<\/w:tr>/g;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(xml)) !== null) {
    const token = match[0];

    if (match[1] !== undefined) {
      output.push(decodeXmlEntities(match[1]));
    } else if (token.startsWith("<w:tab") || token === "</w:tc>") {
      output.push("\t");
    } else if (token.startsWith("<w:br") || token === "</w:p>" || token === "</w:tr>") {
      output.push("\n");
    }
  }

  return output
    .join("")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractDocxText(dataUrl: string) {
  if (!ALLOWED_DOCX_DATA_URL.test(dataUrl)) {
    throw new Error("Uploaded DOCX files must be valid Word documents under 8 MB.");
  }

  const base64 = dataUrl.split(",", 2)[1];
  const buffer = Buffer.from(base64, "base64");

  if (buffer.length === 0 || buffer.length > MAX_DOCX_BYTES) {
    throw new Error("Upload a DOCX file under 8 MB.");
  }

  const documentEntry = getZipEntries(buffer).find((entry) => entry.name === "word/document.xml");

  if (!documentEntry) {
    throw new Error("This DOCX file does not contain a readable Word document.");
  }

  const documentXml = readZipEntry(buffer, documentEntry).toString("utf8");
  const text = extractWordTextFromXml(documentXml);

  if (text.length === 0) {
    throw new Error("No menu text was found in that DOCX file.");
  }

  return text.slice(0, MAX_DOCUMENT_TEXT_LENGTH);
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
  const document =
    body && typeof body === "object" && "document" in body
      ? (body as { document: unknown }).document
      : null;

  if ((!Array.isArray(images) || images.length === 0) && typeof document !== "string") {
    return jsonError("Upload at least one menu image, PDF page, or DOCX file.", 400);
  }

  if (Array.isArray(images) && images.length > MAX_IMAGES) {
    return jsonError(`Upload no more than ${MAX_IMAGES} images or PDF pages.`, 400);
  }

  if (
    Array.isArray(images) &&
    images.some(
      (image) =>
        typeof image !== "string" ||
        image.length > MAX_DATA_URL_LENGTH ||
        !ALLOWED_IMAGE_DATA_URL.test(image),
    )
  ) {
    return jsonError("Uploaded menu pages must be JPEG, PNG, or WebP images under 4 MB each.", 400);
  }

  let documentText = "";
  if (typeof document === "string") {
    try {
      documentText = extractDocxText(document);
    } catch (caughtError) {
      return jsonError(
        caughtError instanceof Error ? caughtError.message : "This DOCX file could not be read.",
        400,
      );
    }
  }

  const content: GroqMessageContent[] = [
    {
      type: "text",
      text:
        "Extract menu items. Return a single valid JSON object and no other text: " +
        '{"items":[{"name":"","description":"","price":0,"category":"","isVegetarian":false,"isBestseller":false,"imageUrl":"","customizationOptions":[{"name":"","price":0}]}]}. ' +
        "Use numeric prices, infer category headings, use empty strings/false when unknown." +
        (documentText
          ? `\n\nMenu document text:\n${documentText}`
          : ""),
    },
    ...(Array.isArray(images)
      ? images.map((url) => ({
          type: "image_url" as const,
          image_url: { url },
        }))
      : []),
  ];

  let parsed: unknown;
  const response = await requestGroqMenuParse({ apiKey, content, strictJson: true });

  try {
    if (!response.ok) {
      const details = await response.text();

      if (!details.includes("json_validate_failed")) {
        return jsonError(
          details || "Groq could not parse this menu. Try a clearer image or fewer pages.",
          response.status,
        );
      }

      const fallbackResponse = await requestGroqMenuParse({
        apiKey,
        content,
        strictJson: false,
      });

      if (!fallbackResponse.ok) {
        const fallbackDetails = await fallbackResponse.text();
        return jsonError(
          fallbackDetails || "Groq could not parse this menu. Try a clearer image or fewer pages.",
          fallbackResponse.status,
        );
      }

      parsed = await parseGroqResponse(fallbackResponse);
    } else {
      parsed = await parseGroqResponse(response);
    }
  } catch {
    return jsonError("Groq returned malformed JSON for this menu.", 502);
  }

  return Response.json({ items: normalizeParsedItems(parsed) });
}
