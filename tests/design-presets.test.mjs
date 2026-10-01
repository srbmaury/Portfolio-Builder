import test from 'node:test';
import assert from 'node:assert/strict';
import {designPresets, applyDesignPreset, matchesDesignPreset} from '../lib/design-presets.ts';
import {defaultConfig, templateCatalog} from '../lib/portfolio.ts';

test('curated designs use supported section layouts', () => {
  for (const preset of designPresets) {
    for (const [type, layout] of Object.entries(preset.layouts)) {
      assert.ok(templateCatalog[type].some(item => item.id === layout), `${preset.id}: ${type}/${layout}`);
    }
    assert.ok(matchesDesignPreset(applyDesignPreset(defaultConfig, preset), preset));
  }
});
test('applying a design preserves section identities, order, visibility and custom sections', () => {
  const config = { theme: 'ink', sections: [{id:'work',type:'projects',title:'My work',visible:false,variant:'grid'}, {id:'custom-awards',type:'custom',customSectionId:'awards',title:'Awards',visible:true,variant:'badges'}] };
  const before = structuredClone(config);
  const result = applyDesignPreset(config, designPresets[0]);
  assert.deepEqual(config, before);
  assert.deepEqual(result.sections.map(({variant,...rest})=>rest), config.sections.map(({variant,...rest})=>rest));
  assert.deepEqual(result.sections[1], config.sections[1]);
  assert.equal(result.sections[0].variant, 'image-grid');
});
