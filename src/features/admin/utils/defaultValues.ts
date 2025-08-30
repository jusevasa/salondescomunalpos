export const deriveAvatarFallback = (value: unknown): string => {
    if (value === null || value === undefined) return 'N/A'
    const raw = String(value).trim()
    if (raw.length === 0) return 'N/A'
    const isNumeric = /^[0-9]+$/.test(raw)
    if (isNumeric) return raw
    const letterMatch = raw.match(/\p{L}/u)
    return letterMatch ? letterMatch[0].toUpperCase() : 'N/A'
}