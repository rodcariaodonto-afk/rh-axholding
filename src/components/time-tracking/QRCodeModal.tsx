import { useEffect, useRef, useState, useCallback } from "react";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, QrCode } from "lucide-react";

interface QRCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    radius_meters: number;
  } | null;
}

export function QRCodeModal({ open, onOpenChange, location }: QRCodeModalProps) {
  const [qrUrl, setQrUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    if (!open || !location) return;

    const publishedUrl = "https://ax-rh.lovable.app";
    const url = `${publishedUrl}/registrar-ponto?local=${location.id}&lat=${location.latitude}&lng=${location.longitude}&raio=${location.radius_meters}`;
    setQrUrl(url);

    QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    }).then((dataUrl) => {
      setQrDataUrl(dataUrl);
    }).catch((err) => {
      console.error("QR Code generation failed:", err);
    });
  }, [open, location]);

  const handleDownload = () => {
    if (!qrDataUrl || !location) return;
    const link = document.createElement("a");
    link.download = `qrcode-${location.name.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="size-5" />
            QR Code — {location?.name}
          </DialogTitle>
          <DialogDescription>
            Imprima ou exiba este QR Code no local para que os colaboradores registrem o ponto.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR Code" className="rounded-lg border" width={300} height={300} />
          ) : (
            <div className="w-[300px] h-[300px] rounded-lg border flex items-center justify-center text-muted-foreground text-sm">
              Gerando QR Code...
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center max-w-xs break-all">
            {qrUrl}
          </p>

          <Button onClick={handleDownload} className="gap-2" disabled={!qrDataUrl}>
            <Download className="size-4" />
            Baixar QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
