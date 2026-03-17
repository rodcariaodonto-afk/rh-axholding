import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LogIn, LogOut, Loader2, MapPin, ShieldAlert, Coffee, UtensilsCrossed } from "lucide-react";
import { useClockInOut, STEP_LABELS, type ClockStep } from "@/hooks/useClockInOut";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatTimeBrasilia } from "@/lib/timezone";

const STEP_CONFIG: Record<ClockStep, { icon: React.ElementType; className: string }> = {
  clock_in: { icon: LogIn, className: "bg-primary hover:bg-primary/90 text-primary-foreground" },
  lunch_out: { icon: UtensilsCrossed, className: "bg-amber-500 hover:bg-amber-600 text-white" },
  lunch_return: { icon: Coffee, className: "bg-emerald-500 hover:bg-emerald-600 text-white" },
  clock_out: { icon: LogOut, className: "bg-destructive hover:bg-destructive/90 text-destructive-foreground" },
};

export function ClockInOutButton() {
  const { openEntry, isCheckingOpen, nextStep, currentMutation, geolocationRequired } = useClockInOut();
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
    currentMutation.mutate(undefined, {
      onError: (error: Error) => {
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

  const config = STEP_CONFIG[nextStep];
  const Icon = config.icon;

  const statusLabel = nextStep === "clock_in"
    ? "Nenhum ponto aberto"
    : nextStep === "lunch_out"
      ? "Trabalhando desde"
      : nextStep === "lunch_return"
        ? "Em intervalo desde"
        : "Trabalhando desde";

  const displayTime = nextStep === "lunch_return" && openEntry?.lunch_out
    ? formatTimeBrasilia(openEntry.lunch_out)
    : openEntry
      ? formatTimeBrasilia(openEntry.clock_in)
      : null;

  return (
    <div className="flex flex-col items-center gap-4 p-6 rounded-xl border bg-card">
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">{statusLabel}</p>
        {displayTime && (
          <p className="text-2xl font-bold text-foreground">{displayTime}</p>
        )}
      </div>

      {/* Progress indicator */}
      {openEntry && (
        <div className="flex items-center gap-2">
          {(["clock_in", "lunch_out", "lunch_return", "clock_out"] as ClockStep[]).map((step, i) => {
            const done = step === "clock_in" ? !!openEntry.clock_in
              : step === "lunch_out" ? !!openEntry.lunch_out
              : step === "lunch_return" ? !!openEntry.lunch_return
              : !!openEntry.clock_out;
            return (
              <div key={step} className="flex items-center gap-1">
                <div className={`size-2.5 rounded-full ${done ? "bg-primary" : "bg-muted-foreground/30"}`} />
                {i < 3 && <div className={`w-6 h-0.5 ${done ? "bg-primary" : "bg-muted-foreground/20"}`} />}
              </div>
            );
          })}
        </div>
      )}

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
        className={`w-full max-w-xs h-14 text-lg font-semibold ${config.className}`}
        onClick={handleClick}
        disabled={currentMutation.isPending}
      >
        {currentMutation.isPending ? (
          <Loader2 className="size-5 animate-spin mr-2" />
        ) : (
          <Icon className="size-5 mr-2" />
        )}
        {STEP_LABELS[nextStep]}
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
