# Document Processing Webhooks API

## Overview

Your LLM-powered document analysis system now supports external webhook integration for processing PDF, DOCX, DOC, and TXT documents. The system provides real document analysis using OpenAI GPT-4 and FAISS vector search.

## Base URL

**Local Development:** `http://localhost:5000/api/v1`  
**Authentication:** Bearer Token: `9a653094793aedeae46f194aa755e2bb17f297f5209b7f99c1ced3671779d95d`

## Webhook Endpoints

### 1. Document URL Processing Webhook

**Endpoint:** `POST /webhook/document-process`

Processes documents from URLs with asynchronous processing and optional callback notifications.

#### Request Body
```json
{
  "document_url": "https://example.com/document.pdf",
  "questions": [
    "What is the grace period for premium payments?",
    "What are the waiting periods for pre-existing diseases?"
  ],
  "callback_url": "https://your-server.com/callback", // Optional
  "webhook_id": "unique_identifier" // Optional
}
```

#### Immediate Response (202 Accepted)
```json
{
  "message": "Document processing started",
  "webhook_id": "webhook_1754650360420",
  "status": "processing"
}
```

### 2. File Upload Webhook

**Endpoint:** `POST /webhook/document-upload`  
**Content-Type:** `multipart/form-data`

Handles direct file uploads with processing.

#### Form Fields
- `document` (file): PDF, DOCX, DOC, or TXT file (max 50MB)
- `questions` (string): JSON array of questions
- `callback_url` (string, optional): URL for result notifications
- `webhook_id` (string, optional): Custom identifier

#### Example using curl:
```bash
curl -X POST http://localhost:5000/api/v1/webhook/document-upload \
  -F "document=@/path/to/your/document.pdf" \
  -F "questions=[\"What is this document about?\", \"What are the key terms?\"]" \
  -F "callback_url=https://your-server.com/callback" \
  -F "webhook_id=upload_123"
```

#### Immediate Response (202 Accepted)
```json
{
  "message": "File upload successful, processing started",
  "webhook_id": "upload_1754650360420",
  "status": "processing",
  "filename": "document.pdf"
}
```

## Callback Response Format

When processing completes, if a `callback_url` was provided, the system will send a POST request:

### Success Callback
```json
{
  "webhook_id": "webhook_1754650360420",
  "status": "completed",
  "document_processed": true,
  "filename": "document.pdf", // Only for file uploads
  "answers": [
    "A grace period of thirty days is provided for premium payment...",
    "There is a waiting period of thirty-six months for pre-existing diseases..."
  ],
  "detailed_answers": [
    {
      "question": "What is the grace period for premium payments?",
      "answer": "A grace period of thirty days is provided for premium payment...",
      "confidence": 0.95,
      "source_section": "GRACE PERIOD FOR PREMIUM PAYMENT",
      "similarity_score": 0.89,
      "tokens_used": 45
    }
  ],
  "metadata": {
    "document_title": "Policy Document.pdf",
    "total_tokens": 150,
    "processing_time": "2025-01-08T10:55:00.000Z"
  }
}
```

### Error Callback
```json
{
  "webhook_id": "webhook_1754650360420",
  "status": "error",
  "filename": "document.pdf", // Only for file uploads
  "error": "Failed to process PDF: Document contains no readable text content",
  "processing_time": "2025-01-08T10:55:00.000Z"
}
```

## Supported File Formats

- **PDF** (.pdf): Extracted using pdf-parse
- **DOCX** (.docx): Extracted using mammoth
- **DOC** (.doc): Converted to DOCX format then processed
- **TXT** (.txt): Direct text processing

## Processing Features

- **Real Document Analysis**: No demo/fallback content - processes actual uploaded documents
- **OpenAI GPT-4**: Generates intelligent answers based on document context
- **FAISS Vector Search**: Semantic search for relevant document sections
- **Confidence Scoring**: AI-generated confidence levels for each answer
- **Source Attribution**: Identifies document sections for each answer
- **Token Tracking**: Monitors OpenAI API usage

## Error Handling

The system provides detailed error messages for:
- Invalid file formats
- Document processing failures
- OpenAI API errors
- Network connectivity issues
- Missing required fields

## Health Check

**Endpoint:** `GET /health`

```json
{
  "status": "healthy",
  "services": {
    "faiss_vector_db": "connected",
    "gpt4_api": "active",
    "document_parser": "ready",
    "api_gateway": "healthy"
  },
  "timestamp": "2025-01-08T10:55:52.132Z"
}
```

## Usage Examples

### Processing a Public PDF URL
```bash
curl -X POST http://localhost:5000/api/v1/webhook/document-process \
  -H "Content-Type: application/json" \
  -d '{
    "document_url": "https://example.com/insurance-policy.pdf",
    "questions": [
      "What is the coverage amount?",
      "What are the exclusions?"
    ],
    "callback_url": "https://your-app.com/webhook/results"
  }'
```

### Uploading and Processing a File
```bash
curl -X POST http://localhost:5000/api/v1/webhook/document-upload \
  -F "document=@policy.pdf" \
  -F "questions=[\"What is the deductible?\", \"What is covered?\"]" \
  -F "callback_url=https://your-app.com/webhook/results"
```

## Integration Notes

1. **Asynchronous Processing**: Both endpoints return immediately (202 status) and process documents in the background
2. **Callback Notifications**: Use callback URLs to receive results when processing completes
3. **Webhook IDs**: Use custom webhook_id values to track specific requests
4. **Error Recovery**: Implement proper error handling for failed document downloads or processing
5. **Rate Limiting**: Consider OpenAI API rate limits when processing multiple documents

## Security

- Bearer token authentication required for all endpoints
- File upload size limited to 50MB
- Only supported file types are accepted
- Temporary files are automatically cleaned up after processing