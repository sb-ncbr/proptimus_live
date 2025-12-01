import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

const useInputHinting = (searchValue: string, debounceMs = 300) => {
    const [debouncedValue, setDebouncedValue] = useState(searchValue);

    // Debounce the search value
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(searchValue);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [searchValue, debounceMs]);

    // Only fetch if we have a debounced value that's not empty
    const shouldFetch = debouncedValue.trim().length > 0;

    const query = useQuery({
        queryKey: ["input-hinting", debouncedValue],
        queryFn: async () => {
            if (!shouldFetch) {
                return [];
            }

            const response = await fetch(
                `/api/input-hinting?value=${encodeURIComponent(debouncedValue)}`
            );

            console.log('Input hinting response:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                url: response.url
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch hints: ${response.status} ${response.statusText}`);
            }

            const text = await response.text();
            console.log('Response text:', text);

            if (!text) {
                console.warn('Empty response body');
                return [];
            }

            try {
                return JSON.parse(text) as string[];
            } catch (error) {
                console.error('Failed to parse JSON:', error, 'Raw text:', text);
                throw new Error('Invalid JSON response');
            }
        },
        enabled: shouldFetch,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
    });

    return {
        hints: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
    };
};

export default useInputHinting;
