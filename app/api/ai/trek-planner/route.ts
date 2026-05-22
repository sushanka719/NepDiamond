import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const message: string = body.message ?? "";

  if (!message.trim()) {
    return Response.json({ error: "Message is required" }, { status: 400 });
  }

  const rawGuides = await prisma.guideProfile.findMany({
    where: {
      verificationStatus: "APPROVED",
      deletedAt: null,
      user: { isActive: true, deletedAt: null },
    },
    select: {
      id: true,
      experienceYears: true,
      dailyRate: true,
      currency: true,
      specializations: true,
      languages: true,
      bio: true,
      user: { select: { fullName: true, avatarUrl: true } },
      reviews: { where: { deletedAt: null }, select: { rating: true } },
    },
  });

  const guides = rawGuides.map((g) => {
    const avgRating =
      g.reviews.length > 0
        ? Math.round(
            (g.reviews.reduce((s, r) => s + r.rating, 0) / g.reviews.length) *
              10
          ) / 10
        : null;
    return {
      id: g.id,
      name: g.user.fullName,
      avatarUrl: g.user.avatarUrl,
      dailyRate: g.dailyRate,
      currency: g.currency,
      specializations: g.specializations,
      languages: g.languages,
      experienceYears: g.experienceYears,
      bio: g.bio,
      avgRating,
      reviewCount: g.reviews.length,
    };
  });

  const systemPrompt = `You are an expert Nepal trek planning assistant. A traveller will describe their requirements and you must produce a personalised trek plan.

Your response MUST follow this exact structure (keep the headings exactly as written):

## Trek Overview
A short summary of the recommended trek (2-3 sentences).

## Day-by-Day Itinerary
List every day: "Day N: Location — activity / elevation gain / accommodation type"

## Recommended Guides
Output a single fenced JSON block (no other text in this section):
\`\`\`json
{"guides": [{"id": "uuid", "reason": "one short sentence why this guide fits"}]}
\`\`\`
Only recommend guides from the available list below. Pick 1-3 guides that best match the traveller's requirements.

## Cost Breakdown
- Guide fee: $X/day × N days = $Y  (use the actual guide's dailyRate)
- Permits & TIMS card: ~$Z
- Accommodation & meals: ~$W/day × N days = $V
- **Total estimated: ~$T**

Keep the itinerary practical and realistic for Nepal trekking conditions.

Available verified guides:
${JSON.stringify(guides, null, 2)}`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: object) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      sendEvent({ type: "guides", guides });

      try {
        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash",
          systemInstruction: systemPrompt,
        });

        const result = await model.generateContentStream({
          contents: [{ role: "user", parts: [{ text: message }] }],
        });

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            sendEvent({ type: "text", text });
          }
        }

        sendEvent({ type: "done" });
      } catch (err) {
        sendEvent({
          type: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        });
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
