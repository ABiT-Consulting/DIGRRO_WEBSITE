export const plans = {
  sprint: {
    key: 'sprint',
    label: 'AI Content Creation & Media Production Training',
    amountUsd: 200,
    priceText: '$200',
    meta: '12-hour bootcamp. 30 seats total.',
    checkoutDescription: 'From Prompt to Production: a 12-hour AI content creation and media production bootcamp with hands-on image, video, voice, and campaign deliverables.',
    seatLimit: 30
  }
};

export const planEntries = Object.values(plans);

export function getPlan(planKey) {
  return plans[planKey] || null;
}
