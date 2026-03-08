import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LogIn, LogOut, Loader2, MapPin, ShieldAlert } from "lucide-react";
import { useClockInOut } from "@/hooks/useClockInOut";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function ClockInOutButton() {
  const { isClockedIn, openEntry, isCheckingOpen, clockIn, clockOut, geolocationRequired } = useClockInOut();
  const [geoError, setGeoError] = useState<string | null>(null);

  if (isCheckingOpen) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleClick = () => {
    setGeoError(null);
    const mutation = isClockedIn ? clockOut : clockIn;
    mutation.mutate(undefined, {
      onError: (error: Error) => {
        // Show inline geo errors prominently
        if (
          error.message.includes("área autorizada") ||
          error.message.includes("localização") ||
          error.message.includes("Localização") ||
          error.message.includes("Permissão de localização")
        ) {
          setGeoError(error.message);
        }
      },
    });
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 rounded-xl border bg-card">
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">
          {isClockedIn ? "Ponto aberto desde" : "Nenhum ponto aberto"}
        </p>
        {isClockedIn && openEntry && (
          <p className="text-2xl font-bold text-foreground">
            {format(new Date(openEntry.clock_in), "HH:mm", { locale: ptBR })}
          </p>
        )}
      </div>

      {geoError && (
        <Alert variant="destructive" className="w-full max-w-xs text-left">
          <ShieldAlert className="size-4" />
          <AlertTitle>Ponto não registrado</AlertTitle>
          <AlertDescription className="text-xs mt-1">
            {geoError}
            {geoError.includes("área autorizada") && (
              <span className="block mt-2 text-muted-foreground">
                Você precisa estar em um dos locais autorizados pela empresa para registrar o ponto. Caso acredite que isso é um erro, entre em contato com o RH.
              </span>
            )}
            {geoError.includes("Permissão de localização") && (
              <span className="block mt-2 text-muted-foreground">
                Acesse as configurações do seu navegador e permita o acesso à localização para este site.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Button
        size="lg"
        className={`w-full max-w-xs h-14 text-lg font-semibold ${
          isClockedIn
            ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            : "bg-primary hover:bg-primary/90 text-primary-foreground"
        }`}
        onClick={handleClick}
        disabled={clockIn.isPending || clockOut.isPending}
      >
        {clockIn.isPending || clockOut.isPending ? (
          <Loader2 className="size-5 animate-spin mr-2" />
        ) : isClockedIn ? (
          <LogOut className="size-5 mr-2" />
        ) : (
          <LogIn className="size-5 mr-2" />
        )}
        {isClockedIn ? "Registrar Saída" : "Registrar Entrada"}
      </Button>

      {geolocationRequired && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3" />
          <span>Localização será verificada</span>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
      </p>
    </div>
  );
}
