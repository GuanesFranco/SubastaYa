const CDN = 'https://cdn.dummyjson.com/product-images';

export const CATEGORIA_TECNOLOGIA = 1;
export const CATEGORIA_VEHICULOS = 2;
export const CATEGORIA_COLECCIONABLES = 3;
export const CATEGORIA_INDUMENTARIA = 4;

const imagen = (categoriaId, titulo, ruta) => ({
  id: ruta,
  categoriaId,
  titulo,
  url: `${CDN}/${ruta}/1.webp`,
  miniatura: `${CDN}/${ruta}/thumbnail.webp`
});

export const IMAGENES_SUGERIDAS = [
  imagen(CATEGORIA_TECNOLOGIA, 'Notebook MacBook Pro 14"', 'laptops/apple-macbook-pro-14-inch-space-grey'),
  imagen(CATEGORIA_TECNOLOGIA, 'Notebook Dell XPS 13', 'laptops/new-dell-xps-13-9300-laptop'),
  imagen(CATEGORIA_TECNOLOGIA, 'iPad mini 2021', 'tablets/ipad-mini-2021-starlight'),
  imagen(CATEGORIA_TECNOLOGIA, 'Tablet Galaxy Tab S8+', 'tablets/samsung-galaxy-tab-s8-plus-grey'),
  imagen(CATEGORIA_TECNOLOGIA, 'iPhone 13 Pro', 'smartphones/iphone-13-pro'),

  imagen(CATEGORIA_VEHICULOS, 'Moto naked Kawasaki Z800', 'motorcycle/kawasaki-z800'),
  imagen(CATEGORIA_VEHICULOS, 'Moto deportiva', 'motorcycle/sportbike-motorcycle'),
  imagen(CATEGORIA_VEHICULOS, 'Moto deportiva gris', 'motorcycle/generic-motorcycle'),
  imagen(CATEGORIA_VEHICULOS, 'Sedán Dodge Charger', 'vehicle/charger-sxt-rwd'),
  imagen(CATEGORIA_VEHICULOS, 'SUV Dodge Durango', 'vehicle/durango-sxt-rwd'),

  imagen(CATEGORIA_COLECCIONABLES, 'Reloj Rolex Submariner', 'mens-watches/rolex-submariner-watch'),
  imagen(CATEGORIA_COLECCIONABLES, 'Reloj con malla de cuero', 'mens-watches/brown-leather-belt-watch'),
  imagen(CATEGORIA_COLECCIONABLES, 'Reloj IWC Ingenieur', 'womens-watches/iwc-ingenieur-automatic-steel'),
  imagen(CATEGORIA_COLECCIONABLES, 'Anteojos aviador', 'sunglasses/classic-sun-glasses'),
  imagen(CATEGORIA_COLECCIONABLES, 'Pelota de básquet', 'sports-accessories/basketball'),

  imagen(CATEGORIA_INDUMENTARIA, 'Camisa a cuadros roja', 'mens-shirts/man-plaid-shirt'),
  imagen(CATEGORIA_INDUMENTARIA, 'Camisa a cuadros azul', 'mens-shirts/blue-&-black-check-shirt'),
  imagen(CATEGORIA_INDUMENTARIA, 'Zapatillas Air Jordan 1', 'mens-shoes/nike-air-jordan-1-red-and-black'),
  imagen(CATEGORIA_INDUMENTARIA, 'Zapatillas Puma Future Rider', 'mens-shoes/puma-future-rider-trainers'),
  imagen(CATEGORIA_INDUMENTARIA, 'Vestido largo floreado', "womens-dresses/black-women's-gown"),
  imagen(CATEGORIA_INDUMENTARIA, 'Vestido a lunares', 'womens-dresses/dress-pea'),
  imagen(CATEGORIA_INDUMENTARIA, 'Cartera Prada celeste', 'womens-bags/prada-women-bag')
];

export function imagenesPara(categoriaId) {
  if (!categoriaId) return IMAGENES_SUGERIDAS;
  return IMAGENES_SUGERIDAS.filter((img) => img.categoriaId === categoriaId);
}
