export const CONTRACT_TEMPLATES = {
  ecommerce: 'E-Commerce Product Photography Agreement',
  social_media: 'Social Media Content Agreement',
  lookbook: 'Lookbook / Catalogue Agreement',
  campaign: 'Brand Campaign Agreement',
  tfp: 'Trade for Portfolio (TFP) Agreement',
  default: 'Modeling Services Agreement',
}

export const USAGE_RIGHTS = {
  ecommerce: 'E-commerce product listings and brand website only. 12-month license.',
  social_media: 'Social media platforms (Instagram, Facebook, TikTok) only. 12-month license.',
  lookbook: 'Print and digital catalogues only. 24-month license.',
  campaign: 'All media including OOH, print, and digital. 24-month license.',
  default: 'Digital media only. 12-month license.',
}

export const generateContractHTML = (contractData) => {
  const {
    modelName,
    brandName,
    shootDate,
    shootTime,
    duration,
    shootType,
    locationCity,
    locationAddress,
    paymentAmount,
    platformFee,
    deliverablesCount,
    deliverablesVideos,
    specialRequirements,
    contractDate,
    bookingId,
  } = contractData

  const title = CONTRACT_TEMPLATES[shootType] || CONTRACT_TEMPLATES.default
  const usage = USAGE_RIGHTS[shootType] || USAGE_RIGHTS.default
  const totalPayout = paymentAmount - (platformFee || Math.round(paymentAmount * 0.1))
  const durationLabel = duration === 'half_day' ? 'Half-day (4 hours)' : 'Full-day (8 hours)'
  const formattedDate = shootDate
    ? new Date(shootDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '[Date TBD]'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1A1A1A; padding: 40px; max-width: 800px; margin: 0 auto; font-size: 14px; line-height: 1.6; }
    h1 { font-size: 22px; font-weight: 700; color: #9B7FE8; text-align: center; margin-bottom: 4px; }
    .subtitle { text-align: center; color: #6B6B6B; font-size: 13px; margin-bottom: 32px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #9B7FE8; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #E8DEFF; }
    .field-row { display: flex; margin-bottom: 8px; }
    .field-label { font-weight: 600; width: 200px; flex-shrink: 0; color: #1A1A1A; }
    .field-value { color: #1A1A1A; }
    .highlight { background: #F3EEFF; padding: 2px 6px; border-radius: 4px; font-weight: 600; color: #9B7FE8; }
    .clause { margin-bottom: 12px; }
    .clause strong { color: #1A1A1A; }
    .signature-block { display: flex; gap: 48px; margin-top: 32px; }
    .signature-party { flex: 1; border-top: 1px solid #1A1A1A; padding-top: 8px; }
    .sig-label { font-size: 12px; color: #6B6B6B; }
    .sig-name { font-weight: 600; margin-bottom: 2px; }
    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #9E9E9E; }
    .logo { text-align: center; font-size: 20px; font-weight: 900; letter-spacing: 2px; color: #9B7FE8; margin-bottom: 8px; }
    .booking-ref { text-align: center; font-size: 11px; color: #9E9E9E; margin-bottom: 32px; }
  </style>
</head>
<body>
  <div class="logo">MODLINK</div>
  <h1>${title}</h1>
  <div class="subtitle">This agreement is entered into as of ${contractDate || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
  <div class="booking-ref">Booking Reference: ${bookingId || 'N/A'}</div>

  <div class="section">
    <div class="section-title">Parties</div>
    <div class="field-row"><span class="field-label">Model (Service Provider):</span><span class="field-value">${modelName || '________________'}</span></div>
    <div class="field-row"><span class="field-label">Brand (Client):</span><span class="field-value">${brandName || '________________'}</span></div>
  </div>

  <div class="section">
    <div class="section-title">Shoot Details</div>
    <div class="field-row"><span class="field-label">Date:</span><span class="field-value">${formattedDate}</span></div>
    <div class="field-row"><span class="field-label">Time:</span><span class="field-value">${shootTime || '________________'}</span></div>
    <div class="field-row"><span class="field-label">Duration:</span><span class="field-value">${durationLabel}</span></div>
    <div class="field-row"><span class="field-label">Location:</span><span class="field-value">${locationAddress || locationCity || '________________'}</span></div>
    <div class="field-row"><span class="field-label">Shoot Type:</span><span class="field-value">${(shootType || 'general').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span></div>
  </div>

  <div class="section">
    <div class="section-title">Payment</div>
    <div class="field-row"><span class="field-label">Total Fee:</span><span class="field-value"><span class="highlight">₹${(paymentAmount || 0).toLocaleString('en-IN')}</span></span></div>
    <div class="field-row"><span class="field-label">Platform Fee (10%):</span><span class="field-value">₹${(platformFee || Math.round((paymentAmount || 0) * 0.1)).toLocaleString('en-IN')}</span></div>
    <div class="field-row"><span class="field-label">Model Receives:</span><span class="field-value"><span class="highlight">₹${totalPayout.toLocaleString('en-IN')}</span></span></div>
    <div class="field-row"><span class="field-label">Payment Method:</span><span class="field-value">Escrow via ModLink (released within 24 hours of content approval)</span></div>
  </div>

  <div class="section">
    <div class="section-title">Deliverables</div>
    <div class="field-row"><span class="field-label">Photos:</span><span class="field-value">${deliverablesCount || '20'} edited photos</span></div>
    <div class="field-row"><span class="field-label">Videos:</span><span class="field-value">${deliverablesVideos || '0'} video clips</span></div>
    ${specialRequirements ? `<div class="field-row"><span class="field-label">Special Requirements:</span><span class="field-value">${specialRequirements}</span></div>` : ''}
    <div class="field-row"><span class="field-label">Delivery Timeline:</span><span class="field-value">Within 72 hours of shoot completion</span></div>
  </div>

  <div class="section">
    <div class="section-title">Usage Rights & Licensing</div>
    <div class="clause"><strong>Granted Usage:</strong> ${usage}</div>
    <div class="clause"><strong>Exclusivity:</strong> Non-exclusive license. Model retains the right to work with other brands unless agreed otherwise in writing.</div>
    <div class="clause"><strong>Credit:</strong> Brand is not required to credit the model unless agreed separately.</div>
    <div class="clause"><strong>Portfolio Use:</strong> Model may use behind-the-scenes content for their personal portfolio, but may not publish final edited images without brand permission.</div>
  </div>

  <div class="section">
    <div class="section-title">Terms & Conditions</div>
    <div class="clause"><strong>1. Cancellation Policy:</strong> Either party may cancel with a minimum of 48 hours notice. If the brand cancels within 24 hours of the scheduled shoot, the model is entitled to 50% of the agreed fee. If the model cancels within 24 hours, no payment is due.</div>
    <div class="clause"><strong>2. Rescheduling:</strong> Either party may request one reschedule with 72 hours notice at no penalty.</div>
    <div class="clause"><strong>3. Model Obligations:</strong> The model agrees to arrive on time, be camera-ready (hair and makeup unless otherwise arranged), bring all agreed outfits/props, and conduct themselves professionally throughout the shoot.</div>
    <div class="clause"><strong>4. Brand Obligations:</strong> The brand agrees to provide a safe, professional shoot environment, disclose any products or activities the model will be working with in advance, and pay within 24 hours of content approval.</div>
    <div class="clause"><strong>5. Content Approval:</strong> The brand has 72 hours to review and approve delivered content. If no response is received within 72 hours, the content is deemed accepted and payment is automatically released.</div>
    <div class="clause"><strong>6. Revisions:</strong> One round of minor revisions is included. Additional revision rounds may be negotiated separately.</div>
    <div class="clause"><strong>7. Dispute Resolution:</strong> Any disputes shall first be attempted to be resolved via ModLink's dispute resolution process. Unresolved disputes shall be subject to the jurisdiction of courts in Maharashtra, India.</div>
    <div class="clause"><strong>8. Governing Law:</strong> This agreement shall be governed by the laws of India.</div>
  </div>

  <div class="section">
    <div class="section-title">Signatures</div>
    <p>By signing (digitally) below, both parties agree to all terms and conditions stated in this agreement.</p>
    <div class="signature-block">
      <div class="signature-party">
        <div class="sig-name">${modelName || 'Model Name'}</div>
        <div class="sig-label">Model / Service Provider</div>
        <div class="sig-label">Date: _________________</div>
      </div>
      <div class="signature-party">
        <div class="sig-name">${brandName || 'Brand Name'}</div>
        <div class="sig-label">Brand / Client</div>
        <div class="sig-label">Date: _________________</div>
      </div>
    </div>
  </div>

  <div class="footer">
    Generated by ModLink · India's Fashion Marketplace<br/>
    This is a legally binding agreement. Both parties should retain a copy.
  </div>
</body>
</html>
  `.trim()
}

export const generateContractPDF = async (contractData) => {
  const { printToFileAsync } = await import('expo-print')
  const html = generateContractHTML(contractData)
  const { uri } = await printToFileAsync({ html, base64: false })
  return uri
}

export const shareContractPDF = async (pdfUri) => {
  const Sharing = await import('expo-sharing')
  const isAvailable = await Sharing.isAvailableAsync()
  if (isAvailable) {
    await Sharing.shareAsync(pdfUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share Contract',
    })
  }
}
