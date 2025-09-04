# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Start
- `npm run build` - Build the NestJS application
- `npm start` - Start the application in production mode
- `npm run start:dev` - Start in development mode with hot reload
- `npm run start:debug` - Start in debug mode with hot reload

### Code Quality
- `npm run lint` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage report
- `npm run test:e2e` - Run end-to-end tests

### Database
- `npm run db:seed` - Run database seed script using `ts-node prisma/seed.ts`
- Prisma commands should be run directly: `npx prisma generate`, `npx prisma migrate dev`, etc.

## Architecture Overview

This is a NestJS REST API for a multilingual content management system called "Imam Zain API v2". The system manages articles, research papers, and books with full internationalization support.

### Core Architecture

**Database Layer**: PostgreSQL with Prisma ORM
- Multi-language content system with translation tables
- Role-based access control (RBAC) with users, roles, permissions, and groups
- Activity logging for audit trails
- File attachment system supporting various media types

**Authentication**: JWT-based authentication with refresh tokens
- Passport.js integration with local and JWT strategies
- BCrypt for password hashing
- Role and permission-based authorization

**Content Models**: Three main content types with unified architecture
- **Articles**: Blog posts with main images and additional attachments
- **Research**: Academic papers with file attachments and metadata
- **Books**: Digital books with covers, files, and multi-part support

### Key Modules

- `AuthModule` - JWT authentication, login, and user management
- `UsersModule` - User CRUD operations and role management  
- `ArticlesModule` - Article content management with translations
- `ResearchModule` - Research paper management with file handling
- `BooksModule` - Book management with cover images and files
- `CategoriesModule` - Unified category system for all content types
- `TagsModule` - Tagging system with multilingual support
- `AttachmentsModule` - File upload and management system
- `CommonModule` - Shared services like pagination (global module)
- `PrismaModule` - Database connection and ORM integration

### Database Schema Highlights

**Multi-language System**: All content supports multiple languages through translation tables:
- `ArticleTranslation`, `ResearchTranslation`, `BookTranslation`
- `CategoryTranslation`, `TagTranslation`
- Language codes reference the `Language` table

**RBAC System**: Comprehensive role-based access control:
- Users belong to multiple roles and groups
- Roles and groups have permissions
- Activity logging tracks all user actions

**Content Relations**:
- Categories are model-specific (ARTICLE, RESEARCH, BOOK enum)
- Tags are shared across all content types
- Attachments system handles main images, covers, files, and additional attachments

## Configuration

The application uses environment-based configuration:
- Default port: 3001
- API prefix: 'api' (configurable via API_PREFIX)
- CORS configured for multiple origins in development
- Global validation pipe with transformation enabled

## File Structure Patterns

- DTOs follow the pattern: `dto/create-*.dto.ts`, `dto/update-*.dto.ts`
- Each module follows NestJS convention: `module.ts`, `controller.ts`, `service.ts`
- Common utilities in `src/common/` including response utilities and pagination service
- Prisma schema defines the entire database structure in `prisma/schema.prisma`

## Development Notes

- Uses TypeScript with strict type checking
- ESLint configuration allows some flexibility with `@typescript-eslint/no-explicit-any: 'off'`
- Global validation pipe transforms and validates all incoming requests
- Comprehensive error handling with global exception filters
- CORS configured to support frontend development on multiple ports