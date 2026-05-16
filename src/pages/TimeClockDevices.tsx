import { DevicesTab } from "@/components/time-tracking/DevicesTab";

export default function TimeClockDevices() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dispositivos de Ponto</h1>
        <p className="text-muted-foreground">
          Cadastre relógios REP, kioskos, apps móveis e demais coletores. Faça importações AFD/CSV manualmente quando necessário.
        </p>
      </div>
      <DevicesTab />
    </div>
  );
}
