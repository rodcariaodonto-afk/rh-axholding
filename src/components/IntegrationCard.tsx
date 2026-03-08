import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Check, 
  Trash2, 
  RefreshCw, 
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  ExternalLink,
  Zap,
  Clock
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { OrganizationIntegration } from "@/hooks/useOrganizationIntegrations";

interface ProviderMeta {
  name: string;
  description: string;
  placeholder: string;
  icon?: React.ReactNode;
  helpUrl?: string;
  helpText?: string;
}

interface IntegrationCardProps {
  provider: string;
  meta: ProviderMeta;
  integration?: OrganizationIntegration;
  onSave: (apiKey: string, testConnection: boolean) => Promise<void>;
  onDelete: () => Promise<void>;
  onTest?: () => Promise<void>;
  isSaving: boolean;
  isDeleting: boolean;
  isTesting?: boolean;
}

export function IntegrationCard({
  provider,
  meta,
  integration,
  onSave,
  onDelete,
  onTest,
  isSaving,
  isDeleting,
  isTesting,
}: IntegrationCardProps) {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testConnection, setTestConnection] = useState(true);

  const isConnected = !!integration;
  const hasError = integration?.status === "error";
  const isLoading = isSaving || isDeleting || isTesting;

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    await onSave(apiKey, testConnection);
    setApiKey("");
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTestStatusBadge = () => {
    if (!integration) return null;
    
    if (integration.last_tested_at === null) {
      return (
        <Badge variant="outline" className="text-muted-foreground">
          <Clock className="w-3 h-3 mr-1" />
          Nunca testado
        </Badge>
      );
    }
    
    if (integration.last_test_success) {
      return (
        <Badge variant="outline" className="border-green-500 text-green-600">
          <Check className="w-3 h-3 mr-1" />
          Testado OK
        </Badge>
      );
    }
    
    return (
      <Badge variant="destructive">
        <AlertCircle className="w-3 h-3 mr-1" />
        Falhou
      </Badge>
    );
  };

  return (
    <Card className={hasError ? "border-destructive" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {meta.icon}
            <div>
              <CardTitle className="text-base">
                {integration?.display_name || meta.name}
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm text-muted-foreground">{meta.description}</p>
                {meta.helpUrl && !isConnected && (
                  <a
                    href={meta.helpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1 whitespace-nowrap"
                  >
                    {meta.helpText || "Obter chave"}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isConnected && getTestStatusBadge()}
            {isConnected && (
              <Badge 
                variant={hasError ? "destructive" : "outline"}
                className={!hasError ? "border-green-500 text-green-600" : ""}
              >
                {hasError ? (
                  <><AlertCircle className="w-3 h-3 mr-1" /> Erro</>
                ) : (
                  <><Check className="w-3 h-3 mr-1" /> Conectado</>
                )}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <>
            {/* Connected State */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Chave:</span>
              <code className="bg-muted px-2 py-1 rounded text-xs">
                ••••••••{integration.last_four}
              </code>
            </div>

            {integration.last_used_at && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Último uso:</span>
                <span className="text-xs">{formatDate(integration.last_used_at)}</span>
              </div>
            )}

            {integration.last_tested_at && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Último teste:</span>
                <span className="text-xs">{formatDate(integration.last_tested_at)}</span>
              </div>
            )}

            {hasError && integration.last_error && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                {integration.last_error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <div className="flex-1 relative">
                <Input
                  type={showKey ? "text" : "password"}
                  placeholder="Nova chave para substituir"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={isLoading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={!apiKey.trim() || isLoading}
                title="Substituir chave"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
              {onTest && (
                <Button
                  variant="outline"
                  onClick={onTest}
                  disabled={isLoading}
                  title="Testar conexão"
                >
                  {isTesting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon" disabled={isLoading}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remover integração?</AlertDialogTitle>
                    <AlertDialogDescription>
                      A integração com {meta.name} será removida. Funcionalidades que dependem 
                      desta integração deixarão de funcionar.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={onDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Remover
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        ) : (
          <>
            {/* Disconnected State */}
            <div className="space-y-3">
              <div className="relative">
                <Input
                  type={showKey ? "text" : "password"}
                  placeholder={meta.placeholder}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={isLoading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id={`test-${provider}`}
                  checked={testConnection}
                  onCheckedChange={(checked) => setTestConnection(checked === true)}
                  disabled={isLoading}
                />
                <Label 
                  htmlFor={`test-${provider}`} 
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Testar conexão antes de salvar
                </Label>
              </div>

              <Button
                className="w-full"
                onClick={handleSave}
                disabled={!apiKey.trim() || isLoading}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Conectar
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
