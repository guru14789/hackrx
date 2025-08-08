import { useQuery } from "@tanstack/react-query";
import { Server } from "lucide-react";

interface SystemHealth {
  status: string;
  services: {
    faiss_vector_db: string;
    gpt4_api: string; 
    document_parser: string;
    api_gateway: string;
  };
  timestamp: string;
}

export default function SystemStatus() {
  const { data: healthData } = useQuery<SystemHealth>({
    queryKey: ['/api/v1/health'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
      case 'ready':
      case 'healthy':
        return 'bg-success';
      case 'processing':
        return 'bg-warning';
      case 'error':
      case 'disconnected':
        return 'bg-error';
      default:
        return 'bg-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'connected': 'Connected',
      'active': 'Active', 
      'ready': 'Ready',
      'healthy': 'Healthy',
      'processing': 'Processing',
      'error': 'Error',
      'disconnected': 'Disconnected'
    };
    return statusMap[status] || status;
  };

  const services = [
    { key: 'faiss_vector_db', label: 'FAISS Vector DB' },
    { key: 'gpt4_api', label: 'GPT-4 API' },
    { key: 'document_parser', label: 'Document Parser' },
    { key: 'api_gateway', label: 'API Gateway' }
  ];

  return (
    <div className="card-container">
      <div className="p-6">
        <h3 className="text-sm font-medium text-foreground mb-4 flex items-center">
          <Server className="w-4 h-4 mr-2 text-muted-foreground" />
          System Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map(service => {
            const status = healthData?.services?.[service.key as keyof typeof healthData.services] || 'unknown';
            return (
              <div key={service.key} className="flex items-center space-x-3">
                <div className={`status-indicator ${getStatusColor(status)}`}></div>
                <div>
                  <div className="text-sm font-medium text-foreground">{service.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {getStatusText(status)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {healthData?.timestamp && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Last updated: {new Date(healthData.timestamp).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
