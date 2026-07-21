export async function validateImageUrl(url) {
    if (!url) return false;
    try {
        const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
        return response.status === 200;
    } catch (e) {
        // Fallback to GET if HEAD fails (some CDNs block HEAD)
        try {
            const response = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(5000) });
            return response.status === 200;
        } catch (err) {
            return false;
        }
    }
}
