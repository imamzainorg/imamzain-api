# Imam Zain API v2

A comprehensive multilingual content management REST API built with NestJS, featuring articles, research papers, and books with full internationalization support.

## Features

- 🌍 **Multilingual Content**: Full i18n support with translation tables
- 🔐 **Authentication & Authorization**: JWT-based auth with role-based access control (RBAC)
- 📚 **Content Management**: Articles, research papers, and books with rich metadata
- 📎 **File Management**: Upload and serve images, documents, and media files
- 🏷️ **Tagging & Categorization**: Flexible tagging and category system
- 📊 **Activity Logging**: Complete audit trail of user activities
- 🔍 **Search & Pagination**: Full-text search with paginated results
- 📝 **Validation**: Comprehensive input validation and error handling

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials and other settings

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database (optional)
npm run db:seed
```

### Running the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run start:prod

# Debug mode
npm run start:debug
```

The API will be available at `http://localhost:3001/api`

### Testing

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Code Quality

```bash
# Lint and fix code
npm run lint

# Format code
npm run format
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/imamzain_db"
DIRECT_URL="postgresql://user:password@localhost:5432/imamzain_db"

# Application
PORT=3001
NODE_ENV=development
API_PREFIX=api

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

## API Documentation

### Base URL

All API endpoints are prefixed with `/api`. For example: `http://localhost:3001/api/auth/login`

### Response Format

All API responses follow a consistent format:

```json
{
  "status": "success" | "error",
  "message": "Human readable message",
  "errors": null | ["error details"],
  "data": {} | [] | null,
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Authentication

The API uses JWT tokens for authentication. After login, you'll receive:
- An `accessToken` for API requests (expires in 15 minutes)
- A `refreshToken` stored as HTTP-only cookie (expires in 7 days)

#### Authentication Endpoints

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

```http
POST /api/auth/refresh
# Refresh token is automatically read from cookie
```

```http
POST /api/auth/logout
Authorization: Bearer <access_token>
```

### Protected Routes

Include the JWT token in the Authorization header:

```http
Authorization: Bearer <access_token>
```

### Content Management

The API manages three main content types: Articles, Research, and Books. Each supports multiple languages and has both public and private endpoints.

#### Articles

**Public Endpoints (no authentication required):**

```http
# Get articles in specific language with pagination
GET /api/{lang}/articles?page=1&limit=10&categoryId=1&search=query

# Get article by ID
GET /api/{lang}/articles/{id}

# Get article by slug
GET /api/{lang}/articles/slug/{slug}
```

**Private Endpoints (authentication required):**

```http
# Get all articles (all languages)
GET /api/articles?page=1&limit=10&categoryId=1&search=query

# Get article with all translations
GET /api/articles/{id}

# Create new article
POST /api/articles
Content-Type: application/json

{
  "slug": "my-article",
  "categoryId": 1,
  "mainImageId": 123,
  "translations": [
    {
      "languageCode": "en",
      "isDefault": true,
      "title": "Article Title",
      "summary": "Brief summary",
      "body": "Article content..."
    }
  ],
  "tagIds": [1, 2, 3],
  "attachmentIds": [456, 789]
}

# Update article
PATCH /api/articles/{id}

# Delete article
DELETE /api/articles/{id}
```

#### Research Papers

Similar structure to articles, with additional fields for academic metadata:

```http
# Public research endpoints
GET /api/{lang}/research
GET /api/{lang}/research/{id}
GET /api/{lang}/research/slug/{slug}

# Private research endpoints
GET /api/research
POST /api/research
PATCH /api/research/{id}
DELETE /api/research/{id}
```

Research creation example:

```json
{
  "slug": "my-research",
  "categoryId": 1,
  "fileId": 123,
  "publishedAt": "2024-01-01",
  "pages": 25,
  "translations": [
    {
      "languageCode": "en",
      "isDefault": true,
      "title": "Research Title",
      "abstract": "Research abstract",
      "authors": "Author Name",
      "metaTitle": "SEO Title",
      "metaDescription": "SEO Description"
    }
  ],
  "tagIds": [1, 2]
}
```

#### Books

Books support covers, files, and multi-part structure:

```http
# Public book endpoints
GET /api/{lang}/books
GET /api/{lang}/books/{id}
GET /api/{lang}/books/slug/{slug}

# Private book endpoints
GET /api/books
POST /api/books
PATCH /api/books/{id}
DELETE /api/books/{id}
```

Book creation example:

```json
{
  "slug": "my-book",
  "isbn": "978-1234567890",
  "categoryId": 1,
  "coverId": 123,
  "fileId": 456,
  "pages": 300,
  "partNumber": 1,
  "totalParts": 3,
  "publishYear": "2024",
  "parentBookId": null,
  "translations": [
    {
      "languageCode": "en",
      "isDefault": true,
      "title": "Book Title",
      "author": "Author Name",
      "publisher": "Publisher Name",
      "description": "Book description",
      "series": "Book Series"
    }
  ],
  "tagIds": [1, 2]
}
```

### File Management

#### Upload Files

```http
POST /api/attachments/upload
Content-Type: multipart/form-data

file: <file_data>
collection: "articles" | "research" | "books" | "general"
altText: "Image description"
metadata: '{"key": "value"}'
```

#### Serve Files

```http
GET /api/attachments/file/{collection}/{filename}
```

#### Manage Attachments

```http
# List attachments with pagination
GET /api/attachments?page=1&limit=10

# Get attachment details
GET /api/attachments/{id}

# Update attachment metadata
PATCH /api/attachments/{id}

# Delete attachment
DELETE /api/attachments/{id}
```

### Categories & Tags

#### Categories

```http
# Public categories for specific model type
GET /api/{lang}/categories?model=ARTICLE

# Private category management
GET /api/categories
POST /api/categories
PATCH /api/categories/{id}
DELETE /api/categories/{id}
```

#### Tags

```http
# Public tags
GET /api/{lang}/tags

# Private tag management
GET /api/tags
POST /api/tags
PATCH /api/tags/{id}
DELETE /api/tags/{id}
```

### User Management

```http
# List users with pagination
GET /api/users?page=1&limit=10

# Get user details
GET /api/users/{id}

# Create user
POST /api/users

# Update user
PATCH /api/users/{id}

# Update user status
PATCH /api/users/{id}/status

# Update user roles
PUT /api/users/{id}/roles

# Delete user
DELETE /api/users/{id}
```

### Supported Languages

The API supports multiple languages through language codes (e.g., `en`, `ar`, `fr`). Use the language code in the URL path for public endpoints to get localized content.

### Error Handling

The API returns appropriate HTTP status codes and error messages:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

Error response example:

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    "title is required",
    "slug must be unique"
  ],
  "data": null
}
```

## Database Schema

The application uses PostgreSQL with Prisma ORM. Key models include:

- **User Management**: Users, Roles, Permissions, Groups, ActivityLogs
- **Content**: Articles, Research, Books with translation tables
- **Media**: Attachments for files, images, and documents
- **Organization**: Categories (model-specific), Tags (shared)
- **Internationalization**: Languages, Translation tables

Run `npx prisma studio` to explore the database schema visually.

## Development

### Database Operations

```bash
# Reset database
npx prisma migrate reset

# Deploy migrations
npx prisma migrate deploy

# Generate Prisma client after schema changes
npx prisma generate

# Open Prisma Studio
npx prisma studio
```

### File Structure

```
src/
├── auth/           # Authentication module
├── users/          # User management
├── articles/       # Article management
├── research/       # Research paper management
├── books/          # Book management
├── categories/     # Category system
├── tags/           # Tagging system
├── attachments/    # File management
├── common/         # Shared utilities
├── prisma/         # Database service
├── app.module.ts   # Root module
└── main.ts         # Application bootstrap
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the UNLICENSED license.
