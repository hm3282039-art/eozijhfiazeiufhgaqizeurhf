/**
 * Catalogue de la boutique : les œufs que l'on peut acheter.
 * `pool` liste les identifiants de `PET_VARIANTS` que l'œuf peut faire éclore.
 */
export const SHOP_EGGS = Object.freeze([
  {
    id: 'basic-egg',
    name: 'Œuf Basique',
    description: 'Un chat ou un chien aux couleurs inédites.',
    colors: ['#fff6dc', '#ffd98a'],
    price: { currency: 'coins', amount: 250 },
    pool: ['candy-cat', 'choco-dog', 'snow-dog'],
  },
  {
    id: 'spotted-egg',
    name: 'Œuf Tacheté',
    description: 'Peut contenir n’importe quel pet… même un dragon !',
    colors: ['#d9f7ff', '#7fd0ff'],
    price: { currency: 'coins', amount: 1000 },
    pool: ['candy-cat', 'choco-dog', 'snow-dog', 'midnight-cat', 'emerald-dragon', 'ice-dragon'],
  },
  {
    id: 'golden-egg',
    name: 'Œuf Doré',
    description: 'Un dragon rare, garanti.',
    colors: ['#fff1a8', '#ffb92e'],
    price: { currency: 'diamonds', amount: 150 },
    pool: ['emerald-dragon', 'ice-dragon'],
  },
]);
