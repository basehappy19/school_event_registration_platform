export function formatThaiDateWithDay(dateInput: string | Date | null): string {
  if (!dateInput) return "ยังไม่กำหนดวัน";

  let dateString = typeof dateInput === 'string' ? dateInput : dateInput.toISOString().split('T')[0];

  const thaiMonths = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  
  const thaiDays = [
    "วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"
  ];

  // Support YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const dateObj = new Date(dateString);
    if (!isNaN(dateObj.getTime())) {
      const dayOfWeek = thaiDays[dateObj.getDay()];
      const day = dateObj.getDate();
      const month = thaiMonths[dateObj.getMonth()];
      const year = dateObj.getFullYear() + 543;
      return `${dayOfWeek}ที่ ${day} ${month} ${year}`;
    }
  }

  // If it already starts with a day name (e.g. วันจันทร์), just return it
  if (dateString.startsWith("วัน")) {
    return dateString.includes("ที่") ? dateString : dateString.replace("วัน", "วันที่ ");
  }


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

export function formatTimeRange(startTime: Date | string | null | undefined, endTime: Date | string | null | undefined): string {
  if (!startTime && !endTime) return "ยังไม่กำหนดเวลา";

  const formatTime = (t: Date | string) => {
    const d = new Date(t);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const startStr = startTime ? formatTime(startTime) : "";
  const endStr = endTime ? formatTime(endTime) : "";

  if (startStr && endStr) {
    return `${startStr} - ${endStr} น.`;
  } else if (startStr) {
    return `${startStr} น.`;
  } else if (endStr) {
    return `จนถึง ${endStr} น.`;
  }

  return "ยังไม่กำหนดเวลา";
}
