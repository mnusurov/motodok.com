import * as si from 'simple-icons';

// Brand slug → simple-icons export. Brands without a glyph return null and
// should fall back to a text wordmark (or be omitted where the title is shown).
const brandIconKey: Record<string, string> = {
  audi: 'siAudi', bmw: 'siBmw', ford: 'siFord', honda: 'siHonda',
  hyundai: 'siHyundai', infiniti: 'siInfiniti', kia: 'siKia', mazda: 'siMazda',
  mitsub: 'siMitsubishi', nissan: 'siNissan', opel: 'siOpel', peugeot: 'siPeugeot',
  renault: 'siRenault', skoda: 'siSkoda', subaru: 'siSubaru', toyota: 'siToyota',
  vaz: 'siLada', volvo: 'siVolvo', vw: 'siVolkswagen',
};

export function brandSvg(slug: string): string | null {
  const icon = (si as Record<string, any>)[brandIconKey[slug]];
  if (!icon) return null;
  return `<svg viewBox="0 0 24 24" fill="currentColor" role="img" aria-hidden="true"><path d="${icon.path}"/></svg>`;
}
