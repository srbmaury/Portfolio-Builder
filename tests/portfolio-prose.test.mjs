import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePortfolioProse, splitProjectDescription, joinProjectDescription, formatExperienceBullets } from '../lib/portfolio-prose.ts';

test('experience bullet formatting preserves achievement text and existing markers', () => {
  const text = ' Built 20+ dashboards.\r\n\r\n• Reduced detection time.\r\n- Added API metrics.';
  const formatted = formatExperienceBullets(text);
  assert.equal(formatted, '- Built 20+ dashboards.\n- Reduced detection time.\n- Added API metrics.');
  assert.equal(formatExperienceBullets(formatted), formatted);
  assert.deepEqual(parsePortfolioProse(formatted), [{type:'list',items:['Built 20+ dashboards.','Reduced detection time.','Added API metrics.']}]);
  assert.equal(formatExperienceBullets('  '), '');
});

test('mixed prose keeps headings and achievements separate', () => {
  assert.deepEqual(parsePortfolioProse('Overview\ncontinued\n- First result\n• Second result\n\n# Approach\nBuilt a service.'), [
    { type: 'paragraph', text: 'Overview continued' },
    { type: 'list', items: ['First result', 'Second result'] },
    { type: 'heading', text: 'Approach' },
    { type: 'paragraph', text: 'Built a service.' },
  ]);
});
test('empty input is empty and HTML remains plain text', () => {
  assert.deepEqual(parsePortfolioProse(' \n\n'), []);
  assert.deepEqual(parsePortfolioProse('<script>alert(1)</script>'), [{type:'paragraph',text:'<script>alert(1)</script>'}]);
});
test('separate case study fields preserve existing multiline descriptions', () => {
  const original = 'Overview\n\n# Problem\nSomething difficult\n\n# Outcome\n- A result';
  const {overview, details} = splitProjectDescription(original);
  assert.equal(joinProjectDescription(overview, details), original);
  assert.equal(joinProjectDescription(overview, ''), 'Overview');
  assert.deepEqual(splitProjectDescription('Intro\r\n\r\nDetails'), {overview:'Intro',details:'Details'});
});
