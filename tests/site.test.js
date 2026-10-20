// Dependency-free site checks. Run: node tests/site.test.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const PAGES = ['index', 'about', 'offerings', 'contact', 'privacy'];
const DASH = new RegExp('[\\u2013\\u2014]');
const ALLOWED_LATIN = ['PLC'];
let checks = 0;
const failures = [];
function ok(cond, msg) { checks++; if (!cond) failures.push(msg); }

for (const p of PAGES) {
  const file = path.join(root, p + '.html');
  ok(fs.existsSync(file), p + '.html exists');
  if (!fs.existsSync(file)) continue;
  const src = fs.readFileSync(file, 'utf8');
  const idsOf = (s) => new Set([...s.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));

  ok(/^<!doctype html>/i.test(src.trim()), p + ': doctype');
  ok(/<html lang="zh-Hans">/.test(src), p + ': lang zh-Hans');
  ok(/<meta charset="utf-8">/i.test(src), p + ': charset');
  ok(/<meta name="viewport"/i.test(src), p + ': viewport');
  ok((src.match(/<title>/g) || []).length === 1, p + ': one title');
  ok((src.match(/<meta name="description"/g) || []).length === 1, p + ': one meta description');
  ok(!DASH.test(src), p + ': no dash characters');
  ok(!/ecostrata/i.test(src), p + ': no Ecostrata anywhere');
  ok(!/john smith|emily johnson|veolia|extrupet|indorama|limerick|abbeyfeale/i.test(src), p + ': no carried-over names or address');
  ok(!/googleapis|gstatic|formspree|cdn\./i.test(src), p + ': no external hosts');
  ok(!/to be supplied|to follow|illustrative|lorem/i.test(src), p + ': no placeholder wording');
  ok(src.includes('&copy; 2017 机械技艺'), p + ': footer copyright 2017');
  ok(/href="privacy\.html"/.test(src), p + ': footer privacy link');
  ok(!/\{\{/.test(src), p + ': no raw tokens');

  // No English in visible text (tags, scripts and attribute values removed)
  let text = src.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ');
  text = text.replace(/&copy;/g, '');
  for (const a of ALLOWED_LATIN) text = text.split(a).join('');
  ok(!/[A-Za-z]/.test(text), p + ': no Latin letters in visible text: ' + (text.match(/[A-Za-z]+/g) || []).slice(0, 5).join(','));
  const title = (src.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  ok(!/[A-Za-z]/.test(title), p + ': title has no Latin letters');

  for (const m of src.matchAll(/\b(?:href|src)="([^"]*)"/g)) {
    const v = m[1];
    if (/^(https?:|mailto:|tel:)/.test(v)) continue;
    if (v.startsWith('#')) { ok(v === '#' || idsOf(src).has(v.slice(1)), p + ': anchor ' + v + ' exists'); continue; }
    const [target, hash] = v.split('#');
    const tp = path.join(root, target);
    ok(fs.existsSync(tp), p + ': link resolves: ' + v);
    if (fs.existsSync(tp) && hash && target.endsWith('.html')) {
      ok(idsOf(fs.readFileSync(tp, 'utf8')).has(hash), p + ': anchor ' + v + ' exists in target');
    }
  }
}

const nav = { index: 'index.html', about: 'about.html', offerings: 'offerings.html', contact: 'contact.html' };
for (const p of Object.keys(nav)) {
  const s = fs.readFileSync(path.join(root, p + '.html'), 'utf8');
  ok(new RegExp('<a href="' + nav[p] + '" aria-current="page">').test(s), p + ': aria-current on own item');
  ok((s.match(/aria-current="page"/g) || []).length === 1, p + ': exactly one aria-current');
}

const js = fs.readFileSync(path.join(root, 'assets/js/site.js'), 'utf8');
ok(/^const FORM_ENDPOINT = '';/m.test(js), 'site.js: FORM_ENDPOINT defined (empty)');
ok(!DASH.test(js), 'site.js: no dash characters');
const css = fs.readFileSync(path.join(root, 'assets/css/site.css'), 'utf8');
ok(!/@import|url\(http/.test(css), 'site.css: no external imports');
ok(/PingFang SC/.test(css) && /Microsoft YaHei/.test(css), 'site.css: Chinese system font stack');
ok(fs.existsSync(path.join(root, 'favicon.svg')), 'favicon.svg exists');

if (failures.length) {
  console.error('FAIL ' + failures.length + ' of ' + checks + ' checks');
  failures.slice(0, 40).forEach(f => console.error(' - ' + f));
  process.exit(1);
}
console.log('OK ' + checks + ' checks green');
