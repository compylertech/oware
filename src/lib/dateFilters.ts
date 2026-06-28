const MONTHS: Record<string, string> = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

export function displayDateToInputValue(date: string) {
  const [day, month, year] = date.trim().replace(",", "").split(/\s+/);
  const monthKey = month ? month.slice(0, 3).toLowerCase() : "";
  const monthValue = MONTHS[monthKey];

  if (!day || !monthValue || !year) return "";

  return `${year}-${monthValue}-${day.padStart(2, "0")}`;
}

export function isDisplayDateInRange(date: string, from: string, to: string) {
  const value = displayDateToInputValue(date);

  if (!value) return true;
  if (from && value < from) return false;
  if (to && value > to) return false;

  return true;
}
