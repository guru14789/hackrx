import { useState } from "react";
import { Plus, X, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Question {
  id: string;
  text: string;
  order: number;
}

interface QuestionManagerProps {
  questions: Question[];
  setQuestions: (questions: Question[]) => void;
}

export default function QuestionManager({ questions, setQuestions }: QuestionManagerProps) {
  const [newQuestion, setNewQuestion] = useState("");

  const addQuestion = () => {
    if (newQuestion.trim()) {
      const newQ: Question = {
        id: Date.now().toString(),
        text: newQuestion.trim(),
        order: questions.length + 1
      };
      setQuestions([...questions, newQ]);
      setNewQuestion("");
    }
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, text: string) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, text } : q
    ));
  };

  return (
    <div className="card-container">
      <div className="p-6">
        <label className="block text-sm font-medium text-foreground mb-2 flex items-center">
          <HelpCircle className="w-4 h-4 mr-2 text-primary" />
          Questions
        </label>
        
        <div className="space-y-3">
          {questions.map((question) => (
            <div key={question.id} className="flex items-center space-x-2">
              <input 
                type="text" 
                placeholder="Enter your question..."
                className="input-field flex-1 text-sm"
                value={question.text}
                onChange={(e) => updateQuestion(question.id, e.target.value)}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeQuestion(question.id)}
                className="text-error hover:text-red-700 p-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          
          <div className="flex items-center space-x-2">
            <input 
              type="text" 
              placeholder="Add new question..."
              className="input-field flex-1 text-sm"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addQuestion()}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={addQuestion}
              disabled={!newQuestion.trim()}
              className="text-primary hover:text-blue-700 p-2"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          <button 
            onClick={addQuestion}
            disabled={!newQuestion.trim()}
            className="w-full py-2 border border-dashed border-border rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Add Question
          </button>
        </div>
      </div>
    </div>
  );
}
