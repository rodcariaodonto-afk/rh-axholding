import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getCurrentPosition } from "@/lib/geolocation";
import { Navigation, Loader2, Search, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface AddLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; latitude: number; longitude: number; radius_meters: number }) => void;
  isPending: boolean;
}

export function AddLocationDialog({ open, onOpenChange, onSubmit, isPending }: AddLocationDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radius, setRadius] = useState("200");
  const [isCapturing, setIsCapturing] = useState(false);

  // Address search state
  const [addressQuery, setAddressQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close results dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const searchAddress = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=br`,
        { headers: { "Accept-Language": "pt-BR" } }
      );
      const data: NominatimResult[] = await res.json();
      setSearchResults(data);
      setShowResults(true);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddressChange = (value: string) => {
    setAddressQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAddress(value), 400);
  };

  const handleSelectResult = (result: NominatimResult) => {
    setLatitude(parseFloat(result.lat).toFixed(6));
    setLongitude(parseFloat(result.lon).toFixed(6));
    setAddressQuery(result.display_name);
    setShowResults(false);
    if (!name) {
      // Auto-fill name with first part of address
      const shortName = result.display_name.split(",").slice(0, 2).join(",").trim();
      setName(shortName);
    }
    toast({ title: "Endereço selecionado", description: result.display_name.slice(0, 80) });
  };

  const handleCaptureLocation = async () => {
    setIsCapturing(true);
    try {
      const pos = await getCurrentPosition();
      setLatitude(pos.latitude.toFixed(6));
      setLongitude(pos.longitude.toFixed(6));
      toast({ title: "Localização capturada", description: `Precisão: ${Math.round(pos.accuracy)}m` });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSubmit = () => {
    if (!name || !latitude || !longitude) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    onSubmit({
      name,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radius_meters: parseInt(radius) || 200,
    });
    // Reset form
    setName("");
    setLatitude("");
    setLongitude("");
    setRadius("200");
    setAddressQuery("");
    setSearchResults([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="size-4 mr-1" />
          Adicionar Local
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Local Autorizado</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do local</Label>
            <Input
              placeholder="Ex: Escritório São Paulo"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Address search */}
          <div className="space-y-2" ref={wrapperRef}>
            <Label>Buscar endereço</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Digite um endereço, cidade ou local..."
                value={addressQuery}
                onChange={(e) => handleAddressChange(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                className="pl-9"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {showResults && searchResults.length > 0 && (
              <div className="border rounded-md bg-popover shadow-md max-h-48 overflow-y-auto">
                {searchResults.map((r) => (
                  <button
                    key={r.place_id}
                    type="button"
                    className="flex items-start gap-2 w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                    onClick={() => handleSelectResult(r)}
                  >
                    <MapPin className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <span className="line-clamp-2">{r.display_name}</span>
                  </button>
                ))}
              </div>
            )}
            {showResults && addressQuery.length >= 3 && searchResults.length === 0 && !isSearching && (
              <p className="text-xs text-muted-foreground px-1">Nenhum resultado encontrado.</p>
            )}
          </div>

          <div className="relative flex items-center gap-3">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground">ou</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleCaptureLocation}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Navigation className="size-4 mr-2" />
            )}
            Usar minha localização atual
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Latitude</Label>
              <Input
                type="number"
                step="any"
                placeholder="-23.550520"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Longitude</Label>
              <Input
                type="number"
                step="any"
                placeholder="-46.633308"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Raio permitido (metros)</Label>
            <Input
              type="number"
              placeholder="200"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Distância máxima em metros a partir do ponto central
            </p>
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
            Salvar Local
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
