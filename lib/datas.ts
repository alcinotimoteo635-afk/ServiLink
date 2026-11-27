// Datas e valores sempre no fuso de Maputo (UTC+2, sem horario de verao).

export function inicioDoDiaMZ(): string {
  const mz = new Date(Date.now() + 2 * 3600 * 1000);
  const utc = Date.UTC(mz.getUTCFullYear(), mz.getUTCMonth(), mz.getUTCDate());
  return new Date(utc - 2 * 3600 * 1000).toISOString();
}

export function fmtData(d: string | null | undefined): string {
  if (!d) return "-";
  return new Date(d).toLocaleString("pt-MZ", {
    timeZone: "Africa/Maputo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function mt(n: number | string | null | undefined): string {
  return `${Number(n ?? 0).toLocaleString("pt-MZ")} MT`;
}
