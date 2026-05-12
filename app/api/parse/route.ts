import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `你是台灣團購訂單解析助手。將 LINE 訂單訊息解析成結構化 JSON。只回傳 JSON，不含任何說明或 markdown 符號：{"orders":[{"buyer_name":"string","region":"string or null","phone":"string or null","address":"string or null","order_date":"YYYY-MM-DD or null","shipping_fee":100,"items":[{"sku":"string or null","product_name":"string","variant":"string or null","qty":0}]}]}`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.1,
    }),
  });

  const data = await res.json();
  console.log("Groq raw:", JSON.stringify(data).slice(0, 300));

  const result = data.choices?.[0]?.message?.content || "{}";
  const clean = result.replace(/```json|```/g, "").trim();

 try {
  const parsedJson = JSON.parse(clean);
  parsedJson.orders = (parsedJson.orders || []).map((o: any) => ({
    ...o,
    source_text: text,
  }));
  return NextResponse.json(parsedJson);
} catch {
  return NextResponse.json({ error: "解析失敗", raw: clean }, { status: 400 });
}
}