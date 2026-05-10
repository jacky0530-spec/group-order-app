import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `你是台灣團購訂單解析助手。將以下 LINE 訂單訊息解析成結構化 JSON。只回傳 JSON，不含任何說明或 markdown 符號：{"orders":[{"buyer_name":"string","region":"string or null","phone":"string or null","address":"string or null","order_date":"YYYY-MM-DD or null","shipping_fee":100,"items":[{"sku":"string or null","product_name":"string","variant":"string or null","qty":0}]}]}\n\n訂單內容：\n${text}`
        }]
      }]
    }),
  });

  const data = await res.json();
  const result = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  console.log("Gemini raw:", JSON.stringify(data).slice(0, 500));
  const clean = result.replace(/```json|```/g, "").trim();

  try {
    const parsedJson = JSON.parse(clean);
// 每筆訂單都附上原始文字
parsedJson.orders = parsedJson.orders.map((o: any) => ({
  ...o,
  source_text: text,
}));
return NextResponse.json(parsedJson);
  } catch {
    return NextResponse.json({ error: "解析失敗", raw: clean }, { status: 400 });
  }
}