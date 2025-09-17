const cfg = {
  ...require('@linzjs/style/.eslintrc.cjs'),
};

// Disable require await as we use `async foo() { throws Bar }` in a few places
const tsRules = cfg.overrides.find((ovr) => ovr.files.find((f) => f.endsWith('*.ts')));
tsRules.rules['@typescript-eslint/require-await'] = 'off';

// node23 needs "import type" when importing types
tsRules.rules['@typescript-eslint/consistent-type-imports'] = 'error';

module.exports = cfg;
