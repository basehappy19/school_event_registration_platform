export function formatThaiDateWithDay(dateInput: string | Date | null): string {
  if (!dateInput) return "ยังไม่กำหนดวัน";

  // Create Date object
  const dateObj = new Date(dateInput);
  if (!isNaN(dateObj.getTime())) {
    try {
      return new Intl.DateTimeFormat('th-TH', { 
        timeZone: 'Asia/Bangkok', 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }).format(dateObj);
    } catch (e) {
      // Fallback if Intl fails
    }
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
