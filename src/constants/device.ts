import { DeviceType, DeviceStatus } from "@/types/device";
import { 
  Monitor, 
  Mouse, 
  Keyboard, 
  Headphones, 
  Webcam, 
  Smartphone, 
  Tablet, 
  Tv, 
  Cast, 
  Cable, 
  Plug, 
  HelpCircle,
  Laptop
} from "lucide-react";

export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  computer: 'Computador',
  monitor: 'Monitor',
  mouse: 'Mouse',
  keyboard: 'Teclado',
  headset: 'Headset',
  webcam: 'Webcam',
  phone: 'Celular',
  tablet: 'Tablet',
  apple_tv: 'Apple TV',
  chromecast: 'Chromecast',
  cable: 'Cabo',
  charger: 'Carregador',
  other: 'Outro',
};

export const DEVICE_TYPE_ICONS: Record<DeviceType, any> = {
  computer: Laptop,
  monitor: Monitor,
  mouse: Mouse,
  keyboard: Keyboard,
  headset: Headphones,
  webcam: Webcam,
  phone: Smartphone,
  tablet: Tablet,
  apple_tv: Tv,
  chromecast: Cast,
  cable: Cable,
  charger: Plug,
  other: HelpCircle,
};

export const DEVICE_STATUS_LABELS: Record<DeviceStatus, string> = {
  borrowed: 'Emprestado',
  available: 'Disponível',
  office: 'Escritório',
  defective: 'Defeito',
  returned: 'Devolvido',
  not_found: 'Não Encontrado',
  maintenance: 'Em Manutenção',
  pending_format: 'Pendente de Formatação',
  pending_return: 'Pendente de Devolução',
  sold: 'Vendido',
  donated: 'Doado',
};

export const DEVICE_STATUS_VARIANTS: Record<DeviceStatus, "info" | "success" | "purple" | "error" | "neutral" | "orange" | "warning" | "amber" | "cyan" | "slate" | "teal"> = {
  borrowed: 'info',
  available: 'success',
  office: 'purple',
  defective: 'error',
  returned: 'neutral',
  not_found: 'orange',
  maintenance: 'warning',
  pending_format: 'amber',
  pending_return: 'cyan',
  sold: 'slate',
  donated: 'teal',
};
