import assert from 'node:assert/strict';
import { Then } from '@cucumber/cucumber';
import { SPECIFICATION_ICONS, type SpecificationResponseDto } from '@e-commerce/contracts';
import { assertKeys, assertText, STATUS_OK } from '../shared/http.ts';
import type { ICustomWorld } from '../support/custom-world.ts';

Then(
  'the seeded specification content is returned in display order',
  function (this: ICustomWorld) {
    assert.equal(this.context.latestResponse!.statusCode, STATUS_OK);
    const specifications = this.context.latestResponse!.json<SpecificationResponseDto[]>();
    assert.deepEqual(
      specifications.map((specification) => specification.specification_id),
      ['sustainability', 'comfort', 'durability', 'versatility'],
    );
    for (const specification of specifications) {
      assertKeys(specification, [
        'specification_id',
        'label',
        'title',
        'description',
        'image_url',
        'image_alt',
        'features',
      ]);
      for (const text of [
        specification.label,
        specification.title,
        specification.description,
        specification.image_url,
        specification.image_alt,
      ]) {
        assertText(text);
      }
      assert.ok(specification.features.length > 0);
      for (const feature of specification.features) {
        assertKeys(feature, ['icon', 'label']);
        assert.ok(SPECIFICATION_ICONS.includes(feature.icon));
        assertText(feature.label);
      }
    }
  },
);
