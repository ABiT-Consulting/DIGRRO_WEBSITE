# SEO KPIs for Digrro

## Website context

This KPI set is tailored to the current Digrro website in this repo:

- Single-page B2B services site targeting GCC markets.
- Primary offers: AI solutions, digital marketing/SEO, web and app development, branding, video, analytics, SAP/Odoo add-ons, and ZATCA services.
- Current technical SEO basics already exist: title, meta description, canonical, robots, sitemap, and `ProfessionalService` schema.
- Current site structure is limiting SEO scale because the sitemap only contains the homepage.
- Measurement is incomplete because no GA4/GTM/Search Console implementation is visible in the built site.

## Important measurement blockers

Fix these before holding the team accountable to growth KPIs:

1. Install GA4 and Google Tag Manager.
2. Verify and connect Google Search Console for `https://digrro.com/`.
3. Track lead events for:
   - successful contact form submit
   - WhatsApp click
   - phone click
   - email click
4. Fix the production contact form build, which currently points to an `undefined` endpoint in the bundled app.
5. Build dedicated SEO landing pages for core services and target markets. A single homepage will not scale well for non-branded search.

## Core KPI scorecard

Report these monthly. Use the first clean month after tracking setup as the baseline.

| KPI | Why it matters | 90-day target | 6-month target | Source |
| --- | --- | --- | --- | --- |
| Organic qualified leads | Measures SEO business impact, not just traffic | Baseline established and tracked cleanly | 10-20 qualified leads/month | GA4 + CRM/manual lead log |
| Organic conversion rate | Shows whether SEO traffic turns into enquiries | 1.5%+ | 2.0%-3.0% | GA4 |
| Non-branded organic clicks | Best indicator of true SEO growth | +20% vs baseline | +50% vs baseline | Search Console |
| Organic impressions | Early signal that keyword coverage is expanding | +25% vs baseline | +75% vs baseline | Search Console |
| Priority keyword count in Top 10 | Tracks ranking progress on commercial terms | 5 keywords | 15 keywords | Ahrefs/Semrush/Search Console |
| Priority keyword count in Top 3 | Tracks ability to win actual traffic | 2 keywords | 6 keywords | Ahrefs/Semrush/Search Console |
| Average CTR on non-branded queries | Ensures titles/snippets earn clicks | 2.5%+ | 3.5%+ | Search Console |
| Service and market landing pages indexed | Measures whether the site has enough SEO surface area | 4-6 pages indexed | 8-12 pages indexed | Search Console |
| Homepage Core Web Vitals pass rate | Protects rankings and UX on the main entry page | Pass all 3 metrics in testing | Pass at 75th percentile in CrUX/GSC | PageSpeed Insights + Search Console |
| Crawl/index coverage health | Keeps technical issues from suppressing growth | 0 critical errors | 95%+ submitted URLs indexed | Search Console |
| Referring domains from relevant sites | Off-page authority growth for competitive terms | +5 quality domains | +15 quality domains | Ahrefs/Semrush |

## Priority keyword groups to track

Track rankings and clicks separately for branded and non-branded terms.

### Branded

- `digrro`
- `digrro ai`
- `digrro digital marketing`

### Non-branded commercial intent

- `ai solutions company in saudi arabia`
- `ai development company uae`
- `seo agency saudi arabia`
- `digital marketing agency gcc`
- `web development company uae`
- `mobile app development company saudi arabia`
- `odoo add-on development`
- `sap add-on development`
- `zatca e invoicing implementation`
- `enterprise integration services gcc`

## KPI targets by area

### 1. Visibility KPIs

- Non-branded clicks: grow at least 50% within 6 months after baseline.
- Impressions: grow at least 75% within 6 months.
- Top 10 rankings: reach 15 commercial keywords in Top 10 within 6 months.
- Top 3 rankings: reach 6 commercial keywords in Top 3 within 6 months.
- Branded CTR: keep above 8%.
- Non-branded CTR: grow to 3.5%+.

### 2. Traffic quality KPIs

- Organic engaged sessions: +40% in 6 months.
- Organic engagement rate: 60%+.
- Average engagement time from organic: 60+ seconds.
- Organic visitors reaching contact section: 25%+.

### 3. Lead generation KPIs

- Organic leads/month: 10-20 qualified leads by month 6.
- Organic conversion rate: 2.0%-3.0%.
- WhatsApp click-through rate from organic sessions: 4%+.
- Contact form completion rate from organic sessions: 1%+ once fixed.
- Lead-to-qualified-lead rate: 40%+.

### 4. Technical SEO KPIs

- Indexed URLs / submitted URLs: 95%+.
- Critical crawl errors: 0.
- Core Web Vitals:
  - LCP under 2.5s
  - INP under 200ms
  - CLS under 0.1
- Broken internal links: 0.
- Duplicate title/meta issues: 0 on published landing pages.

### 5. Content and site expansion KPIs

- New SEO landing pages published: 2 per month until core coverage is complete.
- Core service coverage: 100% of top 6 services have dedicated pages within 90 days.
- Core market coverage: Saudi Arabia, UAE, and Qatar each get dedicated market pages within 120 days.
- Case studies published: 1 new case study every 6-8 weeks.
- Indexed FAQ/schema-enhanced pages: at least 4 by month 6.

## Recommended page roadmap behind the KPIs

To make the KPI targets realistic, expand beyond the homepage in this order:

1. `/ai-solutions`
2. `/seo-digital-marketing`
3. `/web-development`
4. `/mobile-app-development`
5. `/odoo-add-on-development`
6. `/sap-add-on-development`
7. `/zatca-e-invoicing`
8. `/saudi-arabia`
9. `/uae`
10. `/qatar`
11. `/case-studies/[client-name]`

## Dashboard view to use

Use one monthly SEO dashboard with these sections:

- Search Console: clicks, impressions, CTR, average position
- GA4: organic users, engaged sessions, lead events, conversion rate
- Technical: indexed pages, crawl errors, CWV status
- Rankings: Top 3, Top 10, branded vs non-branded
- Leads: form submits, WhatsApp clicks, phone clicks, email clicks, qualified leads

## What success should look like

For this site, SEO success is not just more traffic. It should look like:

- more non-branded commercial queries entering Top 10 and Top 3
- more service and country landing pages getting indexed
- more GCC-relevant leads from organic search
- stable technical health with no crawl or form-submission failures

