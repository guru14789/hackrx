import { useState } from "react";
import DocumentInput from "@/components/document-input";
import QuestionManager from "@/components/question-manager";
import ResultsPanel from "@/components/results-panel";
import SystemStatus from "@/components/system-status";
import { Brain, Settings, Cog } from "lucide-react";

export default function Home() {
  const [documentUrl, setDocumentUrl] = useState("");
  const [questions, setQuestions] = useState<Array<{id: string, text: string, order: number}>>([
    { id: "1", text: "What is the grace period for premium payment under the National Parivar Mediclaim Plus Policy?", order: 1 },
    { id: "2", text: "What is the waiting period for pre-existing diseases (PED) to be covered?", order: 2 },
    { id: "3", text: "Does this policy cover maternity expenses, and what are the conditions?", order: 3 }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);

  return (
    <div className="min-h-screen bg-background font-inter">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">LLM Query Retrieval System</h1>
                <p className="text-sm text-muted-foreground">HackRX Challenge - Document Intelligence</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="status-indicator bg-success"></div>
                <span className="text-sm text-muted-foreground">API Connected</span>
              </div>
              <button className="btn-secondary">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-1 space-y-6">
            <DocumentInput 
              documentUrl={documentUrl}
              setDocumentUrl={setDocumentUrl}
              isProcessing={isProcessing}
            />
            
            <QuestionManager 
              questions={questions}
              setQuestions={setQuestions}
            />

            {/* API Configuration Panel */}
            <div className="card-container">
              <div className="p-6">
                <h3 className="text-sm font-medium text-foreground mb-4 flex items-center">
                  <Cog className="w-4 h-4 mr-2 text-muted-foreground" />
                  API Configuration
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-2">Base URL</label>
                    <input 
                      type="text" 
                      value="http://localhost:5000/api/v1"
                      className="input-field bg-muted text-sm"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-2">Authentication</label>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="password" 
                        placeholder="Bearer token"
                        className="input-field flex-1 text-sm"
                        defaultValue="9a653094793aedeae46f194aa755e2bb17f297f5209b7f99c1ced3671779d95d"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-6">
            <ResultsPanel 
              results={results}
              isProcessing={isProcessing}
              documentUrl={documentUrl}
              questions={questions}
              onProcess={setIsProcessing}
              onResults={setResults}
            />
            
            <SystemStatus />
          </div>
        </div>
      </div>
    </div>
  );
}
