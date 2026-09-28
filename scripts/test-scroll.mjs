import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source=fs.readFileSync(new URL('../src/armory/detailScroll.ts',import.meta.url),'utf8');
const box={exports:{}};
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,box);
const sync=box.exports.syncDetailScroll;
const peers=[];
const layer={querySelectorAll:()=>peers};
function panel(max){
  const card={dataset:{state:'detail'},parentElement:layer};
  const element={scrollTop:0,scrollHeight:max+400,clientHeight:400,closest:()=>card};
  peers.push(element);
  return {card,element};
}
const left=panel(600),right=panel(250);
left.element.scrollTop=150;sync(left.element);
assert.equal(right.element.scrollTop,150);
assert.equal(left.card.dataset.scrolled,'true');
assert.equal(right.card.dataset.scrolled,'true');
sync(right.element);assert.equal(left.element.scrollTop,150);
left.element.scrollTop=500;sync(left.element);
assert.equal(right.element.scrollTop,250);
sync(right.element);assert.equal(left.element.scrollTop,500); // A shorter peer cannot pull its source backwards.
right.element.scrollTop=40;sync(right.element);
assert.equal(left.element.scrollTop,40);
sync(left.element);
right.element.scrollTop=0;sync(right.element);
assert.equal(left.element.scrollTop,0);
assert.equal(left.card.dataset.scrolled,'false');
assert.equal(right.card.dataset.scrolled,'false');
right.card.dataset.state='desk';right.element.scrollTop=100;sync(right.element);
assert.equal(left.element.scrollTop,0);
console.log('PASS: bidirectional scroll, unequal lengths, mirrored-event suppression, top expansion, closed-card isolation.');
