export const plans = {
  sprint: {
    key: 'sprint',
    label: 'Digrro Academy Package',
    amountUsd: 200,
    priceText: '$200',
    meta: 'One package. 30 seats total.',
    checkoutDescription: 'Digrro Academy live AI training package with a 30-seat limit.',
    seatLimit: 30
  }
};

export const planEntries = Object.values(plans);

export function getPlan(planKey) {
  return plans[planKey] || null;
}
