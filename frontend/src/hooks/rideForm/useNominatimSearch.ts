const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export type NominatimResult = {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
};

export type UseNominatimSearchArgs = {
  countryCode?: string;
  language?: string;
  limit?: number;
};

export type UseNominatimSearchContent = ReturnType<typeof useNominatimSearch>;

export const useNominatimSearch = ({ countryCode = 'il', language = 'he', limit = 5 }: UseNominatimSearchArgs) => {
  const search = async (query: string): Promise<NominatimResult[]> => {
    if (query.length < 2) return [];

    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      countrycodes: countryCode,
      limit: String(limit),
      'accept-language': language,
    });

    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { 'User-Agent': 'PickUs-App/1.0' },
    });

    if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);
    return res.json();
  };

  return { search };
};
