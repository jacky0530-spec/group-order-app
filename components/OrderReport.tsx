// @ts-nocheck
"use client";
import { supabase } from "./lib/supabase";
import { useState, useMemo, useEffect } from "react";
const MOCK_ORDERS = [
  { id:"ORD-001", buyer_name:"黃翊哲", region:"新莊", order_date:"2025-05-09", shipping_fee:100, status:"pending",
    items:[{ product_name:"涼感消臭萊卡機能襪", variant:"A 黑色男款", qty:44 },{ product_name:"涼感消臭萊卡機能襪", variant:"B 黑色女款", qty:59 }] },
  { id:"ORD-002", buyer_name:"蔡育涵", region:"苗栗", order_date:"2025-05-09", shipping_fee:100, status:"confirmed",
    items:[{ product_name:"抗菌消臭足弓襪套", variant:"A 男款", qty:450 },{ product_name:"抗菌消臭足弓襪套", variant:"B 女款", qty:750 }] },
  { id:"ORD-003", buyer_name:"黛德美", region:"電商", order_date:"2025-05-08", shipping_fee:100, status:"shipped",
    items:[{ product_name:"涼感速乾抗菌男背心", variant:"黑色 XXL", qty:7 },{ product_name:"涼感速乾抗菌男背心", variant:"白色 XL", qty:2 },{ product_name:"涼感速乾抗菌男背心", variant:"白色 XXL", qty:7 }] },
  { id:"ORD-004", buyer_name:"喬宜思", region:null, order_date:"2025-05-08", shipping_fee:100, status:"pending",
    items:[{ product_name:"玻璃噴油瓶", variant:null, qty:5 },{ product_name:"瓦斯爐刮刀清潔刷", variant:null, qty:3 },{ product_name:"石墨烯黑科技洗衣膠囊", variant:null, qty:3 }] },
  { id:"ORD-005", buyer_name:"陳怡雯", region:"高雄", order_date:"2025-05-08", shipping_fee:100, status:"confirmed",
    items:[{ product_name:"鋅+石墨烯雙效抗菌冰鋒袖套", variant:null, qty:100 }] },
  { id:"ORD-006", buyer_name:"童倉庫", region:null, order_date:"2025-05-08", shipping_fee:0, status:"done",
    items:[{ product_name:"涼感印花安全帽內襯", variant:"A 經典格紋款", qty:152 },{ product_name:"涼感印花安全帽內襯", variant:"B 可愛卡通款", qty:160 }] },
  { id:"ORD-007", buyer_name:"林小美", region:"台北", order_date:"2025-04-15", shipping_fee:100, status:"done",
    items:[{ product_name:"涼感消臭萊卡機能襪", variant:"A 黑色男款", qty:20 }] },
  { id:"ORD-008", buyer_name:"王大明", region:"台中", order_date:"2025-04-20", shipping_fee:100, status:"done",
    items:[{ product_name:"抗菌消臭足弓襪套", variant:"B 女款", qty:30 }] },
];

const STATUS_META = {
  pending:   { label:"待處理", color:"#B45309" },
  confirmed: { label:"已確認", color:"#1D4ED8" },
  shipped:   { label:"已出貨", color:"#065F46" },
  done:      { label:"已完成", color:"#374151" },
  cancelled: { label:"已取消", color:"#991B1B" },
};

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function generateDailyReport(date: string, orders: any[]) {
  const dayOrders = orders.filter(o => o.order_date === date);
  const totalQty = dayOrders.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.qty, 0), 0);
  const totalShipping = dayOrders.reduce((s, o) => s + o.shipping_fee, 0);

  // 商品匯總
  const productMap: Record<string, number> = {};
  dayOrders.forEach(o => {
    o.items.forEach(i => {
      const key = i.variant ? `${i.product_name}（${i.variant}）` : i.product_name;
      productMap[key] = (productMap[key] || 0) + i.qty;
    });
    if (o.source_text) {
  txt += `   📝 原始備註：\n`;
  o.source_text.split("\n").forEach(srcLine  => 
    {
    txt += `      ${srcLine}\n`;
     });
  txt += `\n`;
  }
  });

  let txt = `═══════════════════════════════════\n`;
  txt += `  📋 日報表｜${date}\n`;
  txt += `═══════════════════════════════════\n\n`;
  txt += `【訂單概況】\n`;
  txt += `  訂單數：${dayOrders.length} 筆\n`;
  txt += `  總出貨量：${totalQty} 件\n`;
  txt += `  運費合計：${totalShipping} 元\n\n`;
  txt += `【商品匯總】\n`;
  Object.entries(productMap).forEach(([name, qty]) => {
    txt += `  ${name}：${qty} 件\n`;
  });
  txt += `\n【訂單明細】\n`;
  txt += `───────────────────────────────────\n`;
  dayOrders.forEach((o, idx) => {
    txt += `\n${idx + 1}. ${o.buyer_name}${o.region ? `（${o.region}）` : ""}\n`;
    txt += `   狀態：${STATUS_META[o.status]?.label || o.status}\n`;
    txt += `   運費：+${o.shipping_fee} 元\n`;
    o.items.forEach(i => {
      const name = i.variant ? `${i.product_name}（${i.variant}）` : i.product_name;
      txt += `   • ${name} × ${i.qty}\n`;
    });
  });
  txt += `\n═══════════════════════════════════\n`;
  txt += `  匯出時間：${new Date().toLocaleString("zh-TW")}\n`;
  txt += `═══════════════════════════════════\n`;
  return txt;
}

function generateMonthlyReport(month: string, orders: any[]) {
  const monthOrders = orders.filter(o => o.order_date?.startsWith(month));
  const totalQty = monthOrders.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.qty, 0), 0);
  const totalShipping = monthOrders.reduce((s, o) => s + o.shipping_fee, 0);

  // 按日期分組
  const byDate: Record<string, any[]> = {};
  monthOrders.forEach(o => {
    if (!byDate[o.order_date]) byDate[o.order_date] = [];
    byDate[o.order_date].push(o);
  });

  // 商品匯總
  const productMap: Record<string, number> = {};
  monthOrders.forEach(o => {
    o.items.forEach(i => {
      const key = i.variant ? `${i.product_name}（${i.variant}）` : i.product_name;
      productMap[key] = (productMap[key] || 0) + i.qty;
    });
  });

  // 買家統計
  const buyerMap: Record<string, number> = {};
  monthOrders.forEach(o => {
    buyerMap[o.buyer_name] = (buyerMap[o.buyer_name] || 0) + o.items.reduce((s, i) => s + i.qty, 0);
  });

  let txt = `═══════════════════════════════════\n`;
  txt += `  📊 月報表｜${month}\n`;
  txt += `═══════════════════════════════════\n\n`;
  txt += `【月度概況】\n`;
  txt += `  總訂單數：${monthOrders.length} 筆\n`;
  txt += `  總出貨量：${totalQty} 件\n`;
  txt += `  運費合計：${totalShipping} 元\n`;
  txt += `  活躍天數：${Object.keys(byDate).length} 天\n\n`;
  txt += `【商品銷售排行】\n`;
  Object.entries(productMap)
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, qty], idx) => {
      txt += `  ${idx + 1}. ${name}：${qty} 件\n`;
    });
  txt += `\n【買家訂購排行】\n`;
  Object.entries(buyerMap)
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, qty], idx) => {
      txt += `  ${idx + 1}. ${name}：${qty} 件\n`;
    });
  txt += `\n【每日明細】\n`;
  Object.entries(byDate)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([date, dayOrders]) => {
      const dayQty = dayOrders.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.qty, 0), 0);
      txt += `\n  ▸ ${date}（${dayOrders.length} 筆｜${dayQty} 件）\n`;
      dayOrders.forEach(o => {
  txt += `    • ${o.buyer_name}：`;
  txt += o.items.map(i => `${i.product_name} ×${i.qty}`).join("、") + "\n";
  if (o.source_text) {
    txt += `      📝 ${o.source_text.split("\n").slice(0, 3).join(" / ")}\n`;
  }
});
    });
  txt += `\n═══════════════════════════════════\n`;
  txt += `  匯出時間：${new Date().toLocaleString("zh-TW")}\n`;
  txt += `═══════════════════════════════════\n`;
  return txt;
}

export default function OrderReport() {
  const [mode, setMode] = useState<"daily" | "monthly">("daily");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [selectedDate, setSelectedDate] = useState(() => {
  return new Date().toISOString().slice(0, 10);
});
  const [selectedMonth, setSelectedMonth] = useState("2025-05");

  const [orders, setOrders] = useState([]);

useEffect(() => {
  async function fetchOrders() {
    const { data } = await supabase
      .from("orders")
      .select(`
        id, order_date, shipping_fee, status, source_text,
        buyers ( name, region ),
        order_items ( product_name, variant, qty, sku )
      `)
      .order("order_date", { ascending: false });

    if (data) {
      setOrders(data.map(o => ({
        id: o.id,
        buyer_name: o.buyers?.name || "未知",
        region: o.buyers?.region || null,
        order_date: o.order_date,
        shipping_fee: o.shipping_fee,
        status: o.status,
        items: o.order_items || [],
        source_text: o.source_text || null,
      })));
    }
  }
  fetchOrders();
}, []);

  // 取得所有日期
const allDates = useMemo(() => {
  const dates = [...new Set(orders.map(o => o.order_date).filter(Boolean))];
  return dates.sort((a, b) => sortDir === "desc" ? b.localeCompare(a) : a.localeCompare(b));
}, [orders, sortDir]);

// ← useEffect 要在這裡，useMemo 外面
useEffect(() => {
  if (allDates.length > 0 && !allDates.includes(selectedDate)) {
    setSelectedDate(allDates[0]);
  }
}, [allDates]);

  // 取得所有月份
  const allMonths = useMemo(() => {
    const months = [...new Set(orders.map(o => o.order_date?.slice(0, 7)).filter(Boolean))];
    return months.sort((a, b) => sortDir === "desc" ? b.localeCompare(a) : a.localeCompare(b));
  }, [orders, sortDir]);

  const filteredOrders = useMemo(() => {
    if (mode === "daily") {
  return orders.filter(o => {
    const d = o.order_date?.slice(0, 10);
    return d === selectedDate;
  });
}
return orders.filter(o => {
  if (mode === "daily") {
  return orders.filter(o => (o.order_date || "").slice(0, 10) === selectedDate);
}
return orders.filter(o => (o.order_date || "").slice(0, 7) === selectedMonth);
});
  }, [mode, selectedDate, selectedMonth, orders]);

  // 商品匯總
  const productSummary = useMemo(() => {
    const map: Record<string, number> = {};
    filteredOrders.forEach(o => {
      o.items.forEach(i => {
        const key = i.variant ? `${i.product_name}（${i.variant}）` : i.product_name;
        map[key] = (map[key] || 0) + i.qty;
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredOrders]);

  const totalQty = filteredOrders.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.qty, 0), 0);
  const totalShipping = filteredOrders.reduce((s, o) => s + o.shipping_fee, 0);
function handlePrint() {
  const title = mode === "daily"
    ? `團購日報表｜${selectedDate}`
    : `團購月報表｜${selectedMonth}`;

  const content = mode === "daily"
    ? generateDailyReport(selectedDate, orders)
    : generateMonthlyReport(selectedMonth, orders);

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Noto Sans TC', 'Microsoft JhengHei', sans-serif;
          padding: 32px;
          color: #111;
          font-size: 13px;
          line-height: 1.8;
        }
        h1 {
          font-size: 20px;
          font-weight: 800;
          margin-bottom: 6px;
          color: #111827;
        }
        .subtitle {
          font-size: 12px;
          color: #6B7280;
          margin-bottom: 24px;
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        .stat-card {
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 12px 16px;
        }
        .stat-label {
          font-size: 10px;
          color: #9CA3AF;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 4px;
        }
        .stat-value {
          font-size: 22px;
          font-weight: 800;
        }
        .section-title {
          font-size: 11px;
          font-weight: 600;
          color: #9CA3AF;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin: 20px 0 10px;
          padding-bottom: 6px;
          border-bottom: 1px solid #F3F4F6;
        }
        .order-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #F9FAFB;
        }
        .order-name { font-weight: 600; color: #111827; }
        .order-region { font-size: 11px; color: #9CA3AF; margin-top: 2px; }
        .order-items { font-size: 11px; color: #6B7280; margin-top: 4px; }
        .order-qty { font-weight: 800; font-size: 16px; color: #06C755; }
        .product-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid #F9FAFB;
          font-size: 12px;
        }
        .progress-bar {
          height: 4px;
          background: #F3F4F6;
          border-radius: 2px;
          margin-top: 4px;
        }
        .progress-fill {
          height: 100%;
          background: #111827;
          border-radius: 2px;
        }
        .footer {
          margin-top: 32px;
          padding-top: 16px;
          border-top: 1px solid #E5E7EB;
          font-size: 11px;
          color: #9CA3AF;
          text-align: right;
        }
        @media print {
          body { padding: 20px; }
          @page { margin: 15mm; }
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="subtitle">匯出時間：${new Date().toLocaleString("zh-TW")}</div>

      <div class="stats">
        <div class="stat-card">
          <div class="stat-label">訂單數</div>
          <div class="stat-value">${filteredOrders.length} 筆</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">總出貨</div>
          <div class="stat-value" style="color:#06C755">${totalQty} 件</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">運費合計</div>
          <div class="stat-value" style="color:#3B82F6">${totalShipping} 元</div>
        </div>
      </div>

      <div class="section-title">商品匯總</div>
      ${productSummary.map(([name, qty]) => `
        <div class="product-row">
          <span>${name}</span>
          <strong>${qty} 件</strong>
        </div>
      `).join("")}

      <div class="section-title">訂單明細</div>
      ${filteredOrders.map(o => `
        <div class="order-row">
          <div>
            <div class="order-name">${o.buyer_name}${o.region ? `（${o.region}）` : ""}</div>
            <div class="order-items">
              ${o.items.map(i => `${i.product_name}${i.variant ? `（${i.variant}）` : ""} ×${i.qty}`).join("　")}
            ${o.source_text ? `
  <div style="font-size:10px; color:#9CA3AF; margin-top:4px; 
    font-family:monospace; white-space:pre-wrap; 
    border-left:2px solid #E5E7EB; padding-left:8px;">
    ${o.source_text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
  </div>` : ""}
              </div>
          </div>
          <div class="order-qty">×${o.items.reduce((s, i) => s + i.qty, 0)}</div>
        </div>
      `).join("")}

      <div class="footer">
        ${title}　|　共 ${filteredOrders.length} 筆訂單　|　${new Date().toLocaleString("zh-TW")}
      </div>

      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() { window.close(); };
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}
  function handleExport() {
    if (mode === "daily") {
      const content = generateDailyReport(selectedDate, orders);
      downloadText(`日報表_${selectedDate}.txt`, content);
    } else {
      const content = generateMonthlyReport(selectedMonth, orders);
      downloadText(`月報表_${selectedMonth}.txt`, content);
    }
  }

  return (
    <div style={{ minHeight:"100vh", background:"#F9FAFB", fontFamily:"'Noto Sans TC', system-ui, sans-serif" }}>
<button onClick={() => window.location.href = "/admin"}
  style={{ display:"flex", alignItems:"center", gap:8,
    background:"rgba(255,255,255,0.9)", border:"1.5px solid #E5E7EB",
    color:"#111827", cursor:"pointer", fontSize:14, fontWeight:600,
    padding:"8px 16px", borderRadius:10, marginBottom:12 }}>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
  ← 返回訂單
</button>

      {/* Header */}
      <div style={{ background:"#111827", padding:"16px 20px 20px" }}>
        <div style={{ fontSize:11, color:"#9CA3AF", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:2 }}>
          團購管理
        </div>
        <div style={{ fontSize:20, fontWeight:800, color:"#fff", letterSpacing:"-0.02em" }}>
          報表中心
        </div>
      </div>

      <div style={{ padding:"16px 14px 80px" }}>

        {/* Mode tabs */}
        <div style={{ display:"flex", background:"#fff", borderRadius:12, padding:4, marginBottom:16,
          border:"1px solid #E5E7EB", gap:4 }}>
          {[["daily","📋 日報表"],["monthly","📊 月報表"]].map(([val, label]) => (
            <button key={val} onClick={() => setMode(val as any)}
              style={{ flex:1, padding:"10px 0", borderRadius:9, border:"none",
                background: mode === val ? "#111827" : "transparent",
                color: mode === val ? "#fff" : "#6B7280",
                fontWeight: mode === val ? 700 : 400,
                fontSize:14, cursor:"pointer", transition:"all 0.15s" }}>
              {label}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display:"flex", gap:8, marginBottom:16, alignItems:"center" }}>
          {/* Date/Month selector */}
          <div style={{ flex:1 }}>
            {mode === "daily" ? (
              <select value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                style={{ width:"100%", padding:"10px 12px", border:"1px solid #E5E7EB",
                  borderRadius:9, fontSize:13, color:"#111827", background:"#fff",
                  fontWeight:600, cursor:"pointer" }}>
                {allDates.map(d => {
                  const cnt = orders.filter(o => o.order_date === d).length;
                  return <option key={d} value={d}>{d}（{cnt} 筆）</option>;
                })}
              </select>
            ) : (
              <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
                style={{ width:"100%", padding:"10px 12px", border:"1px solid #E5E7EB",
                  borderRadius:9, fontSize:13, color:"#111827", background:"#fff",
                  fontWeight:600, cursor:"pointer" }}>
                {allMonths.map(m => {
                  const cnt = orders.filter(o => o.order_date?.startsWith(m)).length;
                  return <option key={m} value={m}>{m}（{cnt} 筆）</option>;
                })}
              </select>
            )}
          </div>

          {/* Sort button */}
          <button onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}
            style={{ padding:"10px 14px", border:"1px solid #E5E7EB", borderRadius:9,
              background:"#fff", fontSize:12, color:"#374151", cursor:"pointer",
              display:"flex", alignItems:"center", gap:5, whiteSpace:"nowrap", fontWeight:500 }}>
            {sortDir === "desc" ? "⬇ 最新" : "⬆ 最舊"}
          </button>

          {/* Export button */}
          <button onClick={handleExport}
            style={{ padding:"10px 14px", border:"none", borderRadius:9,
              background:"#06C755", color:"#fff", fontSize:12, cursor:"pointer",
              display:"flex", alignItems:"center", gap:5, whiteSpace:"nowrap", fontWeight:600 }}>
            ⬇ 匯出
          </button>
          <button onClick={handlePrint}
  style={{ padding:"10px 14px", border:"none", borderRadius:9,
    background:"#374151", color:"#fff", fontSize:12, cursor:"pointer",
    display:"flex", alignItems:"center", gap:5, whiteSpace:"nowrap", fontWeight:600 }}>
  🖨 列印
</button>
        </div>

        {/* Stats strip */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:16 }}>
          {[
            { label:"訂單數", value:`${filteredOrders.length} 筆`, color:"#111827" },
            { label:"總出貨", value:`${totalQty} 件`, color:"#06C755" },
            { label:"運費合計", value:`${totalShipping} 元`, color:"#3B82F6" },
          ].map(s => (
            <div key={s.label} style={{ padding:"12px 14px", background:"#fff",
              border:"1px solid #E5E7EB", borderRadius:12 }}>
              <div style={{ fontSize:10, color:"#9CA3AF", fontWeight:600,
                textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>{s.label}</div>
              <div style={{ fontSize:18, fontWeight:800, color:s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Product summary */}
        {productSummary.length > 0 && (
          <div style={{ background:"#fff", borderRadius:12, border:"1px solid #E5E7EB",
            padding:"14px 16px", marginBottom:14 }}>
            <div style={{ fontSize:11, color:"#9CA3AF", fontWeight:600,
              textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:12 }}>
              商品匯總
            </div>
            {productSummary.map(([name, qty], i) => {
              const pct = Math.round((qty / totalQty) * 100);
              return (
                <div key={i} style={{ marginBottom: i < productSummary.length-1 ? 10 : 0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between",
                    fontSize:12, marginBottom:4 }}>
                    <span style={{ color:"#374151", fontWeight:500, flex:1,
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                      paddingRight:8 }}>{name}</span>
                    <span style={{ fontWeight:700, color:"#111827", flexShrink:0 }}>{qty} 件</span>
                  </div>
                  <div style={{ height:5, background:"#F3F4F6", borderRadius:3, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${pct}%`,
                      background:"linear-gradient(90deg, #111827, #374151)",
                      borderRadius:3, transition:"width 0.4s" }}/>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Order list by date */}
        {mode === "daily" ? (
          <div style={{ background:"#fff", borderRadius:12, border:"1px solid #E5E7EB", overflow:"hidden" }}>
            <div style={{ padding:"12px 16px", borderBottom:"1px solid #F3F4F6",
              fontSize:11, color:"#9CA3AF", fontWeight:600,
              textTransform:"uppercase", letterSpacing:"0.06em" }}>
              訂單明細（{filteredOrders.length} 筆）
            </div>
            {filteredOrders.length === 0 ? (
              <div style={{ textAlign:"center", padding:"32px 0", color:"#9CA3AF", fontSize:13 }}>
                此日期無訂單
              </div>
            ) : filteredOrders.map((o, i) => (
              <div key={o.id} style={{ padding:"12px 16px",
                borderBottom: i < filteredOrders.length-1 ? "1px solid #F9FAFB" : "none" }}>
                <div style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"flex-start", marginBottom:6 }}>
                  <div>
                    <span style={{ fontWeight:700, fontSize:14, color:"#111827" }}>{o.buyer_name}</span>
                    {o.region && <span style={{ fontSize:11, color:"#9CA3AF", marginLeft:6 }}>{o.region}</span>}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:11, color: STATUS_META[o.status]?.color,
                      fontWeight:600 }}>{STATUS_META[o.status]?.label}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:"#06C755" }}>
                      ×{o.items.reduce((s, i) => s + i.qty, 0)}
                    </span>
                  </div>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                  {o.items.map((item, j) => (
                    <span key={j} style={{ padding:"3px 8px", background:"#F9FAFB",
                      border:"1px solid #F3F4F6", borderRadius:6, fontSize:11, color:"#6B7280" }}>
                      {item.variant ? `${item.product_name}（${item.variant}）` : item.product_name} ×{item.qty}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Monthly: group by date */
          (() => {
            const byDate: Record<string, any[]> = {};
            filteredOrders.forEach(o => {
              if (!byDate[o.order_date]) byDate[o.order_date] = [];
              byDate[o.order_date].push(o);
            });
            const sortedDates = Object.keys(byDate).sort((a, b) =>
              sortDir === "desc" ? b.localeCompare(a) : a.localeCompare(b));
            return (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {sortedDates.map(date => {
                  const dayOrders = byDate[date];
                  const dayQty = dayOrders.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.qty, 0), 0);
                  return (
                    <div key={date} style={{ background:"#fff", borderRadius:12,
                      border:"1px solid #E5E7EB", overflow:"hidden" }}>
                      <div style={{ padding:"10px 16px", background:"#F9FAFB",
                        borderBottom:"1px solid #F3F4F6",
                        display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={{ fontWeight:700, fontSize:13, color:"#111827" }}>{date}</span>
                        <span style={{ fontSize:12, color:"#6B7280" }}>
                          {dayOrders.length} 筆｜{dayQty} 件
                        </span>
                      </div>
                      {dayOrders.map((o, i) => (
                        <div key={o.id} style={{ padding:"10px 16px",
                          borderBottom: i < dayOrders.length-1 ? "1px solid #F9FAFB" : "none" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                            <span style={{ fontWeight:600, fontSize:13, color:"#111827" }}>
                              {o.buyer_name}{o.region ? `（${o.region}）` : ""}
                            </span>
                            <span style={{ fontSize:13, fontWeight:700, color:"#06C755" }}>
                              ×{o.items.reduce((s, i) => s + i.qty, 0)}
                            </span>
                          </div>
                          <div style={{ fontSize:11, color:"#9CA3AF" }}>
                            {o.items.map(i => i.product_name).filter((v,i,a)=>a.indexOf(v)===i).join("、")}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}
