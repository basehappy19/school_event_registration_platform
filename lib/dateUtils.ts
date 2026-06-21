export function formatThaiDateWithDay(dateInput: string | Date | null): string {
  if (!dateInput) return "ยังไม่กำหนดวัน";

  const thaiMonths = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  const thaiDays = [
    "วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"
  ];

  // Create Date object
  const dateObj = new Date(dateInput);
  if (!isNaN(dateObj.getTime())) {
    const dayOfWeek = thaiDays[dateObj.getDay()];
    const day = dateObj.getDate();
    const month = thaiMonths[dateObj.getMonth()];
    const year = dateObj.getFullYear() + 543;
    return `${dayOfWeek}ที่ ${day} ${month} ${year}`;
  }

  // Fallback for pre-formatted Thai strings like "19 กรกฎาคม 2569"
  if (typeof dateInput === 'string') {
    const dateString = dateInput.trim();
    if (dateString.startsWith("วัน")) {
      return dateString.includes("ที่") ? dateString : dateString.replace("วัน", "วันที่ ");
    }
    return `วันที่ ${dateString}`;
  }

  return "ยังไม่กำหนดวัน";
}

export function formatTimeRange(startTime: Date | string | null | undefined, endTime: Date | string | null | undefined): string {
  if (!startTime && !endTime) return "ยังไม่กำหนดเวลา";

  const formatTime = (t: Date | string) => {
    const d = new Date(t);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' });
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
