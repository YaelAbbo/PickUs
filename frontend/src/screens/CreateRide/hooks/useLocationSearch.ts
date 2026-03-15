import { useEffect, useRef, useState } from 'react';
import { useNominatimSearch, type NominatimResult } from './useNominatimSearch';

export type PlaceResult = {
  placeId: string;
  description: string;
  lat: number;
  lng: number;
};

export type UseLocationSearchArgs = {
  debounceMs?: number;
  countryCode?: string;
  language?: string;
};

export type UseLocationSearchContent = ReturnType<typeof useLocationSearch>;

export const useLocationSearch = ({ debounceMs = 400, countryCode, language }: UseLocationSearchArgs) => {
  const { search } = useNominatimSearch({ countryCode, language });

  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false); // true once a query has completed
  const [fetchError, setFetchError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const query = (text: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.length < 2) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    // Show loading immediately when user types (before debounce fires)
    setLoading(true);
    setSearched(false);

    debounceRef.current = setTimeout(async () => {
      setFetchError(null);
      try {
        const data = await search(text);
        setResults(data);
      } catch (e) {
        setFetchError(e instanceof Error ? e.message : 'שגיאה בחיפוש');
        setResults([]);
      } finally {
        setLoading(false);
        setSearched(true);
      }
    }, debounceMs);
  };

  const clear = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setResults([]);
    setSearched(false);
    setLoading(false);
    setFetchError(null);
  };

  const toPlace = (item: NominatimResult): PlaceResult => {
    const short = item.display_name.split(',').slice(0, 2).join(',').trim();
    return {
      placeId: item.place_id,
      description: short,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    };
  };

  const isSearching = loading;
  const hasNoResults = searched && !loading && results.length === 0 && !fetchError;

  return { results, isSearching, hasNoResults, fetchError, query, clear, toPlace };
};
