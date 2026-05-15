// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";

function validateSignature(body, signature) {
  const secret = process.env.LINE_CHANNEL_SECRET;
  const hash = crypto.createHmac("SHA256", secret).update(body).digest("base64");
  return hash === signature;
}

function isOrderMessage(text) {
  if (text.length < 10) return false;
  const ignoreWords = ["謝謝","感謝","收到","好的","OK","早安","晚安","已付款","請問","何時"];
  for (const w of ignoreWords) {
    if (text.includes(w) && text.length < 30) return false;
  }
  const orderKeywords = ["下單","運費","訂購"];
  const qtyPatterns = [/\+\d+/, /\*\d+/, /\d+個/, /\d+組/, /\d+雙/];
  let score = 0;
  for (const kw of orderKeywords) if (text.includes(kw)) { score += 40; break; }
  for (const p of qtyPatterns) if (p.test(text)) { score += 30; break; }
  if (/\d+\/元|運費\d+|加\d+元/.test(text)) score += 20;
  if (text.split("\n").length >= 3) score += 10;
  return score >= 50;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-line-signature") || "";

  if (!validateSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const data = JSON.parse(body);
  const events = data.events || [];

  for (const event of events) {
    if (event.type !== "message" || event.message.type !== "text") continue;
    const text = event.message.text;
    if (!isOrderMessage(text)) continue;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/parse-and-save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        line_message_id: event.message.id 
      });
    } catch (err) {
      console.error("解析失敗:", err);
    }
  }

  return NextResponse.json({ status: "ok" });
}