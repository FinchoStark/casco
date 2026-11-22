// Datos fijos: temario, niveles, técnicas y frases del mentor.
'use strict';

const NINJA = {
  inicio: 'https://app.formacion.ninja/',
  tests: 'https://app.formacion.ninja/tests',
  clases: 'https://app.formacion.ninja/clases/bomberos-especialistas-ayuntamiento-de-madrid',
  convocatorias: 'https://app.formacion.ninja/convocatorias',
};

// Páginas por pomodoro de materia nueva (primera vuelta)
const PAGS_POMO = { esp: 4, com: 3 };

// Orden de estudio. tipo: esp = específico, com = comunes
const TEMAS = [
  // Bloque A · Fuego
  { id: 'e1', n: '1', t: 'Teoría del fuego', p: 43, tipo: 'esp', b: 'A · Fuego',
    tip: 'Cuadro comparativo: clases de fuego (A, B, C, D, F) y su agente extintor. Acrónimo para el tetraedro del fuego.' },
  { id: 'e2', n: '2', t: 'Incendios de interior (I)', p: 30, tipo: 'esp', b: 'A · Fuego',
    tip: 'Cuadro comparativo: flashover, backdraft y rollover (qué es, señales, cómo se evita).' },
  { id: 'e3', n: '3', t: 'Incendios de interior (II)', p: 37, tipo: 'esp', b: 'A · Fuego',
    tip: 'Mapa mental de las técnicas de ataque y ventilación. Técnica de la cadena para el orden de actuación.' },
  { id: 'e4', n: '4', t: 'Hidráulica', p: 21, tipo: 'esp', b: 'A · Fuego',
    tip: 'Código fonético para presiones, caudales y diámetros. Haz a mano los ejemplos de cálculo.' },
  { id: 'e5', n: '5', t: 'Incendios de vegetación', p: 19, tipo: 'esp', b: 'A · Fuego',
    tip: 'Mapa mental de las partes del incendio forestal y los factores (combustible, topografía, meteorología).' },
  // Bloque B · Electricidad
  { id: 'e18', n: '18', t: 'Conceptos básicos de electricidad', p: 33, tipo: 'esp', b: 'B · Electricidad',
    tip: 'Fórmulas en un folio aparte. Código fonético para las tensiones de cada categoría.' },
  { id: 'e19', n: '19', t: 'Infraestructuras eléctricas', p: 47, tipo: 'esp', b: 'B · Electricidad',
    tip: 'Cuadro comparativo: alta, media y baja tensión (valores, instalaciones, riesgos).' },
  // Bloque C · Edificación
  { id: 'e11', n: '11-13', t: 'Edificaciones (I, II, III)', p: 125, tipo: 'esp', b: 'C · Edificación',
    tip: 'Tema largo: buen candidato para el palacio de la memoria (una habitación por apartado).' },
  { id: 'e14', n: '14', t: 'Edificaciones (IV)', p: 51, tipo: 'esp', b: 'C · Edificación',
    tip: 'Cuadros comparativos de tipos de estructura y sus patologías o fallos en incendio.' },
  { id: 'e30', n: '30-31', t: 'Código Técnico de la Edificación (I y II)', p: 48, tipo: 'esp', b: 'C · Edificación',
    tip: 'Muchas cifras (distancias, resistencias, ocupación): código fonético y subrayado verde a tope.' },
  { id: 'e20', n: '20', t: 'Instalaciones de la edificación (I)', p: 48, tipo: 'esp', b: 'C · Edificación',
    tip: 'Mapa mental por tipo de instalación: dónde está, cómo se corta y qué riesgo tiene.' },
  { id: 'e21', n: '21', t: 'Instalaciones de la edificación (II)', p: 22, tipo: 'esp', b: 'C · Edificación',
    tip: 'Sigue el mapa mental del tema 20 añadiendo ramas.' },
  { id: 'e22', n: '22', t: 'Instalaciones de la edificación (III)', p: 29, tipo: 'esp', b: 'C · Edificación',
    tip: 'Cierra el mapa de instalaciones y haz el folio de los tres temas juntos.' },
  // Bloque D · Rescate
  { id: 'e15', n: '15', t: 'Accesos forzados', p: 48, tipo: 'esp', b: 'D · Rescate e intervención',
    tip: 'Cuadro comparativo de herramientas: para qué sirve cada una y en qué tipo de puerta o cerradura.' },
  { id: 'e10b', n: '10.2', t: 'Rescate en ascensores', p: 17, tipo: 'esp', b: 'D · Rescate e intervención',
    tip: 'Técnica de la cadena para la secuencia del rescate, paso a paso.' },
  { id: 'e10a', n: '10.1', t: 'Rescate apícola y de otras especies', p: 29, tipo: 'esp', b: 'D · Rescate e intervención',
    tip: 'Cuadro comparativo por especie: riesgo, equipo y procedimiento.' },
  { id: 'e16', n: '16', t: 'Intervenciones en arbolado urbano', p: 41, tipo: 'esp', b: 'D · Rescate e intervención',
    tip: 'Mapa mental de riesgos y técnicas de corte.' },
  { id: 'e6', n: '6-7', t: 'Seguridad en trabajos verticales (ANETVA)', p: 2, tipo: 'esp', b: 'D · Rescate e intervención',
    tip: 'Pocas páginas: léelo junto al tema 23.' },
  { id: 'e23', n: '23', t: 'Seguridad en trabajos verticales', p: 32, tipo: 'esp', b: 'D · Rescate e intervención',
    tip: 'Acrónimos para los equipos y la cadena de seguridad. Cuadro comparativo de los nudos.' },
  { id: 'e25', n: '25', t: 'Equipos de corte térmico y soldadura', p: 24, tipo: 'esp', b: 'D · Rescate e intervención',
    tip: 'Cuadro comparativo de los equipos: gas, temperatura, usos y riesgos.' },
  { id: 'e8', n: '8-9', t: 'Accidentes de tráfico (I y II) · APRAT', p: 93, tipo: 'esp', b: 'D · Rescate e intervención',
    tip: 'Técnica de la cadena o método del viaje para las fases de la excarcelación.' },
  // Bloque E · Riesgos y protección
  { id: 'e17', n: '17', t: 'NRBQ', p: 68, tipo: 'esp', b: 'E · Riesgos y protección',
    tip: 'Cuadro comparativo de los niveles de protección de los trajes. Acrónimos para las zonas de intervención.' },
  { id: 'e24a', n: '24.1', t: 'Guía técnica del INSST', p: 33, tipo: 'esp', b: 'E · Riesgos y protección',
    tip: 'Subrayado verde en obligaciones y cifras. Notas al margen en forma de pregunta.' },
  { id: 'e24b', n: '24.2', t: 'EPI de las vías respiratorias', p: 18, tipo: 'esp', b: 'E · Riesgos y protección',
    tip: 'Cuadro comparativo: equipos filtrantes frente a aislantes (autónomos o semiautónomos).' },
  // Bloque F · Sanitario
  { id: 'e26', n: '26-28', t: 'Soporte Vital Básico y atención inicial', p: 125, tipo: 'esp', b: 'F · Sanitario',
    tip: 'Técnica de la cadena para la secuencia del SVB. Código fonético para frecuencias y profundidades.' },
  // Bloque G · Organización
  { id: 'e29a', n: '29.1', t: 'Reglamento del Cuerpo de Bomberos', p: 24, tipo: 'esp', b: 'G · Organización',
    tip: 'Es una norma: fíjate en categorías, plazos y quién decide qué.' },
  { id: 'e29b', n: '29.2', t: 'Sistema Nacional de Protección Civil · Ley 17/15', p: 6, tipo: 'esp', b: 'G · Organización',
    tip: 'Corto: acrónimo con los principios y las actuaciones del sistema.' },
  { id: 'e32', n: '32', t: 'Información de los vehículos de emergencias', p: 32, tipo: 'esp', b: 'G · Organización',
    tip: 'Cuadro comparativo de los tipos de vehículo y su dotación.' },
  // Comunes
  { id: 'c1a', n: '1.1', t: 'Constitución Española', p: 12, tipo: 'com', b: 'Comunes',
    tip: 'Método del viaje para los 10 títulos. Código fonético para los artículos clave (art. 14 = ToRo).' },
  { id: 'c1b', n: '1.2', t: 'Estatuto de Autonomía de Madrid · LO 3/83', p: 6, tipo: 'com', b: 'Comunes',
    tip: 'Cuadro comparativo de las instituciones: Asamblea, Presidente y Gobierno.' },
  { id: 'c2a', n: '2.1', t: 'Bases del Régimen Local · Ley 7/85', p: 18, tipo: 'com', b: 'Comunes',
    tip: 'Cuadro comparativo de los órganos municipales y sus competencias.' },
  { id: 'c2b', n: '2.2', t: 'Capitalidad · Ley 22/06', p: 9, tipo: 'com', b: 'Comunes',
    tip: 'Compáralo con la Ley 7/85: ¿qué tiene de especial Madrid?' },
  { id: 'c4', n: '4', t: 'EBEP (I) · RDL 5/15', p: 17, tipo: 'com', b: 'Comunes',
    tip: 'Cuadro comparativo: funcionario de carrera, interino, laboral y eventual.' },
  { id: 'c5', n: '5', t: 'EBEP (II) · RDL 5/15', p: 16, tipo: 'com', b: 'Comunes',
    tip: 'Método del viaje para derechos y deberes. Cuadro de las situaciones administrativas.' },
  { id: 'c6', n: '6', t: 'Procedimiento Administrativo · Ley 39/15', p: 28, tipo: 'com', b: 'Comunes',
    tip: 'Cuadro comparativo de los recursos (alzada, reposición, revisión) con sus plazos. Código fonético para los plazos.' },
  { id: 'c3', n: '3', t: 'Haciendas Locales · RDL 2/04', p: 16, tipo: 'com', b: 'Comunes',
    tip: 'Cuadro comparativo de impuestos, tasas y contribuciones especiales.' },
  { id: 'c8', n: '8', t: 'Prevención de Riesgos Laborales · Ley 31/95', p: 26, tipo: 'com', b: 'Comunes',
    tip: 'Acrónimo para los principios de la acción preventiva. Subrayado verde en derechos y obligaciones.' },
  { id: 'c7a', n: '7.1', t: 'Igualdad efectiva · LO 3/07', p: 5, tipo: 'com', b: 'Comunes',
    tip: 'Corto: folio en blanco directamente después de leer.' },
  { id: 'c7b', n: '7.2', t: 'Ley LGTBI · Ley 4/23', p: 5, tipo: 'com', b: 'Comunes',
    tip: 'Corto: folio en blanco directamente después de leer.' },
  { id: 'c7c', n: '7.3', t: 'Plan de Igualdad del Ayuntamiento', p: 5, tipo: 'com', b: 'Comunes',
    tip: 'Corto: mapa mental de ejes y medidas.' },
];

// Intervalos de repaso espaciado (días tras terminar el tema); luego cada 30
const REPASOS = [1, 3, 7, 15, 30];

// Niveles: se sube cuando se cumple holgadamente; nunca obligatorio.
const NIVELES = [
  { n: 1, nombre: 'Chispa', pomos: 2, desc: 'Lo único que cuenta es sentarse cada día.' },
  { n: 2, nombre: 'Llama', pomos: 3, desc: 'El hábito ya prende. Entran el subrayado por colores y las notas al margen.' },
  { n: 3, nombre: 'Hoguera', pomos: 4, desc: 'Ya hay ritmo. Entran los mapas mentales y los acrónimos.' },
  { n: 4, nombre: 'Incendio', pomos: 5, desc: 'Ya rinde de verdad. Entran los cuadros comparativos y las mnemotecnias.' },
  { n: 5, nombre: 'Flashover', pomos: 6, desc: 'Ritmo de crucero. Con esto llega de sobra.' },
];

// Técnicas: nivel en el que se desbloquean
const TECNICAS = [
  { id: 'pomodoro', nivel: 1, icono: '⏱️', nombre: 'Pomodoro + cronómetro',
    corto: 'Bloques de 25 minutos de foco total y 5 de pausa.',
    pasos: [
      'El móvil en otra habitación (o esta app en primer plano y nada más).',
      'Durante los 25 minutos no se hace nada más. Si te viene algo a la cabeza, apúntalo en un papel y sigue.',
      'En la pausa, ponte de pie, bebe agua y no mires pantallas.',
      'Después de 4 pomodoros, haz una pausa larga de 15 a 20 minutos.',
      'El cronómetro mide el tiempo neto: lo que cuenta es lo que estudias de verdad.',
    ] },
  { id: 'folio', nivel: 1, icono: '📄', nombre: 'Truco del folio',
    corto: 'Con el libro cerrado, escribe en un folio en blanco todo lo que recuerdes.',
    pasos: [
      'Al acabar un apartado o la sesión, coge un folio en blanco y cierra el libro.',
      'Escribe todo lo que recuerdes: esquema, listas y datos. Aunque sea poco.',
      'Abre el libro y completa con OTRO color lo que faltaba.',
      'Lo escrito en ese otro color es lo que repasas mañana.',
      'Guarda los folios por tema: con el tiempo forman tu resumen de repaso.',
    ] },
  { id: 'subrayado', nivel: 1, icono: '✏️', nombre: 'Lectura en dos pasadas',
    corto: 'Primero se entiende y luego se subraya. En la primera lectura, nada de subrayar.',
    pasos: [
      'Prelectura de 2-3 minutos: títulos, negritas, imágenes y esquemas.',
      'Primera lectura sin subrayar: como mucho, una raya de lápiz en el margen.',
      'Segunda lectura: ahora sí, subraya solo lo importante.',
    ] },
  { id: 'jerarquia', nivel: 2, icono: '🖍️', nombre: 'Jerarquía de subrayado',
    corto: 'Tres colores, cada uno con su función, y menos del 20 % del texto.',
    pasos: [
      'ROJO: la idea principal de cada párrafo (2-5 palabras, no la frase entera).',
      'AZUL: las ideas secundarias que explican la principal.',
      'VERDE: datos de examen: cifras, plazos, artículos, temperaturas, excepciones.',
      'En las leyes, fíjate en lo que los tests usan para pillar: días hábiles o naturales, «podrá» o «deberá», «salvo», «excepto».',
      'SUBRAYADO INVERSO: cada pregunta que falles en un test de Ninja, búscala en el PDF y márcala con ★.',
    ] },
  { id: 'margen', nivel: 2, icono: '💬', nombre: 'Notas en el margen',
    corto: 'Palabras clave y preguntas al margen para repasar tapando el texto.',
    pasos: [
      'Una palabra clave (1-3 palabras) por párrafo.',
      'Mejor en forma de pregunta: no «Clases de fuego», sino «¿Qué 5 clases de fuego hay?».',
      'Al repasar, tapa el texto y responde a las preguntas del margen.',
      'Símbolos: ★ fallada en un test · ⚠ trampa o excepción · ↔ comparar con otro tema · ? duda para la academia.',
    ] },
  { id: 'mapas', nivel: 3, icono: '🧠', nombre: 'Mapas mentales',
    corto: 'Un tema entero en una sola hoja, para verlo de un vistazo.',
    pasos: [
      'El título del tema en el centro de la hoja, en horizontal.',
      'Una rama por apartado y, de ella, ramas más pequeñas con palabras clave.',
      'Dibujos sencillos y colores: se recuerdan mejor que el texto.',
      'Se repasa en un minuto: ideal para el primer pomodoro del día.',
    ] },
  { id: 'acronimos', nivel: 3, icono: '🔤', nombre: 'Acrónimos',
    corto: 'Con las iniciales de una lista se forma una palabra o una frase absurda.',
    pasos: [
      'Para listas cortas en las que el orden no importa (o puede inventarse).',
      'Con las iniciales se forma una palabra que exista o una frase absurda.',
      'Cuanto más ridícula y tuya sea, mejor se recuerda.',
      'No hagas acrónimos de todo: solo de lo que no entra entendiéndolo.',
    ] },
  { id: 'cuadros', nivel: 4, icono: '📊', nombre: 'Cuadros comparativos',
    corto: 'Para lo que se parece y se confunde: una tabla con los mismos criterios.',
    pasos: [
      'Una columna por cada cosa que se compara y una fila por cada criterio.',
      'Usa siempre los mismos criterios: definición, cifras, cuándo, quién, excepciones.',
      'Ejemplos: flashover, backdraft y rollover; funcionario e interino; tipos de recurso.',
      'Las diferencias son justo lo que pregunta el test.',
    ] },
  { id: 'fonetico', nivel: 4, icono: '🔢', nombre: 'Código fonético',
    corto: 'Cada número es una consonante, y con ellas se forman palabras que se recuerdan.',
    pasos: [
      '0 = S/Z · 1 = T/D · 2 = N/Ñ · 3 = M · 4 = R · 5 = L · 6 = J/G/CH · 7 = K/C/Q · 8 = F · 9 = P/B.',
      'Las vocales no cuentan: se ponen las que haga falta.',
      'Ejemplo: art. 14 = T-R = ToRo. 39 = M-P = MaPa.',
      'Aprende el código en 2 o 3 días. Abajo tienes un conversor, y Ninja tiene su Calculadora Fonética.',
    ] },
  { id: 'cadena', nivel: 4, icono: '⛓️', nombre: 'Técnica de la cadena',
    corto: 'Cada paso se une al siguiente con una imagen absurda.',
    pasos: [
      'Para secuencias en las que el orden importa: pasos del SVB, fases de la excarcelación…',
      'Convierte cada paso en una imagen concreta.',
      'Une la imagen 1 con la 2 en una escena exagerada, con movimiento; luego la 2 con la 3, y así.',
      'Para recordarla, tira de la cadena desde el principio.',
    ] },
  { id: 'viaje', nivel: 5, icono: '🚶', nombre: 'Método del viaje',
    corto: 'Colocas cada elemento en un punto de un recorrido que te sabes de memoria.',
    pasos: [
      'Elige un recorrido conocido (de casa al gimnasio, por ejemplo) con 10-20 paradas fijas.',
      'Pon en cada parada una imagen del elemento de la lista.',
      'Para recordar, recorre el camino mentalmente.',
      'Ideal para listas largas y ordenadas: los 10 títulos de la Constitución, por ejemplo.',
    ] },
  { id: 'palacio', nivel: 5, icono: '🏰', nombre: 'Palacio de la memoria',
    corto: 'Una casa que conoces, con una habitación por tema y un mueble por apartado.',
    pasos: [
      'Úsalo solo para 2 o 3 temas grandes (Edificaciones, CTE…).',
      'Cada habitación es un tema y cada mueble un apartado.',
      'Coloca imágenes exageradas en cada mueble.',
      'Repasa recorriendo la casa siempre en el mismo sentido.',
    ] },
];

// Pasos guiados según el tipo de pomodoro
const GUIAS = {
  nuevo: [
    'Prelectura (2-3 min): títulos, negritas e imágenes.',
    'Primera lectura sin subrayar.',
    'Segunda lectura subrayando (y notas al margen, cuando las tengas desbloqueadas).',
  ],
  repaso: [
    'Folio en blanco del tema, con el libro cerrado.',
    'Abre y completa con otro color lo que faltaba.',
    'Repasa el subrayado verde y las ★.',
  ],
  cierre: [
    'Folio en blanco de lo de hoy.',
    'Completa con otro color.',
    'Test corto en Ninja del tema de hoy y apunta el resultado aquí.',
  ],
  libre: [
    'Elige un tema y repasa lo que tengas más flojo.',
  ],
};

// Frases del mentor (propias)
const FRASES = [
  'La constancia gana a la intensidad. Hoy toca sentarse, nada más.',
  'Un pomodoro malo cuenta más que uno que no hiciste.',
  'No estudias para hoy: estudias para acordarte en julio.',
  'El casco no se gana en un día bueno, sino sumando muchos normales.',
  'Si cuesta empezar, ponte 5 minutos. Casi siempre te quedas.',
  'Cada folio en blanco que llenas es memoria de verdad.',
  'El corte lo marca el test: cada pregunta que sepas es una neta más.',
  'Descansar también entrena. El domingo es sagrado.',
  'Lo que fallas hoy en un test es lo que aciertas en el examen.',
  'Igual que con un incendio: primero se controla y luego se extingue. Primero el hábito, luego el temario.',
];
