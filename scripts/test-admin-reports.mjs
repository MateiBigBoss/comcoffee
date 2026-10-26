// Profit & statistics math (admin/public/reports.js), without a browser or database.
import assert from 'node:assert/strict';
import test from 'node:test';
import {buildReport, periodRange, previousRange, reportCsv} from '../admin/public/reports.js';

const today = '2026-10-26';
const lei = n => Math.round(n * 100);
let id = 0;
const pay = (kind, amount, date, event_id = null, category = kind === 'income' ? 'Plată eveniment' : 'Consumabile', extra = {}) => ({id: ++id, kind, amount: lei(amount), date, category, description: category, event_id, ...extra});
const data = {
  enquiries: [{id: 1, type: 'nunta'}, {id: 2, type: 'corporate'}],
  events: [
    {id: 1, enquiry_id: 1, title: 'Nuntă', date: '2026-06-20', guests: 100, price: lei(5000), status: 'confirmed', location: 'Cluj'},
    {id: 2, enquiry_id: 2, title: 'Conferință', date: '2026-10-10', guests: 200, price: lei(4000), status: 'confirmed', location: 'Cluj'},
    {id: 3, enquiry_id: null, title: 'Târg', date: '2026-09-05', guests: 500, price: 0, status: 'confirmed', location: 'Sibiu'},
    {id: 4, enquiry_id: null, title: 'Anulat', date: '2026-07-01', guests: 50, price: lei(900), status: 'cancelled', location: 'Cluj'},
    {id: 5, enquiry_id: null, title: 'Viitor', date: '2026-12-12', guests: 80, price: lei(3000), status: 'confirmed', location: 'Cluj'},
  ],
  ledger: [
    pay('income', 2000, '2026-04-02', 1, 'Avans eveniment'), pay('income', 3000, '2026-06-22', 1), pay('expense', 1200.5, '2026-06-18', 1, 'Cafea & ingrediente'), pay('expense', 800, '2026-06-18', 1, 'Personal'),
    pay('income', 1500, '2026-10-01', 2), pay('expense', 1700, '2026-10-08', 2, 'Personal'),
    pay('income', 2500, '2026-09-06', 3), pay('expense', 3100, '2026-09-03', 3, 'Cafea & ingrediente'),
    pay('income', 1000, '2026-10-05', 5, 'Avans eveniment'),
    pay('expense', 450, '2026-03-02', null, 'Marketing'),
    pay('expense', 9999, '2026-05-05', null, 'Echipamente', {deleted: 1}),
  ],
};

test('event mode puts an event\'s money on the event date and keeps cents exact', () => {
  const r = buildReport(data, {from: '2026-06-01', to: '2026-06-30', mode: 'event', today});
  assert.equal(r.totals.income, lei(5000), 'The April deposit belongs to the June wedding.');
  assert.equal(r.totals.expense, lei(2000.5));
  assert.equal(r.totals.profit, lei(2999.5));
  assert.equal(Math.round(r.totals.margin * 1000), 600);
  assert.equal(r.rows.length, 1);
  assert.equal(r.rows[0].status, 'profit');
  assert.equal(r.rows[0].costPerGuest, 2001, '2000,50 lei / 100 guests, rounded to the ban.');
});

test('cash mode counts every payment on its own date', () => {
  const r = buildReport(data, {from: '2026-06-01', to: '2026-06-30', mode: 'cash', today});
  assert.equal(r.totals.income, lei(3000));
  assert.equal(r.totals.expense, lei(2000.5));
  const april = buildReport(data, {from: '2026-04-01', to: '2026-04-30', mode: 'cash', today});
  assert.equal(april.totals.income, lei(2000));
});

test('deleted entries never count and general costs are reported apart', () => {
  const r = buildReport(data, {from: '2026-01-01', to: '2026-12-31', mode: 'event', today});
  assert.equal(r.totals.general, lei(450));
  assert.equal(r.totals.expense, lei(450 + 2000.5 + 1700 + 3100));
  assert.equal(r.totals.income, lei(5000 + 1500 + 2500 + 1000));
  assert.ok(!r.categories.some(c => c.name === 'Echipamente'));
  assert.deepEqual(r.categories.map(c => c.name), ['Cafea & ingrediente', 'Personal', 'Marketing']);
  assert.equal(Math.round(r.categories.reduce((n, c) => n + c.share, 0) * 1000), 1000);
});

test('statuses: owed is not a loss, cancelled and future events are kept apart', () => {
  const r = buildReport(data, {from: '2026-01-01', to: '2026-12-31', mode: 'event', today});
  const status = Object.fromEntries(r.rows.map(x => [x.event.title, x.status]));
  assert.deepEqual(status, {Nuntă: 'profit', Conferință: 'owed', Târg: 'loss', Anulat: 'cancelled', Viitor: 'upcoming'});
  const conf = r.rows.find(x => x.event.title === 'Conferință');
  assert.equal(conf.receivable, lei(2500));
  assert.equal(conf.expected, lei(4000 - 1700));
  assert.equal(r.totals.receivable, lei(2500 + 2000), 'Owed money from the conference and the future event.');
  assert.equal(r.totals.events, 4, 'Cancelled events are not counted.');
  assert.equal(r.totals.avgProfit, Math.round((lei(2999.5) + lei(-600)) / 2), 'Average uses finished events only.');
  assert.deepEqual(r.types.map(t => t.type), ['nunta', 'corporate', 'manual']);
});

test('insights name the best event, losses, money to recover and missing costs', () => {
  const extra = {...data, events: [...data.events, {id: 6, title: 'Fără costuri', date: '2026-08-08', guests: 30, price: lei(700), status: 'confirmed'}], ledger: [...data.ledger, pay('income', 700, '2026-08-08', 6)]};
  const r = buildReport(extra, {from: '2026-01-01', to: '2026-12-31', mode: 'event', today});
  const titles = r.insights.map(i => i.title);
  assert.ok(titles.includes('Cel mai profitabil'));
  assert.ok(titles.includes('Un eveniment pe pierdere'));
  assert.ok(titles.includes('Bani de recuperat'));
  assert.ok(titles.includes('Urmează să încasezi'));
  assert.ok(titles.includes('Costuri lipsă?'));
  assert.equal(r.insights.find(i => i.title === 'Cel mai profitabil').event.title, 'Nuntă');
});

test('monthly buckets show at least six months, cumulative profit only inside the period', () => {
  const r = buildReport(data, {from: '2026-10-01', to: '2026-10-31', mode: 'event', today});
  assert.equal(r.months.length, 6);
  assert.equal(r.months[0].key, '2026-05');
  assert.equal(r.months.at(-1).key, '2026-10');
  assert.equal(r.months.filter(m => m.inPeriod).length, 1);
  assert.equal(r.months[0].cumulative, null);
  assert.equal(r.months.at(-1).cumulative, r.totals.profit);
  const all = buildReport(data, {from: '2020-01-01', to: '2026-12-31', mode: 'event', today});
  assert.equal(all.months.length, 24, 'Long ranges keep the latest 24 months.');
});

test('period presets and the previous period', () => {
  assert.deepEqual(periodRange('month', today), {from: '2026-10-01', to: '2026-10-31', label: 'luna aceasta'});
  assert.deepEqual(periodRange('quarter', today).from, '2026-10-01');
  assert.equal(periodRange('quarter', today).to, '2026-12-31');
  assert.equal(periodRange('12m', today).from, '2025-11-01');
  assert.equal(periodRange('year', '2028-02-10').to, '2028-12-31');
  assert.equal(periodRange('custom', today, {from: '2026-05-01', to: '2026-04-01'}).label, 'de la început', 'An inverted interval falls back.');
  const all = periodRange('all', today, {}, data);
  assert.equal(all.from, '2026-03-02');
  assert.equal(all.to, '2026-12-12');
  assert.deepEqual(previousRange({from: '2026-10-01', to: '2026-10-31'}), {from: '2026-08-31', to: '2026-09-30'});
});

test('CSV export is ready for Romanian Excel', () => {
  const r = buildReport(data, {from: '2026-06-01', to: '2026-06-30', mode: 'event', today});
  const csv = reportCsv(r, s => s.toUpperCase());
  assert.ok(csv.startsWith('﻿'));
  const lines = csv.slice(1).split('\r\n');
  assert.equal(lines[0].split(';')[0], 'Eveniment');
  assert.equal(lines[1], 'Nuntă;2026-06-20;Nuntă;100;5000,00;2000,50;2999,50;60%;0,00;PROFIT');
  const tricky = reportCsv({...r, rows: [{...r.rows[0], event: {...r.rows[0].event, title: 'A; "B"'}}]});
  assert.match(tricky, /"A; ""B"""/);
});
