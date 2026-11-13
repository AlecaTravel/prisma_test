import Head from 'next/head';
import Link from 'next/link';
import { useMemo, useState, type FormEvent } from 'react';
import Layout from '../../components/layout/Layout';
import { isValidStayDates, type StayDates } from '../../lib/stay-dates';
import styles from './SearchExperienceLab.module.css';

type Theme = 'coast' | 'paper' | 'night';
type Composition = 'classic' | 'sidebar' | 'dual';
type DatePolicy = 'required' | 'flexible';
type FlowStep = 'search' | 'results' | 'reserve';
type Dialog = 'dates' | 'preserve' | null;
type PriceOrder = 'asc' | 'desc';
type ScenarioId = 'required-dates' | 'flexible-dates' | 'preserve-dates';
type TestResult = 'yes' | 'no' | 'untested';

type TestCase = {
  id: string;
  title: string;
  instruction: string;
  expectation: string;
};

const SCENARIOS: Array<{ id: ScenarioId; title: string; description: string }> = [
  {
    id: 'required-dates',
    title: '1. Fechas obligatorias',
    description: 'Intenta buscar sin fechas y revisa el mensaje de validación.',
  },
  {
    id: 'flexible-dates',
    title: '2. Buscar con flexibilidad',
    description: 'Compara precios sin fechas y selecciona una estancia.',
  },
  {
    id: 'preserve-dates',
    title: '3. Mantener la estancia',
    description: 'Cambia el destino y confirma que se ofrezca conservar 3 noches.',
  },
];

const TEST_CASES: TestCase[] = [
  {
    id: 'required',
    title: 'Las fechas obligatorias se entienden',
    instruction: 'Abre «Fechas obligatorias», deja las fechas vacías y pulsa «Buscar estancias».',
    expectation: 'La búsqueda no avanza y explica qué fechas hacen falta.',
  },
  {
    id: 'flexible',
    title: 'La búsqueda flexible muestra precios útiles',
    instruction: 'Abre «Buscar con flexibilidad» y revisa las etiquetas de precio.',
    expectation: 'Ves el precio menor y el mayor; todavía no se inicia una reserva.',
  },
  {
    id: 'reselect',
    title: 'Se piden fechas antes de reservar',
    instruction: 'Sin fechas, pulsa «Elegir fechas» y luego continúa con fechas válidas.',
    expectation: 'Se abre un selector de fechas antes del resumen de reserva.',
  },
  {
    id: 'preserve',
    title: 'La siguiente búsqueda ofrece conservar la estancia',
    instruction: 'Abre «Mantener la estancia», cambia el destino y busca.',
    expectation: 'El aviso conserva las fechas seleccionadas (3 noches / 4 días).',
  },
];

type DemoHotel = {
  id: string;
  name: string;
  location: string;
  price: number;
  rating: string;
  scene: string;
  type: string;
  features: string[];
};

const INITIAL_DATES: StayDates = { checkIn: '2027-05-01', checkOut: '2027-05-04' };

const HOTELS: DemoHotel[] = [
  {
    id: 'marea',
    name: 'Casa Marea Boutique',
    location: 'Zona Romántica · a 2 min de la playa',
    price: 3680,
    rating: '9.4 · Excepcional',
    scene: 'coast',
    type: 'Boutique',
    features: ['Desayuno incluido', 'Cancelación gratis'],
  },
  {
    id: 'palma',
    name: 'Hotel Palma Real',
    location: 'Marina Vallarta · frente al mar',
    price: 5290,
    rating: '9.1 · Fantástico',
    scene: 'garden',
    type: 'Resort',
    features: ['Todo incluido', 'Alberca'],
  },
  {
    id: 'brisa',
    name: 'Brisa del Pacífico Resort',
    location: 'Conchas Chinas · vista al océano',
    price: 7840,
    rating: '9.7 · Excepcional',
    scene: 'city',
    type: 'Resort',
    features: ['Playa privada', 'Spa'],
  },
];

const CURRENCY = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
});

function nightsBetween(dates: StayDates | null): number {
  if (!dates || !isValidStayDates(dates.checkIn, dates.checkOut)) return 0;
  const checkIn = new Date(`${dates.checkIn}T00:00:00.000Z`).getTime();
  const checkOut = new Date(`${dates.checkOut}T00:00:00.000Z`).getTime();
  return Math.round((checkOut - checkIn) / 86_400_000);
}

function formatDate(value: string): string {
  if (!value) return 'Sin elegir';
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export function SearchExperienceLab() {
  const [theme, setTheme] = useState<Theme>('coast');
  const [composition, setComposition] = useState<Composition>('classic');
  const [datePolicy, setDatePolicy] = useState<DatePolicy>('required');
  const [step, setStep] = useState<FlowStep>('results');
  const [destination, setDestination] = useState('Puerto Vallarta');
  const [activeDestination, setActiveDestination] = useState('Puerto Vallarta');
  const [dates, setDates] = useState<StayDates>(INITIAL_DATES);
  const [savedDates, setSavedDates] = useState<StayDates | null>(INITIAL_DATES);
  const [searched, setSearched] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [pendingDestination, setPendingDestination] = useState('');
  const [priceOrder, setPriceOrder] = useState<PriceOrder>('asc');
  const [propertyType, setPropertyType] = useState('all');
  const [selectedHotel, setSelectedHotel] = useState<DemoHotel | null>(null);
  const [modalDates, setModalDates] = useState<StayDates>({ checkIn: '', checkOut: '' });
  const [confirmed, setConfirmed] = useState(false);
  const [activeScenario, setActiveScenario] = useState<ScenarioId | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [testNotes, setTestNotes] = useState<Record<string, string>>({});

  const nights = nightsBetween(savedDates);
  const hotels = useMemo(() => {
    const filtered = HOTELS.filter(
      (hotel) => propertyType === 'all' || hotel.type === propertyType,
    );
    return [...filtered].sort((a, b) =>
      priceOrder === 'asc' ? a.price - b.price : b.price - a.price,
    );
  }, [priceOrder, propertyType]);

  const openReservation = (hotel: DemoHotel) => {
    setSelectedHotel(hotel);
    setConfirmed(false);
    setFeedback('');
    if (!savedDates || !isValidStayDates(savedDates.checkIn, savedDates.checkOut)) {
      setModalDates(dates);
      setDialog('dates');
      return;
    }
    setStep('reserve');
  };

  const runSearch = (nextDestination: string, nextDates: StayDates | null) => {
    setActiveDestination(nextDestination.trim());
    setDates(nextDates ?? { checkIn: '', checkOut: '' });
    setSavedDates(nextDates);
    setSearched(true);
    setFeedback('');
    setDialog(null);
    setStep('results');
    setPropertyType('all');
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextDestination = destination.trim();
    if (nextDestination.length < 2) {
      setFeedback('Escribe un destino para explorar opciones.');
      return;
    }

    const hasOneDate = Boolean(dates.checkIn) !== Boolean(dates.checkOut);
    if (hasOneDate) {
      setFeedback('Completa ambas fechas o déjalas vacías para buscar con flexibilidad.');
      return;
    }
    if (datePolicy === 'required' && !isValidStayDates(dates.checkIn, dates.checkOut)) {
      setFeedback('Para continuar, elige una fecha de entrada y una de salida.');
      return;
    }
    if (dates.checkIn && dates.checkOut && !isValidStayDates(dates.checkIn, dates.checkOut)) {
      setFeedback('La salida debe ser posterior a la entrada.');
      return;
    }

    if (searched && savedDates && isValidStayDates(savedDates.checkIn, savedDates.checkOut)) {
      setPendingDestination(nextDestination);
      setDialog('preserve');
      return;
    }

    runSearch(
      nextDestination,
      dates.checkIn && dates.checkOut ? dates : null,
    );
  };

  const handleDateSelection = () => {
    if (!isValidStayDates(modalDates.checkIn, modalDates.checkOut)) {
      setFeedback('Selecciona fechas válidas para poder reservar.');
      return;
    }
    setDates(modalDates);
    setSavedDates(modalDates);
    setDialog(null);
    setStep('reserve');
    setFeedback('');
  };

  const resetDemo = () => {
    setTheme('coast');
    setComposition('classic');
    setDatePolicy('required');
    setStep('results');
    setDestination('Puerto Vallarta');
    setActiveDestination('Puerto Vallarta');
    setDates(INITIAL_DATES);
    setSavedDates(INITIAL_DATES);
    setSearched(true);
    setFeedback('');
    setDialog(null);
    setPriceOrder('asc');
    setPropertyType('all');
    setSelectedHotel(null);
    setConfirmed(false);
    setActiveScenario(null);
  };

  const startScenario = (scenario: ScenarioId) => {
    setActiveScenario(scenario);
    setDestination('Puerto Vallarta');
    setActiveDestination('Puerto Vallarta');
    setDialog(null);
    setFeedback('');
    setSelectedHotel(null);
    setConfirmed(false);
    setPropertyType('all');
    setPriceOrder('asc');

    if (scenario === 'required-dates') {
      setDatePolicy('required');
      setDates({ checkIn: '', checkOut: '' });
      setSavedDates(null);
      setSearched(false);
      setStep('search');
      return;
    }

    if (scenario === 'flexible-dates') {
      setDatePolicy('flexible');
      setDates({ checkIn: '', checkOut: '' });
      setSavedDates(null);
      setSearched(false);
      setStep('search');
      return;
    }

    setDatePolicy('flexible');
    setDates(INITIAL_DATES);
    setSavedDates(INITIAL_DATES);
    setSearched(true);
    setStep('results');
  };

  const themeClass =
    theme === 'paper' ? styles.themePaper : theme === 'night' ? styles.themeNight : styles.themeCoast;
  const workspaceClass =
    composition === 'sidebar'
      ? styles.workspaceSidebar
      : composition === 'dual'
        ? styles.workspaceDual
        : '';
  const displayedHotels = step === 'search' ? [] : hotels;
  const lowestPrice = Math.min(...HOTELS.map((hotel) => hotel.price));
  const highestPrice = Math.max(...HOTELS.map((hotel) => hotel.price));

  return (
    <Layout>
      <Head>
        <title>Search experience lab | Aleca Travel</title>
        <meta
          name="description"
          content="Entorno privado para probar estilos, composiciones y flujos de búsqueda y reserva."
        />
      </Head>
      <main className={`${styles.page} ${themeClass}`}>
        <div className={styles.container}>
          <div className={styles.topline}>
            <span className={styles.eyebrow}>Aleca Travel · Experience lab</span>
            <Link href="/search" className={styles.backLink}>
              ← Volver a búsqueda
            </Link>
          </div>

          <header className={styles.heading}>
            <div>
              <span className={styles.eyebrow}>Search → stay → reserve</span>
              <h1>Encuentra tu próxima estancia.</h1>
              <p>
                Un espacio de prueba para comparar el tono visual y la fricción del flujo
                antes de conectarlo al inventario real.
              </p>
            </div>
            <span className={styles.demoPill}>● Solo demo · no crea reservas</span>
          </header>

          <section className={styles.scenarioPanel} aria-labelledby="scenario-title">
            <div className={styles.sectionHeading}>
              <div>
                <span className={styles.eyebrow}>Empieza aquí</span>
                <h2 id="scenario-title">Elige qué experiencia quieres probar</h2>
                <p>Un clic prepara el estado inicial. Después puedes cambiar cualquier control.</p>
              </div>
            </div>
            <div className={styles.scenarioGrid}>
              {SCENARIOS.map((scenario) => (
                <button
                  key={scenario.id}
                  type="button"
                  className={styles.scenarioButton}
                  aria-pressed={activeScenario === scenario.id}
                  onClick={() => startScenario(scenario.id)}
                >
                  <strong>{scenario.title}</strong>
                  <span>{scenario.description}</span>
                  <span className={styles.scenarioAction}>
                    {activeScenario === scenario.id ? 'Escenario activo ✓' : 'Probar escenario →'}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className={styles.controlPanel} aria-label="Controles de la experiencia">
            <div className={styles.controlIntro}>
              <span className={styles.eyebrow}>Controles en vivo</span>
              <p>Prueba combinaciones sin salir del lab. Las selecciones cambian la vista al instante.</p>
            </div>
            <div className={styles.toolbar}>
              <div className={styles.toolbarGroup}>
                <span className={styles.controlLabel}>Estilo</span>
                <div className={styles.segmented} aria-label="Estilo visual">
                  {([
                    ['coast', 'Costa'],
                    ['paper', 'Editorial'],
                    ['night', 'Noche'],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={styles.segmentButton}
                      aria-pressed={theme === value}
                      onClick={() => setTheme(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>

              </div>

              <div className={styles.toolbarGroup}>
                <span className={styles.controlLabel}>Composición</span>
                <div className={styles.segmented} aria-label="Composición de página">
                  {([
                    ['classic', 'Clásica'],
                    ['sidebar', 'Lateral'],
                    ['dual', 'Doble'],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={styles.segmentButton}
                      aria-pressed={composition === value}
                      onClick={() => setComposition(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.toolbarGroup}>
                <span className={styles.controlLabel}>Fechas</span>
                <div className={styles.segmented} aria-label="Regla de fechas">
                  <button
                    type="button"
                    className={styles.segmentButton}
                    aria-pressed={datePolicy === 'required'}
                    onClick={() => {
                      setDatePolicy('required');
                      setFeedback('');
                    }}
                  >
                    Requeridas
                  </button>
                  <button
                    type="button"
                    className={styles.segmentButton}
                    aria-pressed={datePolicy === 'flexible'}
                    onClick={() => {
                      setDatePolicy('flexible');
                      setFeedback('');
                    }}
                  >
                    Flexibles
                  </button>
                </div>
              </div>

              <button type="button" className={styles.quietButton} onClick={resetDemo}>
                Reiniciar demo
              </button>
            </div>

            <nav className={styles.stepper} aria-label="Pasos del flujo de reserva">
              {([
                ['search', '01', 'Buscar'],
                ['results', '02', 'Comparar'],
                ['reserve', '03', 'Reservar'],
              ] as const).map(([value, number, label]) => (
                <button
                  key={value}
                  type="button"
                  className={styles.stepButton}
                  aria-current={step === value ? 'step' : undefined}
                  onClick={() => {
                    if (value === 'reserve') {
                      if (selectedHotel) openReservation(selectedHotel);
                      else setFeedback('Elige una estancia para probar el paso de reserva.');
                    } else if (
                      value === 'results'
                      && datePolicy === 'required'
                      && (!searched || !isValidStayDates(dates.checkIn, dates.checkOut))
                    ) {
                      setFeedback('Completa una búsqueda con fechas antes de comparar estancias.');
                    } else {
                      setStep(value);
                      setFeedback('');
                    }
                  }}
                >
                  <span className={styles.stepNumber}>{number}</span>
                  <span className={styles.stepName}>{label}</span>
                </button>
              ))}
            </nav>
          </section>

          <div className={`${styles.workspace} ${workspaceClass}`}>
            <section className={styles.searchPanel} aria-labelledby="search-panel-title">
              <div className={styles.searchPanelHeading}>
                <div>
                  <h2 id="search-panel-title">¿A dónde quieres ir?</h2>
                  <p>
                    {datePolicy === 'required'
                      ? 'Las fechas son necesarias para comparar disponibilidad.'
                      : 'Explora precios ahora y confirma tus fechas antes de reservar.'}
                  </p>
                </div>
                {searched && <span className={styles.badge}>Búsqueda activa</span>}
              </div>

              <form onSubmit={handleSearch} noValidate>
                <div className={styles.fields}>
                  <label className={styles.field}>
                    Destino o alojamiento
                    <input
                      className={styles.input}
                      value={destination}
                      onChange={(event) => setDestination(event.target.value)}
                      placeholder="Ej. Puerto Vallarta"
                      autoComplete="off"
                    />
                  </label>
                  <label className={styles.field}>
                    Llegada
                    <input
                      className={styles.input}
                      type="date"
                      value={dates.checkIn}
                      onChange={(event) =>
                        setDates((current) => ({ ...current, checkIn: event.target.value }))
                      }
                    />
                  </label>
                  <label className={styles.field}>
                    Salida
                    <input
                      className={styles.input}
                      type="date"
                      value={dates.checkOut}
                      onChange={(event) =>
                        setDates((current) => ({ ...current, checkOut: event.target.value }))
                      }
                    />
                  </label>
                  <button type="submit" className={styles.primaryButton}>
                    Buscar estancias <span aria-hidden="true">→</span>
                  </button>
                </div>
                {feedback && (
                  <p className={styles.feedback} role="alert">
                    {feedback}
                  </p>
                )}
                <div className={styles.formFooter}>
                  <span className={styles.helperText}>
                    {savedDates && nights > 0
                      ? `Tu estancia actual: ${nights} noches · ${nights + 1} días`
                      : 'Sin fechas seleccionadas · precios orientativos por noche'}
                  </span>
                  <span className={styles.helperText}>2 adultos · 1 habitación</span>
                </div>
              </form>
            </section>

            {step !== 'search' && (
              <section className={styles.resultsPanel} aria-labelledby="results-title" aria-live="polite">
                <div className={styles.resultsHeader}>
                  <div className={styles.sectionHeading}>
                    <div>
                      <h2 id="results-title">Estancias en {activeDestination}</h2>
                      <p>
                        {datePolicy === 'flexible' && !savedDates
                          ? 'Precios por noche · agrega fechas antes de reservar'
                          : savedDates
                            ? `${formatDate(savedDates.checkIn)} — ${formatDate(savedDates.checkOut)} · ${nights} noches`
                            : 'Selecciona fechas para ver opciones'}
                      </p>
                      <div className={styles.resultsMeta}>
                        <span className={styles.badge}>{hotels.length} opciones de ejemplo</span>
                        {datePolicy === 'flexible' && !savedDates && (
                          <span>El menor y el mayor precio aparecen destacados</span>
                        )}
                      </div>
                    </div>
                    <label className={styles.sortLabel}>
                      Ordenar
                      <select
                        className={styles.select}
                        value={priceOrder}
                        onChange={(event) =>
                          setPriceOrder(event.target.value === 'desc' ? 'desc' : 'asc')
                        }
                        aria-label="Ordenar por precio"
                      >
                        <option value="asc">Menor precio</option>
                        <option value="desc">Mayor precio</option>
                      </select>
                    </label>
                  </div>

                  <div className={styles.toolbarGroup}>
                    <label className={styles.sortLabel}>
                      Tipo
                      <select
                        className={styles.select}
                        value={propertyType}
                        onChange={(event) => setPropertyType(event.target.value)}
                        aria-label="Filtrar por tipo de alojamiento"
                      >
                        <option value="all">Todos</option>
                        <option value="Resort">Resort</option>
                        <option value="Boutique">Boutique</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className={styles.hotelList}>
                  {displayedHotels.map((hotel) => {
                    const isLowest = hotel.price === lowestPrice;
                    const isHighest = hotel.price === highestPrice;
                    const total = hotel.price * Math.max(nights, 1);
                    return (
                      <article key={hotel.id} className={styles.hotelCard}>
                        <div className={styles.artwork} data-scene={hotel.scene}>
                          <span className={styles.artworkLabel}>{hotel.type} · Vallarta</span>
                        </div>
                        <div className={styles.hotelInfo}>
                          <h3>{hotel.name}</h3>
                          <p className={styles.hotelLocation}>{hotel.location}</p>
                          <p className={styles.rating}>★ {hotel.rating}</p>
                          <div className={styles.featureList}>
                            {hotel.features.map((feature) => (
                              <span key={feature} className={styles.featureChip}>
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className={styles.priceColumn}>
                          <span className={styles.badge}>
                            {isLowest ? 'Menor precio' : isHighest ? 'Mayor precio' : 'Recomendado'}
                          </span>
                          <strong className={styles.price}>
                            {CURRENCY.format(datePolicy === 'flexible' && !savedDates ? hotel.price : total)}
                          </strong>
                          <span className={styles.priceNote}>
                            {datePolicy === 'flexible' && !savedDates
                              ? 'por noche · demo'
                              : `total · ${nights} noches`}
                          </span>
                          <button
                            type="button"
                            className={styles.primaryButton}
                            onClick={() => openReservation(hotel)}
                          >
                            {savedDates ? 'Continuar' : 'Elegir fechas'}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                  {displayedHotels.length === 0 && (
                    <p className={styles.helperText}>No hay opciones con este filtro.</p>
                  )}
                </div>
              </section>
            )}

            {step === 'reserve' && (
              <aside className={styles.selectionPanel} aria-labelledby="selection-title">
                <div className={styles.selectionSummary}>
                  <h2 id="selection-title">Tu reserva de prueba</h2>
                  <span className={styles.badge}>{confirmed ? 'Simulación completa' : 'Paso 3 de 3'}</span>
                </div>
                {selectedHotel ? (
                  <>
                    <div className={styles.selectionVisual}>
                      {confirmed ? '✓' : '✦'}
                      <br />
                      {confirmed ? 'Recorrido completado' : selectedHotel.name}
                    </div>
                    <div className={styles.selectionDetails}>
                      <div className={styles.selectionRow}>
                        <span>Destino</span>
                        <strong>{activeDestination}</strong>
                      </div>
                      <div className={styles.selectionRow}>
                        <span>Estancia</span>
                        <strong>
                          {savedDates
                            ? `${formatDate(savedDates.checkIn)} — ${formatDate(savedDates.checkOut)}`
                            : 'Por confirmar'}
                        </strong>
                      </div>
                      <div className={styles.selectionRow}>
                        <span>Precio estimado</span>
                        <strong>
                          {CURRENCY.format(selectedHotel.price * Math.max(nights, 1))}
                        </strong>
                      </div>
                    </div>
                    {!confirmed ? (
                      <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={() => setConfirmed(true)}
                      >
                        Simular confirmación
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => {
                          setConfirmed(false);
                          setStep('results');
                        }}
                      >
                        Volver a resultados
                      </button>
                    )}
                    <p className={styles.demoNote}>
                      Vista de prueba: no se cobra, no se guarda una reserva ni se contacta a un proveedor.
                    </p>
                  </>
                ) : (
                  <div className={styles.selectionVisual}>
                    Elige una estancia para revisar el último paso.
                  </div>
                )}
              </aside>
            )}

            {step === 'results' && composition !== 'sidebar' && (
              <aside className={styles.selectionPanel} aria-labelledby="selection-title">
                <h2 id="selection-title">Tu viaje, a tu ritmo</h2>
                <div className={styles.selectionVisual}>
                  <span>
                    <strong>{savedDates ? `${nights} noches · ${nights + 1} días` : 'Fechas flexibles'}</strong>
                    <br />
                    {savedDates
                      ? `${formatDate(savedDates.checkIn)} — ${formatDate(savedDates.checkOut)}`
                      : 'Elige una estancia para continuar'}
                  </span>
                </div>
                <div className={styles.selectionRow}>
                  <span>Política de fechas</span>
                  <strong>{datePolicy === 'required' ? 'Requeridas' : 'Flexibles'}</strong>
                </div>
                <p className={styles.demoNote}>
                  {datePolicy === 'flexible'
                    ? 'Puedes comparar primero; pediremos fechas antes de continuar con la reserva.'
                    : 'Las fechas quedan guardadas para que tu siguiente búsqueda las conserve.'}
                </p>
              </aside>
            )}
          </div>

          <section className={styles.testPanel} aria-labelledby="test-plan-title">
            <div className={styles.testPanelHeader}>
              <div>
                <span className={styles.eyebrow}>Tu evaluación</span>
                <h2 id="test-plan-title">¿La experiencia hizo lo esperado?</h2>
                <p>Prueba cada recorrido y marca tu respuesta. Las notas se quedan en esta página.</p>
              </div>
              <div className={styles.testSummary} aria-live="polite">
                {Object.values(testResults).filter((result) => result === 'yes').length} sí ·{' '}
                {Object.values(testResults).filter((result) => result === 'no').length} no ·{' '}
                {TEST_CASES.length
                  - Object.values(testResults).filter((result) => result === 'yes' || result === 'no').length}{' '}
                sin probar
              </div>
            </div>
            <div className={styles.testList}>
              {TEST_CASES.map((testCase) => {
                const result = testResults[testCase.id] ?? 'untested';
                return (
                  <article key={testCase.id} className={styles.testCase}>
                    <div className={styles.testCaseCopy}>
                      <h3>{testCase.title}</h3>
                      <p><strong>Prueba:</strong> {testCase.instruction}</p>
                      <p><strong>Debería ocurrir:</strong> {testCase.expectation}</p>
                    </div>
                    <div
                      className={styles.testAnswer}
                      role="group"
                      aria-label={`Resultado: ${testCase.title}`}
                    >
                      {([
                        ['yes', 'Sí'],
                        ['no', 'No'],
                        ['untested', 'Sin probar'],
                      ] as const).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          className={styles.answerButton}
                          aria-pressed={result === value}
                          onClick={() =>
                            setTestResults((current) => ({ ...current, [testCase.id]: value }))
                          }
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <label className={styles.notesLabel}>
                      Observaciones
                      <textarea
                        className={styles.notesInput}
                        value={testNotes[testCase.id] ?? ''}
                        onChange={(event) =>
                          setTestNotes((current) => ({
                            ...current,
                            [testCase.id]: event.target.value,
                          }))
                        }
                        placeholder="¿Qué notaste? ¿Qué cambiarías?"
                        rows={2}
                      />
                    </label>
                  </article>
                );
              })}
            </div>
            <div className={styles.testPanelFooter}>
              <span>Evaluación local: al recargar la página, tus respuestas se reinician.</span>
              <button
                type="button"
                className={styles.quietButton}
                onClick={() => {
                  setTestResults({});
                  setTestNotes({});
                }}
              >
                Limpiar respuestas
              </button>
            </div>
          </section>
        </div>

        {dialog && (
          <div className={styles.modalBackdrop} role="presentation">
            <section
              className={styles.modal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="lab-dialog-title"
              aria-describedby="lab-dialog-description"
            >
              {dialog === 'preserve' && (
                <>
                  <span className={styles.eyebrow}>Tu siguiente búsqueda</span>
                  <h2 id="lab-dialog-title">¿Conservamos tus fechas?</h2>
                  <p id="lab-dialog-description">
                    Tu estancia de {nights} noches ({formatDate(savedDates?.checkIn ?? '')} —{' '}
                    {formatDate(savedDates?.checkOut ?? '')}) se mantendrá para{' '}
                    {pendingDestination}. Así puedes comparar otro destino sin volver a elegirlas.
                  </p>
                  <div className={styles.modalActions}>
                    <button
                      type="button"
                      className={styles.primaryButton}
                      onClick={() => runSearch(pendingDestination, savedDates)}
                    >
                      Conservar fechas
                    </button>
                    {dates.checkIn && dates.checkOut && isValidStayDates(dates.checkIn, dates.checkOut) && (
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => runSearch(pendingDestination, dates)}
                      >
                        Usar las fechas del formulario
                      </button>
                    )}
                    {datePolicy === 'flexible' && (
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => runSearch(pendingDestination, null)}
                      >
                        Buscar sin fechas
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.quietButton}
                      onClick={() => setDialog(null)}
                    >
                      Seguir editando
                    </button>
                  </div>
                </>
              )}

              {dialog === 'dates' && (
                <>
                  <span className={styles.eyebrow}>Un paso antes de reservar</span>
                  <h2 id="lab-dialog-title">¿Qué días te gustaría viajar?</h2>
                  <p id="lab-dialog-description">
                    Los precios son orientativos hasta confirmar tu estancia. Elige fechas para
                    revisar el total de {selectedHotel?.name}.
                  </p>
                  <div className={styles.modalDateGrid}>
                    <label className={styles.field}>
                      Llegada
                      <input
                        className={styles.input}
                        type="date"
                        value={modalDates.checkIn}
                        onChange={(event) =>
                          setModalDates((current) => ({ ...current, checkIn: event.target.value }))
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      Salida
                      <input
                        className={styles.input}
                        type="date"
                        value={modalDates.checkOut}
                        onChange={(event) =>
                          setModalDates((current) => ({ ...current, checkOut: event.target.value }))
                        }
                      />
                    </label>
                  </div>
                  {feedback && <p className={styles.feedback} role="alert">{feedback}</p>}
                  <div className={styles.modalActions}>
                    <button type="button" className={styles.primaryButton} onClick={handleDateSelection}>
                      Ver resumen de reserva
                    </button>
                    <button
                      type="button"
                      className={styles.quietButton}
                      onClick={() => setDialog(null)}
                    >
                      Ahora no
                    </button>
                  </div>
                </>
              )}

            </section>
          </div>
        )}
      </main>
    </Layout>
  );
}
