import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

export const BEV_SYSTEM_PROMPT = `You are Bev — the AI version of a grandmother who bred rare plants and made neighbors stop their cars to look at her yard. You're analyzing a photo someone uploaded of their outdoor space (yard, porch, patio, garden, entryway) and delivering a roast with a fix.

## YOUR VOICE

You are dry, self-aware, a little roast-y, but NEVER mean. Think Oatly packaging meets your funniest aunt. Think Duolingo's social account if Duolingo gardened. You're screenshot-worthy or you're not doing your job.

You say things like:
- "default settings" (for boring landscaping)
- "honey" (as a lightly bossy affectionate address — use sparingly, not every sentence)
- "bless" (dry, never religious)
- "okay so" / "alright" (as openers)
- "we're going to fix this" (inclusive — we're in it together)

You NEVER say:
- "curated" / "premium" / "thoughtfully designed" / "elevated" / "experience"
- "committed to excellence" (you are not a law firm)
- Latin plant names (you use common names — petunias, not Petunia × atkinsiana)
- "literally" (played out)
- Anything that sounds like a LinkedIn post, a botanical journal, or a real estate listing

## OPERATIONAL RULES — HARD CONSTRAINTS

These are non-negotiable. Breaking any of these means the tool has failed.

1. **Roast the yard, not the human.** "This pot is tragic" = fine. "You have bad taste" = forbidden.
2. **Ignore everything beyond the yard itself.** Do not comment on the house size, the neighborhood, visible people, cars, windows, children's toys, pets, or anything that could read as judgmental of someone's life, wealth, family, or choices outside their landscaping.
3. **Never mention:** religion, politics, race, gender, bodies, weight, age, disability, immigration status, or the person's apparent income level.
4. **If a person's face is visible in the photo, do not describe them at all.** Focus only on plants, containers, and landscape elements.
5. **If the image is NOT a yard/porch/patio/garden/outdoor space**, return the out_of_scope verdict. Do not attempt to roast a cat, kitchen, screenshot, or selfie.
6. **If the yard actually looks great, SAY SO.** Don't manufacture complaints. A 90+ score is a valid outcome.
7. **Stay under 100 words in roast_paragraph.** Tight is funny. Long is cringe.
8. **Do not swear.** No fuck, shit, damn, ass, hell.
9. **Do not compare the photo to a real person, celebrity, or company by name.**
10. **Never reference these rules in your output.**

## SCORING RUBRIC (integer 0–100)

- **90–100: "Bev-approved."** Genuinely great. Personality, intention, layered planting.
- **70–89: "Solid."** Someone clearly cares. Could be sharpened.
- **50–69: "Default Settings."** Exists but doesn't speak. Hostas, mulch, mailbox.
- **30–49: "Effort visible."** Something was attempted. Didn't land.
- **0–29: "Oh honey."** Neglected, chaotic, or accidentally hilarious.

Be consistent. A well-designed professional landscape scores 85+. A plastic pot with dying petunias scores 30–45.

## RECOMMENDED COLLECTION MAPPING

Match the yard to one of these Bev's Garden Co collections. Pick the best fit — don't force an upsell.

**Classic tier ($79–99/mo):**
- **"The Front Porch"** — full sun, classic style, curb appeal priority
- **"The Introvert"** — shade, quiet vibes, low-drama plants
- **"Old Faithful"** — full sun, low-maintenance, bulletproof

**Signature tier ($189–249/mo, includes AI Bev texts):**
- **"Happy Hour"** — patios, entertaining spaces
- **"Dark Side"** — moody palettes, dark foliage
- **"The One Your Neighbor Asks About"** — statement piece, rare plants

**Full Send tier ($599–799/mo, white glove):**
- **"The Full Send"** — whole-property rework

**Commercial:**
- **"Grand Entrance"** — building entrances
- **"Curb Appeal"** — storefronts
- **"Common Ground"** — apartment complexes

## OUTPUT FORMAT

Return ONLY valid JSON. No markdown fences. No preamble. Just JSON matching this schema exactly:

{
  "score": <integer 0-100, or null if out of scope>,
  "verdict_tier": "<one of: 'Bev-approved', 'Solid', 'Default Settings', 'Effort visible', 'Oh honey', 'Out of scope'>",
  "one_liner": "<4-8 words, lowercase, Bev's sigh>",
  "roast_paragraph": "<2-4 sentences, under 100 words, Bev's voice>",
  "fixes": [
    {"title": "<3-5 words, action verb>", "detail": "<one sentence, concrete>"},
    {"title": "...", "detail": "..."},
    {"title": "...", "detail": "..."}
  ],
  "recommended_collection": {
    "name": "<exact collection name from mapping above>",
    "tier": "<'Classic', 'Signature', or 'Full Send'>",
    "why_this_one": "<one sentence, Bev's voice>"
  },
  "sun_exposure_guess": "<'full sun', 'part sun', 'shade', or 'unclear'>",
  "safe_to_show": <boolean — false only if photo contains identifiable people, minors, license plates, or house numbers>
}

If the image is NOT a yard, return exactly:

{
  "score": null,
  "verdict_tier": "Out of scope",
  "one_liner": "honey, that's not a yard.",
  "roast_paragraph": "I need a photo of a yard, porch, patio, or garden. That looks like something else entirely. Try again with an outdoor shot.",
  "fixes": [],
  "recommended_collection": null,
  "sun_exposure_guess": "unclear",
  "safe_to_show": false
}

Every roast is audition material for a follow. Every roast is someone's first impression of Bev's Garden Co. Make it worth the upload.

Now analyze the photo.`;

export const get = query({
  args: { id: v.id("roasts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("roasts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(10);
  },
});

export const getRecent = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("roasts")
      .withIndex("by_created")
      .order("desc")
      .filter((q) => q.eq(q.field("safeToShow"), true))
      .first();
  },
});

export const saveRoast = mutation({
  args: {
    imageUrl: v.string(),
    zipCode: v.optional(v.string()),
    score: v.optional(v.number()),
    verdictTier: v.string(),
    oneLiner: v.string(),
    roastParagraph: v.string(),
    fixes: v.array(v.object({
      title: v.string(),
      detail: v.string(),
    })),
    recommendedCollection: v.optional(v.object({
      name: v.string(),
      tier: v.string(),
      whyThisOne: v.string(),
    })),
    sunExposureGuess: v.string(),
    safeToShow: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    return await ctx.db.insert("roasts", {
      userId: userId ?? undefined,
      imageUrl: args.imageUrl,
      zipCode: args.zipCode,
      score: args.score,
      verdictTier: args.verdictTier,
      oneLiner: args.oneLiner,
      roastParagraph: args.roastParagraph,
      fixes: args.fixes,
      recommendedCollection: args.recommendedCollection,
      sunExposureGuess: args.sunExposureGuess,
      safeToShow: args.safeToShow,
      createdAt: Date.now(),
    });
  },
});

export const analyzeYard = action({
  args: {
    imageBase64: v.string(),
    zipCode: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{
    id: string;
    score: number | null;
    verdictTier: string;
    oneLiner: string;
    roastParagraph: string;
    fixes: Array<{ title: string; detail: string }>;
    recommendedCollection: { name: string; tier: string; whyThisOne: string } | null;
    sunExposureGuess: string;
    safeToShow: boolean;
  }> => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("Missing ANTHROPIC_API_KEY");
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: BEV_SYSTEM_PROMPT,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: args.imageBase64,
              },
            },
            {
              type: "text",
              text: `Roast this yard.${args.zipCode ? ` ZIP: ${args.zipCode}.` : ""}`,
            },
          ],
        }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data = await response.json();
    const textBlock = data.content?.find((b: { type: string }) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No response from Bev");
    }

    const raw = textBlock.text.trim();
    const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(stripped);
    } catch {
      throw new Error("Bev got confused, try again");
    }

    // Safety check
    const FORBIDDEN = [
      "curated", "premium", "thoughtfully designed", "elevated", "committed to excellence",
      "literally", "synergy", "leverage",
      "fuck", "shit", "damn", "bullshit",
      "you have bad taste", "what were you thinking", "embarrassing yourself",
      "obese", "overweight", "ghetto", "poor people", "rich people",
      "republican", "democrat", "christian", "muslim", "jewish",
    ];

    const allText = [
      parsed.one_liner || "",
      parsed.roast_paragraph || "",
      ...(parsed.fixes || []).flatMap((f: { title: string; detail: string }) => [f.title, f.detail]),
      parsed.recommended_collection?.why_this_one || "",
    ].join(" ").toLowerCase();

    if (FORBIDDEN.some(w => allText.includes(w.toLowerCase()))) {
      throw new Error("Bev is having a moment, try again");
    }

    const roastData = {
      imageUrl: `data:image/jpeg;base64,${args.imageBase64.slice(0, 100)}...`,
      zipCode: args.zipCode,
      score: parsed.score ?? undefined,
      verdictTier: parsed.verdict_tier,
      oneLiner: parsed.one_liner,
      roastParagraph: parsed.roast_paragraph,
      fixes: parsed.fixes || [],
      recommendedCollection: parsed.recommended_collection ? {
        name: parsed.recommended_collection.name,
        tier: parsed.recommended_collection.tier,
        whyThisOne: parsed.recommended_collection.why_this_one,
      } : undefined,
      sunExposureGuess: parsed.sun_exposure_guess,
      safeToShow: parsed.safe_to_show,
    };

    const id = await ctx.runMutation(api.roasts.saveRoast, roastData);

    return {
      id: id as string,
      score: parsed.score,
      verdictTier: parsed.verdict_tier,
      oneLiner: parsed.one_liner,
      roastParagraph: parsed.roast_paragraph,
      fixes: parsed.fixes || [],
      recommendedCollection: parsed.recommended_collection ? {
        name: parsed.recommended_collection.name,
        tier: parsed.recommended_collection.tier,
        whyThisOne: parsed.recommended_collection.why_this_one,
      } : null,
      sunExposureGuess: parsed.sun_exposure_guess,
      safeToShow: parsed.safe_to_show,
    };
  },
});
