# Patches

## @nestjs/swagger@11.2.6

**Why:** The Swagger CLI plugin's `esmCompatible` mode generates `await import()`
inside non-async arrow functions, causing `SyntaxError: Unexpected reserved word`
at runtime in ESM builds.

**What:** Wraps `type:` and `enum:` property initializers in `async () => ...`
arrow functions when `esmCompatible` is enabled, so `await import()` is valid.

**Remove when:** `@nestjs/swagger` ships a fix for ESM-compatible async imports.
Track: https://github.com/nestjs/swagger/issues/1450
