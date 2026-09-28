import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const read = (path) =>
  fs.readFileSync(new URL("../" + path, import.meta.url), "utf8");
const weapons = JSON.parse(read("src/data/weapons.json"));
const curves = JSON.parse(read("src/data/ballistics.json"));
// Run the actual pure TypeScript calculator without a subprocess or a browser.
const compiled = ts.transpileModule(read("src/domain/damage.ts"), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const box = { exports: {} };
vm.runInNewContext(compiled, box);
const {
  hitResult,
  damageAtRange,
  timeToKill,
  rpmFor,
  BODY_PARTS,
  DEFAULT_CONDITIONS: c,
} = box.exports;
const weapon = (id) => weapons.find((w) => w.referenceId === id);
const hit = (id, part, patch = {}) =>
  hitResult(weapon(id), curves[id], part, { ...c, ...patch });
const close = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

assert.equal(weapons.length, 53);
assert.equal(new Set(weapons.map((w) => w.id)).size, 53);
assert.equal(Object.keys(curves).length, 53);
let checks = 0;
for (const w of weapons) {
  const data = curves[w.referenceId];
  assert.ok(data && data.damagePoints.length);
  assert.ok(w.damage > 0 && w.rpm > 0 && w.ammo && w.image && w.weaponClass);
  close(w.damage, data.baseDamage);
  assert.equal(rpmFor(data, c), w.rpm);
  assert.equal(damageAtRange(data, data.maxDistance + 1), null);
  assert.equal(damageAtRange(data, -1), null);
  data.damagePoints.forEach((point, i) => {
    if (i) assert.ok(point.x > data.damagePoints[i - 1].x);
    close(damageAtRange(data, point.x), point.y);
  });
  for (const distance of [0, Math.min(50, data.maxDistance), data.maxDistance])
    for (const helmet of [0, 1, 2, 3])
      for (const vest of [0, 1, 2, 3])
        for (const part of BODY_PARTS) {
          const result = hitResult(w, data, part.id, {
            ...c,
            distance,
            helmet,
            vest,
          });
          assert.ok(result.damage > 0 && Number.isFinite(result.damage));
          assert.equal(result.hits, Math.ceil(100 / result.damage));
          assert.ok(result.ttk >= 0);
          checks++;
        }
}
close(hit("M416", "Head").damage, 56.4);
close(hit("M416", "Chest").damage, 26.4);
close(hit("M416", "Head").ttk, 0.0859);
close(hit("M416", "Chest", { vest: 0 }).damage, 44);
close(hit("M416", "Chest", { helmet: 0 }).damage, 26.4);
close(hit("M416", "UpperArm", { helmet: 3, vest: 3 }).damage, 21.6);
close(hit("AWM", "Head", { helmet: 3 }).damage, 118.125);
assert.equal(hit("AWM", "Head", { helmet: 3 }).hits, 1);
close(hit("Dragunov", "Head").damage, 89.04);
close(hit("UMP", "Forearm").damage, 27.29935);
assert.equal(hit("Sawed-off", "Chest").hits, 2); // 99.792 damage must NOT round to a one-shot kill.
close(hit("S686", "Chest", { shotgunMode: "pellet" }).damage, 15.444);
assert.equal(hit("S686", "Chest", { shotgunMode: "pellet" }).ttk, null);
close(timeToKill(3, curves.S686.timings, c), 2.657); // Includes reload after the first two shells.
close(timeToKill(3, curves["Mk47 Mutant"].timings, c), 0.129);
close(timeToKill(4, curves.M16A4.timings, c), 0.2347);
assert.equal(rpmFor(curves.MG3, { ...c, mg3Mode: "660" }), 660);
close(timeToKill(2, curves.AWM.timings, { ...c, scope: "no-ads" }), 2.107);
console.log(
  `PASS: 53 weapons, every measured point, ${checks} body/armor/range combinations, pellet boundaries, burst timing, reload timing, unknown ranges.`,
);
