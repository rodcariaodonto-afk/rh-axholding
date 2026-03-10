import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRegistrarPonto } from "@/hooks/useRegistrarPonto";
import { MapPin, CheckCircle2, XCircle, Loader2, QrCode } from "lucide-react";

export default function RegistrarPonto() {
  const [searchParams] = useSearchParams();
  const localId = searchParams.get("local");
  const lat = parseFloat(searchParams.get("lat") || "0");
  const lng = parseFloat(searchParams.get("lng") || "0");
  const raio = parseFloat(searchParams.get("raio") || "0");

  const { registrar } = useRegistrarPonto();
  const [result, setResult] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [successData, setSuccessData] = useState<{ locationName: string; distance: number } | null>(null);

  const isValidParams = localId && lat !== 0 && lng !== 0 && raio > 0;

  const handleRegistrar = async () => {
    if (!localId) return;
    setResult("idle");
    setErrorMsg("");

    try {
      const data = await registrar.mutateAsync({
        locationId: localId,
        expectedLat: lat,
        expectedLng: lng,
        expectedRadius: raio,
      });
      setResult("success");
      setSuccessData({ locationName: data.locationName, distance: data.distance });
    } catch (err: any) {
      setResult("error");
      setErrorMsg(err.message || "Erro ao registrar ponto.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex items-center justify-center size-14 rounded-full bg-primary/10">
            <QrCode className="size-7 text-primary" />
          </div>
          <CardTitle className="text-xl">Registrar Ponto</CardTitle>
          <p className="text-sm text-muted-foreground">
            Registro via QR Code com validação GPS
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isValidParams ? (
            <Alert variant="destructive">
              <XCircle className="size-4" />
              <AlertTitle>Parâmetros inválidos</AlertTitle>
              <AlertDescription>
                Este link não contém dados válidos de localização. Escaneie o QR Code novamente.
              </AlertDescription>
            </Alert>
          ) : result === "success" && successData ? (
            <div className="text-center space-y-3">
              <div className="mx-auto flex items-center justify-center size-16 rounded-full bg-primary/10">
                <CheckCircle2 className="size-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Ponto registrado!</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p className="flex items-center justify-center gap-1">
                  <MapPin className="size-3" />
                  {successData.locationName}
                </p>
                <p>Distância: {successData.distance}m</p>
              </div>
            </div>
          ) : result === "error" ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <XCircle className="size-4" />
                <AlertTitle>Registro negado</AlertTitle>
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
              <Button onClick={handleRegistrar} className="w-full" size="lg" disabled={registrar.isPending}>
                {registrar.isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                Tentar novamente
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Ao clicar, seu navegador solicitará permissão de localização para validar que você está no local autorizado.
                </p>
              </div>
              <Button
                onClick={handleRegistrar}
                className="w-full"
                size="lg"
                disabled={registrar.isPending}
              >
                {registrar.isPending ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Verificando localização...
                  </>
                ) : (
                  <>
                    <MapPin className="size-4 mr-2" />
                    Registrar ponto
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
