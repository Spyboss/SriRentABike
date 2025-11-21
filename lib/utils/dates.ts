export function diffDays(start: Date, end: Date) {
  const one = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const two = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  const ms = two.getTime() - one.getTime()
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  return Math.max(1, days)
}