import express from "express";
import Anthropic from "@anthropic-ai/sdk";

const app = express();
app.use(express.json({ limit: "20kb" }));

// Optional password gate: set ACCESS_PASSWORD to require a login (username can be anything).
app.use((req, res, next) => {
  const pw = process.env.ACCESS_PASSWORD;
  if (!pw) return next();
  const auth = req.headers.authorization || "";
  const given = Buffer.from(auth.split(" ")[1] || "", "base64").toString().split(":").slice(1).join(":");
  if (given === pw) return next();
  res.set("WWW-Authenticate", 'Basic realm="Listing Writer"').status(401).send("Password required");
});

app.use(express.static("public"));

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment
const MODEL = process.env.MODEL || "claude-sonnet-5-5";

// Simple per-IP limit so strangers can't run up your bill: 20 listings per hour.
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now > h.reset) { hits.set(ip, { n: 1, reset: now + 3600000 }); return false; }
  return ++h.n > 20;
}

const clip = (v, n) => String(v ?? "").slice(0, n);

app.post("/api/listing", async (req, res) => {
  if (limited(req.ip)) return res.status(429).json({ error: "Too many requests. Try again in an hour." });
  const b = req.body || {};
  const item = clip(b.item, 200), facts = clip(b.facts, 2000);
  if (!item || !facts) return res.status(400).json({ error: "Item and facts are required." });

  const prompt = `You write online marketplace listings for New Zealand sellers.
Platform: ${clip(b.platform, 40)}
Item: ${item}
Condition: ${clip(b.condition, 40)}
Price: ${b.price ? "$" + clip(b.price, 12) + " NZD" : "not given"}
Pickup/postage: ${clip(b.ship, 200) || "not given"}
Tone: ${clip(b.tone, 60)}
Seller's facts: ${facts}

Rules: Use ONLY the facts given. Never invent features, brands, measurements or claims. State flaws honestly. Use NZ English. Put anything important that is missing in "missing".
Return JSON only, no other text: {"title": string under 80 chars, keyword-rich, "description": string with short paragraphs then bullet points using "- ", "keywords": array of 8-12 strings, "missing": array of strings (empty if nothing)}`;

  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });
    const text = msg.content.filter(c => c.type === "text").map(c => c.text).join("");
    const json = JSON.parse(text.replace(/```json|```/g, "").trim());
    res.json(json);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Couldn't write the listing. Try again." });
  }
});

app.listen(process.env.PORT || 3000, () => console.log("Running on port " + (process.env.PORT || 3000)));
