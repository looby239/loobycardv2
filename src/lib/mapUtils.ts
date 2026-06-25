export function getMapIframeSrc(card: { map_url?: string | null, venue_address?: string | null, venue_name?: string | null }): string {
  let fallbackQuery = card.venue_address || card.venue_name || '';
  let mapIframeSrc = `https://maps.google.com/maps?q=${encodeURIComponent(fallbackQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  
  if (card.map_url) {
    if (card.map_url.includes('<iframe') && card.map_url.includes('src="')) {
      const match = card.map_url.match(/src="([^"]+)"/);
      if (match && match[1]) {
        return match[1];
      }
    } else if (card.map_url.includes('google.com/maps/embed') || card.map_url.includes('/embed?')) {
      return card.map_url;
    } else if (card.map_url.includes('@')) {
      const coordMatch = card.map_url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (coordMatch) {
        return `https://maps.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
      }
    }
  }

  return mapIframeSrc;
}

export async function expandMapUrl(url: string | null | undefined): Promise<string | null | undefined> {
  if (!url) return url;
  if (url.includes('maps.app.goo.gl') || url.includes('goo.gl/maps')) {
    try {
      const res = await fetch(url, { redirect: 'manual' });
      const location = res.headers.get('location');
      if (location) {
        return location;
      }
    } catch (e) {
      console.error('Error expanding map url', e);
    }
  }
  return url;
}
