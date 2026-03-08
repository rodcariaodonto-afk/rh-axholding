import { useState, useEffect } from "react";

interface City {
  id: number;
  nome: string;
}

export const useBrazilianCities = (stateCode: string | undefined) => {
  const [cities, setCities] = useState<{ value: string; label: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCities = async () => {
      if (!stateCode) {
        setCities([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateCode}/municipios?orderBy=nome`
        );
        const data: City[] = await response.json();
        
        setCities(
          data.map((city) => ({
            value: city.nome,
            label: city.nome,
          }))
        );
      } catch (error) {
        console.error("Error fetching cities:", error);
        setCities([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCities();
  }, [stateCode]);

  return { cities, isLoading };
};
