const formatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function formatDateTime(value: string): string {
  return formatter.format(new Date(value))
}
