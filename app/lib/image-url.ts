const knownUnsplashImages: Record<string, string> = {
  "2YuuSQlgoPA":
    "https://images.unsplash.com/photo-1613483515012-8879be29b578?auto=format&fit=crop&w=320&q=80",
};

export function normalizeMenuImageUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname !== "unsplash.com" && parsedUrl.hostname !== "www.unsplash.com") {
      return url;
    }

    const photoId = parsedUrl.pathname.split("-").at(-1);
    return (photoId && knownUnsplashImages[photoId]) || url;
  } catch {
    return url;
  }
}
