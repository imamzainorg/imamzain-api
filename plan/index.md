Task: Dual Language-Aware Endpoints (Public & Private)
Goal
Implement a dual-route structure for all GET endpoints on translatable resources. The idea is to separate public, language-specific endpoints from private, CMS-friendly endpoints.

Requirements
1. Public Endpoints (Language-Specific)
- These endpoints must include a :lang prefix in the route.

- Purpose: To serve translated content to the frontend/public consumers based on the specified language.

- Example: GET /api/:lang/books → returns books in the specified language (en, ar, etc.).

2. Private Endpoints (All Languages)
- These endpoints must NOT include the :lang prefix.

- Purpose: To be used in the CMS/dashboard for managing multi-language content. They return all language entries for each item (used for editing and organizing translations).

Endpoint Design
✅ Public (with :lang/ prefix)
GET /api/:lang/books

GET /api/:lang/books/:id

GET /api/:lang/books/slug/:slug

GET /api/:lang/articles

GET /api/:lang/articles/:id

GET /api/:lang/articles/slug/:slug

GET /api/:lang/research

GET /api/:lang/research/:id

GET /api/:lang/research/slug/:slug

GET /api/:lang/categories

GET /api/:lang/categories/:id

GET /api/:lang/categories/slug/:slug

GET /api/:lang/tags

GET /api/:lang/tags/:id

GET /api/:lang/tags/slug/:slug

🔒 Private (no :lang prefix, returns all languages)
GET /api/books

GET /api/books/:id

GET /api/books/slug/:slug

GET /api/articles

GET /api/articles/:id

GET /api/articles/slug/:slug

GET /api/research

GET /api/research/:id

GET /api/research/slug/:slug

GET /api/categories

GET /api/categories/:id

GET /api/categories/slug/:slug

GET /api/tags

GET /api/tags/:id

GET /api/tags/slug/:slug