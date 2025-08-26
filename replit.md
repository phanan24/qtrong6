# Project Overview

## Overview

LimVA is a Vietnamese educational platform that provides AI-powered learning tools for students. The application features a Q&A forum where students can ask questions and receive answers from both the community and AI assistants, homework analysis and practice question generation, and competitive rankings at school, provincial, and national levels. The platform integrates with OpenRouter AI services to provide intelligent tutoring capabilities across multiple subjects including mathematics, literature, English, and science.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client is built as a Single Page Application (SPA) using React with TypeScript, utilizing Vite as the build tool for fast development and optimized production builds. The UI framework is based on shadcn/ui components with Radix UI primitives, providing a modern and accessible interface. State management is handled through TanStack Query (React Query) for server state and React hooks for local state. The application uses Wouter for lightweight client-side routing and react-hook-form with Zod validation for form handling.

### Backend Architecture
The server follows a RESTful API design using Express.js with TypeScript in ESM module format. Authentication is implemented using Passport.js with local strategy and session-based authentication using express-session with PostgreSQL session store. The API structure includes dedicated routes for user management, posts and comments, homework submissions, AI interactions, practice questions, and administrative functions. Request logging and error handling middleware provide debugging capabilities and graceful error responses.

### Database Design
The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations. The schema includes comprehensive tables for users with role-based access (admin/regular), posts and nested comments for the Q&A forum, homework submissions with AI analysis, practice questions and attempts for skill assessment, rating system for content quality, and monthly rankings for competitive features. Database migrations are managed through Drizzle Kit with schema definitions shared between client and server.

### Authentication and Authorization
Session-based authentication is implemented with secure password hashing using Node.js crypto module's scrypt function. Role-based access control differentiates between regular users and administrators. Protected routes ensure authenticated access to core features, while admin routes restrict access to administrative functions. Session management includes configurable timeouts and secure cookie handling for production environments.

### AI Integration Strategy
The platform integrates with OpenRouter AI API to access multiple language models including DeepSeek and GPT models. AI settings are configurable by administrators to enable/disable specific models. The integration supports homework analysis, automatic practice question generation, and intelligent Q&A responses. Fallback mechanisms ensure graceful handling of AI service outages, and the modular design allows for easy integration of additional AI providers.

## External Dependencies

### Core Infrastructure
- **Neon Database**: PostgreSQL-compatible serverless database for data persistence
- **OpenRouter AI API**: Multi-model AI service for educational content generation and analysis

### Authentication & Session Management
- **Passport.js**: Authentication middleware with local strategy implementation
- **connect-pg-simple**: PostgreSQL session store for Express sessions

### Database & ORM
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL support
- **@neondatabase/serverless**: Neon's serverless PostgreSQL driver

### Frontend Libraries
- **shadcn/ui & Radix UI**: Component library providing accessible UI primitives
- **TanStack Query**: Server state management and data synchronization
- **React Hook Form**: Form state management with validation
- **Zod**: TypeScript-first schema validation
- **Wouter**: Minimal client-side routing library
- **date-fns**: Date manipulation and formatting utilities

### Development Tools
- **Vite**: Frontend build tool with hot module replacement
- **Tailwind CSS**: Utility-first CSS framework for styling
- **TypeScript**: Type-safe JavaScript development
- **ESBuild**: Fast JavaScript bundler for production builds

### Replit Integration
- **@replit/vite-plugin-cartographer**: Development environment integration
- **@replit/vite-plugin-runtime-error-modal**: Enhanced error reporting in development