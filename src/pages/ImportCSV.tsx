import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { importDevicesFromCSV } from "@/scripts/importDevices";
import { ArrowLeft, Upload, CheckCircle2, AlertCircle, Eye } from "lucide-react";
import { DEVICE_TYPE_LABELS, DEVICE_STATUS_LABELS } from "@/constants/device";

const ImportCSV = () => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    skippedItems: string[];
  } | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      setResult(null);
      setPreviewData(null);
      
      // Parse CSV para preview
      try {
        const text = await selectedFile.text();
        const csvData = parseCSV(text);
        setPreviewData(csvData.slice(0, 10)); // Mostrar apenas os primeiros 10
      } catch (error) {
        console.error("Erro ao ler arquivo:", error);
        toast({
          title: "Erro ao ler arquivo",
          description: "Não foi possível ler o arquivo CSV.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo CSV válido.",
        variant: "destructive",
      });
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split("\n");
    const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ''));
    const data: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = lines[i].split(",").map(v => v.trim().replace(/"/g, ''));
      const row: any = {};

      headers.forEach((header, index) => {
        row[header] = values[index];
      });

      data.push(row);
    }

    return data;
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione um arquivo CSV primeiro.",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);

    try {
      const text = await file.text();
      const csvData = parseCSV(text);

      const importResult = await importDevicesFromCSV(csvData);
      setResult(importResult);

      toast({
        title: "Importação concluída!",
        description: `${importResult.imported} equipamentos importados, ${importResult.skipped} pulados.`,
      });
    } catch (error: any) {
      console.error("Erro ao importar CSV:", error);
      toast({
        title: "Erro na importação",
        description: error.message || "Ocorreu um erro ao importar o CSV.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Importar Equipamentos</h1>
            <p className="text-muted-foreground">
              Importar dados de equipamentos a partir de um arquivo CSV
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload do CSV</CardTitle>
            <CardDescription>
              Selecione o arquivo CSV com os dados dos equipamentos para importar.
              Equipamentos com status "Não encontrado" serão automaticamente pulados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={importing}
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  Arquivo selecionado: {file.name}
                </p>
              )}
            </div>

            <Button
              onClick={handleImport}
              disabled={!file || importing || !previewData}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {importing ? "Importando..." : "Confirmar e Importar Equipamentos"}
            </Button>
          </CardContent>
        </Card>

        {previewData && previewData.length > 0 && !result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                Pré-visualização dos Dados
              </CardTitle>
              <CardDescription>
                Mostrando até 10 registros do arquivo. Verifique se os dados estão corretos antes de importar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de linhas</p>
                    <p className="text-2xl font-bold">{previewData.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tipos encontrados</p>
                    <p className="text-lg font-semibold">
                      {[...new Set(previewData.map(d => d['Tipo (short text)']).filter(Boolean))].length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status diferentes</p>
                    <p className="text-lg font-semibold">
                      {[...new Set(previewData.map(d => d['Situacao (drop down)']).filter(Boolean))].length}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Responsável</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Specs</TableHead>
                        <TableHead>Hexnode</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {row['Tipo (short text)'] || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {row['Situacao (drop down)'] || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {row['Responsável (drop down)'] || '-'}
                          </TableCell>
                          <TableCell>
                            {row['Modelo (short text)'] || row['Task Name'] || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {row['Processador (short text)'] && `CPU: ${row['Processador (short text)']}`}
                            {row['Memória RAM (short text)'] && ` | RAM: ${row['Memória RAM (short text)']}`}
                            {row['Armazenamento (short text)'] && ` | Disco: ${row['Armazenamento (short text)']}`}
                          </TableCell>
                          <TableCell>
                            {row['Hexnode (drop down)'] === 'Cadastrado' ? (
                              <Badge className="bg-status-success text-status-success-foreground">Sim</Badge>
                            ) : (
                              <Badge variant="outline">Não</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Resultado da Importação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-sm text-muted-foreground">Importados</p>
                  <p className="text-2xl font-bold text-green-600">{result.imported}</p>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <p className="text-sm text-muted-foreground">Pulados</p>
                  <p className="text-2xl font-bold text-orange-600">{result.skipped}</p>
                </div>
              </div>

              {result.skippedItems.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Equipamentos Pulados:
                  </h4>
                  <div className="space-y-1 max-h-60 overflow-y-auto bg-muted p-3 rounded-md">
                    {result.skippedItems.map((item, index) => (
                      <p key={index} className="text-sm text-muted-foreground">
                        • {item}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={() => navigate("/")}
                className="w-full"
              >
                Voltar para o Inventário
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ImportCSV;
