// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req: NextRequest) {
  const { text, line_message_id } = await req.json();
  console.log("parse-and-save 收到:", { text: text?.slice(0,30), line_message_id });
// 只有有 line_message_id 才檢查重複
if (line_message_id) {
  const { data: existing } = await supabase
    .from("orders")
    .select("id")
    .eq("line_message_id", line_message_id)
    .maybeSingle(); // ← 改用 maybeSingle，找不到不會報錯
  
  if (existing) {
    console.log("重複訊息，略過:", line_message_id);
    return NextResponse.json({ status: "duplicate" });
  }
}
  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: `你是台灣團購訂單解析助手。只回傳 JSON：{"orders":[{"buyer_name":"string","region":"string or null","phone":"string or null","address":"string or null","order_date":"YYYY-MM-DD or null","shipping_fee":100,"items":[{"sku":"string or null","product_name":"string","variant":"string or null","qty":0}]}]}` },
        { role: "user", content: text }
      ],
      temperature: 0.1,
    }),
  });

  const groqData = await groqRes.json();
  const result = groqData.choices?.[0]?.message?.content || "{}";
  const clean = result.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);

  for (const o of parsed.orders || []) {
    const { data: buyerData } = await supabase
      .from("buyers").insert({
        name: o.buyer_name, phone: o.phone,
        address: o.address, region: o.region,
      }).select().single();

    if (!buyerData) continue;

    const { data: orderData } = await supabase
      .from("orders").insert({
        buyer_id: buyerData.id,
        order_date: o.order_date,
        shipping_fee: o.shipping_fee,
        status: "pending",
        source_text: text,
        line_message_id: line_message_id || null,
      }).select().single();

    if (!orderData) continue;

    await supabase.from("order_items").insert(
      o.items.map((item) => ({
        order_id: orderData.id,
        sku: item.sku,
        product_name: item.product_name,
        variant: item.variant,
        qty: item.qty,
      }))
    );
  }

  return NextResponse.json({ status: "ok" });
}