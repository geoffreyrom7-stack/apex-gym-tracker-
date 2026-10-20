export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isValidLogDate(dateString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
  const parsedDate = new Date(`${dateString}T12:00:00`);
  return !Number.isNaN(parsedDate.getTime()) && getLocalDateString(parsedDate) === dateString;
}

export function getLastSevenDates(date = new Date()) {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(date);
    day.setDate(date.getDate() - (6 - index));
    return getLocalDateString(day);
  });
}

export function formatDateLabel(dateString) {
  return new Intl.DateTimeFormat("en", { weekday: "short" }).format(
    new Date(`${dateString}T12:00:00`),
  );
}
