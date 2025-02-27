# @bunvel/framework

## 0.5.0

### Added

- Extended all controllers with the default `Controller` class.

### Changed

- Updated all stubs to use `export default` syntax.

### Fixed

- Fixed route responses to handle `null` returns correctly.

## 0.4.0

### Minor Changes

- Introduced **Path** and **asset()** helpers for seamless access to framework directories and asset URLs:

  ### ✅ Path Utility Methods:

  - Access key framework directories with intuitive methods:
    - `appPath()` – Path to the application directory.
    - `basePath()` – Path to the project root.
    - `configPath()` – Path to the configuration directory.
    - `databasePath()` – Path to the database directory.
    - Supports custom paths via environment variables.

  ### ✅ URL & Asset Helpers:

  - `assets()` – Generate URLs for static assets.
    - Auto-switches between HTTP and HTTPS based on `APP_URL`.
    - Example: `assets('img/logo.png')`.
  - `baseUrl()` – Retrieve the application’s base URL.

  Simplified path resolution and asset management for a better developer experience! 🚀

## 0.3.0

### Minor Changes

- We're excited to introduce the new Str class, providing a collection of helpful string manipulation methods inspired by Laravel's Str and Stringable. This release makes working with strings easier and more efficient.

  ### 🔨 New Features:

  - **`Str.plural()`**: Convert a word to its plural form.
  - **`Str.singular()`**: Convert a word to its singular form.
  - **`Str.slugify()`**: Generate URL-friendly slugs.
  - **`Str.random()`**: Create random strings of a given length.
  - **`Str.camel()`**: Convert strings to camelCase.
  - **And more!**
