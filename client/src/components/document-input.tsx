import { FileText } from "lucide-react";

interface DocumentInputProps {
  documentUrl: string;
  setDocumentUrl: (url: string) => void;
  isProcessing: boolean;
}

export default function DocumentInput({ documentUrl, setDocumentUrl, isProcessing }: DocumentInputProps) {
  return (
    <div className="card-container">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Document Processing</h2>
          <div className="flex items-center space-x-2">
            <span className={`status-indicator ${isProcessing ? 'bg-warning' : 'bg-success'}`}></span>
            <span className="text-xs text-muted-foreground">
              {isProcessing ? 'Processing' : 'Ready'}
            </span>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2 flex items-center">
            <FileText className="w-4 h-4 mr-2 text-error" />
            Document URL
          </label>
          <input 
            type="url" 
            placeholder="https://hackrx.blob.core.windows.net/assets/policy.pdf..."
            className="input-field"
            value={documentUrl}
            onChange={(e) => setDocumentUrl(e.target.value)}
            disabled={isProcessing}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Supports PDF, DOCX, and email documents
          </p>
        </div>
      </div>
    </div>
  );
}
