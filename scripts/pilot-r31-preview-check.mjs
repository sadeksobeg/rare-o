const { humanizeInboxPreview, humanizeMessageBody } = await import(
  "../lib/whatsapp/messaging/preview-label.ts"
);

const L = {
  sticker: "ملصق",
  image: "صورة",
  video: "فيديو",
  audio: "مقطع صوتي",
  document: "ملف",
  location: "موقع",
  contact: "جهة اتصال",
  reaction: "تفاعل",
  unsupported: "رسالة غير مدعومة",
  empty: "—",
};

const cases = [
  ["[unsupported:sticker]", "ملصق"],
  ["[unsupported]", "رسالة غير مدعومة"],
  ["[sticker]", "ملصق"],
  ["[image]", "صورة"],
  ["[audio]", "مقطع صوتي"],
  ["[document] invoice.pdf", "invoice.pdf"],
  ["hello", "hello"],
  ["", "—"],
  ["[weird]", "رسالة غير مدعومة"],
];

let fail = 0;
for (const [raw, expect] of cases) {
  const got = humanizeInboxPreview(raw, L);
  if (got !== expect) {
    console.log("FAIL", JSON.stringify(raw), "=>", got, "expected", expect);
    fail++;
  }
}
const b = humanizeMessageBody("[unsupported:sticker]", "sticker", null, L);
if (b !== "ملصق") {
  console.log("FAIL body", b);
  fail++;
}
console.log(fail === 0 ? "PREVIEW_OK" : `PREVIEW_FAIL ${fail}`);
process.exit(fail === 0 ? 0 : 1);
