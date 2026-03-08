export type DeviceType = 
  | 'computer'
  | 'monitor'
  | 'mouse'
  | 'keyboard'
  | 'headset'
  | 'webcam'
  | 'phone'
  | 'tablet'
  | 'apple_tv'
  | 'chromecast'
  | 'cable'
  | 'charger'
  | 'other';

export type DeviceStatus = 
  | 'borrowed'           // Emprestado
  | 'available'          // Disponível
  | 'office'             // Escritório
  | 'defective'          // Defeito
  | 'returned'           // Devolvido
  | 'not_found'          // Não encontrado
  | 'maintenance'        // Em manutenção
  | 'pending_format'     // Pendente de formatação
  | 'pending_return'     // Pendente de devolução
  | 'sold'               // Vendido
  | 'donated';           // Doado

export interface Device {
  id: string;
  user_name: string;
  model: string;
  year: number;
  device_type: DeviceType;
  status: DeviceStatus;
  
  // Campos específicos de computador (NULLABLE)
  processor?: string;
  ram?: number;
  disk?: number;
  
  // Campo específico de monitor (NULLABLE)
  screen_size?: number;
  
  // Campos comuns opcionais
  notes?: string;
  serial?: string;
  warranty_date?: string;
  hexnode_registered?: boolean;
  
  // Campos de sistema
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  employees?: {
    email: string;
    full_name?: string;
  };
}
