# LLM-Powered Document Analysis System

A production-ready document analysis system that processes PDF, DOCX, and TXT files using OpenAI GPT-4 and FAISS vector search. Built for insurance, legal, HR, and compliance use cases.

## 🚀 Quick Start

### Development Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd hackrx-document-analysis

# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your OpenAI API key

# Start development server
npm run dev
```

### Production Deployment

Follow the complete [Deployment Guide](./DEPLOYMENT_GUIDE.md) for deploying to:
- **Frontend**: Vercel
- **Backend**: Render  
- **Database**: Firebase Firestore

## 📚 Features

- **Real Document Processing**: Analyzes actual PDF, DOCX, and TXT files
- **OpenAI Integration**: GPT-4 powered intelligent answers with confidence scoring
- **Vector Search**: FAISS semantic search for relevant document sections
- **External Webhooks**: API endpoints for external system integration
- **Async Processing**: Non-blocking document processing with status tracking
- **Production Ready**: Firebase database, CORS configuration, error handling

## 🔗 API Endpoints

### Health Check
```bash
GET /api/v1/health
```

### Document Processing Webhook
```bash
POST /api/v1/webhook/document-process
Content-Type: application/json

{
  "document_url": "https://example.com/document.pdf",
  "questions": ["What is this document about?"],
  "callback_url": "https://your-app.com/callback",
  "webhook_id": "unique_id"
}
```

### File Upload Webhook
```bash
POST /api/v1/webhook/document-upload
Content-Type: multipart/form-data

Fields:
- document: PDF/DOCX/TXT file (max 50MB)
- questions: JSON array of questions
- callback_url: Optional callback URL
- webhook_id: Optional unique identifier
```

## 🛠 Tech Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS, shadcn/ui
- **Backend**: Express.js, TypeScript, OpenAI API, FAISS
- **Database**: Firebase Firestore (production), Memory (development)
- **Deployment**: Vercel + Render + Firebase

## 📖 Documentation

- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [Webhook Documentation](./WEBHOOK_DOCUMENTATION.md) - API reference and examples
- [Architecture Overview](./replit.md) - Technical architecture details

## 🔐 Environment Variables

```env
# Required
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=development

# Firebase (Production)
FIREBASE_PROJECT_ID=hackrx-4d649
FIREBASE_API_KEY=your_firebase_api_key

# Frontend
VITE_API_BASE_URL=http://localhost:5000
```

## 🚦 Usage Examples

### Processing a Document URL
```bash
curl -X POST http://localhost:5000/api/v1/webhook/document-process \
  -H "Content-Type: application/json" \
  -d '{
    "document_url": "https://example.com/contract.pdf",
    "questions": ["What are the payment terms?", "What is the contract duration?"]
  }'
```

### Uploading a File
```bash
curl -X POST http://localhost:5000/api/v1/webhook/document-upload \
  -F "document=@contract.pdf" \
  -F "questions=[\"What are the key clauses?\", \"What are the obligations?\"]"
```

## 📊 Response Format

### Success Response
```json
{
  "webhook_id": "unique_id",
  "status": "completed",
  "answers": ["Answer 1", "Answer 2"],
  "detailed_answers": [
    {
      "question": "What are the payment terms?",
      "answer": "Payment is due within 30 days...",
      "confidence": 0.95,
      "source_section": "Payment Terms",
      "similarity_score": 0.89,
      "tokens_used": 45
    }
  ],
  "metadata": {
    "document_title": "Contract.pdf",
    "total_tokens": 150,
    "processing_time": "2025-01-08T10:55:00.000Z"
  }
}
```

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build:client` - Build frontend for production  
- `npm run build:server` - Build backend for production
- `npm run start:server` - Start production server

### Project Structure
```
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared TypeScript schemas
├── temp/           # Temporary file storage
└── docs/           # Documentation
```

## 📞 Support

For issues and questions:
1. Check the [Deployment Guide](./DEPLOYMENT_GUIDE.md)
2. Review [Webhook Documentation](./WEBHOOK_DOCUMENTATION.md)
3. Check logs in your deployment platform
4. Verify environment variables are set correctly

---

Built for HackRX 2025 🏆