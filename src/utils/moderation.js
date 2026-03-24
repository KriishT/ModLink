// Simple keyword moderation for MVP
// Detects attempts to move conversations off-platform

const FLAGGED_PATTERNS = [
  /whatsapp/i,
  /watsapp/i,
  /wa\.me/i,
  /\bphone\b/i,
  /\bnumber\b/i,
  /\bcall me\b/i,
  /meet outside/i,
  /outside the app/i,
  /off.?platform/i,
  /\bfree\b.*shoot/i,
  /\bexposure\b/i,
  /test shoot/i,
  /private.*shoot/i,
  /\btelegram\b/i,
  /\binstagram\b.*dm/i,
  /\bemail me\b/i,
  /\bmy number\b/i,
  /\bgive me your\b/i,
  /\bpay you cash\b/i,
  /\bcash payment\b/i,
  /\bno contract\b/i,
]

const FLAG_REASONS = {
  contact_sharing: 'Attempting to share contact information off-platform',
  off_platform: 'Attempting to move conversation off-platform',
  unpaid_work: 'Offering unpaid/low-value work',
  suspicious: 'Suspicious content detected',
}

export const moderateMessage = (text) => {
  if (!text || typeof text !== 'string') return { flagged: false, reasons: [] }

  const lowerText = text.toLowerCase()
  const reasons = []

  FLAGGED_PATTERNS.forEach((pattern) => {
    if (pattern.test(lowerText)) {
      if (/whatsapp|telegram|phone|number|call/i.test(pattern.source)) {
        if (!reasons.includes(FLAG_REASONS.contact_sharing)) {
          reasons.push(FLAG_REASONS.contact_sharing)
        }
      } else if (/outside|platform|instagram.*dm|email/i.test(pattern.source)) {
        if (!reasons.includes(FLAG_REASONS.off_platform)) {
          reasons.push(FLAG_REASONS.off_platform)
        }
      } else if (/free|exposure|test shoot|cash/i.test(pattern.source)) {
        if (!reasons.includes(FLAG_REASONS.unpaid_work)) {
          reasons.push(FLAG_REASONS.unpaid_work)
        }
      } else {
        if (!reasons.includes(FLAG_REASONS.suspicious)) {
          reasons.push(FLAG_REASONS.suspicious)
        }
      }
    }
  })

  return {
    flagged: reasons.length > 0,
    reasons,
    primaryReason: reasons[0] || null,
  }
}

export const getFlagWarningMessage = (flagResult) => {
  if (!flagResult.flagged) return null

  const messages = {
    [FLAG_REASONS.contact_sharing]: '⚠️ Sharing contact info outside ModLink violates our terms and removes your payment and contract protections.',
    [FLAG_REASONS.off_platform]: '⚠️ Moving off-platform removes all safety protections. All bookings must go through ModLink.',
    [FLAG_REASONS.unpaid_work]: '⚠️ This message may contain an offer for unpaid work. "Exposure" is not payment.',
    [FLAG_REASONS.suspicious]: '⚠️ This message was flagged by our safety system. Please keep all communications professional.',
  }

  return messages[flagResult.primaryReason] || '⚠️ This message was flagged. Please review our community guidelines.'
}
