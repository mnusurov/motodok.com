import * as si from 'simple-icons';

// Brand slug → simple-icons export. Preferred source: vector paths built with
// proper internal cutouts (checkered BMW roundel, KIA wordmark, etc). Brands
// without a glyph fall through to the local logo file below, then to a text
// wordmark.
const brandIconKey: Record<string, string> = {
  audi: 'siAudi', bmw: 'siBmw', ford: 'siFord', honda: 'siHonda',
  hyundai: 'siHyundai', infiniti: 'siInfiniti', kia: 'siKia', mazda: 'siMazda',
  mitsub: 'siMitsubishi', nissan: 'siNissan', opel: 'siOpel', peugeot: 'siPeugeot',
  renault: 'siRenault', skoda: 'siSkoda', subaru: 'siSubaru', toyota: 'siToyota',
  vaz: 'siLada', volvo: 'siVolvo', vw: 'siVolkswagen', tesla: 'siTesla',
};

export function brandSvg(slug: string): string | null {
  const icon = (si as Record<string, any>)[brandIconKey[slug]];
  if (!icon) return null;
  return `<svg viewBox="0 0 24 24" fill="currentColor" role="img" aria-hidden="true"><path d="${icon.path}"/></svg>`;
}

// Brands with no simple-icons glyph but a sourced logo file (SVG, or PNG with
// background stripped for transparency) that renders as a clean silhouette —
// car-brand-logos npm package + Wikimedia Commons. Some source files in that
// pack are solid-fill emblems with no internal contrast to mask against (Land
// Rover's oval badge; BMW/Kia/Skoda have the same issue but are already
// covered by simple-icons above) and were rejected after a visual check at
// production size; only checked-good files are listed here. Rendered via CSS
// mask so multi-color source art still comes out as a flat currentColor
// silhouette, matching the simple-icons glyphs above.
const brandLogoFile: Record<string, string> = {
  'mercedes-benz': '/images/brands/mercedes-benz.svg',
  gaz: '/images/brands/gaz.png',
  daewoo: '/images/brands/daewoo.png',
  byd: '/images/brands/byd.svg',
  baic: '/images/brands/baic.svg',
  xpeng: '/images/brands/xpeng.png',
  zeekr: '/images/brands/zeekr.png',
  changan: '/images/brands/changan.png',
  leapmotor: '/images/brands/leapmotor.png',
};

export function brandLogoMask(slug: string): string | null {
  return brandLogoFile[slug] || null;
}
