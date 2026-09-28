---
paths:
  - "includes/**/*.php"
  - "purecart.php"
  - "tests/**/*.php"
---

# PHP Conventions

- Every file: `declare(strict_types=1);`
- Namespace: `PureCart\<Module>\<Class>` — maps to `includes/<Module>/<Class>.php`
- Constants: `PURECART_*` — check `OptionKeys.php` before adding new options
- WP hook/filter prefix: `purecart_`
- Text domain: `purecart`
- REST namespace: `purecart/v1` (constant `PURECART_API_NAMESPACE`)
- DB tables: `{$wpdb->prefix}purecart_<name>` — all queries via `$wpdb->prepare()`
- No `__()` in constructors — register i18n strings in methods, not `__construct()`
- Extend `PureCartStore` for new DB tables — implement `schema()` for `dbDelta()`
- Extend `PureCartApi` for new REST controllers — implement `register_routes()`
- New module: create `Module.php` that instantiates and wires all module classes
