// @ts-nocheck
"use client";
import { useState, useRef, useEffect } from "react";
import { supabase } from "./lib/supabase";

const MOCK_ORDERS = [
  {
    id: "ORD-001", buyer_name: "黃翊哲", region: "新莊", phone: null, address: null,
    order_date: "2025-05-09", shipping_fee: 100, status: "pending",
    items: [
      { sku: "B3097-10", product_name: "涼感消臭萊卡機能襪", variant: "A 黑色男款", qty: 44 },
      { sku: "B3096-13", product_name: "涼感消臭萊卡機能襪", variant: "B 黑色女款", qty: 59 },
    ],
  },
  {
    id: "ORD-002", buyer_name: "蔡育涵", region: "苗栗", phone: "037-597792",
    address: "苗栗縣頭份市興隆里12鄰隆頂街380號",
    order_date: "2025-05-09", shipping_fee: 100, status: "confirmed",
    items: [
      { sku: "B3096-o", product_name: "抗菌消臭足弓襪套", variant: "A 男款", qty: 450 },
      { sku: "B3097-13", product_name: "抗菌消臭足弓襪套", variant: "B 女款", qty: 750 },
    ],
  },
  {
    id: "ORD-003", buyer_name: "黛德美", region: "電商", phone: null, address: null,
    order_date: "2025-05-08", shipping_fee: 100, status: "shipped",
    items: [
      { sku: "5118", product_name: "涼感速乾抗菌男背心", variant: "黑色 XXL", qty: 7 },
      { sku: "5118", product_name: "涼感速乾抗菌男背心", variant: "白色 XL", qty: 2 },
      { sku: "5118", product_name: "涼感速乾抗菌男背心", variant: "白色 XXL", qty: 7 },
      { sku: "5118", product_name: "涼感速乾抗菌男背心", variant: "寶藍 XL", qty: 2 },
    ],
  },
  {
    id: "ORD-004", buyer_name: "喬宜思", region: null, phone: null, address: null,
    order_date: "2025-05-08", shipping_fee: 100, status: "pending",
    items: [
      { sku: null, product_name: "玻璃噴油瓶", variant: null, qty: 5 },
      { sku: null, product_name: "瓦斯爐刮刀清潔刷", variant: null, qty: 3 },
      { sku: null, product_name: "石墨烯黑科技洗衣膠囊", variant: null, qty: 3 },
    ],
  },
  {
    id: "ORD-005", buyer_name: "陳怡雯", region: "高雄", phone: "0938113198",
    address: "高雄市前金區仁德街249號",
    order_date: "2025-05-08", shipping_fee: 100, status: "confirmed",
    items: [{ sku: "9006", product_name: "鋅+石墨烯雙效抗菌冰鋒袖套", variant: null, qty: 100 }],
  },
  {
    id: "ORD-006", buyer_name: "童倉庫", region: null, phone: null, address: null,
    order_date: "2025-05-08", shipping_fee: 0, status: "done",
    items: [
      { sku: "9524", product_name: "涼感印花安全帽內襯", variant: "A 經典格紋款", qty: 152 },
      { sku: "9524", product_name: "涼感印花安全帽內襯", variant: "B 可愛卡通款", qty: 160 },
    ],
  },
];

const STATUS_META = {
  pending:   { label: "待處理", color: "#B45309", bg: "#FEF3C7", dot: "#F59E0B", next: "confirmed" },
  confirmed: { label: "已確認", color: "#1D4ED8", bg: "#DBEAFE", dot: "#3B82F6", next: "shipped" },
  shipped:   { label: "已出貨", color: "#065F46", bg: "#D1FAE5", dot: "#10B981", next: "done" },
  done:      { label: "已完成", color: "#374151", bg: "#F3F4F6", dot: "#9CA3AF", next: null },
  cancelled: { label: "已取消", color: "#991B1B", bg: "#FEE2E2", dot: "#EF4444", next: null },
};

const AVATAR_PALETTE = [
  ["#FDE68A","#92400E"],["#BBF7D0","#065F46"],["#BFDBFE","#1E40AF"],
  ["#FBCFE8","#9D174D"],["#DDD6FE","#4C1D95"],["#FED7AA","#9A3412"],
];
function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[h];
}

function Badge({ status, small }) {
  const m = STATUS_META[status] || STATUS_META.pending;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:4,
      padding: small ? "2px 8px" : "4px 10px",
      borderRadius:20, background:m.bg, color:m.color,
      fontSize: small ? 10 : 11, fontWeight:600, letterSpacing:"0.02em", whiteSpace:"nowrap"
    }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:m.dot, flexShrink:0 }}/>
      {m.label}
    </span>
  );
}

// Bottom sheet component
function Sheet({ open, onClose, title, children }) {
  const ref = useRef();
  const startY = useRef(null);
  const currentY = useRef(0);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function onTouchStart(e) { startY.current = e.touches[0].clientY; }
  function onTouchMove(e) {
    const dy = e.touches[0].clientY - startY.current;
    if (dy < 0) return;
    currentY.current = dy;
    if (ref.current) ref.current.style.transform = `translateY(${dy}px)`;
  }
  function onTouchEnd() {
    if (currentY.current > 120) { onClose(); }
    if (ref.current) ref.current.style.transform = "";
    currentY.current = 0;
  }

  return (
    <>
      <div onClick={onClose} style={{
        position:"fixed", inset:0, background:"rgba(0,0,0,0.4)",
        zIndex:300, opacity: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
        transition:"opacity 0.25s"
      }}/>
      <div ref={ref} style={{
        position:"fixed", left:0, right:0, bottom:0, zIndex:301,
        background:"#fff", borderRadius:"20px 20px 0 0",
        transform: open ? "translateY(0)" : "translateY(100%)",
        transition:"transform 0.3s cubic-bezier(0.32,0.72,0,1)",
        maxHeight:"92vh", display:"flex", flexDirection:"column",
        boxShadow:"0 -4px 40px rgba(0,0,0,0.12)"
      }}>
        {/* drag handle */}
        <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
          style={{ padding:"12px 0 6px", display:"flex", justifyContent:"center", flexShrink:0 }}>
          <div style={{ width:36, height:4, borderRadius:2, background:"#E5E7EB" }}/>
        </div>
        {title && (
          <div style={{ padding:"4px 20px 14px", display:"flex", justifyContent:"space-between",
            alignItems:"center", borderBottom:"1px solid #F3F4F6", flexShrink:0 }}>
            <span style={{ fontWeight:700, fontSize:16 }}>{title}</span>
            <button onClick={onClose} style={{ background:"#F3F4F6", border:"none", borderRadius:"50%",
              width:30, height:30, cursor:"pointer", fontSize:16, color:"#6B7280",
              display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
          </div>
        )}
        <div style={{ overflowY:"auto", flex:1 }}>{children}</div>
      </div>
    </>
  );
}

// Swipeable order card
function OrderCard({ order, onTap, onStatusChange }) {
  const [offset, setOffset] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const startX = useRef(null);
  const isDragging = useRef(false);
  const ACTION_WIDTH = 140;
  const [abg, atx] = avatarColor(order.buyer_name);
  const totalQty = order.items.reduce((s, i) => s + i.qty, 0);
  const m = STATUS_META[order.status];

  function onTouchStart(e) {
    startX.current = e.touches[0].clientX;
    isDragging.current = false;
  }
  function onTouchMove(e) {
    const dx = e.touches[0].clientX - startX.current;
    isDragging.current = true;
    if (dx > 0 && !revealed) return;
    const base = revealed ? -ACTION_WIDTH : 0;
    const next = Math.max(-ACTION_WIDTH, Math.min(0, base + dx));
    setOffset(next);
  }
  function onTouchEnd() {
    if (!isDragging.current) return;
    if (offset < -ACTION_WIDTH / 2) { setOffset(-ACTION_WIDTH); setRevealed(true); }
    else { setOffset(0); setRevealed(false); }
  }
  function handleTap() {
    if (revealed) { setOffset(0); setRevealed(false); return; }
    onTap(order);
  }

  const nextStatus = m?.next;

  return (
    <div style={{ position:"relative", overflow:"hidden", marginBottom:8 }}>
      {/* Action buttons behind card */}
      <div style={{ position:"absolute", right:0, top:0, bottom:0, width:ACTION_WIDTH,
        display:"flex", borderRadius:"0 14px 14px 0" }}>
        {nextStatus && (
          <button onClick={() => { onStatusChange(order.id, nextStatus); setOffset(0); setRevealed(false); }}
            style={{ flex:1, background:"#06C755", border:"none", color:"#fff",
              fontSize:11, fontWeight:700, cursor:"pointer", display:"flex",
              flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {STATUS_META[nextStatus].label}
          </button>
        )}
        <button onClick={() => { onStatusChange(order.id, "cancelled"); setOffset(0); setRevealed(false); }}
          style={{ flex:1, background:"#EF4444", border:"none", color:"#fff",
            fontSize:11, fontWeight:700, cursor:"pointer", display:"flex",
            flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3,
            borderRadius: nextStatus ? "0 14px 14px 0" : "0 14px 14px 0" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          取消
        </button>
      </div>

      {/* Card */}
      <div
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        onClick={handleTap}
        style={{
          background:"#fff", borderRadius:14, padding:"14px 16px",
          border:"1px solid #F3F4F6", transform:`translateX(${offset}px)`,
          transition: isDragging.current ? "none" : "transform 0.25s cubic-bezier(0.32,0.72,0,1)",
          cursor:"pointer", userSelect:"none", position:"relative", zIndex:1,
        }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
          {/* Avatar */}
          <div style={{ width:40, height:40, borderRadius:10, background:abg, flexShrink:0,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:15, fontWeight:700, color:atx }}>
            {order.buyer_name.charAt(0)}
          </div>
          {/* Main */}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
              <span style={{ fontWeight:700, fontSize:14, color:"#111827" }}>{order.buyer_name}</span>
              <Badge status={order.status} small />
            </div>
            <div style={{ fontSize:11, color:"#9CA3AF", marginBottom:6 }}>
              {[order.region, order.order_date].filter(Boolean).join(" · ")}
            </div>
            <div style={{ fontSize:12, color:"#6B7280", overflow:"hidden",
              textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {order.items.map(i => i.product_name).filter((v,i,a)=>a.indexOf(v)===i).slice(0,2).join("、")}
              {order.items.length > 2 ? ` 等` : ""}
            </div>
          </div>
          {/* Qty pill */}
          <div style={{ flexShrink:0, background:"#F9FAFB", border:"1px solid #F3F4F6",
            borderRadius:8, padding:"4px 10px", textAlign:"center" }}>
            <div style={{ fontSize:16, fontWeight:800, color:"#111827", lineHeight:1 }}>{totalQty}</div>
            <div style={{ fontSize:9, color:"#9CA3AF", marginTop:2 }}>件</div>
          </div>
        </div>
        {/* Swipe hint on first card */}
        {!revealed && offset === 0 && (
          <div style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
            opacity:0, pointerEvents:"none" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MobileOrderDashboard() {
  const [orders, setOrders] = useState([]);
  // 從 Supabase 載入訂單
useEffect(() => {
  async function fetchOrders() {
    const { data: ordersData } = await supabase
      .from("orders")
      .select(`
        id, order_date, shipping_fee, status, source_text,
        buyers ( id, name, phone, address, region ),
        order_items ( id, sku, product_name, variant, qty )
      `)
      .order("created_at", { ascending: false });

console.log("訂單資料:", ordersData);
    if (ordersData && ordersData.length > 0) {
      const formatted = ordersData.map((o) => ({
        id: o.id,
        buyer_name: o.buyers?.name || "未知",
        region: o.buyers?.region || null,
        phone: o.buyers?.phone || null,
        address: o.buyers?.address || null,
        order_date: o.order_date,
        shipping_fee: o.shipping_fee,
        status: o.status,
        items: o.order_items || [],
        source_text: o.source_text || null,
      }));
      setOrders(formatted);
    }
  }
  fetchOrders();
}, []);

// 更新狀態到 Supabase
async function updateStatusDB(id, status) {
  await supabase.from("orders").update({ status }).eq("id", id);
  updateStatus(id, status);
}
  const [tab, setTab] = useState("orders");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showParser, setShowParser] = useState(false);
  const [parseText, setParseText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [search, setSearch] = useState("");

  function updateStatus(id, status) {
    setOrders(p => p.map(o => o.id === id ? { ...o, status } : o));
    if (selectedOrder?.id === id) setSelectedOrder(p => ({ ...p, status }));
  }

  const filtered = orders.filter(o => {
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !q || o.buyer_name.includes(q) ||
      (o.region || "").includes(q) ||
      o.items.some(i => i.product_name.includes(q) || (i.sku || "").includes(q));
    return matchStatus && matchSearch;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    shipped: orders.filter(o => o.status === "shipped").length,
    done: orders.filter(o => o.status === "done").length,
  };

  async function handleParse() {
  if (!parseText.trim()) return;
  setParsing(true);
  try {
    const res = await fetch("/api/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: parseText }),
    });
    const parsed = await res.json();
    if (parsed.error) throw new Error(parsed.error);
const newOrders = [];
for (const o of parsed.orders) {
  // 1. 先建立或找到買家
  const { data: buyerData } = await supabase
    .from("buyers")
    .insert({
      name: o.buyer_name,
      phone: o.phone,
      address: o.address,
      region: o.region,
    })
    .select()
    .single();

  if (!buyerData) continue;

  // 2. 建立訂單（含原始文字備註）
  const { data: orderData } = await supabase
    .from("orders")
    .insert({
      buyer_id: buyerData.id,
      order_date: o.order_date,
      shipping_fee: o.shipping_fee,
      status: "pending",
      source_text: o.source_text,  // ← 原始 LINE 訊息存這裡
    })
    .select()
    .single();

  if (!orderData) continue;

  // 3. 建立訂單明細
  await supabase.from("order_items").insert(
    o.items.map((item: any) => ({
      order_id: orderData.id,
      sku: item.sku,
      product_name: item.product_name,
      variant: item.variant,
      qty: item.qty,
    }))
  );

  newOrders.push({
    ...o,
    id: orderData.id,
    buyer_name: o.buyer_name,
    status: "pending",
  });
}

setOrders((p: any) => [...newOrders, ...p]);
setShowParser(false);
setParseText("");

  } catch (e) {
    alert("解析失敗，請確認格式");
  } finally {
    setParsing(false);
  }
}

  return (
    <div style={{ maxWidth:480, margin:"0 auto", background:"#F9FAFB",
      minHeight:"100vh", display:"flex", flexDirection:"column",
      fontFamily:"'Noto Sans TC', system-ui, sans-serif" }}>

      {/* Status bar area */}
      <div style={{ background:"#111827", paddingTop:4 }}/>

      {/* Top header */}
      <div style={{ background:"#111827", padding:"14px 20px 18px",
        display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:11, color:"#9CA3AF", letterSpacing:"0.08em",
            textTransform:"uppercase", marginBottom:2 }}>團購管理</div>
          <div style={{ fontSize:20, fontWeight:800, color:"#fff", letterSpacing:"-0.02em" }}>
            訂單總覽
          </div>
        </div>
        <button onClick={() => setShowParser(true)}
          style={{ width:40, height:40, borderRadius:12, background:"#06C755",
            border:"none", cursor:"pointer", display:"flex", alignItems:"center",
            justifyContent:"center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      {/* Stats strip */}
      <div style={{ background:"#111827", padding:"0 16px 20px",
        display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
        {[
          { label:"全部", val:stats.total, color:"#fff" },
          { label:"待處理", val:stats.pending, color:"#FCD34D" },
          { label:"出貨中", val:stats.shipped, color:"#34D399" },
          { label:"完成", val:stats.done, color:"#60A5FA" },
        ].map(s => (
          <button key={s.label}
            onClick={() => setFilterStatus(
              s.label === "全部" ? "all" :
              s.label === "待處理" ? "pending" :
              s.label === "出貨中" ? "shipped" : "done"
            )}
            style={{ background: "rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)",
              borderRadius:10, padding:"10px 6px", cursor:"pointer", textAlign:"center" }}>
            <div style={{ fontSize:20, fontWeight:800, color:s.color, lineHeight:1 }}>{s.val}</div>
            <div style={{ fontSize:10, color:"#9CA3AF", marginTop:3 }}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex:1, padding:"16px 14px 80px", overflowY:"auto" }}>

        {/* Search */}
        <div style={{ position:"relative", marginBottom:14 }}>
          <svg style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜尋買家、商品..."
            style={{ width:"100%", padding:"10px 12px 10px 34px", border:"1px solid #E5E7EB",
              borderRadius:10, fontSize:13, background:"#fff", color:"#111827",
              outline:"none", boxSizing:"border-box" }}/>
        </div>

        {/* Filter pills */}
        <div style={{ display:"flex", gap:7, marginBottom:16, overflowX:"auto", paddingBottom:2 }}>
          {[["all","全部"], ["pending","待處理"], ["confirmed","已確認"],
            ["shipped","已出貨"], ["done","已完成"]].map(([val, lbl]) => {
            const active = filterStatus === val;
            return (
              <button key={val} onClick={() => setFilterStatus(val)}
                style={{ padding:"6px 14px", borderRadius:20, border:"none", whiteSpace:"nowrap",
                  background: active ? "#111827" : "#fff",
                  color: active ? "#fff" : "#6B7280",
                  fontSize:12, fontWeight:active?600:400, cursor:"pointer",
                  boxShadow: active ? "none" : "0 1px 3px rgba(0,0,0,0.06)",
                  flexShrink:0 }}>
                {lbl}
              </button>
            );
          })}
        </div>

        {/* Swipe hint */}
        <div style={{ fontSize:11, color:"#9CA3AF", marginBottom:10, textAlign:"right" }}>
          ← 左滑可快速更新狀態
        </div>

        {/* Order cards */}
        {filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"48px 0", color:"#9CA3AF", fontSize:13 }}>
            沒有符合的訂單
          </div>
        ) : filtered.map(order => (
          <OrderCard key={order.id} order={order}
            onTap={setSelectedOrder}
            onStatusChange={updateStatus} />
        ))}
      </div>

      {/* Bottom nav */}
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
        width:"100%", maxWidth:480, background:"#fff", borderTop:"1px solid #F3F4F6",
        display:"grid", gridTemplateColumns:"repeat(3,1fr)", zIndex:200,
        paddingBottom:"env(safe-area-inset-bottom, 8px)" }}>
        {[
          { id:"orders", icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>, label:"訂單" },
          { id:"add", icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>, label:"新增", action:() => setShowParser(true) },
          { id:"stats", icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, label:"統計", action:() => window.location.href = "/report" },
        ].map(({ id, icon, label, action }) => {
          const active = tab === id;
          return (
            <button key={id} onClick={action || (() => setTab(id))}
              style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3,
                padding:"10px 0", background:"none", border:"none", cursor:"pointer",
                color: active ? "#111827" : "#9CA3AF" }}>
              {icon}
              <span style={{ fontSize:10, fontWeight: active ? 700 : 400 }}>{label}</span>
              {active && <span style={{ width:4, height:4, borderRadius:"50%", background:"#111827", position:"absolute", bottom:6 }}/>}
            </button>
          );
        })}
      </div>

      {/* Order Detail Sheet */}
      <Sheet open={!!selectedOrder} onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `${selectedOrder.buyer_name} 的訂單` : ""}>
        {selectedOrder && (() => {
          const o = selectedOrder;
          const [abg, atx] = avatarColor(o.buyer_name);
          const totalQty = o.items.reduce((s,i) => s+i.qty, 0);
          return (
            <div style={{ padding:"16px 20px 32px" }}>
              {/* Buyer info */}
              <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
                <div style={{ width:52, height:52, borderRadius:14, background:abg,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:20, fontWeight:800, color:atx, flexShrink:0 }}>
                  {o.buyer_name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:17 }}>{o.buyer_name}</div>
                  <div style={{ fontSize:12, color:"#9CA3AF", marginTop:2 }}>
                    {[o.region, o.order_date].filter(Boolean).join(" · ")}
                  </div>
                  {o.phone && (
                    <a href={`tel:${o.phone}`} style={{ fontSize:12, color:"#3B82F6", marginTop:2, display:"block" }}>
                      {o.phone}
                    </a>
                  )}
                </div>
                <div style={{ marginLeft:"auto" }}><Badge status={o.status}/></div>
              </div>

              {/* Info chips */}
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:18 }}>
                {[
                  ["運費", o.shipping_fee ? `+${o.shipping_fee} 元` : "免運"],
                  ["總件數", `${totalQty} 件`],
                  ["訂單號", o.id],
                ].map(([k,v]) => (
                  <div key={k} style={{ padding:"6px 12px", background:"#F9FAFB",
                    border:"1px solid #F3F4F6", borderRadius:8, fontSize:12 }}>
                    <span style={{ color:"#9CA3AF" }}>{k}：</span>
                    <span style={{ color:"#374151", fontWeight:500 }}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Address */}
              {o.address && (
                <div style={{ padding:"12px 14px", background:"#F0FDF4",
                  border:"1px solid #BBF7D0", borderRadius:10, marginBottom:18,
                  fontSize:12, color:"#065F46", display:"flex", gap:8, alignItems:"flex-start" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" style={{ flexShrink:0, marginTop:1 }}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {o.address}
                </div>
              )}
              
{o.source_text && (
  <div style={{ marginBottom:18 }}>
    <div style={{ fontSize:11, color:"#9CA3AF", fontWeight:600,
      letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:8 }}>
      原始訂單備註
    </div>
    <div style={{ padding:"12px 14px", background:"#F9FAFB",
      border:"1px solid #F3F4F6", borderRadius:10,
      fontSize:12, color:"#374151", lineHeight:1.8,
      fontFamily:"monospace", whiteSpace:"pre-wrap" }}>
      {o.source_text}
    </div>
  </div>
)}

              {/* Items */}
              <div style={{ fontSize:11, color:"#9CA3AF", fontWeight:600,
                letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:10 }}>
                商品明細 ({o.items.length} 項)
              </div>
              <div style={{ border:"1px solid #F3F4F6", borderRadius:12, overflow:"hidden", marginBottom:20 }}>
                {o.items.map((item, i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between",
                    alignItems:"center", padding:"12px 14px",
                    borderBottom: i < o.items.length-1 ? "1px solid #F9FAFB":"none",
                    background: i%2===0 ? "#fff" : "#FAFAFA" }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:"#111827" }}>{item.product_name}</div>
                      <div style={{ fontSize:11, color:"#9CA3AF", marginTop:2, overflow:"hidden",
                        textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {[item.sku, item.variant].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <div style={{ fontWeight:800, fontSize:18, color:"#06C755", marginLeft:12 }}>
                      ×{item.qty}
                    </div>
                  </div>
                ))}
                <div style={{ display:"flex", justifyContent:"space-between",
                  padding:"10px 14px", background:"#F9FAFB",
                  borderTop:"2px solid #F3F4F6", fontSize:13, fontWeight:700, color:"#374151" }}>
                  <span>合計</span><span>{totalQty} 件</span>
                </div>
              </div>

              {/* Status update */}
              <div style={{ fontSize:11, color:"#9CA3AF", fontWeight:600,
                letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:10 }}>
                更新狀態
              </div>
              {/* 刪除按鈕 */}
<div style={{ marginTop:20, paddingTop:16, borderTop:"1px solid #F3F4F6" }}>
  <button onClick={async () => {
    if (!confirm(`確定要刪除 ${o.buyer_name} 的訂單？`)) return;
    await supabase.from("order_items").delete().eq("order_id", o.id);
    await supabase.from("orders").delete().eq("id", o.id);
    setOrders(p => p.filter(x => x.id !== o.id));
    setSelectedOrder(null);
  }}
    style={{ width:"100%", padding:"12px", border:"1.5px solid #FCA5A5",
      borderRadius:10, background:"#FFF1F1", color:"#DC2626",
      fontSize:13, fontWeight:600, cursor:"pointer" }}>
    🗑 刪除此訂單
  </button>
</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                {Object.entries(STATUS_META).map(([s, m]) => {
                  const active = o.status === s;
                  return (
                    <button key={s} onClick={() => updateStatus(o.id, s)}
                      style={{ padding:"10px 6px", borderRadius:10, border: active ? `2px solid ${m.dot}` : "1.5px solid #F3F4F6",
                        background: active ? m.bg : "#fff", color: active ? m.color : "#9CA3AF",
                        fontSize:12, fontWeight: active?700:400, cursor:"pointer",
                        display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                      <span style={{ width:8, height:8, borderRadius:"50%", background:m.dot }}/>
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </Sheet>

      {/* Parse Sheet */}
      <Sheet open={showParser} onClose={() => setShowParser(false)} title="匯入 LINE 訂單">
        <div style={{ padding:"16px 20px 32px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px",
            background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:10, marginBottom:16,
            fontSize:12, color:"#065F46" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            貼上 LINE 群組的訂單訊息，AI 自動解析
          </div>
          <textarea value={parseText} onChange={e => setParseText(e.target.value)}
            placeholder="貼上訂單訊息..."
            style={{ width:"100%", height:200, padding:14, border:"1.5px solid #E5E7EB",
              borderRadius:12, fontSize:13, lineHeight:1.7, resize:"none",
              fontFamily:"monospace", boxSizing:"border-box", color:"#374151",
              outline:"none", background:"#FAFAFA" }}/>
          <button onClick={handleParse} disabled={parsing || !parseText.trim()}
            style={{ marginTop:14, width:"100%", padding:"14px",
              background: parsing || !parseText.trim() ? "#E5E7EB" : "#06C755",
              color: parsing || !parseText.trim() ? "#9CA3AF" : "#fff",
              border:"none", borderRadius:12, fontWeight:700, fontSize:15,
              cursor: parsing ? "not-allowed" : "pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            {parsing ? (
              <><span style={{ width:16, height:16, border:"2.5px solid rgba(255,255,255,0.4)",
                borderTopColor:"#fff", borderRadius:"50%",
                animation:"spin 0.8s linear infinite", display:"inline-block" }}/>解析中...</>
            ) : "解析並匯入"}
          </button>
        </div>
      </Sheet>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        input:focus, textarea:focus { outline: 2px solid #06C755; outline-offset: -1px; border-color: transparent !important; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
