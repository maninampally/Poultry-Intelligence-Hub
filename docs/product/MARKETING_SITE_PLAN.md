# Marketing site plan

## Direction

Poultry Intelligence should feel practical, calm, and field-ready. The site
uses the existing green design language, plain language, and a product preview
instead of decorative charts or artificial “AI” imagery.

## Implemented surfaces

- Landing page with product preview and offline-first positioning
- Features, pricing, about, and contact pages
- Demo request and FAQ pages with mobile navigation
- Privacy and terms pages with early-product disclosure
- Branded public 404 page
- Shared marketing header/footer and navigation
- Page title, description, Open Graph, and theme-color metadata

## Business and conversion improvements

### Homepage

- Lead with a clear customer promise for Indian broiler farm owners and
  managers, not only a general product statement.
- Keep one primary call to action, such as **Start free** or **Request a farm
  walkthrough**, with **See the product** as the secondary action.
- Add a short workflow section: **Record → Understand → Act**.
- Explain the business value in plain language: fewer missed records, earlier
  action, clearer batch costs, and better team coordination.
- Label all dashboard numbers as **Sample preview data** until real customer
  data is available. Never imply unverified farm results.
- End the page with a strong demo or walkthrough call to action.

### Lead generation

- Add a contact/demo form with name, phone or WhatsApp, farm size, shed count,
  current record-keeping method, and main challenge.
- Make the form's success, validation, privacy, and failure states explicit.
- Replace placeholder email addresses before launch.
- Add a clear response expectation, such as when a farm walkthrough request will
  receive a reply.

### Pricing and packaging

- Use **Early access** or **Pilot program** instead of promising permanent
  free pricing while packaging is undecided.
- Define packages for individual farm owners, managers, and multi-farm teams
  only after validating their needs.
- Add pricing FAQs covering offline use, sheds, support, data export, billing,
  and cancellation.
- Do not publish customer savings or productivity claims without evidence.

## Trust and credibility

- Add a trust section covering offline-first operation, India-focused design,
  role-based access, data ownership, and exportability.
- Add a security page when authentication, storage, and deployment details are
  ready to describe accurately.
- Add an FAQ page covering setup, connectivity, roles, data, and support.
- Add customer stories or testimonials only after receiving permission and
  publishing verifiable details.
- Keep a visible disclaimer that the product is not veterinary, financial, or
  legal advice.
- Avoid invented partner logos, certifications, reviews, awards, or customer
  metrics.

## Product presentation

- Add real product screenshots for the Today dashboard, daily round, feed
  runway, batch profitability, and offline sync state.
- Prefer annotated screenshots and short product walkthroughs over decorative
  charts or generic stock imagery.
- Keep the visual system calm and operational: no gradients, glass effects,
  fake-futuristic AI visuals, or decorative data visualizations.
- Ensure every screenshot uses clearly labeled fixture data rather than
  implying that it represents a real customer.

## Navigation and UX

- Replace the mobile header's direct-login menu action with an accessible menu
  containing Features, Pricing, About, Contact, Sign in, and Get started.
- Keep primary actions at least 48 px high and ensure all interactive elements
  have accessible names and visible focus states.
- Add useful hover, focus, loading, validation, success, and error states.
- Keep layouts responsive and allow important labels and form fields to wrap.
- Use the design-token system for colors, spacing, and typography instead of
  adding new page-specific hard-coded values.

## Recommended public routes

- `/features`
- `/pricing`
- `/about`
- `/contact`
- `/demo`
- `/faq`
- `/security`
- `/resources`
- `/privacy`
- `/terms`
- `/404`

Only publish `/security`, `/resources`, and customer-story pages when their
content is based on actual implementation or approved source material.

## SEO and launch readiness

- Add route-specific titles and descriptions rather than relying only on the
  global metadata in `index.html`.
- Add a real Open Graph image with readable text and a 1.91:1 aspect ratio;
  do not use only the logo as the social preview.
- Add canonical URLs, `robots.txt`, `sitemap.xml`, and Organization/Software
  structured data once the production domain is known.
- Check heading hierarchy, keyboard navigation, color contrast, alt text, and
  mobile layout at each public route.
- Add analytics only with an explicit privacy decision and documented consent
  behavior.
- Verify production error handling, form delivery, domain redirects,
  favicon, and 404 behavior before launch.

## Suggested delivery order

1. Replace ambiguous preview metrics with labeled fixture data.
2. Add mobile navigation and a conversion-focused homepage workflow.
3. Add the demo/contact lead form and explicit form states.
4. Add screenshots, trust content, FAQ, and early-access pricing language.
5. Add route-level SEO, social preview assets, sitemap, and structured data.
6. Run accessibility, responsive, build, and production smoke checks.

The current lead form is intentionally marked as preview-only until a real
form endpoint or CRM integration is selected. Do not remove that disclosure
until submissions are securely delivered, retained, and handled under the
published privacy policy.

## Content guardrails

- Avoid invented farm outcomes or customer logos.
- Keep operational claims specific and verifiable.
- Keep the demo disclaimer visible where a user could mistake the workspace for
  production veterinary or financial advice.
- Replace placeholder contact details before public launch.
- Do not expose private farm, farmer, phone, financial, or operational data in
  screenshots, examples, analytics, or testimonials.
