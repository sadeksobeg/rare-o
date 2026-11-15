/** Shared print-ready invoice styles (retail + wholesale). */
export const INVOICE_CSS = `
@page { size: A4; margin: 0; }
.inv-wrap { background:#ece7f1; min-height:100vh; padding:24px 12px 48px; font-family: var(--font-sans, "IBM Plex Sans Arabic", system-ui, sans-serif); color:#1d1426; }
.inv-bar { max-width:794px; margin:0 auto 14px; display:flex; justify-content:space-between; align-items:center; gap:12px; }
.inv-print-btn { height:44px; padding:0 22px; border-radius:999px; border:0; background:#2a1340; color:#f4d9a6; font-weight:600; font-size:14px; cursor:pointer; }
.inv-back { color:#2a1340; font-size:14px; text-decoration:underline; text-underline-offset:4px; }
.inv-page { position:relative; width:794px; max-width:100%; min-height:1123px; margin:0 auto; background:#fff; box-shadow:0 30px 80px -30px rgba(42,19,64,.45); overflow:hidden; }
.inv-head { position:relative; background:linear-gradient(135deg,#150b21 0%,#2a1340 55%,#52277c 100%); color:#fff; padding:40px 48px 34px; }
.inv-head::after { content:""; position:absolute; inset-inline-end:-80px; top:-80px; width:300px; height:300px; border-radius:50%; background:radial-gradient(circle,rgba(200,150,62,.38),transparent 65%); }
.inv-brand { position:relative; display:flex; align-items:center; gap:16px; z-index:1; }
.inv-brand img { height:64px; width:auto; }
.inv-brand b { font-size:26px; letter-spacing:.32em; font-weight:500; }
.inv-brand span { display:block; font-size:12px; opacity:.7; letter-spacing:0; margin-top:4px; }
.inv-title { position:relative; z-index:1; margin-top:26px; display:flex; justify-content:space-between; align-items:flex-end; gap:20px; flex-wrap:wrap; }
.inv-title h1 { margin:0; font-size:34px; font-weight:600; color:#f4d9a6; }
.inv-meta { font-size:13px; line-height:1.9; opacity:.9; text-align:end; }
.inv-meta bdi { font-weight:600; letter-spacing:.04em; }
.inv-gold { height:4px; background:linear-gradient(90deg,#c8963e,#f4d9a6,#c8963e); }
.inv-body { padding:34px 48px 20px; }
.inv-cols { display:grid; grid-template-columns:1fr 1fr; gap:22px; }
.inv-card { border:1px solid #e6dff0; border-radius:14px; padding:16px 18px; background:#fcfaff; }
.inv-card h3 { margin:0 0 10px; font-size:12px; letter-spacing:.06em; color:#7a6a91; font-weight:600; }
.inv-card p { margin:3px 0; font-size:14px; line-height:1.7; }
.inv-card .k { color:#7a6a91; }
table.inv-table { width:100%; border-collapse:collapse; margin-top:26px; font-size:14px; }
.inv-table th { background:#2a1340; color:#f4d9a6; font-weight:600; font-size:12.5px; padding:11px 12px; text-align:start; }
.inv-table th:first-child { border-start-start-radius:10px; }
.inv-table th:last-child { border-start-end-radius:10px; }
.inv-table td { padding:13px 12px; border-bottom:1px solid #eee7f5; }
.inv-table td.num, .inv-table th.num { text-align:end; font-variant-numeric:tabular-nums; }
.inv-totals { margin-top:18px; margin-inline-start:auto; width:320px; max-width:100%; }
.inv-totals div { display:flex; justify-content:space-between; padding:7px 4px; font-size:14px; }
.inv-totals .grand { margin-top:6px; padding:14px 16px; border-radius:12px; background:linear-gradient(135deg,#2a1340,#52277c); color:#fff; font-size:17px; font-weight:600; }
.inv-totals .grand bdi { color:#f4d9a6; }
.inv-notes { margin-top:24px; display:grid; grid-template-columns:1fr 150px; gap:22px; align-items:center; }
.inv-notes p { margin:4px 0; font-size:12.5px; line-height:1.8; color:#5d4f72; }
.inv-qr { text-align:center; font-size:11px; color:#7a6a91; }
.inv-qr img { width:130px; height:130px; display:block; margin:0 auto 6px; }
.inv-foot { position:absolute; inset-inline:0; bottom:0; padding:16px 48px 22px; background:#150b21; color:#e8dcc4; display:flex; justify-content:space-between; gap:12px; font-size:12.5px; flex-wrap:wrap; }
.inv-chip { display:inline-block; padding:2px 10px; border-radius:999px; background:rgba(244,217,166,.16); color:#f4d9a6; font-size:12px; margin-inline-start:6px; }
@media (max-width:640px){ .inv-head,.inv-body{padding-inline:20px} .inv-cols{grid-template-columns:1fr} .inv-notes{grid-template-columns:1fr} .inv-foot{padding-inline:20px; position:static; margin-top:24px} .inv-page{min-height:0} .inv-title h1{font-size:26px} }
@media print {
  .inv-wrap { background:#fff; padding:0; }
  .inv-bar { display:none; }
  .inv-page { box-shadow:none; width:210mm; min-height:297mm; margin:0; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;
