import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { useNominatimSearch, type NominatimResult } from './useNominatimSearch';

export type PlaceResult = {
  placeId: string;
  description: string;
  lat: number;
  lng: number;
};

const QUERY_KEY = 'location-search';

export const convertNominatimResultToPlaceResult = (item: NominatimResult): PlaceResult => {
  const description = item.display_name.split(',').slice(0, 2).join(',').trim();

  return { placeId: item.place_id, description, lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
};

export type UseLocationSearchArgs = {
  debounceMs?: number;
  countryCode?: string;
  language?: string;
};

export type UseLocationSearchContent = ReturnType<typeof useLocationSearch>;

export const useLocationSearch = ({ debounceMs = 400, countryCode, language }: UseLocationSearchArgs) => {
  const queryClient = useQueryClient();
  const { search } = useNominatimSearch({ countryCode, language });

  const debounceRef = useRef<number | null>(null);
  const searchTextRef = useRef('');

  const {
    data: results = [],
    isFetching,
    isSuccess,
    error,
  } = useQuery<NominatimResult[], Error>({
    queryKey: [QUERY_KEY, searchTextRef.current],
    queryFn: () => search(searchTextRef.current),
    enabled: searchTextRef.current.length >= 2,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const query = (text: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.length < 2) {
      searchTextRef.current = '';
      queryClient.removeQueries({ queryKey: [QUERY_KEY] });

      return;
    }

    debounceRef.current = setTimeout(() => {
      searchTextRef.current = text;

      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, text] });
    }, debounceMs);
  };

  const clear = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    searchTextRef.current = '';
    queryClient.removeQueries({ queryKey: [QUERY_KEY] });
  };

  const isSearchDone = isSuccess && !isFetching;
  const isSearching = isFetching;
  const hasNoResults = isSearchDone && results.length === 0 && !error;
  const fetchError = error?.message ?? null;

  return { results, isSearching, hasNoResults, fetchError, query, clear };
};
