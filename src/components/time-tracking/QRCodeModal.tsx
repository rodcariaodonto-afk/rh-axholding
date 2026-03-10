import { useEffect, useRef, useState } from "react";
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    if (!open || !location || !canvasRef.current) return;

    const publishedUrl = "https://ax-rh.lovable.app";
    const url = `${publishedUrl}/registrar-ponto?local=${location.id}&lat=${location.latitude}&lng=${location.longitude}&raio=${location.radius_meters}`;
    setQrUrl(url);

    QRCode.toCanvas(canvasRef.current, url, {
      width: 300,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });
  }, [open, location]);

  const handleDownload = () => {
    if (!canvasRef.current || !location) return;
    const link = document.createElement("a");
    link.download = `qrcode-${location.name.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
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
          <canvas ref={canvasRef} className="rounded-lg border" />

          <p className="text-xs text-muted-foreground text-center max-w-xs break-all">
            {qrUrl}
          </p>

          <Button onClick={handleDownload} className="gap-2">
            <Download className="size-4" />
            Baixar QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
