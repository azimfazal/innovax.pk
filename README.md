# Innovax Technology — Corporate Website (innovax.pk)

A production-ready, **static** corporate website for Innovax Technology and the Innovax HMIS product.
No build step, no framework, no backend required — plain HTML + CSS + a little vanilla JS.
It deploys directly to **GitHub Pages** on the existing `azimfazal/innovax.pk` repository.

## Why static?

The existing repository already serves plain HTML from GitHub Pages (with a `CNAME` for `innovax.pk`).
This site reuses that exact stack, so it uploads and publishes with zero build tooling and zero
hosting cost, and stays fast and easy to maintain.

## Contents

```
index.html        Home: hero, dashboard preview, benefits, featured solutions, implementation, FAQ, CTA
solutions.html    All solution modules, clearly labelled Available / In rollout / Planned
features.html     Platform capabilities + an "accurate claims" section
about.html        Company, vision, mission, expertise, engineering approach, commitments
demo.html         Lead-generation form (validated, honest submission, spam honeypot)
contact.html      Contact channels + contact form
privacy.html      Privacy policy (configurable template)
terms.html        Terms of use (configurable template)
404.html          Custom not-found page (GitHub Pages serves this automatically)
robots.txt        Crawler directives + sitemap pointer
sitemap.xml       XML sitemap for https://innovax.pk
assets/css/style.css   Design system (tokens, components, responsive)
assets/js/config.js    THE ONLY FILE YOU EDIT for contact/social/form settings
assets/js/main.js      Nav, scroll reveal, config injection, form validation & submission
```

## Deploy to GitHub Pages

1. On GitHub, open `azimfazal/innovax.pk` (branch `main`).
2. **Keep** the existing `CNAME` file (it binds the `innovax.pk` domain) and any pages you still
   want (e.g. `jobs.html`, `jobs/`).
3. Upload/replace these at the repository root:
   `index.html`, `solutions.html`, `features.html`, `about.html`, `demo.html`, `contact.html`,
   `privacy.html`, `terms.html`, `404.html`, `robots.txt`, `sitemap.xml`.
   (Easiest: drag the whole `innovax-website` folder contents in, or use `Add file → Upload files`.)
4. Upload the `assets/` folder so the tree becomes `assets/css/style.css` and `assets/js/*.js`.
5. Confirm **Settings → Pages** source is the `main` branch (root). Your existing GitHub Pages
   deployment will republish automatically.
6. Visit `https://innovax.pk` (or the `github.io` preview) to verify.

> The old `firstpage.html` can be deleted or left; it is not linked from the new site.

## Configure contact details & forms

Edit **`assets/js/config.js`** only:

- `email`, `phone`, `phoneHref`, `address`, `whatsapp`, `facebook`, `linkedin`.
  Any value left as `""` is automatically hidden from the UI (no dead links).
- `formEndpoint`:
  - **Production (recommended):** set it to a form service URL (Formspree / Web3Forms / your own
    API). The site POSTs JSON and shows the real success or error state.
  - **No backend:** leave it `""`. Valid submissions then open the visitor's email client
    pre-filled via `mailto:` and show an honest "we opened your email client" notice.
    The site never fakes a success message.

Both forms include a hidden honeypot field (`_hp`) to discard bot submissions.

## Content accuracy policy

Per the project brief, the site deliberately:
- labels modules **Available / In rollout / Planned** instead of claiming everything is deployed;
- avoids invented customers, testimonials, awards, registration numbers or years in operation;
- describes security/integrations factually and defers certification claims to scoping;
- uses only fictional sample data in the dashboard preview, clearly labelled.

Update these labels in `solutions.html` as modules move from rollout to live.

## Local preview

Open `index.html` in a browser, or serve the folder:

```
npx serve .
# or
python -m http.server 8000
```

## Maintenance notes

- All pages share the same header/footer markup; update nav links in every file if you add a page.
- Colours, spacing and components live as CSS custom properties at the top of `assets/css/style.css`.
- To add a page: copy an existing page, change the `<title>`/meta/canonical, set the active nav item,
  and add it to `sitemap.xml`.
