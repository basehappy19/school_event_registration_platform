export function formatThaiDateWithDay(dateString: string | null): string {
  if (!dateString) return "ยังไม่กำหนดวัน";

  // If it already starts with a day name (e.g. วันจันทร์), just return it
  if (dateString.startsWith("วัน")) {
    return dateString.includes("ที่") ? dateString : dateString.replace("วัน", "วันที่ ");
  }

  const thaiMonths = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  
  const thaiDays = [
    "วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"
  ];

  try {
    // Expected format: "19 กรกฎาคม 2569"
    const parts = dateString.trim().split(/\s+/);
    if (parts.length >= 3) {
      const day = parseInt(parts[0], 10);
      const monthStr = parts[1];
      const yearStr = parts[2];

      const monthIndex = thaiMonths.findIndex(m => m === monthStr);
      let year = parseInt(yearStr, 10);

      // If year is BE (e.g. 2569), convert to CE (2026)
      if (year > 2500) {
        year -= 543;
      }

      if (!isNaN(day) && monthIndex !== -1 && !isNaN(year)) {
        const dateObj = new Date(year, monthIndex, day);
        const dayOfWeek = thaiDays[dateObj.getDay()];
        
        return `${dayOfWeek}ที่ ${dateString}`;
      }
    }
  } catch (e) {
    console.error("Error parsing Thai date", e);
  }

  // Fallback to original string prefixed with "วันที่ "
  return `วันที่ ${dateString}`;
}
