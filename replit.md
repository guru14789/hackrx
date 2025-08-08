# LLM-Powered Query Retrieval System

## Overview

This is an intelligent document analysis system built for HackRX that processes large documents (PDFs, DOCX, emails) and answers natural language queries using LLM technology. The system is designed for insurance, legal, HR, and compliance use cases, providing semantic search capabilities with explainable decision rationale through structured JSON responses.

The application implements a full-stack architecture with a React frontend for document upload and query management, an Express.js backend for document processing and API endpoints, and integrates with OpenAI for natural language processing and FAISS for vector-based semantic search.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**January 8, 2025 - Production Deployment Configuration Complete**
- Added external webhook endpoints with full deployment support
- `/api/v1/webhook/document-process` - URL-based document processing
- `/api/v1/webhook/document-upload` - Direct file upload with multipart/form-data
- Firebase Firestore integration for production database storage
- Deployment configurations for Vercel (frontend) and Render (backend)
- Environment-aware storage: Firebase in production, memory in development
- CORS configuration for cross-origin deployment scenarios
- Complete deployment guide with step-by-step instructions

## System Architecture

### Frontend Architecture
- **React with TypeScript**: Modern component-based UI using functional components and hooks
- **Vite Build System**: Fast development server and optimized production builds
- **Tailwind CSS + shadcn/ui**: Utility-first styling with a comprehensive component library
- **TanStack Query**: Server state management for API calls with caching and synchronization
- **Wouter**: Lightweight client-side routing
- **Form Management**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Express.js with TypeScript**: RESTful API server with middleware-based request processing
- **Modular Service Layer**: Separated concerns with dedicated services for document processing, vector search, and OpenAI integration
- **Memory-based Storage**: In-memory storage system for processing requests, results, and status tracking
- **Bearer Token Authentication**: Simple API authentication using hardcoded bearer tokens
- **Error Handling**: Comprehensive error handling with structured JSON responses

### Document Processing Pipeline
- **Multi-format Support**: Handles PDF, DOCX, and email documents through format-specific processors
- **Text Extraction**: Converts documents into processable text chunks for analysis
- **Vector Embeddings**: Generates semantic embeddings using OpenAI's embedding models
- **FAISS Integration**: Implements vector similarity search for semantic document retrieval
- **Clause Matching**: Semantic similarity scoring for relevant content identification

### API Design
- **RESTful Endpoints**: Clean API structure with multiple processing endpoints:
  - `/api/v1/hackrx/run` - Original document processing endpoint
  - `/api/v1/webhook/document-process` - External webhook for URL-based document processing
  - `/api/v1/webhook/document-upload` - File upload webhook with multipart support
- **Async Processing**: Non-blocking document processing with status tracking and progress updates
- **Webhook Integration**: Callback notification system for external service integration
- **Structured Responses**: JSON responses with metadata including confidence scores, token usage, and processing times
- **Request Validation**: Zod schema validation for type-safe API contracts

### Data Management
- **Shared Schema**: TypeScript schemas shared between frontend and backend using Zod for validation
- **Type Safety**: End-to-end type safety from API requests to database operations
- **Status Tracking**: Real-time processing status updates with progress indicators
- **Dual Storage**: Firebase Firestore in production, memory storage in development
- **Environment-Aware**: Automatic storage selection based on NODE_ENV

## External Dependencies

### Database & ORM
- **Drizzle ORM**: Type-safe database operations with PostgreSQL support
- **Neon Database**: Serverless PostgreSQL for production deployment
- **Database Migrations**: Schema versioning and migration management through Drizzle Kit

### AI & Machine Learning
- **OpenAI API**: GPT-4 for natural language processing and answer generation
- **FAISS Vector Database**: Facebook AI Similarity Search for semantic document retrieval
- **Embedding Generation**: OpenAI embedding models for vector representation of document content

### UI & Styling
- **Radix UI**: Unstyled, accessible component primitives for complex UI elements
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide Icons**: Comprehensive icon library for UI elements
- **Inter Font**: Typography through Google Fonts integration

### Development & Build Tools
- **Vite**: Fast build tool with HMR and optimized bundling
- **ESBuild**: JavaScript bundler for server-side code compilation
- **TypeScript**: Static type checking across the entire application
- **PostCSS**: CSS processing with Tailwind integration
- **Deployment**: Vercel for frontend, Render for backend, Firebase for database

### Third-party Integrations
- **Document Download**: HTTP-based document fetching from external URLs
- **Session Management**: PostgreSQL session store for user session persistence
- **Development Tools**: Replit integration for cloud development environment