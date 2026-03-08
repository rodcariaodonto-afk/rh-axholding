import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { parseXLSFile, SolidesRow } from "@/lib/parseXLS";
import { previewImport, executeImport, ImportPreview, ImportOptions, ImportResult, EmployeeMatch } from "@/lib/importEmployees";

type ImportStep = "upload" | "preview" | "importing" | "result";

export default function ImportEmployees() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<SolidesRow[]>([]);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [options, setOptions] = useState<ImportOptions>({
    updatePersonalData: true,
    updateContactData: true,
    updateContractData: true,
    processTerminations: true,
    createNewEmployees: false,
  });

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ];
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();

    if (!validTypes.includes(selectedFile.type) && !['xls', 'xlsx', 'csv'].includes(fileExtension || '')) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione um arquivo .xls, .xlsx ou .csv",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setIsLoading(true);

    try {
      const parsedRows = await parseXLSFile(selectedFile);
      setRows(parsedRows);

      const importPreview = await previewImport(parsedRows);
      setPreview(importPreview);
      setStep("preview");

      toast({
        title: "Arquivo processado",
        description: `${parsedRows.length} linhas encontradas`,
      });
    } catch (error) {
      toast({
        title: "Erro ao processar arquivo",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleImport = useCallback(async () => {
    if (!preview) return;

    setStep("importing");
    setIsLoading(true);

    try {
      const importResult = await executeImport(
        preview.matched, 
        options.createNewEmployees ? preview.notFound : [],
        options
      );
      setResult(importResult);
      setStep("result");

      const totalProcessed = importResult.updated + importResult.created;
      toast({
        title: "Importação concluída",
        description: `${importResult.updated} atualizados, ${importResult.created} criados`,
      });
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: (error as Error).message,
        variant: "destructive",
      });
      setStep("preview");
    } finally {
      setIsLoading(false);
    }
  }, [preview, options, toast]);

  const handleReset = useCallback(() => {
    setStep("upload");
    setFile(null);
    setRows([]);
    setPreview(null);
    setResult(null);
  }, []);

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">Importar Colaboradores</h1>
        <p className="text-muted-foreground mt-2">
          Importe dados de colaboradores a partir de um arquivo Excel exportado da Solides
        </p>
      </div>

      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Upload do Arquivo
            </CardTitle>
            <CardDescription>
              Selecione um arquivo .xls ou .xlsx exportado da Solides. O sistema irá fazer o match
              pelo <strong>Email Empresarial</strong> para atualizar colaboradores existentes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept=".xls,.xlsx,.csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                disabled={isLoading}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-4"
              >
                {isLoading ? (
                  <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
                ) : (
                  <Upload className="h-12 w-12 text-muted-foreground" />
                )}
                <div>
                  <p className="text-lg font-medium">
                    {isLoading ? "Processando arquivo..." : "Clique para selecionar um arquivo"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Formatos aceitos: .xls, .xlsx, .csv
                  </p>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "preview" && preview && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{preview.matched.length}</p>
                    <p className="text-sm text-muted-foreground">Colaboradores encontrados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <XCircle className="h-8 w-8 text-destructive" />
                  <div>
                    <p className="text-2xl font-bold">{preview.notFound.length}</p>
                    <p className="text-sm text-muted-foreground">Email não encontrado</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{preview.noEmail.length}</p>
                    <p className="text-sm text-muted-foreground">Sem email empresarial</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Import Options */}
          <Card>
            <CardHeader>
              <CardTitle>Opções de Importação</CardTitle>
              <CardDescription>Selecione quais dados deseja atualizar</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="personalData"
                  checked={options.updatePersonalData}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({ ...prev, updatePersonalData: !!checked }))
                  }
                />
                <Label htmlFor="personalData">Dados pessoais (nome, nascimento, gênero, etc.)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="contactData"
                  checked={options.updateContactData}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({ ...prev, updateContactData: !!checked }))
                  }
                />
                <Label htmlFor="contactData">Dados de contato (email, telefone, endereço)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="contractData"
                  checked={options.updateContractData}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({ ...prev, updateContractData: !!checked }))
                  }
                />
                <Label htmlFor="contractData">Dados de contrato (admissão, salário, tipo)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terminations"
                  checked={options.processTerminations}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({ ...prev, processTerminations: !!checked }))
                  }
                />
                <Label htmlFor="terminations">Processar desligamentos</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="createNew"
                  checked={options.createNewEmployees}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({ ...prev, createNewEmployees: !!checked }))
                  }
                />
                <Label htmlFor="createNew" className="flex items-center gap-2">
                  Criar novos colaboradores (emails não encontrados)
                  {preview.notFound.length > 0 && (
                    <Badge variant="secondary">{preview.notFound.length}</Badge>
                  )}
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Matched Employees List */}
          {preview.matched.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-primary">
                  Colaboradores a serem atualizados ({preview.matched.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {preview.matched.map((match, index) => (
                      <MatchedEmployeeRow key={index} match={match} />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Not Found List */}
          {preview.notFound.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className={options.createNewEmployees ? "text-primary" : "text-muted-foreground"}>
                  {options.createNewEmployees ? (
                    <>Colaboradores a serem criados ({preview.notFound.length})</>
                  ) : (
                    <>Emails não encontrados ({preview.notFound.length})</>
                  )}
                </CardTitle>
                <CardDescription>
                  {options.createNewEmployees 
                    ? "Estes colaboradores serão criados no sistema"
                    : "Ative a opção 'Criar novos colaboradores' para importá-los"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {preview.notFound.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.name}</span>
                          {item.isTermination && (
                            <Badge variant="destructive" className="text-xs">Desligado</Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">{item.email}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleReset}>
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={preview.matched.length === 0 && !options.createNewEmployees}
            >
              Importar {preview.matched.length + (options.createNewEmployees ? preview.notFound.length : 0)} colaboradores
            </Button>
          </div>
        </div>
      )}

      {step === "importing" && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-lg">Importando dados...</p>
            <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos</p>
          </CardContent>
        </Card>
      )}

      {step === "result" && result && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <CheckCircle className="h-6 w-6" />
                Importação Concluída
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-primary">{result.updated}</p>
                  <p className="text-sm text-muted-foreground">Atualizados</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">{result.created}</p>
                  <p className="text-sm text-muted-foreground">Criados</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-muted-foreground">{result.skipped}</p>
                  <p className="text-sm text-muted-foreground">Sem alterações</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-destructive">{result.errors.length}</p>
                  <p className="text-sm text-muted-foreground">Erros</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {result.createdItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Colaboradores Criados ({result.createdItems.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {result.createdItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-sm text-muted-foreground">{item.email}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {result.updatedItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Colaboradores Atualizados ({result.updatedItems.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {result.updatedItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">{item.email}</span>
                        </div>
                        <Badge variant="secondary">{item.fieldsUpdated.length} campos</Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {result.errors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">Erros</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {result.errors.map((error, index) => (
                      <div key={index} className="py-2 border-b last:border-0">
                        <div className="flex justify-between">
                          <span className="font-medium">{error.name}</span>
                          <span className="text-sm text-muted-foreground">{error.email}</span>
                        </div>
                        <p className="text-sm text-destructive">{error.reason}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={handleReset}>
              Importar outro arquivo
            </Button>
            <Button onClick={() => navigate("/employees")}>
              Ir para Colaboradores
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function MatchedEmployeeRow({ match }: { match: EmployeeMatch }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{match.rowData['Nome'] || match.fullName}</span>
          {match.isTermination && (
            <Badge variant="destructive" className="text-xs">Desligamento</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{match.email}</p>
      </div>
      <div className="flex flex-wrap gap-1 max-w-[300px] justify-end">
        {match.fieldsToUpdate.slice(0, 4).map((field, idx) => (
          <Badge key={idx} variant="outline" className="text-xs">
            {field}
          </Badge>
        ))}
        {match.fieldsToUpdate.length > 4 && (
          <Badge variant="secondary" className="text-xs">
            +{match.fieldsToUpdate.length - 4}
          </Badge>
        )}
      </div>
    </div>
  );
}
