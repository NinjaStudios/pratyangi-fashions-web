import { Router, type IRouter } from "express";

const router: IRouter = Router();

const geminiModel = process.env["GEMINI_IMAGE_MODEL"] ?? "gemini-2.5-flash-image";
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageBytes = 7 * 1024 * 1024;
const tryOnTiers = new Set(["silver", "platinum"]);

type InlineImage = { mimeType: string; data: string };

type GeminiPart = {
  text?: string;
  inlineData?: InlineImage;
  inline_data?: { mime_type: string; data: string };
};

type GeminiResponse = {
  candidates?: { content?: { parts?: GeminiPart[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
};

const prompt = [
  "You are a virtual saree try-on assistant for an Indian silk saree boutique.",
  "Image 1 is a photo of the customer. Image 2 is the saree product.",
  "Generate one photorealistic image of the same customer from image 1 wearing the saree from image 2,",
  "draped in a traditional style with the pallu over the shoulder.",
  "Keep the customer's face, skin tone, hair, body shape, and pose exactly the same.",
  "Reproduce the saree's colours, border, zari work, and weave pattern faithfully.",
  "Use soft, flattering studio lighting and a clean neutral background.",
].join(" ");

function readImage(value: unknown): InlineImage | string {
  if (!value || typeof value !== "object") return "is missing";
  const { mimeType, data } = value as Partial<InlineImage>;
  if (typeof mimeType !== "string" || !allowedMimeTypes.has(mimeType)) return "must be a JPEG, PNG, or WebP image";
  if (typeof data !== "string" || data.length === 0) return "is empty";
  if (!/^[A-Za-z0-9+/]+=*$/.test(data)) return "is not valid base64";
  if ((data.length * 3) / 4 > maxImageBytes) return "is larger than 7 MB";
  return { mimeType, data };
}

router.post("/try-on", async (req, res) => {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    res.status(503).json({ error: "AI try-on is not configured. Set GEMINI_API_KEY on the API server." });
    return;
  }

  const { tier, personImage, garmentImage } = (req.body ?? {}) as Record<string, unknown>;
  if (typeof tier !== "string" || !tryOnTiers.has(tier)) {
    res.status(403).json({ error: "AI try-on is not available for this collection." });
    return;
  }

  const person = readImage(personImage);
  if (typeof person === "string") {
    res.status(400).json({ error: `Your photo ${person}.` });
    return;
  }
  const garment = readImage(garmentImage);
  if (typeof garment === "string") {
    res.status(400).json({ error: `The saree image ${garment}.` });
    return;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: person.mimeType, data: person.data } },
              { inline_data: { mime_type: garment.mimeType, data: garment.data } },
            ],
          }],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
        }),
        signal: AbortSignal.timeout(90_000),
      },
    );

    const result = (await response.json()) as GeminiResponse;
    if (!response.ok) {
      req.log.error({ status: response.status, error: result.error?.message }, "Gemini try-on request failed");
      res.status(502).json({ error: "The AI service could not create your look right now. Please try again." });
      return;
    }

    const parts = result.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      const inline = part.inlineData ?? (part.inline_data && { mimeType: part.inline_data.mime_type, data: part.inline_data.data });
      if (inline?.data) {
        res.json({ image: `data:${inline.mimeType};base64,${inline.data}` });
        return;
      }
    }

    const reason = result.promptFeedback?.blockReason ?? result.candidates?.[0]?.finishReason;
    req.log.warn({ reason }, "Gemini returned no image");
    res.status(422).json({
      error: "The AI couldn't create a look from this photo. Try a clear, well-lit, front-facing photo of one person.",
    });
  } catch (err) {
    req.log.error({ err }, "Gemini try-on request errored");
    res.status(502).json({ error: "The AI service took too long to respond. Please try again." });
  }
});

export default router;
