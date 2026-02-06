/**
 * Helper to fix malformed Discord URLs that sometimes appear concatenated in the DB
 * Example: https://cdn.discordapp.com/avatars/795699837907632159/https://cdn.discordapp.com/embed/avatars/0.png.png
 */
export const getCleanAvatarUrl = (url: string | null | undefined): string | undefined => {
    if (!url) return undefined;

    // Handle concatenated URLs by taking the last valid starting point
    const lastHttps = url.lastIndexOf('https://');
    if (lastHttps > 0) {
        return url.substring(lastHttps);
    }

    return url;
};
