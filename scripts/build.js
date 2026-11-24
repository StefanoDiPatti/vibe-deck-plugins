'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'plugins');
const OUT = path.join(ROOT, 'packages');
const INDEX = path.join(ROOT, 'index.json');
const NAME_RE = /^[a-z0-9][a-z0-9_-]*$/;
const VERSION_RE = /^\d+\.\d+\.\d+$/;
const ALLOWED = /^(plugin\.json|home\.json|(widgets|pages|lang)\/[a-z0-9][a-z0-9_.-]*\.json)$/;
const IGNORED = /^(README\.md|screenshot[a-z0-9_-]*\.png)$/i;
const MAX_PACKAGE = 1024 * 1024;

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

class Problems {
  constructor() { this.list = []; }
  add(where, msg) { this.list.push(where + ': ' + msg); }
  get count() { return this.list.length; }
}

class DockValidator {
  constructor(dir) {
    this.validate = null;
    if (!dir) return;
    const app = path.resolve(dir);
    process.env.DOCK_PLUGINS_DIR = process.env.DOCK_PLUGINS_DIR || path.join(ROOT, '.no-plugins');
    process.env.DOCK_OFFICIAL_PLUGINS_DIR = process.env.DOCK_OFFICIAL_PLUGINS_DIR || path.join(ROOT, '.no-plugins');
    process.env.LOG_LEVEL = 'error';
    this.validate = require(path.join(app, 'server', 'shapes')).validate;
  }
  check(def, id, ctx) { return this.validate ? this.validate(def, id, ctx) : []; }
}

function readFiles(dir, problems, where) {
  const files = {};
  (function walk(rel) {
    fs.readdirSync(path.join(dir, rel), { withFileTypes: true }).sort(function (a, b) { return a.name < b.name ? -1 : 1; }).forEach(function (d) {
      const r = rel ? rel + '/' + d.name : d.name;
      if (d.isDirectory()) return walk(r);
      if (IGNORED.test(r)) return;
      if (!ALLOWED.test(r)) { problems.add(where, 'file non ammesso nel market: ' + r + ' (solo plugin.json, home.json, widgets/, pages/, lang/)'); return; }
      try { files[r] = JSON.parse(fs.readFileSync(path.join(dir, r), 'utf8')); } catch (e) { problems.add(where + '/' + r, 'JSON non valido: ' + e.message); }
    });
  })('');
  return files;
}

function checkManifest(m, id, problems) {
  const where = id + '/plugin.json';
  if (!m) { problems.add(id, 'manca plugin.json'); return; }
  if (m.id !== id) problems.add(where, '"id" deve essere "' + id + '", come la cartella');
  ['name', 'description', 'author'].forEach(function (k) { if (typeof m[k] !== 'string' || !m[k].trim()) problems.add(where, '"' + k + '" mancante'); });
  if (!VERSION_RE.test(m.version || '')) problems.add(where, '"version" deve essere nel formato 1.0.0');
  if (!/^>=\s*\d+\.\d+\.\d+$/.test(m.engine || '')) problems.add(where, '"engine" deve essere nel formato ">=2.2.0"');
  if (m.type === 'pack') problems.add(where, 'i pacchetti di plugin non vanno nel market');
  const http = m.permissions && m.permissions.http;
  if (http !== undefined && (!Array.isArray(http) || http.some(function (h) { return typeof h !== 'string' || !/^[a-z0-9.-]+(:\d+)?$/.test(h); }))) {
    problems.add(where, '"permissions.http" deve elencare siti come "api.esempio.com"');
  }
}

function firstIcon(files) {
  const w = Object.keys(files).filter(function (n) { return /^widgets\//.test(n); }).map(function (n) { return files[n]; })[0];
  return (w && w.icon) || 'apps';
}

function build(dockDir) {
  const problems = new Problems();
  const validator = new DockValidator(dockDir);
  const ids = fs.readdirSync(SRC, { withFileTypes: true }).filter(function (d) { return d.isDirectory(); }).map(function (d) { return d.name; }).sort();
  const packages = {};
  const entries = [];
  ids.forEach(function (id) {
    if (!NAME_RE.test(id)) { problems.add(id, 'nome della cartella non valido: minuscole, numeri, - e _'); return; }
    const files = readFiles(path.join(SRC, id), problems, id);
    const m = files['plugin.json'];
    checkManifest(m, id, problems);
    if (!m) return;
    const ctx = { plugin: id, permissions: m.permissions || {} };
    const widgets = Object.keys(files).filter(function (n) { return /^widgets\//.test(n); });
    const pages = Object.keys(files).filter(function (n) { return /^pages\//.test(n); });
    if (!widgets.length && !pages.length) problems.add(id, 'serve almeno un widget o una pagina');
    widgets.forEach(function (n) {
      validator.check(files[n], n.replace(/^widgets\//, '').replace(/\.json$/, ''), ctx).forEach(function (p) { problems.add(id + '/' + n, p); });
    });
    const text = JSON.stringify({ format: 1, files: files });
    if (text.length > MAX_PACKAGE) problems.add(id, 'pacchetto troppo grande (max 1 MB)');
    const file = id + '-' + m.version + '.vdp.json';
    packages[file] = text;
    entries.push({
      id: id, name: m.name, description: m.description, author: m.author, version: m.version, engine: m.engine,
      platforms: Array.isArray(m.platforms) ? m.platforms : ['windows', 'linux'], tags: Array.isArray(m.tags) ? m.tags : [],
      permissions: m.permissions || {}, icon: m.icon || firstIcon(files), widgets: widgets.length, pages: pages.length,
      url: 'packages/' + file, sha256: crypto.createHash('sha256').update(text).digest('hex'), size: text.length
    });
  });
  const index = JSON.stringify({ format: 1, plugins: entries }, null, 2) + '\n';
  return { problems: problems, packages: packages, index: index, entries: entries };
}

function main() {
  const check = process.argv.indexOf('--check') >= 0;
  const r = build(arg('--dock') || process.env.DOCK_APP);
  if (r.problems.count) {
    console.error('Problemi:\n  ' + r.problems.list.join('\n  '));
    process.exit(1);
  }
  if (check) {
    const stale = [];
    if (!fs.existsSync(INDEX) || fs.readFileSync(INDEX, 'utf8') !== r.index) stale.push('index.json');
    Object.keys(r.packages).forEach(function (f) {
      const p = path.join(OUT, f);
      if (!fs.existsSync(p) || fs.readFileSync(p, 'utf8') !== r.packages[f]) stale.push('packages/' + f);
    });
    (fs.existsSync(OUT) ? fs.readdirSync(OUT) : []).forEach(function (f) { if (!r.packages[f]) stale.push('packages/' + f + ' (da togliere)'); });
    if (stale.length) {
      console.error('Da rigenerare con "node scripts/build.js":\n  ' + stale.join('\n  '));
      process.exit(1);
    }
    console.log('Market a posto: ' + r.entries.length + ' plugin');
    return;
  }
  fs.mkdirSync(OUT, { recursive: true });
  fs.readdirSync(OUT).forEach(function (f) { if (!r.packages[f]) fs.unlinkSync(path.join(OUT, f)); });
  Object.keys(r.packages).forEach(function (f) { fs.writeFileSync(path.join(OUT, f), r.packages[f]); });
  fs.writeFileSync(INDEX, r.index);
  r.entries.forEach(function (e) { console.log('ok  ' + e.id + ' ' + e.version + '  (' + e.widgets + ' widget, ' + e.size + ' byte)'); });
}

main();
