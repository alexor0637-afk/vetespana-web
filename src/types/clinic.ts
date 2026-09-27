export type Plan = 'Gratis' | 'Premium'

export interface ClinicPhoto {
  id: string
  url: string
  filename: string
  width?: number
  height?: number
}

export interface Clinic {
  id: string
  slug: string
  nombre: string
  ciudad: string
  direccion: string
  telefono: string
  web?: string
  email?: string
  whatsapp?: string
  redesSociales?: string
  especialidades: string[]
  horario?: string
  urgencias24h: boolean
  fotoPortada?: ClinicPhoto
  galeriaFotos: ClinicPhoto[]
  descripcion?: string
  plan: Plan
  valoracionMedia?: number
  verificada: boolean
  /** Coordenadas (para "Cerca de mí") */
  lat?: number
  lng?: number
  /** Última modificación en la base (ISO), para el lastmod del sitemap */
  actualizado?: string
}

export interface Review {
  id: string
  clinicaId: string
  nombreUsuario: string
  puntuacion: number
  comentario: string
  fecha: string
  aprobada: boolean
}

export const ESPECIALIDADES = [
  'Perros',
  'Gatos',
  'Animales exóticos',
  'Reptiles',
  'Aves',
  'Urgencias',
  'Cirugía',
  'Dermatología',
  'Odontología',
  'Traumatología',
  'Oncología',
  'Cardiología',
  'Hospitalización',
] as const

// Emoji para cada especialidad (se usa en los filtros y chips)
export const ESPECIALIDAD_EMOJI: Record<string, string> = {
  'Perros':            '🐶',
  'Gatos':             '🐱',
  'Animales exóticos': '🦎',
  'Reptiles':          '🐢',
  'Aves':              '🦜',
  'Urgencias':         '🚨',
  'Cirugía':           '🔪',
  'Dermatología':      '🧴',
  'Odontología':       '🦷',
  'Traumatología':     '🦴',
  'Oncología':         '🎗️',
  'Cardiología':       '❤️',
  'Hospitalización':   '🏥',
}

export const CIUDADES_POR_COMUNIDAD: Record<string, string[]> = {
  'Andalucía':            ['Adra', 'Alcalá de Guadaíra', 'Alcalá la Real', 'Algeciras', 'Almería', 'Almuñécar', 'Andújar', 'Antequera', 'Ayamonte', 'Baza', 'Benalmádena', 'Bormujos', 'Cádiz', 'Camas', 'Cártama', 'Chiclana de la Frontera', 'Coín', 'Córdoba', 'Coria del Río', 'Dos Hermanas', 'Écija', 'El Ejido', 'El Puerto de Santa María', 'Estepona', 'Fuengirola', 'Granada', 'Guadix', 'Huelva', 'Isla Cristina', 'Jaén', 'Jerez de la Frontera', 'La Línea de la Concepción', 'La Rinconada', 'Lebrija', 'Lepe', 'Linares', 'Loja', 'Los Palacios y Villafranca', 'Lucena', 'Mairena del Aljarafe', 'Málaga', 'Marbella', 'Martos', 'Mijas', 'Montilla', 'Morón de la Frontera', 'Motril', 'Nerja', 'Priego de Córdoba', 'Puente Genil', 'Rincón de la Victoria', 'Ronda', 'Roquetas de Mar', 'San Fernando', 'Sanlúcar de Barrameda', 'Sevilla', 'Tomares', 'Torremolinos', 'Úbeda', 'Utrera', 'Vélez-Málaga', 'Vícar'],
  'Aragón':               ['Alcañiz', 'Barbastro', 'Calatayud', 'Cuarte de Huerva', 'Ejea de los Caballeros', 'Fraga', 'Huesca', 'Monzón', 'Teruel', 'Zaragoza'],
  'Asturias':             ['Avilés', 'Gijón', 'Langreo', 'Llanera', 'Mieres', 'Oviedo', 'Siero'],
  'Canarias':             ['Adeje', 'Arona', 'Arrecife', 'Candelaria', 'Gáldar', 'Ingenio', 'La Orotava', 'Las Palmas', 'Los Realejos', 'Puerto del Rosario', 'San Bartolomé de Tirajana', 'San Cristóbal de La Laguna', 'Santa Cruz de Tenerife', 'Telde'],
  'Cantabria':            ['Camargo', 'Castro-Urdiales', 'Piélagos', 'Santander', 'Torrelavega'],
  'Castilla y León':      ['Aranda de Duero', 'Arroyo de la Encomienda', 'Ávila', 'Béjar', 'Burgos', 'Laguna de Duero', 'León', 'Medina del Campo', 'Miranda de Ebro', 'Palencia', 'Ponferrada', 'Salamanca', 'Segovia', 'Soria', 'Valladolid', 'Zamora'],
  'Castilla-La Mancha':   ['Albacete', 'Alcázar de San Juan', 'Almansa', 'Azuqueca de Henares', 'Ciudad Real', 'Cuenca', 'Daimiel', 'Guadalajara', 'Hellín', 'Illescas', 'Manzanares', 'Puertollano', 'Seseña', 'Talavera de la Reina', 'Toledo', 'Tomelloso', 'Valdepeñas', 'Villarrobledo'],
  'Cataluña':             ['Amposta', 'Badalona', 'Banyoles', 'Barberà del Vallès', 'Barcelona', 'Blanes', 'Calella', 'Cambrils', 'Castelldefels', 'Cerdanyola del Vallès', 'Cornellà de Llobregat', 'El Masnou', 'El Prat de Llobregat', 'El Vendrell', 'Esplugues de Llobregat', 'Figueres', 'Gavà', 'Girona', 'Granollers', 'Igualada', 'L\'Hospitalet de Llobregat', 'Lleida', 'Lloret de Mar', 'Manlleu', 'Manresa', 'Martorell', 'Mataró', 'Molins de Rei', 'Mollet del Vallès', 'Montcada i Reixac', 'Olot', 'Pineda de Mar', 'Premià de Mar', 'Reus', 'Ripollet', 'Rubí', 'Sabadell', 'Salou', 'Salt', 'Sant Adrià de Besòs', 'Sant Andreu de la Barca', 'Sant Boi de Llobregat', 'Sant Cugat del Vallès', 'Sant Feliu de Llobregat', 'Sant Joan Despí', 'Sant Vicenç dels Horts', 'Santa Coloma de Gramenet', 'Tarragona', 'Terrassa', 'Tortosa', 'Vic', 'Viladecans', 'Vilafranca del Penedès', 'Vilanova i la Geltrú', 'Vilassar de Mar'],
  'Comunidad de Madrid':  ['Alcalá de Henares', 'Alcobendas', 'Alcorcón', 'Algete', 'Aranjuez', 'Arganda del Rey', 'Arroyomolinos', 'Boadilla del Monte', 'Ciempozuelos', 'Collado Villalba', 'Colmenar Viejo', 'Coslada', 'Fuenlabrada', 'Getafe', 'Humanes de Madrid', 'Las Rozas', 'Leganés', 'Madrid', 'Majadahonda', 'Mejorada del Campo', 'Moralzarzal', 'Móstoles', 'Navalcarnero', 'Parla', 'Pinto', 'Pozuelo de Alarcón', 'Rivas-Vaciamadrid', 'San Fernando de Henares', 'San Lorenzo de El Escorial', 'San Sebastián de los Reyes', 'Torrejón de Ardoz', 'Torrelodones', 'Tres Cantos', 'Valdemoro', 'Villanueva de la Cañada', 'Villanueva del Pardillo', 'Villaviciosa de Odón'],
  'C. Valenciana':        ['Alaquàs', 'Alcoy', 'Aldaia', 'Algemesí', 'Alicante', 'Almassora', 'Alzira', 'Benetússer', 'Benidorm', 'Bétera', 'Borriana', 'Burjassot', 'Calp', 'Carcaixent', 'Castellón', 'Catarroja', 'Crevillent', 'Cullera', 'Dénia', 'El Campello', 'Elche', 'Elda', 'Gandia', 'Ibi', 'La Vall d\'Uixó', 'Manises', 'Massamagrell', 'Mislata', 'Novelda', 'Oliva', 'Ontinyent', 'Orihuela', 'Paiporta', 'Paterna', 'Petrer', 'Quart de Poblet', 'Requena', 'Riba-roja de Túria', 'San Vicente del Raspeig', 'Santa Pola', 'Sueca', 'Torrent', 'Torrevieja', 'Valencia', 'Vila-real', 'Villena', 'Vinaròs', 'Xàbia', 'Xàtiva', 'Xirivella'],
  'Extremadura':          ['Almendralejo', 'Badajoz', 'Cáceres', 'Coria', 'Don Benito', 'Mérida', 'Montijo', 'Navalmoral de la Mata', 'Plasencia', 'Villafranca de los Barros', 'Villanueva de la Serena', 'Zafra'],
  'Galicia':              ['A Coruña', 'Arteixo', 'Cambre', 'Cangas', 'Carballo', 'Culleredo', 'Ferrol', 'Lalín', 'Lugo', 'Monforte de Lemos', 'Narón', 'Oleiros', 'Ourense', 'Ponteareas', 'Pontevedra', 'Redondela', 'Ribeira', 'Santiago de Compostela', 'Sanxenxo', 'Vigo', 'Vilagarcía de Arousa', 'Vilanova de Arousa'],
  'Islas Baleares':       ['Calvià', 'Eivissa', 'Inca', 'Llucmajor', 'Manacor', 'Maó', 'Marratxí', 'Palma', 'Santa Eulària des Riu'],
  'La Rioja':             ['Alfaro', 'Arnedo', 'Calahorra', 'Haro', 'Lardero', 'Logrono'],
  'Región de Murcia':     ['Águilas', 'Alcantarilla', 'Alhama de Murcia', 'Archena', 'Caravaca de la Cruz', 'Cartagena', 'Cieza', 'Jumilla', 'Las Torres de Cotillas', 'Lorca', 'Mazarrón', 'Molina de Segura', 'Murcia', 'San Javier', 'San Pedro del Pinatar', 'Torre-Pacheco', 'Totana', 'Yecla'],
  'Navarra':              ['Barañáin', 'Burlada', 'Estella', 'Pamplona', 'Tafalla', 'Tudela', 'Zizur Mayor'],
  'País Vasco':           ['Barakaldo', 'Basauri', 'Bermeo', 'Bilbao', 'Durango', 'Eibar', 'Errenteria', 'Gernika-Lumo', 'Getxo', 'Hernani', 'Irun', 'Llodio', 'Mondragón', 'Portugalete', 'San Sebastián', 'Santurtzi', 'Sestao', 'Tolosa', 'Vitoria', 'Zarautz'],
}

export const COMUNIDADES = Object.keys(CIUDADES_POR_COMUNIDAD)

export const COMUNIDAD_EMOJI: Record<string, string> = {
  'Andalucía':            '🌞',
  'Aragón':               '🏔️',
  'Asturias':             '🌿',
  'Canarias':             '🌴',
  'Cantabria':            '🌊',
  'Castilla y León':      '🏰',
  'Castilla-La Mancha':   '🌾',
  'Cataluña':             '🔴',
  'Comunidad de Madrid':  '🏙️',
  'C. Valenciana':        '🍊',
  'Extremadura':          '🦅',
  'Galicia':              '🌧️',
  'Islas Baleares':       '⛵',
  'La Rioja':             '🍷',
  'Región de Murcia':     '☀️',
  'Navarra':              '🏃',
  'País Vasco':           '🐟',
}

// Lista plana de todas las ciudades, derivada del mapa por comunidad
// (se mantiene siempre sincronizada con CIUDADES_POR_COMUNIDAD)
export const CIUDADES: readonly string[] = Object.values(CIUDADES_POR_COMUNIDAD)
  .flat()
  .sort((a, b) => a.localeCompare(b, 'es'))

// Nombres de display para valores con ortografía simplificada (heredada de Airtable;
// los slugs de las URLs salen de estos valores, así que no se cambian)
export const CIUDAD_DISPLAY: Record<string, string> = {
  'A Coruña': 'A Coruña',
  'Logrono': 'Logroño',
  'Las Palmas': 'Las Palmas de Gran Canaria',
  'Vitoria': 'Vitoria-Gasteiz',
}
