---
name: Neon HTTP driver null-rows bug
description: neon-http v1.1.0 crashes with "Cannot read properties of null (reading 'map')" when a JOIN query returns 0 rows — workaround and context.
---

## The bug

`@neondatabase/serverless` v1.1.0 (latest as of 2026-07) returns `null` for `rows` when a Postgres query with LEFT JOINs returns 0 rows. The `processQueryResult` function in `index.mjs` calls `r.rows.map(...)` without a null guard, crashing with:

```
TypeError: Cannot read properties of null (reading 'map')
  at processQueryResult (.../node_modules/@neondatabase/serverless/index.mjs:1304)
```

**Why:** The Neon HTTP API returns `{"rows": null, "fields": [...]}` for zero-row result sets when JOINs are involved. Simple single-table queries with data are unaffected.

## Applied fix

Patched the installed driver directly (sed):

```bash
sed -i 's/u=e===!0?r\.rows\.map(c=>c\.map/u=e===!0?(r.rows??[]).map(c=>c.map/g; s/):r\.rows\.map(c=>Object/):(r.rows??[]).map(c=>Object/g' \
  node_modules/@neondatabase/serverless/index.mjs
```

This patch is applied to the local `node_modules`. It will be lost on `npm install`. If the neon package is reinstalled or upgraded, re-apply the patch or verify the bug is fixed in the new version.

**How to apply:** Run the sed command above after any `npm install` that touches `@neondatabase/serverless`. Consider adding a `postinstall` npm script to automate this.

## Alternative (if needed)

Use `patch-package` to make the fix permanent across installs:
1. `npm install --save-dev patch-package`
2. Apply the sed fix
3. `npx patch-package @neondatabase/serverless`
4. Add `"postinstall": "patch-package"` to package.json scripts
