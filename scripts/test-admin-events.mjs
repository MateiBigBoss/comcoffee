// Event page math and supply presets (admin/public/events.js), without a browser or database.
import assert from 'node:assert/strict';
import test from 'node:test';
import {PRESETS, eventMoney, lastUsed, lineTotal, usedBefore} from '../admin/public/events.js';

const today = '2026-10-26';
const lei = n => Math.round(n * 100);
const event = {id: 7, title: 'Nuntă', date: '2026-10-03', price: lei(8400), status: 'confirmed'};
const state = {
  ledger: [
    {id: 1, kind: 'income', amount: lei(3000), event_id: 7}, {id: 2, kind: 'income', amount: lei(3400), event_id: 7},
    {id: 3, kind: 'expense', amount: lei(1800), event_id: 7}, {id: 4, kind: 'expense', amount: lei(126), event_id: 7},
    {id: 5, kind: 'income', amount: lei(999), event_id: 7, deleted: 1}, {id: 6, kind: 'income', amount: lei(500), event_id: 8},
  ],
  supplies: [
    {id: 1, event_id: 7, name: 'Pahare 8oz', unit: 'buc', quantity: 300000, unit_price_4: 4200, total: lei(126), ledger_id: 4},
    {id: 2, event_id: 7, name: 'Lapte', unit: 'litri', quantity: 40000, unit_price_4: 65000, total: lei(260), ledger_id: null},
    {id: 3, event_id: 7, name: 'Cacao', unit: 'kg', quantity: 1500, unit_price_4: 480000, total: lei(72), ledger_id: null, deleted: 1},
    {id: 4, event_id: 8, name: 'lapte', unit: 'l', quantity: 10000, unit_price_4: 70000, total: lei(70), ledger_id: null},
    {id: 5, event_id: 8, name: 'Sirop de caramel', unit: 'sticle', quantity: 2000, unit_price: 3500, total: lei(70), ledger_id: null},
  ],
};

test('event money: received, owed, paid and planned costs, expected profit', () => {
  const m = eventMoney(state, event, today);
  assert.equal(m.income, lei(6400), 'Deleted entries and other events do not count.');
  assert.equal(m.owed, lei(2000));
  assert.equal(m.paid, lei(1926));
  assert.equal(m.planned, lei(260), 'Paid supply lines are already in paid costs; deleted lines are ignored.');
  assert.equal(m.costs, lei(2186));
  assert.equal(m.profitNow, lei(4474));
  assert.equal(m.expected, lei(8400 - 1926 - 260));
  assert.equal(Math.round(m.progress * 100), 76);
  assert.equal(m.status, 'owed');
});

test('statuses and events without an agreed price', () => {
  assert.equal(eventMoney(state, {...event, date: '2026-12-01'}, today).status, 'upcoming');
  assert.equal(eventMoney(state, {...event, status: 'cancelled'}, today).status, 'cancelled');
  assert.equal(eventMoney(state, {...event, status: 'cancelled'}, today).owed, 0);
  const free = eventMoney(state, {...event, price: 0}, today);
  assert.equal(free.owed, 0);
  assert.equal(free.status, 'profit');
  assert.equal(free.expected, lei(6400 - 1926 - 260), 'Without a price, expected profit uses what was received.');
  assert.equal(free.progress, 1);
  assert.equal(eventMoney({ledger: [], supplies: []}, {...event, id: 99, price: 0}, today).status, 'empty');
});

test('presets cover coffee, milk and every cup size', () => {
  const names = PRESETS.map(p => p.name);
  for (const name of ['Cafea boabe', 'Lapte', 'Pahare 4oz', 'Pahare 8oz', 'Pahare 10oz', 'Pahare 12oz']) assert.ok(names.includes(name), name);
  assert.ok(PRESETS.every(p => p.unit && !('price' in p)), 'Presets never carry invented prices.');
});

test('the last price and unit are remembered per item, case-insensitively', () => {
  assert.deepEqual(lastUsed(state.supplies, 'LAPTE'), {unit: 'l', unitPrice: 7});
  assert.deepEqual(lastUsed(state.supplies, 'Pahare 8oz'), {unit: 'buc', unitPrice: 0.42});
  assert.deepEqual(lastUsed(state.supplies, 'Sirop de caramel'), {unit: 'sticle', unitPrice: 35}, 'Older rows without a precise price still work.');
  assert.equal(lastUsed(state.supplies, 'Gheață'), null);
  assert.deepEqual(usedBefore(state.supplies).map(i => i.name), ['Sirop de caramel', 'Cacao'], 'Hand-typed items are offered; presets are not repeated.');
});

test('line totals round like the server', () => {
  assert.equal(lineTotal(300, 0.42), lei(126));
  assert.equal(lineTotal(1.5, 48), lei(72));
  assert.equal(lineTotal(0.333, 9.99), 333);
  assert.equal(lineTotal(12, 0.0833), 100);
});
