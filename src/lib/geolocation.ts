export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

/**
 * Captura a posição atual do usuário via Geolocation API do navegador.
 */
export function getCurrentPosition(): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalização não suportada pelo navegador"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            reject(new Error("Permissão de localização negada. Habilite nas configurações do navegador."));
            break;
          case err.POSITION_UNAVAILABLE:
            reject(new Error("Localização indisponível."));
            break;
          case err.TIMEOUT:
            reject(new Error("Tempo esgotado ao buscar localização."));
            break;
          default:
            reject(new Error("Erro ao obter localização."));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Calcula distância em metros entre dois pontos (fórmula de Haversine).
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // raio da Terra em metros
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Verifica se uma posição está dentro de alguma das geocercas.
 */
export function isWithinAnyFence(
  position: GeoPosition,
  locations: { latitude: number; longitude: number; radius_meters: number }[]
): boolean {
  if (locations.length === 0) return true; // sem locais configurados = sem restrição

  return locations.some((loc) => {
    const distance = haversineDistance(
      position.latitude,
      position.longitude,
      loc.latitude,
      loc.longitude
    );
    return distance <= loc.radius_meters;
  });
}
