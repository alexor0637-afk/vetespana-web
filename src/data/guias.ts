// Contenido de las Guías (sección SEO informacional). Cada guía responde a
// búsquedas reales de dueños de mascotas y enlaza al directorio. Texto original.
//
// Los párrafos admiten enlaces en formato markdown: [texto](/ruta) — se
// renderizan como <Link> internos (ver app/guias/[slug]/page.tsx).

export interface Seccion {
  h: string
  parrafos: string[]
  lista?: string[]
}

export interface Guia {
  slug: string
  titulo: string // H1
  metaTitulo: string // <title>
  descripcion: string // meta description
  emoji: string
  resumen: string // intro + tarjeta del índice
  actualizado: string // ISO
  actualizadoTexto: string
  lectura: string // tiempo de lectura
  heroImg: string // foto de cabecera
  heroAlt: string
  inlineImg: string // foto dentro del contenido
  inlineAlt: string
  inlineCaption: string
  inlineAfter: number // se inserta tras esta sección (índice)
  secciones: Seccion[]
  faq: { q: string; a: string }[]
}

export const GUIAS: Guia[] = [
  {
    slug: 'como-elegir-clinica-veterinaria',
    titulo: 'Cómo elegir una buena clínica veterinaria',
    metaTitulo: 'Cómo elegir una buena clínica veterinaria (guía 2026)',
    descripcion:
      'Aprende a elegir la mejor clínica veterinaria para tu mascota: qué mirar, preguntas clave, señales de calidad y errores a evitar. Guía práctica y actualizada.',
    emoji: '🩺',
    resumen:
      'Elegir veterinario no es solo cuestión de cercanía. Te contamos en qué fijarte para encontrar una clínica de confianza para tu perro, gato o mascota.',
    actualizado: '2026-06-08',
    actualizadoTexto: 'junio de 2026',
    lectura: '5 min',
    heroImg: '/images/guias/g1-hero.jpg',
    heroAlt: 'Veterinario y dueña atienden a un perro pequeño en la consulta',
    inlineImg: '/images/guias/g1-inline.jpg',
    inlineAlt: 'Veterinario sostiene a un perro pequeño con el fonendoscopio',
    inlineCaption: 'Una buena clínica dedica tiempo a tu mascota y te explica todo con calma.',
    inlineAfter: 1,
    secciones: [
      {
        h: 'No elijas solo por cercanía',
        parrafos: [
          'La clínica más cercana no siempre es la mejor para tu mascota, pero la distancia sí importa: en una urgencia, cada minuto cuenta. Lo ideal es tener identificada una clínica de confianza cerca de casa y, además, saber dónde está el hospital veterinario con urgencias 24h más próximo.',
          'Una buena estrategia es combinar ambas cosas: busca [clínicas cerca de ti](/cerca-de-mi) para el día a día (vacunas, revisiones, consultas) y ten localizado un centro de [urgencias 24h](/urgencias-veterinarias-24h) por si surge un imprevisto fuera de horario.',
        ],
      },
      {
        h: 'Señales de una clínica de calidad',
        parrafos: ['Hay detalles que distinguen a una clínica seria. Fíjate en estos puntos cuando visites o investigues un centro:'],
        lista: [
          'Instalaciones limpias y ordenadas, con sala de espera separada (idealmente perros y gatos por separado).',
          'Personal que dedica tiempo a explicarte el diagnóstico y las opciones de tratamiento sin prisas.',
          'Presupuestos claros y por escrito antes de cualquier intervención.',
          'Equipamiento propio: laboratorio, radiografía o ecografía agilizan mucho los diagnósticos.',
          'Reseñas reales positivas y respuestas a las críticas de otros clientes.',
          'Especialidades declaradas (cirugía, dermatología, traumatología…) si tu mascota tiene necesidades concretas.',
        ],
      },
      {
        h: 'Preguntas que conviene hacer',
        parrafos: ['Antes de quedarte con una clínica, no tengas reparo en preguntar. Una clínica transparente responderá sin problema:'],
        lista: [
          '¿Tienen servicio de urgencias propio o derivan a otro centro fuera de horario?',
          '¿Cómo funcionan los presupuestos y las formas de pago?',
          '¿Disponen de hospitalización si mi mascota necesita quedarse ingresada?',
          '¿Tienen veterinarios con formación en alguna especialidad concreta?',
          '¿Trabajan con animales exóticos, si es tu caso (reptiles, aves, roedores)?',
        ],
      },
      {
        h: 'Usa las reseñas con cabeza',
        parrafos: [
          'Las opiniones de otros dueños son muy útiles, pero léelas con criterio. Una clínica con muchas reseñas y una valoración alta y sostenida en el tiempo es más fiable que una con cuatro opiniones perfectas. Fíjate en cómo responde el centro a las críticas: una respuesta educada y resolutiva dice mucho de su trato.',
          'En cada ficha de [nuestro directorio](/clinicas) puedes ver la información de contacto, horarios, especialidades y fotos reales de la clínica para hacerte una idea antes de ir.',
        ],
      },
      {
        h: 'Errores frecuentes al elegir',
        parrafos: ['Evita estos fallos habituales:'],
        lista: [
          'Quedarte con la primera clínica sin comparar al menos dos o tres opciones.',
          'No tener localizado un centro de urgencias antes de necesitarlo.',
          'Elegir solo por precio: lo barato puede salir caro si falta equipamiento o seguimiento.',
          'Ignorar las especialidades cuando tu mascota tiene una patología concreta.',
        ],
      },
    ],
    faq: [
      {
        q: '¿Cada cuánto debo llevar a mi mascota al veterinario?',
        a: 'Para un animal adulto y sano, se recomienda al menos una revisión anual. En cachorros, animales mayores o con enfermedades crónicas, las visitas son más frecuentes según indique el veterinario.',
      },
      {
        q: '¿Puedo cambiar de clínica veterinaria si no estoy contento?',
        a: 'Sí, puedes cambiar cuando quieras. Es recomendable pedir el historial clínico de tu mascota para dárselo al nuevo veterinario y mantener la continuidad del seguimiento.',
      },
      {
        q: '¿Cómo encuentro un veterinario cerca de mí?',
        a: 'Puedes usar la búsqueda por ciudad o la herramienta "cerca de mí" de VetEspaña, que te muestra las clínicas más próximas a tu ubicación ordenadas por distancia.',
      },
    ],
  },
  {
    slug: 'urgencias-veterinarias-24h',
    titulo: 'Urgencias veterinarias 24h: qué hacer y cuándo acudir',
    metaTitulo: 'Urgencias veterinarias 24h: qué hacer y cuándo acudir',
    descripcion:
      'Guía de urgencias veterinarias: señales de alarma en perros y gatos, qué hacer antes de llegar a la clínica y cómo encontrar un veterinario de urgencias 24h cerca de ti.',
    emoji: '🚑',
    resumen:
      'Saber reconocer una urgencia y actuar rápido puede salvarle la vida a tu mascota. Te explicamos las señales de alarma y cómo encontrar atención 24h.',
    actualizado: '2026-06-08',
    actualizadoTexto: 'junio de 2026',
    lectura: '6 min',
    heroImg: '/images/guias/g2-hero.jpg',
    heroAlt: 'Veterinario examina a un pastor alemán tumbado en la clínica',
    inlineImg: '/images/guias/g2-inline.jpg',
    inlineAlt: 'Veterinario con mascarilla y guantes revisa a un perro',
    inlineCaption: 'Ante una urgencia, llama a la clínica antes de salir: ganarás minutos clave.',
    inlineAfter: 1,
    secciones: [
      {
        h: 'Señales de alarma: cuándo es una urgencia',
        parrafos: [
          'Algunos síntomas requieren atención veterinaria inmediata, sin esperar al día siguiente. Si tu perro o gato presenta alguno de estos signos, busca atención urgente cuanto antes:',
        ],
        lista: [
          'Dificultad para respirar, respiración muy agitada o encías azuladas/pálidas.',
          'Vómitos o diarrea persistentes, sobre todo con sangre.',
          'Intento de vomitar sin éxito y abdomen hinchado (posible torsión gástrica, muy grave en perros grandes).',
          'Convulsiones, desmayos o pérdida de consciencia.',
          'Traumatismos: atropellos, caídas de altura o peleas con heridas profundas.',
          'Ingestión de tóxicos o de objetos (chocolate, antigelidante, medicamentos humanos, etc.).',
          'Imposibilidad de orinar, especialmente en gatos macho (urgencia vital).',
          'Sangrado que no se detiene o golpe de calor (jadeo extremo tras exposición al sol).',
        ],
      },
      {
        h: 'Qué hacer antes de llegar a la clínica',
        parrafos: [
          'Mantén la calma: tu mascota percibe tu nerviosismo. Llama por teléfono a la clínica de urgencias antes de salir para avisar de que vas en camino y que preparen lo necesario. Así ganan tiempo para atenderte nada más llegar.',
          'No le des comida, agua ni medicación humana sin que te lo indiquen: muchos fármacos para personas son tóxicos para perros y gatos. Si ha ingerido un producto, lleva el envase contigo para que el veterinario sepa exactamente qué ha tomado.',
        ],
      },
      {
        h: 'Cómo encontrar urgencias 24h cerca de ti',
        parrafos: [
          'No esperes a la emergencia para buscar. Ten localizado de antemano el centro de urgencias más cercano y guarda su teléfono en el móvil.',
          'En VetEspaña puedes filtrar directamente las [clínicas con urgencias 24h](/urgencias-veterinarias-24h) y también ver las [clínicas más cercanas a tu ubicación](/cerca-de-mi) ordenadas por distancia. Te recomendamos hacerlo hoy mismo, con calma, y apuntar el contacto donde lo tengas a mano.',
        ],
      },
      {
        h: 'Prepara un pequeño plan de emergencia',
        parrafos: ['Tener esto listo te ahorrará minutos críticos llegado el momento:'],
        lista: [
          'El teléfono y la dirección de la clínica de urgencias 24h más cercana.',
          'Una alternativa por si la primera está saturada o cerrada.',
          'El transportín preparado y accesible (sobre todo para gatos).',
          'La cartilla o historial de tu mascota y la lista de su medicación, si toma alguna.',
        ],
      },
    ],
    faq: [
      {
        q: '¿Todas las clínicas atienden urgencias por la noche?',
        a: 'No. Muchas clínicas tienen horario diurno y derivan las urgencias nocturnas a hospitales veterinarios con servicio 24h. Por eso conviene localizar de antemano un centro con urgencias propias.',
      },
      {
        q: '¿Cuánto cuesta una urgencia veterinaria?',
        a: 'Suele tener un coste superior a la consulta normal por el horario y la atención inmediata, más las pruebas o tratamientos que se necesiten. Pide siempre un presupuesto en cuanto la situación esté estabilizada.',
      },
      {
        q: '¿Qué hago si ingiere algo tóxico?',
        a: 'Llama de inmediato a un veterinario, no le provoques el vómito por tu cuenta (en algunos tóxicos empeora la situación) y lleva el envase del producto para que sepan qué ha ingerido.',
      },
    ],
  },
  {
    slug: 'calendario-vacunas-perros-gatos',
    titulo: 'Calendario de vacunas para perros y gatos',
    metaTitulo: 'Calendario de vacunas para perros y gatos en España',
    descripcion:
      'Calendario orientativo de vacunas para perros y gatos en España: vacunas esenciales, edades, recordatorios y por qué son importantes. Consulta siempre con tu veterinario.',
    emoji: '💉',
    resumen:
      'Las vacunas protegen a tu mascota de enfermedades graves. Repasamos las principales para perros y gatos y a qué edad se ponen (siempre bajo criterio veterinario).',
    actualizado: '2026-06-08',
    actualizadoTexto: 'junio de 2026',
    lectura: '6 min',
    heroImg: '/images/guias/g3-hero.jpg',
    heroAlt: 'Veterinario sujeta con cuidado a un gato sobre la mesa de exploración',
    inlineImg: '/images/guias/g3-inline.jpg',
    inlineAlt: 'Vacunación de un gato en la clínica veterinaria',
    inlineCaption: 'Las vacunas preparan el sistema inmunitario frente a enfermedades graves.',
    inlineAfter: 1,
    secciones: [
      {
        h: 'Por qué son importantes las vacunas',
        parrafos: [
          'Las vacunas preparan el sistema inmunitario de tu mascota para defenderse de enfermedades infecciosas que pueden ser graves o mortales. Además de proteger a tu animal, ayudan a frenar la transmisión de enfermedades como la rabia, que también afecta a las personas.',
          'Este calendario es orientativo. El plan exacto depende de la edad, el estado de salud, el estilo de vida y la zona donde vivís. Tu veterinario es quien debe establecer y ajustar la pauta concreta de tu mascota.',
        ],
      },
      {
        h: 'Vacunas habituales en perros',
        parrafos: ['Las vacunas caninas suelen empezar hacia las 6-8 semanas de vida, con recordatorios cada pocas semanas hasta completar la pauta de cachorro:'],
        lista: [
          'Parvovirosis y moquillo: de las más importantes, se inician en las primeras semanas.',
          'Hepatitis y leptospirosis: habituales dentro de las vacunas polivalentes.',
          'Rabia: obligatoria en buena parte de España; consulta la normativa de tu comunidad autónoma.',
          'Tos de las perreras: recomendable si tu perro acude a guarderías, residencias o tiene mucho contacto con otros perros.',
          'Recordatorios anuales: la mayoría de pautas incluyen una revacunación periódica para mantener la inmunidad.',
        ],
      },
      {
        h: 'Vacunas habituales en gatos',
        parrafos: ['En gatos, la vacunación también arranca en las primeras semanas de vida:'],
        lista: [
          'Trivalente felina (panleucopenia, rinotraqueítis y calicivirus): la base de la protección.',
          'Leucemia felina: especialmente recomendada en gatos con acceso al exterior.',
          'Rabia: según la normativa de tu zona y si el gato sale al exterior o viaja.',
          'Recordatorios periódicos: tu veterinario indicará cada cuánto revacunar.',
        ],
      },
      {
        h: 'Más allá de las vacunas: desparasitación',
        parrafos: [
          'La vacunación va de la mano de un buen plan de desparasitación, tanto interna (lombrices y otros parásitos intestinales) como externa (pulgas, garrapatas y mosquitos transmisores de la leishmaniosis). La frecuencia depende del animal y de la época del año.',
          'En tu revisión anual, aprovecha para repasar con el veterinario tanto las vacunas pendientes como la desparasitación. ¿No tienes clínica de confianza? Busca [clínicas veterinarias cerca de ti](/clinicas) y pide cita para un chequeo.',
        ],
      },
    ],
    faq: [
      {
        q: '¿Es obligatorio vacunar a mi mascota?',
        a: 'La vacuna de la rabia es obligatoria en gran parte de España, aunque varía según la comunidad autónoma. El resto son muy recomendables para proteger la salud de tu mascota. Consulta la normativa local con tu veterinario.',
      },
      {
        q: '¿A qué edad se pone la primera vacuna?',
        a: 'Normalmente las primeras vacunas se inician hacia las 6-8 semanas de vida, con recordatorios cada pocas semanas hasta completar la pauta de cachorro o gatito.',
      },
      {
        q: '¿Qué pasa si se me olvida un recordatorio?',
        a: 'Si se retrasa una dosis, contacta con tu veterinario lo antes posible. En algunos casos habrá que reiniciar parte de la pauta para asegurar una protección correcta.',
      },
    ],
  },
  {
    slug: 'cuanto-cuesta-veterinario',
    titulo: 'Cuánto cuesta el veterinario en España',
    metaTitulo: 'Cuánto cuesta el veterinario en España (precios orientativos)',
    descripcion:
      'Precios orientativos del veterinario en España: consulta, vacunas, análisis, cirugías y urgencias. Por qué varían y cómo ahorrar sin renunciar a la calidad.',
    emoji: '💶',
    resumen:
      '¿Cuánto cuesta llevar a tu mascota al veterinario? Repasamos precios orientativos por servicio y los factores que hacen que varíen tanto de una clínica a otra.',
    actualizado: '2026-06-08',
    actualizadoTexto: 'junio de 2026',
    lectura: '5 min',
    heroImg: '/images/guias/g4-hero.jpg',
    heroAlt: 'Veterinario examina a un perro pequeño con el fonendoscopio',
    inlineImg: '/images/guias/g4-inline.jpg',
    inlineAlt: 'Gato atendido con cuidado sobre la mesa de la clínica veterinaria',
    inlineCaption: 'La prevención —vacunas y revisiones— evita tratamientos más caros después.',
    inlineAfter: 1,
    secciones: [
      {
        h: 'Por qué varían tanto los precios',
        parrafos: [
          'En España no existe un precio fijo para los servicios veterinarios: cada clínica establece sus tarifas. Por eso el coste puede variar bastante según la ciudad, el tipo de centro (clínica de barrio u hospital con especialistas), el equipamiento disponible y la complejidad de cada caso.',
          'Esto no significa que lo más caro sea siempre mejor ni lo más barato peor. La clave es entender qué incluye cada presupuesto y compararlo con criterio. Pedir el precio por adelantado y por escrito es totalmente normal y recomendable.',
        ],
      },
      {
        h: 'Precios orientativos por servicio',
        parrafos: [
          'Estas cifras son aproximadas y solo sirven como referencia general: pueden cambiar mucho según la clínica y tu zona. Pide siempre presupuesto en tu centro:',
        ],
        lista: [
          'Consulta general: suele ser el servicio más económico y la puerta de entrada a cualquier tratamiento.',
          'Vacunación: el precio varía según el tipo de vacuna y si incluye la revisión.',
          'Análisis de sangre y pruebas: dependen del número de parámetros y de si la clínica tiene laboratorio propio.',
          'Radiografía o ecografía: varían según la zona explorada y el equipo.',
          'Cirugías (esterilización, extracciones dentales, etc.): es donde más difieren los presupuestos; influye el tipo de anestesia y el postoperatorio.',
          'Urgencias: tienen un recargo respecto a la consulta normal por la atención inmediata y el horario.',
        ],
      },
      {
        h: 'Cómo ahorrar sin renunciar a la calidad',
        parrafos: ['Cuidar la salud de tu mascota no tiene por qué arruinarte. Algunas ideas para gestionar mejor el gasto:'],
        lista: [
          'La prevención sale a cuenta: vacunas, desparasitación y revisiones anuales evitan tratamientos caros más adelante.',
          'Pide y compara presupuestos para intervenciones programadas (no para una urgencia).',
          'Pregunta por planes de salud o cuotas mensuales que algunas clínicas ofrecen.',
          'Valora un seguro veterinario si tu mascota es propensa a problemas de salud.',
          'Detecta los problemas pronto: una consulta a tiempo siempre es más barata que una urgencia.',
        ],
      },
      {
        h: 'Compara antes de decidir',
        parrafos: [
          'Para tratamientos no urgentes, merece la pena comparar un par de clínicas. En VetEspaña puedes ver la información de contacto y especialidades de [clínicas veterinarias de toda España](/clinicas) y llamar para pedir presupuesto. Y para imprevistos, ten siempre localizadas las [urgencias 24h cercanas](/urgencias-veterinarias-24h).',
        ],
      },
    ],
    faq: [
      {
        q: '¿Cuánto cuesta una consulta veterinaria?',
        a: 'La consulta general suele ser el servicio más económico, pero el precio varía según la clínica y la ciudad. Lo mejor es preguntar directamente en el centro, ya que cada clínica fija sus propias tarifas.',
      },
      {
        q: '¿Es más caro el veterinario de urgencias?',
        a: 'Sí, las urgencias suelen tener un recargo respecto a la consulta normal por la atención inmediata y el horario, además de las pruebas o tratamientos que se necesiten.',
      },
      {
        q: '¿Merece la pena un seguro veterinario?',
        a: 'Depende de tu mascota y de tu situación. Puede compensar en animales propensos a problemas de salud o ante el riesgo de cirugías caras. Compara coberturas y condiciones antes de contratarlo.',
      },
    ],
  },
  {
    slug: 'perro-no-come',
    titulo: 'Mi perro no come: causas y qué hacer',
    metaTitulo: 'Mi perro no come: causas y qué hacer (guía 2026)',
    descripcion:
      'Tu perro no come y no sabes por qué. Causas más frecuentes (de leves a graves), qué puedes hacer en casa y cuándo es urgente acudir al veterinario.',
    emoji: '🍽️',
    resumen:
      'Que un perro deje de comer puede ser una tontería pasajera o la señal de algo serio. Te ayudamos a distinguirlo y a saber cuándo hay que actuar.',
    actualizado: '2026-06-08',
    actualizadoTexto: 'junio de 2026',
    lectura: '6 min',
    heroImg: '/images/guias/g5-hero.jpg',
    heroAlt: 'Perro tumbado junto a su comedero sin comer',
    inlineImg: '/images/guias/g5-inline.jpg',
    inlineAlt: 'Veterinario revisa a un perro en la consulta',
    inlineCaption: 'Si la falta de apetito dura más de 24-48h o hay otros síntomas, acude al veterinario.',
    inlineAfter: 1,
    secciones: [
      {
        h: '¿Cuándo hay que preocuparse?',
        parrafos: [
          'Que un perro salte una comida de vez en cuando suele ser normal: el calor, un día de menos actividad o un pequeño empacho. La señal de alarma es cuando la falta de apetito se mantiene o viene acompañada de otros síntomas.',
          'Como referencia general: en un perro adulto y sano, más de 24 horas sin comer ya merece atención; en cachorros, perros mayores o enfermos, el margen es mucho menor y conviene consultar antes.',
        ],
      },
      {
        h: 'Causas más frecuentes',
        parrafos: ['La falta de apetito (lo que el veterinario llama "anorexia") puede tener muchas causas, de leves a graves:'],
        lista: [
          'Estrés o cambios: mudanza, viajes, un animal nuevo en casa, ruidos (tormentas, petardos).',
          'Problemas de boca: dolor dental, una encía inflamada o algo clavado le impiden comer.',
          'Empacho o problema digestivo: ha comido algo que le ha sentado mal.',
          'Calor: en verano muchos perros comen menos; es normal hasta cierto punto.',
          'Dolor o enfermedad: infecciones, problemas de riñón o hígado, fiebre… suelen quitar el apetito.',
          'Manías con la comida: a veces rechazan un pienso nuevo o piden premios; ojo con malacostumbrarlos.',
        ],
      },
      {
        h: 'Qué puedes hacer en casa',
        parrafos: ['Si tu perro está por lo demás animado y no tiene otros síntomas, puedes probar esto durante un día:'],
        lista: [
          'Asegúrate de que bebe agua: que no coma es menos urgente que que no beba.',
          'Ofrécele su comida habitual templada o ligeramente humedecida (huele más y apetece más).',
          'Quita los premios y las sobras de la mesa: que tenga hambre real a su hora.',
          'Dale tranquilidad y su rutina; evita forzarle a comer a la fuerza.',
        ],
      },
      {
        h: 'Cuándo acudir al veterinario',
        parrafos: ['No esperes si aparece cualquiera de estas señales — pueden indicar algo serio:'],
        lista: [
          'Lleva más de 24-48h sin comer (o menos si es cachorro, mayor o enfermo).',
          'Además no bebe agua o vomita / tiene diarrea.',
          'Está apático, decaído, tiembla o se esconde.',
          'Intenta comer pero le duele, o babea mucho.',
          'El abdomen se ve hinchado o se queja al tocarlo (puede ser una urgencia grave).',
        ],
      },
      {
        h: 'No lo dejes pasar',
        parrafos: [
          'La falta de apetito es de los síntomas más inespecíficos pero también más útiles: el cuerpo avisa de que algo no va bien. Ante la duda, una consulta a tiempo es siempre más barata y segura que esperar. Busca [tu veterinario](/clinicas) o, si es fuera de horario y hay síntomas graves, un centro de [urgencias 24h](/urgencias-veterinarias-24h).',
        ],
      },
    ],
    faq: [
      {
        q: '¿Cuánto tiempo puede estar un perro sin comer?',
        a: 'Un perro adulto y sano puede aguantar un par de días sin comer sin riesgo inmediato, pero más de 24-48h sin apetito ya justifica una consulta. En cachorros, perros mayores o enfermos el margen es mucho menor.',
      },
      {
        q: 'Mi perro no come pero está alegre y juega, ¿es grave?',
        a: 'Suele ser menos preocupante: puede ser calor, estrés o una mania pasajera. Vigílalo, asegúrate de que bebe y, si en 24-48h no mejora o aparecen otros síntomas, acude al veterinario.',
      },
      {
        q: '¿Le puedo dar comida casera para que coma?',
        a: 'Puntualmente puede ayudar (pollo cocido sin sal, arroz), pero no abuses ni le acostumbres a rechazar su pienso. Si la falta de apetito persiste, el problema no es la comida: que lo vea un veterinario.',
      },
    ],
  },
  {
    slug: 'alimentos-prohibidos-perros-gatos',
    titulo: 'Alimentos prohibidos para perros y gatos',
    metaTitulo: 'Alimentos prohibidos para perros y gatos (lista 2026)',
    descripcion:
      'Lista de alimentos tóxicos y peligrosos para perros y gatos: chocolate, uvas, cebolla, xilitol y más. Qué hacer si tu mascota come algo prohibido.',
    emoji: '🚫',
    resumen:
      'Muchos alimentos normales para nosotros son tóxicos para perros y gatos. Esta es la lista de los que debes evitar siempre y qué hacer si comen algo peligroso.',
    actualizado: '2026-06-08',
    actualizadoTexto: 'junio de 2026',
    lectura: '6 min',
    heroImg: '/images/guias/g6-hero.jpg',
    heroAlt: 'Perro mirando comida humana sobre una mesa',
    inlineImg: '/images/guias/g6-inline.jpg',
    inlineAlt: 'Un perro y un gato juntos en casa',
    inlineCaption: 'Ante la duda de si algo es tóxico, no se lo des: pregunta primero a tu veterinario.',
    inlineAfter: 1,
    secciones: [
      {
        h: 'Por qué importa',
        parrafos: [
          'El cuerpo de los perros y gatos no procesa igual que el nuestro. Hay alimentos cotidianos —e inofensivos para una persona— que les pueden provocar desde una indigestión hasta una intoxicación grave. La mejor norma es sencilla: no darles "comida de humano" salvo lo que tu veterinario apruebe.',
        ],
      },
      {
        h: 'Lista de alimentos peligrosos',
        parrafos: ['Estos son los más importantes a evitar siempre:'],
        lista: [
          'Chocolate y cacao: contienen teobromina, tóxica para perros y gatos. Cuanto más puro, más peligroso.',
          'Uvas y pasas: pueden causar fallo renal en perros, incluso en poca cantidad.',
          'Cebolla, ajo y puerro (crudos, cocinados o en polvo): dañan sus glóbulos rojos.',
          'Xilitol (edulcorante de chicles, caramelos y algunos productos "sin azúcar"): muy tóxico, baja la glucemia de golpe.',
          'Aguacate: la persina puede sentarles mal; el hueso además es un riesgo de atragantamiento.',
          'Alcohol y masa cruda con levadura: peligrosos incluso en pequeñas cantidades.',
          'Café, té y bebidas con cafeína: les afectan al corazón y al sistema nervioso.',
          'Huesos cocidos: se astillan y pueden perforar el tubo digestivo.',
          'Frutos secos, sobre todo macadamia: tóxicos para perros.',
          'Lácteos en exceso: muchos son intolerantes a la lactosa (diarrea).',
        ],
      },
      {
        h: 'Qué hacer si come algo prohibido',
        parrafos: [
          'Si tu mascota ha comido algo de esta lista, no esperes a ver "si le pasa algo". Llama de inmediato a tu veterinario o a un centro de [urgencias 24h](/urgencias-veterinarias-24h) e indícale qué ha comido, cuánta cantidad y hace cuánto.',
          'Muy importante: no le provoques el vómito por tu cuenta — en algunos tóxicos empeora la situación. Si puedes, guarda el envase o una foto del producto para que el veterinario sepa exactamente a qué se enfrenta.',
        ],
      },
      {
        h: 'Mejor prevenir',
        parrafos: ['Pequeños hábitos que evitan sustos:'],
        lista: [
          'Guarda chocolate, dulces "sin azúcar" y fruta como las uvas fuera de su alcance.',
          'No dejes restos de comida ni bolsas accesibles.',
          'Avisa a niños y visitas de que no le den "un trocito" sin preguntar.',
          'Si quieres premiarle con comida natural, consulta a tu veterinario qué opciones son seguras.',
        ],
      },
    ],
    faq: [
      {
        q: '¿Qué pasa si mi perro come un poco de chocolate?',
        a: 'Depende del tipo y la cantidad respecto a su peso: el chocolate negro y puro es el más peligroso. Ante cualquier ingesta, llama a tu veterinario con los datos (tipo, cantidad, peso del perro) para que valore si hay riesgo.',
      },
      {
        q: '¿Los gatos tienen los mismos alimentos prohibidos?',
        a: 'En gran parte sí (chocolate, cebolla, ajo, alcohol, cafeína…). Los gatos además son muy sensibles a la cebolla y el ajo y nunca deben tomar leche en exceso ni atún en lata de forma habitual.',
      },
      {
        q: '¿Puedo darle fruta y verdura a mi perro?',
        a: 'Algunas son seguras en pequeña cantidad (manzana sin pepitas, zanahoria), pero otras como uvas y pasas son tóxicas. Consulta siempre con tu veterinario antes de incorporar alimentos nuevos.',
      },
    ],
  },
  {
    slug: 'golpe-de-calor-mascotas',
    titulo: 'Golpe de calor en perros y gatos: qué hacer',
    metaTitulo: 'Golpe de calor en perros y gatos: síntomas y qué hacer',
    descripcion:
      'Golpe de calor en perros y gatos: síntomas, primeros auxilios paso a paso, cuándo es urgencia y cómo prevenirlo en verano. Puede salvarle la vida.',
    emoji: '☀️',
    resumen:
      'En verano el golpe de calor es una urgencia real que puede ser mortal en minutos. Aprende a reconocerlo, a actuar rápido y, sobre todo, a evitarlo.',
    actualizado: '2026-06-08',
    actualizadoTexto: 'junio de 2026',
    lectura: '5 min',
    heroImg: '/images/guias/g7-hero.jpg',
    heroAlt: 'Perro jadeando con la lengua fuera por el calor',
    inlineImg: '/images/guias/g7-inline.jpg',
    inlineAlt: 'Perro bebiendo agua para refrescarse',
    inlineCaption: 'Sombra, agua fresca y nunca dejarlos en el coche: la prevención es clave.',
    inlineAfter: 1,
    secciones: [
      {
        h: 'Qué es y por qué es tan peligroso',
        parrafos: [
          'Los perros y gatos apenas sudan: regulan su temperatura sobre todo jadeando. Cuando hace mucho calor y no pueden refrescarse, su temperatura corporal sube de forma descontrolada. Eso es un golpe de calor, y puede dañar órganos vitales en cuestión de minutos. Es una de las urgencias veterinarias más graves del verano.',
          'Son especialmente vulnerables los perros de hocico chato (bulldog, carlino…), los mayores, los cachorros, los que tienen sobrepeso o problemas de corazón, y los de pelo largo y oscuro.',
        ],
      },
      {
        h: 'Señales de alarma',
        parrafos: ['Sospecha de golpe de calor si, con calor, tu mascota presenta:'],
        lista: [
          'Jadeo muy intenso y rápido que no se calma.',
          'Babeo espeso, lengua y encías muy rojas (o azuladas en casos graves).',
          'Debilidad, tambaleo, desorientación o que se desploma.',
          'Vómitos o diarrea.',
          'Temperatura corporal muy alta al tacto.',
        ],
      },
      {
        h: 'Primeros auxilios (mientras vas al veterinario)',
        parrafos: ['Actúa rápido, pero con cabeza. El objetivo es bajarle la temperatura de forma gradual:'],
        lista: [
          'Llévalo a un sitio fresco y a la sombra de inmediato.',
          'Refréscalo con agua fresca (NO helada) en patas, ingles, barriga y cuello.',
          'Ofrécele agua para beber, sin obligarle.',
          'No lo cubras con toallas mojadas muy frías ni uses hielo: un enfriamiento brusco es contraproducente.',
          'Llama y ve a un veterinario o a [urgencias 24h](/urgencias-veterinarias-24h) aunque parezca recuperarse: el daño interno no siempre se ve.',
        ],
      },
      {
        h: 'Cómo prevenirlo',
        parrafos: ['La mejor cura es que no ocurra:'],
        lista: [
          'NUNCA lo dejes en el coche, ni un minuto ni con la ventanilla bajada.',
          'Pasea a primera hora de la mañana o al anochecer, evitando las horas de más calor.',
          'Comprueba el asfalto con la mano: si te quema, le quema las almohadillas.',
          'Asegúrale siempre sombra y agua fresca disponible.',
          'No hagas ejercicio intenso con él en días de mucho calor.',
        ],
      },
    ],
    faq: [
      {
        q: '¿El golpe de calor en perros es mortal?',
        a: 'Puede serlo si no se actúa a tiempo: la subida de temperatura daña órganos vitales en pocos minutos. Por eso es una urgencia y hay que refrescarlo de forma gradual y acudir al veterinario cuanto antes.',
      },
      {
        q: 'Mi perro parece recuperado tras refrescarlo, ¿hace falta el veterinario?',
        a: 'Sí. Aunque mejore por fuera, el golpe de calor puede haber causado daños internos que no se ven. Una revisión veterinaria confirma que está bien y previene complicaciones.',
      },
      {
        q: '¿Los gatos también sufren golpes de calor?',
        a: 'Sí, aunque suelen buscar sombra por instinto. Vigila a gatos mayores, con sobrepeso o en pisos muy calurosos, y asegúrales sombra, ventilación y agua fresca.',
      },
    ],
  },
  {
    slug: 'pulgas-garrapatas-perros-gatos',
    titulo: 'Pulgas y garrapatas: cómo eliminarlas y prevenirlas',
    metaTitulo: 'Pulgas y garrapatas en perros y gatos: cómo eliminarlas',
    descripcion:
      'Cómo saber si tu mascota tiene pulgas o garrapatas, cómo eliminarlas de forma segura y cómo prevenirlas. Qué enfermedades transmiten y cuándo ir al veterinario.',
    emoji: '🐛',
    resumen:
      'Pulgas y garrapatas no son solo una molestia: transmiten enfermedades. Te contamos cómo detectarlas, eliminarlas bien y, sobre todo, mantenerlas lejos.',
    actualizado: '2026-06-08',
    actualizadoTexto: 'junio de 2026',
    lectura: '6 min',
    heroImg: '/images/guias/g8-hero.jpg',
    heroAlt: 'Persona revisando el pelaje de un perro en busca de parásitos',
    inlineImg: '/images/guias/g8-inline.jpg',
    inlineAlt: 'Revisión del pelaje de un gato en la clínica',
    inlineCaption: 'La prevención (pipetas, collares o pastillas) es mucho más fácil que tratar una plaga.',
    inlineAfter: 1,
    secciones: [
      {
        h: 'Por qué hay que tomárselas en serio',
        parrafos: [
          'Las pulgas y garrapatas no solo provocan picores: pueden transmitir enfermedades importantes. Las garrapatas pueden contagiar babesiosis, ehrlichiosis o la enfermedad de Lyme; las pulgas causan alergias y pueden transmitir parásitos intestinales. Por eso conviene prevenirlas y actuar pronto si aparecen.',
        ],
      },
      {
        h: 'Cómo saber si tu mascota las tiene',
        parrafos: ['Señales que delatan su presencia:'],
        lista: [
          'Se rasca, se muerde o se lame mucho, sobre todo lomo, cuello y base de la cola.',
          'Puntitos negros en el pelo (heces de pulga) que al mojarse se vuelven rojizos.',
          'Pequeños bultos al acariciarlo: las garrapatas se enganchan a la piel (orejas, cuello, entre los dedos).',
          'Zonas sin pelo, rojeces o costras por el rascado.',
        ],
      },
      {
        h: 'Cómo eliminarlas de forma segura',
        parrafos: ['Si ya las tiene, actúa con cuidado:'],
        lista: [
          'Garrapatas: retíralas con una pinza específica, agarrando lo más cerca posible de la piel y tirando recto sin girar. No uses aceite, alcohol ni las quemes (puede hacer que suelten más saliva infectada).',
          'Pulgas: usa un producto antiparasitario recomendado por tu veterinario (pipeta, pastilla o collar). No basta con bañarlo.',
          'Trata también el entorno: las pulgas viven en alfombras, camas y sofás. Lava textiles a temperatura alta y aspira a fondo.',
          'Si hay heridas, mucho rascado o la garrapata se ha quedado clavada, que lo vea el veterinario.',
        ],
      },
      {
        h: 'Prevención todo el año',
        parrafos: [
          'Prevenir es mucho más fácil que eliminar una plaga. Hoy existen pipetas, collares y pastillas muy eficaces; tu veterinario te indicará la mejor opción según tu mascota y tu zona. Aunque la primavera y el verano son los meses de más riesgo, en muchas regiones conviene mantener la protección todo el año.',
          'Aprovecha la revisión anual para repasar el plan antiparasitario. ¿No tienes veterinario de confianza? Encuentra [clínicas cerca de ti](/cerca-de-mi).',
        ],
      },
    ],
    faq: [
      {
        q: '¿Cómo quito una garrapata a mi perro?',
        a: 'Con una pinza específica, agarrándola lo más cerca posible de la piel y tirando recto y firme, sin girar ni aplastarla. No uses aceite, alcohol ni fuego. Si no sale entera o la zona se inflama, acude al veterinario.',
      },
      {
        q: '¿Las pulgas del perro o gato pican a las personas?',
        a: 'Pueden picar a las personas, aunque no viven en nosotros. Por eso, ante una infestación, hay que tratar también la casa (textiles, sofás, alfombras), no solo al animal.',
      },
      {
        q: '¿Cada cuánto hay que desparasitar de pulgas y garrapatas?',
        a: 'Depende del producto y de la zona, pero suele ser mensual o cada pocos meses. En muchas regiones se recomienda protección todo el año. Tu veterinario te indicará la pauta exacta.',
      },
    ],
  },
  {
    slug: 'cuanto-cuesta-esterilizar-perro-gato',
    titulo: 'Cuánto cuesta esterilizar o castrar a un perro o gato',
    metaTitulo: 'Cuánto cuesta esterilizar o castrar a un perro o gato',
    descripcion:
      'Precios orientativos de esterilizar o castrar a perros y gatos en España, de qué depende el precio, beneficios para su salud y cómo elegir clínica.',
    emoji: '✂️',
    resumen:
      '¿Cuánto cuesta castrar o esterilizar a tu mascota y merece la pena? Repasamos los precios orientativos, de qué dependen y los beneficios para su salud.',
    actualizado: '2026-06-08',
    actualizadoTexto: 'junio de 2026',
    lectura: '5 min',
    heroImg: '/images/guias/g9-hero.jpg',
    heroAlt: 'Veterinaria sujeta a un gato durante una consulta',
    inlineImg: '/images/guias/g9-inline.jpg',
    inlineAlt: 'Equipo veterinario en quirófano',
    inlineCaption: 'Pide presupuesto por escrito: una buena clínica te detalla qué incluye.',
    inlineAfter: 1,
    secciones: [
      {
        h: 'De qué depende el precio',
        parrafos: [
          'En España no hay un precio único: cada clínica fija sus tarifas. El coste de esterilizar o castrar varía bastante según varios factores, así que lo mejor es pedir presupuesto en tu zona antes de decidir.',
        ],
        lista: [
          'Especie y sexo: castrar a un macho suele ser más sencillo (y económico) que esterilizar a una hembra, que es una cirugía abdominal.',
          'Tamaño y peso del animal: a más tamaño, más anestesia y materiales.',
          'La clínica y la ciudad: el equipamiento, el tipo de anestesia y el postoperatorio influyen en el precio.',
          'Extras: analítica preanestésica, medicación para casa o un collar isabelino pueden ir aparte.',
        ],
      },
      {
        h: 'Precios orientativos',
        parrafos: [
          'Como referencia muy general (pueden variar mucho según clínica y zona): castrar a un gato macho suele ser lo más económico; esterilizar a una gata o a una perra cuesta más por ser cirugía abdominal; y en perras el precio sube con el tamaño. Pide siempre presupuesto: es lo normal y te evita sorpresas.',
          'Muchos ayuntamientos y protectoras tienen campañas de esterilización a precio reducido en ciertas épocas — merece la pena preguntar.',
        ],
      },
      {
        h: 'Por qué merece la pena (más allá del precio)',
        parrafos: ['Esterilizar no es solo evitar camadas no deseadas; tiene beneficios de salud y convivencia:'],
        lista: [
          'Previene enfermedades: reduce tumores de mama e infecciones de útero en hembras, y problemas de próstata en machos.',
          'Evita camadas no deseadas y ayuda a controlar el abandono.',
          'Mejora la convivencia: menos escapadas, marcajes y conductas asociadas al celo.',
          'Es una cirugía rutinaria y segura en una clínica con buen equipo.',
        ],
      },
      {
        h: 'Cómo elegir dónde hacerlo',
        parrafos: [
          'Para una cirugía programada como esta, merece la pena comparar un par de clínicas y preguntar qué incluye cada presupuesto (analítica previa, anestesia, postoperatorio). Una clínica seria te lo explicará con claridad y por escrito. Si quieres ampliar, lee también nuestra guía de [cómo elegir clínica veterinaria](/guias/como-elegir-clinica-veterinaria) y busca [clínicas cerca de ti](/clinicas).',
        ],
      },
    ],
    faq: [
      {
        q: '¿Es mejor castrar o esterilizar?',
        a: 'Son términos que a veces se usan indistintamente. Lo importante es seguir el consejo de tu veterinario sobre el método y el momento más adecuados para tu mascota según su especie, edad y salud.',
      },
      {
        q: '¿A qué edad se esteriliza a un perro o gato?',
        a: 'Suele hacerse cuando son jóvenes, pero la edad ideal depende de la especie, la raza y el tamaño. Tu veterinario te indicará el mejor momento en cada caso.',
      },
      {
        q: '¿La esterilización engorda a mi mascota?',
        a: 'Cambia un poco su metabolismo y pueden tender a ganar peso si no se ajusta la alimentación y el ejercicio. Con una dieta adecuada se controla sin problema.',
      },
    ],
  },
]

export function getGuia(slug: string): Guia | undefined {
  return GUIAS.find((g) => g.slug === slug)
}
