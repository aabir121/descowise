// Generic API fetch helper with error handling

export async function fetchJsonWithHandling(url: string): Promise<any> {
    const response = await fetch(url);
    if (!response.ok) {
        let errorMessage = `API error (status: ${response.status})`;
        try {
            const errorJson = await response.json();
            if (errorJson.message) errorMessage = errorJson.message;
        } catch (e) {
            // Ignore JSON parse errors
        }
        throw new Error(errorMessage);
    }
    return response.json();
} 