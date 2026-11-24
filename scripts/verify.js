'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'plugins');

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

const dock = arg('--dock') || process.env.DOCK_APP;
if (!dock) { console.error('Uso: node scripts/verify.js --dock ../vibe-deck/app [--only <plugin>]'); process.exit(2); }
process.env.DOCK_PLUGINS_DIR = path.join(ROOT, '.no-plugins');
process.env.DOCK_OFFICIAL_PLUGINS_DIR = path.join(ROOT, '.no-plugins');
process.env.LOG_LEVEL = 'error';
const shapes = require(path.join(path.resolve(dock), 'server', 'shapes'));

const EMPTY = /^(\s|·|-|–|\/|°|%|\$|€)*$/;

class Checker {
  constructor() { this.out = []; }
  empty(s) { return s === undefined || s === null || EMPTY.test(String(s)); }
  problems(v) {
    if (v.error) return ['dati non disponibili: ' + v.error];
    const p = [];
    if (v.shape === 'value' && this.empty(v.value)) p.push('valore vuoto');
    if (v.shape === 'text' && this.empty(v.text)) p.push('testo vuoto');
    if (v.shape === 'status' && this.empty(v.text)) p.push('stato senza testo');
    if (v.shape === 'bars') v.rows.forEach(function (r, i) { if (EMPTY.test(r.value)) p.push('riga ' + (i + 1) + ' vuota'); });
    if (v.shape === 'list') {
      if (!v.items.length) p.push('lista vuota');
      else if (this.empty(v.items[0].title)) p.push('righe senza titolo');
    }
    const text = JSON.stringify(v);
    if (/\{\{|undefined|NaN|\[object Object\]/.test(text)) p.push('segnaposto non risolto');
    return p;
  }
  sample(v) {
    if (v.error) return '';
    if (v.shape === 'value') return v.value + (v.unit ? ' ' + v.unit : '') + (v.sub ? ' · ' + v.sub : '');
    if (v.shape === 'text') return v.text + (v.sub ? ' · ' + v.sub : '');
    if (v.shape === 'status') return (v.on ? 'OK ' : 'PROBLEMI ') + v.text;
    if (v.shape === 'bars') return v.rows.map(function (r) { return r.label + ' ' + r.value; }).join(' | ');
    if (v.shape === 'list') return v.items.length + ' righe: ' + v.items[0].title + (v.items[0].right ? ' · ' + v.items[0].right : '') + (v.items[0].sub ? ' · ' + v.items[0].sub : '');
    if (v.shape === 'buttons') return v.buttons.length + ' pulsanti';
    if (v.shape === 'slider') return v.value + ' ' + v.unit;
    return v.shape;
  }
}

async function main() {
  const only = arg('--only');
  const checker = new Checker();
  let bad = 0, total = 0, skipped = 0;
  const ids = fs.readdirSync(SRC).filter(function (n) { return (!only || n === only) && fs.existsSync(path.join(SRC, n, 'plugin.json')); }).sort();
  for (const id of ids) {
    const dir = path.join(SRC, id, 'widgets');
    const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(function (f) { return /\.json$/.test(f); }).sort() : [];
    console.log('\n' + id);
    for (const f of files) {
      const name = f.replace(/\.json$/, '');
      const def = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      total++;
      if (def.source && def.source.type === 'pc') { skipped++; console.log('  --  ' + name + ' (dati del PC: si prova sulla dock)'); continue; }
      const r = await shapes.preview(id, def, name, { allowHost: true });
      const p = r.problems.length ? r.problems : checker.problems(r.view);
      if (p.length) bad++;
      console.log('  ' + (p.length ? 'NO  ' : 'ok  ') + name.padEnd(26) + (p.length ? p.join('; ') : checker.sample(r.view)).slice(0, 150));
    }
  }
  console.log('\n' + total + ' widget, ' + (total - bad - skipped) + ' con dati veri, ' + skipped + ' con i dati del PC, ' + bad + ' con problemi');
  process.exit(bad ? 1 : 0);
}

main();
