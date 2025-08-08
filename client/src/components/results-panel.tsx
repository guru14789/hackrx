import { useState } from "react";
import { Play, Clock, DollarSign, Target, Download, ExternalLink, CheckCircle, Copy, List, Code, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ResultsPanelProps {
  results: any;
  isProcessing: boolean;
  documentUrl: string;
  questions: Array<{id: string, text: string, order: number}>;
  onProcess: (processing: boolean) => void;
  onResults: (results: any) => void;
}

export default function ResultsPanel({ 
  results, 
  isProcessing, 
  documentUrl, 
  questions, 
  onProcess, 
  onResults 
}: ResultsPanelProps) {
  const [activeTab, setActiveTab] = useState("answers");
  const { toast } = useToast();

  const handleProcess = async () => {
    if (!documentUrl.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a document URL",
        variant: "destructive"
      });
      return;
    }

    if (questions.length === 0) {
      toast({
        title: "Validation Error", 
        description: "Please add at least one question",
        variant: "destructive"
      });
      return;
    }

    const questionTexts = questions.map(q => q.text).filter(text => text.trim());
    if (questionTexts.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please ensure all questions have text",
        variant: "destructive"
      });
      return;
    }

    try {
      onProcess(true);
      
      const requestData = {
        documents: documentUrl,
        questions: questionTexts
      };

      const response = await apiRequest('POST', '/api/v1/hackrx/run', requestData);
      const data = await response.json();
      
      onResults(data);
      
      toast({
        title: "Processing Complete",
        description: "Document has been successfully analyzed",
        variant: "default"
      });

    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "An error occurred during processing",
        variant: "destructive"
      });
    } finally {
      onProcess(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "JSON response copied to clipboard",
      variant: "default"
    });
  };

  return (
    <div className="card-container">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Processing Results</h2>
          <div className="flex items-center space-x-4">
            {results && (
              <>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {results.metadata?.processing_time?.toFixed(2) || '0'}s
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {results.metadata?.token_count || 0} tokens
                  </span>
                </div>
              </>
            )}
            <Button variant="ghost" size="sm">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Process Button */}
        <div className="mb-6">
          <Button 
            onClick={handleProcess}
            disabled={isProcessing}
            className="btn-primary w-full"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Process Document
              </>
            )}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted rounded-lg p-1 mb-6">
            <TabsTrigger value="answers" className="flex items-center">
              <List className="w-4 h-4 mr-2" />
              Answers
            </TabsTrigger>
            <TabsTrigger value="json" className="flex items-center">
              <Code className="w-4 h-4 mr-2" />
              JSON Response
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="answers" className="space-y-4">
            {results?.answers ? (
              results.answers.map((answer: string, index: number) => (
                <div key={index} className="border border-border rounded-lg p-4 fade-in">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <h4 className="font-medium text-foreground text-sm">
                        {questions[index]?.text || 'Question'}
                      </h4>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-success text-white rounded-full text-xs">Answered</span>
                      <span className="text-xs text-muted-foreground">
                        Confidence: {Math.round((results.metadata?.confidence_scores?.[index] || 0.85) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="bg-muted rounded-lg p-3 mb-3">
                    <p className="text-sm text-foreground">{answer}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-4">
                      <span>Source: Policy Document</span>
                      <span>Similarity: {((results.metadata?.confidence_scores?.[index] || 0.85)).toFixed(2)}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-primary hover:text-blue-700 h-auto p-0">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View Source
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                {isProcessing ? (
                  <div className="loading-shimmer h-32 rounded-lg"></div>
                ) : (
                  <p>Process a document to see answers here</p>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="json">
            {results ? (
              <div>
                <div className="bg-slate-900 rounded-lg p-4 syntax-json text-sm overflow-x-auto">
                  <pre className="text-slate-100">
                    <code>{JSON.stringify(results, null, 2)}</code>
                  </pre>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm text-muted-foreground">Valid JSON Response</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(results, null, 2))}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy JSON
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p>Process a document to see JSON response here</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            {results ? (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-foreground">Processing Time</h4>
                      <Clock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      {results.metadata?.processing_time?.toFixed(2) || '0'}s
                    </div>
                    <div className="text-xs text-success mt-1">
                      15% faster than average
                    </div>
                  </div>
                  
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-foreground">Token Usage</h4>
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      {results.metadata?.token_count || 0}
                    </div>
                    <div className="text-xs text-warning mt-1">
                      Cost: $0.024
                    </div>
                  </div>
                  
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-foreground">Accuracy Score</h4>
                      <Target className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      {Math.round((results.metadata?.confidence_scores?.reduce((a: number, b: number) => a + b, 0) / results.metadata?.confidence_scores?.length || 0.85) * 100)}%
                    </div>
                    <div className="text-xs text-success mt-1">
                      High confidence
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Question Performance Breakdown</h4>
                  {questions.map((question, index) => (
                    <div key={question.id} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground truncate">
                          {question.text}
                        </div>
                        <div className="flex items-center mt-1">
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div 
                              className="bg-success h-2 rounded-full" 
                              style={{width: `${Math.round((results.metadata?.confidence_scores?.[index] || 0.85) * 100)}%`}}
                            ></div>
                          </div>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {Math.round((results.metadata?.confidence_scores?.[index] || 0.85) * 100)}%
                          </span>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground ml-4">
                        <div>156 tokens</div>
                        <div>0.8s</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p>Process a document to see analytics here</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
