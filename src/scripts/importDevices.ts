import { supabase } from "@/integrations/supabase/client";
import { DeviceType, DeviceStatus } from "@/types/device";

interface CSVRow {
  'Responsável (drop down)': string;
  'Tipo (short text)': string;
  'Modelo (short text)': string;
  'Task Name': string;
  'Processador (short text)'?: string;
  'Memória RAM (short text)'?: string;
  'Armazenamento (short text)'?: string;
  'Tamanho Tela (short text)'?: string;
  'Situacao (drop down)': string;
  'Hexnode (drop down)'?: string;
}

// Mapeamento de tipos do CSV para DeviceType
const TYPE_MAP: Record<string, DeviceType> = {
  'Computador': 'computer',
  'Monitor': 'monitor',
  'Mouse': 'mouse',
  'Teclado': 'keyboard',
  'Headset': 'headset',
  'Webcam': 'webcam',
  'Celular': 'phone',
  'iPhone': 'phone',
  'Android': 'phone',
  'Tablet': 'tablet',
  'Apple TV': 'apple_tv',
  'Chromecast': 'chromecast',
  'Cabo': 'cable',
  'Carregador': 'charger',
};

// Mapeamento de status do CSV para DeviceStatus
const STATUS_MAP: Record<string, DeviceStatus> = {
  'Emprestado': 'borrowed',
  'Disponível': 'available',
  'Escritório': 'office',
  'Defeito': 'defective',
  'Devolvido': 'returned',
  'Não encontrado': 'not_found',
  'Em manutenção': 'maintenance',
  'Pendente de formatação': 'pending_format',
  'Pendente de devolução': 'pending_return',
  'Vendido': 'sold',
  'Doado': 'donated',
};

// Função para limpar valores N/A
const cleanValue = (value: string | undefined): string | undefined => {
  if (!value || value.trim() === '' || value.toLowerCase() === 'n/a') {
    return undefined;
  }
  return value.trim();
};

// Função para extrair número de strings como "16GB" ou "512 GB"
const extractNumber = (value: string | undefined): number | undefined => {
  if (!value) return undefined;
  const cleaned = cleanValue(value);
  if (!cleaned) return undefined;
  const match = cleaned.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : undefined;
};

// Função para encontrar usuário por nome ou email
const findUserByNameOrEmail = async (
  name: string,
  employees: any[]
): Promise<{ id: string; name: string } | null> => {
  if (!name || name.trim() === '') return null;

  const cleanName = name.trim().toLowerCase();

  // Caso especial: Popcode - deixar sem user_id
  if (cleanName === 'popcode') {
    return { id: '', name: 'Popcode' };
  }

  // Tentar match por full_name exato
  let match = employees.find(
    (p) => p.full_name?.toLowerCase() === cleanName
  );

  if (match) {
    return { id: match.id, name: match.full_name || match.email.split('@')[0] };
  }

  // Tentar match por email (antes do @)
  match = employees.find(
    (p) => p.email.split('@')[0].toLowerCase() === cleanName
  );

  if (match) {
    return { id: match.id, name: match.full_name || match.email.split('@')[0] };
  }

  // Tentar match parcial no nome
  match = employees.find(
    (p) => 
      p.full_name?.toLowerCase().includes(cleanName) ||
      cleanName.includes(p.full_name?.toLowerCase())
  );

  if (match) {
    return { id: match.id, name: match.full_name || match.email.split('@')[0] };
  }

  // Se não encontrou, usar apenas o nome sem user_id
  return { id: '', name };
};

export const importDevicesFromCSV = async (csvData: CSVRow[]) => {
  try {
    // Buscar todos os employees de uma vez
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, email, full_name');

    if (employeesError) {
      throw employeesError;
    }

    const devices: Array<{
      user_name: string;
      user_id: string | null;
      device_type: DeviceType;
      status: DeviceStatus;
      model: string;
      year: number;
      processor: string | undefined;
      ram: number | undefined;
      disk: number | undefined;
      screen_size: number | undefined;
      hexnode_registered: boolean;
      serial: undefined;
      warranty_date: undefined;
      notes: undefined;
    }> = [];
    const skipped: string[] = [];

    for (const row of csvData) {
      // Pular equipamentos não encontrados ou sem dados
      const situacao = row['Situacao (drop down)'];
      if (!situacao || situacao === 'Não encontrado') {
        skipped.push(`${row['Tipo (short text)']} - ${row['Modelo (short text)'] || row['Task Name']} (${situacao || 'Sem status'})`);
        continue;
      }

      // Mapear tipo
      const tipoRaw = row['Tipo (short text)'];
      const deviceType = TYPE_MAP[tipoRaw] || 'other';

      // Mapear status
      const status = STATUS_MAP[situacao] || 'borrowed';

      // Encontrar usuário
      const responsavel = row['Responsável (drop down)'];
      const userMatch = await findUserByNameOrEmail(responsavel, employees || []);

      // Usar Task Name como modelo se Modelo estiver vazio
      const model = cleanValue(row['Modelo (short text)']) || cleanValue(row['Task Name']) || 'Sem modelo';

      // Ano - extrair do modelo ou usar ano atual
      const year = new Date().getFullYear();

      // Processar campos específicos
      const processor = deviceType === 'computer' ? cleanValue(row['Processador (short text)']) : undefined;
      const ram = deviceType === 'computer' ? extractNumber(row['Memória RAM (short text)']) : undefined;
      const disk = deviceType === 'computer' ? extractNumber(row['Armazenamento (short text)']) : undefined;
      const screenSize = (deviceType === 'computer' || deviceType === 'monitor') 
        ? extractNumber(row['Tamanho Tela (short text)']) 
        : undefined;

      // Processar Hexnode (apenas para computadores)
      const hexnodeRaw = row['Hexnode (drop down)'];
      const hexnodeRegistered = deviceType === 'computer' 
        ? hexnodeRaw === 'Cadastrado'
        : false;

      devices.push({
        user_name: userMatch?.name || responsavel || 'Sem responsável',
        user_id: userMatch?.id || null,
        device_type: deviceType,
        status,
        model,
        year,
        processor,
        ram,
        disk,
        screen_size: screenSize,
        hexnode_registered: hexnodeRegistered,
        serial: undefined,
        warranty_date: undefined,
        notes: undefined,
      });
    }

    console.log(`Importando ${devices.length} equipamentos...`);
    console.log(`Pulados: ${skipped.length} equipamentos`);

    if (devices.length > 0) {
      const { data, error } = await supabase
        .from('devices')
        .insert(devices)
        .select();

      if (error) {
        console.error('Erro ao importar:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} equipamentos importados com sucesso!`);
      console.log('\nEquipamentos pulados:');
      skipped.forEach(item => console.log(`  - ${item}`));
    }

    return {
      imported: devices.length,
      skipped: skipped.length,
      skippedItems: skipped,
    };
  } catch (error) {
    console.error('Erro durante importação:', error);
    throw error;
  }
};
