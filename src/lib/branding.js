export async function fetchBrandingConfig() {
  try {
    const response = await fetch('https://beacon-92324875.base44.app/functions/getHubConfig');
    const data = await response.json();
    return {
      primaryColor: data.config.branding.brand_primary_color,
      secondaryColor: data.config.branding.brand_secondary_color,
    };
  } catch (error) {
    console.error('Failed to fetch branding config:', error);
    return null;
  }
}

export function applyBrandingColors(primaryColor, secondaryColor) {
  const root = document.documentElement;
  if (primaryColor) {
    root.style.setProperty('--primary-dynamic', primaryColor);
  }
  if (secondaryColor) {
    root.style.setProperty('--secondary-dynamic', secondaryColor);
  }
}