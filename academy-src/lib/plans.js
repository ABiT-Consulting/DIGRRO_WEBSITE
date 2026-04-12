export const plans = {
  sprint: {
    key: 'sprint',
    label: 'AI Marketing Sprint',
    amountUsd: 200,
    priceText: '$200',
    meta: 'Per seat public cohort or $1,750 for a private team workshop',
    wiseUrl: 'https://wise.com/pay/r/T8dFGpv3_Sg2afU'
  },
  bootcamp: {
    key: 'bootcamp',
    label: 'AI Content and Video Bootcamp',
    amountUsd: 650,
    priceText: '$650',
    meta: 'Early-bird per seat, $850 standard price',
    wiseUrl: 'https://wise.com/pay/r/MsWUgYiH8IAsAWs'
  },
  corporate: {
    key: 'corporate',
    label: 'Corporate Academy Program',
    amountUsd: 4800,
    priceText: 'From $4,800',
    meta: 'For teams up to 15 participants, with premium custom option at $7,500',
    wiseUrl: 'https://wise.com/pay/r/B4wiCcWLuoQo_EA'
  }
};

export const planEntries = Object.values(plans);

export function getPlan(planKey) {
  return plans[planKey] || null;
}