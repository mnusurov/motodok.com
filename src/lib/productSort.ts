type Availability = 'in_stock' | 'on_order' | 'discontinued';
type Dated = { publishedDate?: Date; updatedDate?: Date };

// Only discontinued items are pushed to the end — in_stock and on_order sort together by date,
// so new on-order items surface immediately instead of hiding behind the entire in-stock catalog.
const rank = (availability?: Availability) => (availability === 'discontinued' ? 1 : 0);

// updatedDate is a deliberate editorial signal, not an automatic edit timestamp: touching a product
// (fixing a typo, correcting a price) shouldn't silently bump it in the listing. Only set updatedDate
// when the change should actually move the product's position — otherwise leave it blank.
const sortDate = (d: Dated) => (d.updatedDate || d.publishedDate)?.getTime() || 0;

export function sortProducts<T extends { data: Dated & { availability?: Availability } }>(items: T[]): T[] {
  return items.slice().sort((a, b) => {
    const rankDiff = rank(a.data.availability) - rank(b.data.availability);
    if (rankDiff !== 0) return rankDiff;
    return sortDate(b.data) - sortDate(a.data);
  });
}
