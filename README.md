# Machinery Techniques (机械技艺)

Chinese-language (Simplified) static site. Plain HTML, CSS and JS, no build step.

- Pages: index, about, offerings, contact, privacy
- Fonts: system Chinese fonts only, no external hosts
- Contact form: set `FORM_ENDPOINT` at the top of `assets/js/site.js`. Empty means the form shows a "being connected" message and sends nothing.
- Contact details on `contact.html` are placeholders (待填写) until supplied.

Checks:

    node tests/site.test.js
    NODE_PATH="<folder with playwright>/node_modules" node tests/shots.js
