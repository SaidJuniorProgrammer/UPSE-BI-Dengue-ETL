import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { DashboardService, DashboardFilters } from './services/dashboard';

const BRAND = {
  navy: '#053A90',
  navySoft: 'rgba(5, 58, 144, 0.08)',
  blue: '#4798E4',
  blueSoft: 'rgba(71, 152, 228, 0.12)',
  green: '#057E3F',
  greenSoft: 'rgba(5, 126, 63, 0.12)',
  gray: '#667085',
};

interface MapaPunto {
  canton: string;
  lat: number;
  lng: number;
  casos_totales: number;
  tasa_incidencia_100k: number;
  precipitacion_mm: number;
  temp_maxima_c: number;
  camas_totales: number;
  camas_ocupadas: number;
  medicos_disponibles: number;
  ocupacion_pct: number;
  nivel_saturacion: string;
}

type MapLayerKey = 'casos' | 'lluvia' | 'infraestructura';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, AfterViewInit, OnDestroy {
  seccionActiva: string = 'resumen';
  kpis: any = {};
  filtroActual: string = 'Nacional';
  provinciaActual: string = '';
  cantonActual: string = '';
  anioActual: string = '';
  enfermedadActual: string = '';
  causaActual: string = '';
  origenActual: string = '';
  mostrarAvanzados: boolean = false;
  casosTendenciaPct: number = 0;
  mapaBase: string = 'osm';
  searchQuery: string = '';
  panelCapasOculto: boolean = false;

  // Catálogos
  enfermedades: any[] = [];
  geografiaMap: any = {};
  provinciasList: string[] = [];
  cantonesList: string[] = [];

  mapaDatos: MapaPunto[] = [];
  mapaActivo = false;
  mapaCargado = false;
  mapaCentro = { lat: -1.8, lng: -78.5, zoom: 7.2 }; // National view zoom/coords
  capasMapa: Record<MapLayerKey, boolean> = {
    casos: true,
    lluvia: true,
    infraestructura: true,
  };
  mapaResumen = {
    totalCasos: 0,
    lluviaPromedio: 0,
    ocupacionPromedio: 0,
    cantonCritico: 'Santa Elena',
  };

  // Capacity variables
  camasTotales: number = 0;
  camasOcupadas: number = 0;
  ocupacionPct: number = 0;
  medicosOperativos: number = 0;
  cantonesCriticosCount: number = 0;
  cantonesCriticosList: any[] = [];

  @ViewChild('mapContainer') mapContainer?: ElementRef<HTMLDivElement>;

  private leafletModule: any = null;
  private mapInstance: any = null;

  public lineChartData: ChartData<'line'> = { datasets: [], labels: [] };
  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: BRAND.navy,
          usePointStyle: true,
          boxWidth: 10,
          boxHeight: 10,
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        ticks: { color: '#667085' },
        grid: { color: 'rgba(5, 58, 144, 0.08)' },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: { display: true, text: 'Casos Confirmados', color: '#667085' },
        ticks: { color: '#667085' },
        grid: { color: 'rgba(5, 58, 144, 0.08)' },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: { display: true, text: 'Precipitación (mm)', color: '#667085' },
        ticks: { color: '#667085' },
        grid: { drawOnChartArea: false },
      },
    },
  };
  public lineChartType: 'line' = 'line';

  public barChartData: ChartData<'bar'> = { datasets: [], labels: [] };
  public barChartOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        ticks: { color: '#667085' },
        grid: { color: 'rgba(5, 58, 144, 0.08)' },
      },
      y: {
        ticks: { color: '#667085' },
        grid: { display: false },
      },
    },
  };
  public barChartType: 'bar' = 'bar';

  public scatterChartData: ChartData<'scatter'> = { datasets: [] };
  public scatterChartOptions: ChartOptions<'scatter'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: BRAND.navy,
          usePointStyle: true,
          boxWidth: 10,
          boxHeight: 10,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const rawVal = context.raw as { x: number, y: number, label: string };
            return `${rawVal.label}: ${rawVal.y} pacientes, ${rawVal.x} médicos`;
          }
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: 'Médicos Operativos', color: '#667085' },
        ticks: { color: '#667085' },
        grid: { color: 'rgba(5, 58, 144, 0.08)' },
      },
      y: {
        title: { display: true, text: 'Pacientes Febriles', color: '#667085' },
        ticks: { color: '#667085' },
        grid: { color: 'rgba(5, 58, 144, 0.08)' },
      },
    },
  };
  public scatterChartType: 'scatter' = 'scatter';

  public etiologiaChartData: ChartData<'bar'> = { datasets: [] };
  public etiologiaChartOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        title: { display: true, text: 'Casos Confirmados', color: '#667085' },
        ticks: { color: '#667085' },
        grid: { color: 'rgba(5, 58, 144, 0.08)' }
      },
      y: {
        ticks: { color: '#667085' },
        grid: { display: false }
      }
    }
  };
  public etiologiaChartType: 'bar' = 'bar';
  public etiologiasTabla: any[] = [];
  
  alertasCriticas: any[] = [];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    // Cargar catálogos
    this.dashboardService.getGeografia().subscribe((geo) => {
      this.geografiaMap = geo || {};
      this.provinciasList = Object.keys(this.geografiaMap).sort();
    });
    this.dashboardService.getEnfermedades().subscribe((list) => {
      this.enfermedades = list || [];
    });
    this.actualizarTodo();
  }

  ngAfterViewInit(): void {
    if (this.mapaActivo && this.mapaDatos.length > 0) {
      void this.renderizarMapa();
    }
  }

  ngOnDestroy(): void {
    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
    }
  }

  // Filter Handlers
  filtrarPorProvincia(provincia: string) {
    this.provinciaActual = provincia;
    this.cantonActual = ''; // Reset canton
    if (provincia) {
      this.cantonesList = (this.geografiaMap[provincia] || []).map((c: any) => c.canton).sort();
      this.filtroActual = `Prov. ${provincia}`;
    } else {
      this.cantonesList = [];
      this.filtroActual = 'Nacional';
    }
    this.actualizarTodo();
  }

  // Nueva función interactiva para filtrar por cantón
  filtrarPorCanton(canton: string, nombreVista?: string) {
    this.cantonActual = canton;
    if (nombreVista) {
      this.filtroActual = nombreVista;
    } else if (canton) {
      this.filtroActual = canton;
    } else if (this.provinciaActual) {
      this.filtroActual = `Prov. ${this.provinciaActual}`;
    } else {
      this.filtroActual = 'Nacional';
    }
    this.actualizarTodo();
  }

  filtrarPorAnio(anio: string) {
    this.anioActual = anio;
    this.actualizarTodo();
  }

  filtrarPorEnfermedad(enfermedad: string) {
    this.enfermedadActual = enfermedad;
    this.actualizarTodo();
  }

  filtrarPorCausa(causa: string) {
    this.causaActual = causa;
    this.actualizarTodo();
  }

  filtrarPorOrigen(origen: string) {
    this.origenActual = origen;
    this.actualizarTodo();
  }

  irASeccion(seccion: string) {
    this.seccionActiva = seccion;
    if (seccion === 'mapa') {
      this.activarMapa();
    }
  }

  limpiarFiltros() {
    this.provinciaActual = '';
    this.cantonActual = '';
    this.anioActual = '';
    this.enfermedadActual = '';
    this.causaActual = '';
    this.origenActual = '';
    this.cantonesList = [];
    this.filtroActual = 'Nacional';
    this.mostrarAvanzados = false;
    this.actualizarTodo();
  }

  alternarAvanzados() {
    this.mostrarAvanzados = !this.mostrarAvanzados;
  }

  limpiarFiltro(tipo: string) {
    if (tipo === 'provincia') {
      this.provinciaActual = '';
      this.cantonActual = '';
      this.cantonesList = [];
    } else if (tipo === 'canton') {
      this.cantonActual = '';
    } else if (tipo === 'anio') {
      this.anioActual = '';
    } else if (tipo === 'enfermedad') {
      this.enfermedadActual = '';
    } else if (tipo === 'causa') {
      this.causaActual = '';
    } else if (tipo === 'origen') {
      this.origenActual = '';
    }
    this.actualizarTodo();
  }

  exportarPDF() {
    window.print();
  }

  cambiarMapaBase(base: string) {
    this.mapaBase = base;
    if (this.mapaActivo) {
      void this.renderizarMapa();
    }
  }

  buscarCanton(cantonNombre: string) {
    this.searchQuery = cantonNombre;
    if (!cantonNombre) return;
    const found = this.mapaDatos.find(
      (d) => d.canton.toLowerCase().includes(cantonNombre.toLowerCase())
    );
    if (found && this.mapInstance) {
      this.mapInstance.setView([found.lat, found.lng], 10);
    }
  }

  get activeFiltersSummary(): string {
    const parts = [this.filtroActual];
    if (this.anioActual) parts.push(`Año: ${this.anioActual}`);
    if (this.enfermedadActual) parts.push(this.enfermedadActual);
    return parts.join(' | ');
  }

  togglePanelCapas() {
    this.panelCapasOculto = !this.panelCapasOculto;
    if (this.mapInstance) {
      setTimeout(() => {
        this.mapInstance.invalidateSize();
      }, 150);
    }
  }

  activarMapa(): void {
    this.mapaActivo = true;
    setTimeout(() => {
      void this.renderizarMapa();
    }, 0);
  }

  alternarCapa(capa: MapLayerKey): void {
    this.capasMapa[capa] = !this.capasMapa[capa];
    if (this.mapaActivo) {
      void this.renderizarMapa();
    }
  }

  private getFiltersPayload(): DashboardFilters {
    return {
      provincia: this.provinciaActual || undefined,
      canton: this.cantonActual || undefined,
      anio: this.anioActual || undefined,
      enfermedad: this.enfermedadActual || undefined,
      causa: this.causaActual || undefined,
      origen: this.origenActual || undefined,
    };
  }

  actualizarTodo() {
    const filters = this.getFiltersPayload();
    this.cargarKpis(filters);
    this.cargarGraficos(filters);
    this.cargarMapa(filters);
    this.cargarAlertas();
  }

  cargarKpis(filters: DashboardFilters) {
    this.dashboardService.getKpis(filters).subscribe((data) => {
      this.kpis = data || {};
    });
  }

  get urbanosPct(): number {
    const total = (Number(this.kpis.total_casos_urbanos) || 0) + (Number(this.kpis.total_casos_rurales) || 0);
    return total > 0 ? Math.round((Number(this.kpis.total_casos_urbanos) || 0) / total * 100) : 0;
  }

  get ruralesPct(): number {
    const total = (Number(this.kpis.total_casos_urbanos) || 0) + (Number(this.kpis.total_casos_rurales) || 0);
    return total > 0 ? Math.round((Number(this.kpis.total_casos_rurales) || 0) / total * 100) : 0;
  }

  get enfermedadesFiltradas(): any[] {
    return this.enfermedades.filter((e) => {
      const matchCausa = !this.causaActual || e.tipo_causa === this.causaActual;
      const matchOrigen = !this.origenActual || e.categoria_origen === this.origenActual;
      return matchCausa && matchOrigen;
    });
  }

  cargarGraficos(filters: DashboardFilters) {
    this.dashboardService.getGraficoTemporal(filters).subscribe((data: any[]) => {
      if (data && data.length >= 2) {
        const last = Number(data[data.length - 1].casos) || 0;
        const prev = Number(data[data.length - 2].casos) || 0;
        this.casosTendenciaPct = prev > 0 ? Math.round(((last - prev) / prev) * 100) : 0;
      } else {
        this.casosTendenciaPct = 0;
      }

      this.lineChartData = {
        labels: data.map((d) => `${d.anio} - Sem ${d.semana_epidem} (${d.mes.substring(0, 3)})`),
        datasets: [
          {
            data: data.map((d) => d.casos),
            label: 'Casos Confirmados',
            borderColor: BRAND.navy,
            backgroundColor: BRAND.navySoft,
            fill: true,
            tension: 0.35,
            pointRadius: 2,
            pointHoverRadius: 4,
            yAxisID: 'y',
          },
          {
            data: data.map((d) => d.lluvia),
            label: 'Precipitación (mm)',
            borderColor: BRAND.blue,
            backgroundColor: BRAND.blueSoft,
            fill: false,
            tension: 0.35,
            pointRadius: 2,
            pointHoverRadius: 4,
            yAxisID: 'y1',
            borderDash: [5, 5],
          },
          {
            data: data.map((d) => d.alertas),
            label: 'Alertas de Prensa',
            borderColor: BRAND.green,
            backgroundColor: BRAND.greenSoft,
            fill: false,
            tension: 0.35,
            pointRadius: 2,
            pointHoverRadius: 4,
            borderDash: [2, 2],
          },
        ],
      };
    });

    this.dashboardService.getGraficoCantones(filters).subscribe((data: any[]) => {
      this.barChartData = {
        labels: data.map((d) => d.canton),
        datasets: [
          {
            data: data.map((d) => d.tasa_incidencia_100k),
            label: 'Tasa de Incidencia (por 100k hab)',
            backgroundColor: BRAND.green,
            borderRadius: 8,
            hoverBackgroundColor: BRAND.blue,
          },
        ],
      };
    });

    this.dashboardService.getGraficoInfraestructura(filters).subscribe((data: any[]) => {
      if (data && data.length > 0) {
        this.camasTotales = data.reduce((acc, curr) => acc + (Number(curr.camas_totales) || 0), 0);
        this.camasOcupadas = data.reduce(
          (acc, curr) => acc + (Number(curr.camas_ocupadas) || 0),
          0,
        );
        this.ocupacionPct =
          this.camasTotales > 0 ? Math.round((this.camasOcupadas / this.camasTotales) * 100) : 0;
        this.medicosOperativos = data.reduce((acc, curr) => acc + (Number(curr.medicos_disponibles) || 0), 0);

        this.cantonesCriticosList = data.map((d) => {
          const cTot = Number(d.camas_totales) || 0;
          const cOcu = Number(d.camas_ocupadas) || 0;
          const pct = cTot > 0 ? Math.round((cOcu / cTot) * 100) : 0;
          const libres = cTot - cOcu;
          return {
            canton: d.canton,
            ocupacion_pct: pct,
            camas_libres: libres,
            camas_totales: cTot,
            camas_ocupadas: cOcu,
            medicos: Number(d.medicos_disponibles) || 0,
            nivel_saturacion: d.nivel_saturacion
          };
        }).sort((a, b) => b.ocupacion_pct - a.ocupacion_pct);

        this.cantonesCriticosCount = this.cantonesCriticosList.filter(c => c.ocupacion_pct > 80).length;

        // Prepare Scatter Plot datasets grouped by status
        const normalPoints: any[] = [];
        const altoPoints: any[] = [];
        const saturadoPoints: any[] = [];

        data.forEach(d => {
          const cTot = Number(d.camas_totales) || 0;
          const cOcu = Number(d.camas_ocupadas) || 0;
          const pct = cTot > 0 ? Math.round((cOcu / cTot) * 100) : 0;
          const pt = { x: Number(d.medicos_disponibles) || 0, y: Number(d.carga_pacientes) || 0, label: d.canton || 'Centro' };
          
          if (pct > 90) {
            saturadoPoints.push(pt);
          } else if (pct >= 70) {
            altoPoints.push(pt);
          } else {
            normalPoints.push(pt);
          }
        });

        this.scatterChartData = {
          datasets: [
            {
              data: normalPoints,
              label: 'Normal (<70%)',
              backgroundColor: '#057E3F',
              borderColor: '#ffffff',
              pointRadius: 9,
              pointHoverRadius: 11
            },
            {
              data: altoPoints,
              label: 'Alerta (70-90%)',
              backgroundColor: '#ff9f43',
              borderColor: '#ffffff',
              pointRadius: 9,
              pointHoverRadius: 11
            },
            {
              data: saturadoPoints,
              label: 'Crítico (>90%)',
              backgroundColor: '#ee5253',
              borderColor: '#ffffff',
              pointRadius: 9,
              pointHoverRadius: 11
            }
          ]
        };

      } else {
        this.camasTotales = 0;
        this.camasOcupadas = 0;
        this.ocupacionPct = 0;
        this.medicosOperativos = 0;
        this.cantonesCriticosCount = 0;
        this.cantonesCriticosList = [];
        this.scatterChartData = { datasets: [] };
      }
    });

    this.dashboardService.getGraficoEtiologia(filters).subscribe((data: any[]) => {
      const etiologyMap: Record<string, number> = {};
      const originsMap: Record<string, string[]> = {};
      let totalCasos = 0;

      data.forEach((item) => {
        const causa = item.tipo_causa || 'Otros';
        const casos = Number(item.casos) || 0;
        etiologyMap[causa] = (etiologyMap[causa] || 0) + casos;
        totalCasos += casos;
        
        if (item.categoria_origen) {
          if (!originsMap[causa]) originsMap[causa] = [];
          if (!originsMap[causa].includes(item.categoria_origen)) {
            originsMap[causa].push(item.categoria_origen);
          }
        }
      });
      
      const etiologiaList = Object.keys(etiologyMap).map(causa => {
        const casos = etiologyMap[causa];
        const pct = totalCasos > 0 ? Math.round((casos / totalCasos) * 100) : 0;
        const origenes = originsMap[causa] ? originsMap[causa].join(', ') : 'Adquirida';
        return {
          causa,
          casos,
          porcentaje: pct,
          origen: origenes
        };
      }).sort((a, b) => b.casos - a.casos);
      
      this.etiologiasTabla = etiologiaList;
      
      this.etiologiaChartData = {
        labels: etiologiaList.map(e => e.causa),
        datasets: [
          {
            data: etiologiaList.map(e => e.casos),
            backgroundColor: [BRAND.navy, BRAND.blue, BRAND.green, '#ff9f43', '#ee5253'],
            borderRadius: 6
          }
        ]
      };
    });
  }

  cargarAlertas() {
    this.dashboardService.getAlertasCriticas().subscribe((data) => {
      this.alertasCriticas = data || [];
    });
  }

  cargarMapa(filters: DashboardFilters) {
    this.dashboardService.getMapaProvincia(filters).subscribe((data: any[]) => {
      this.mapaDatos = (data || []).map((item) => ({
        canton: item.canton,
        lat: Number(item.lat),
        lng: Number(item.lng),
        casos_totales: Number(item.casos_totales) || 0,
        tasa_incidencia_100k: Number(item.tasa_incidencia_100k) || 0,
        precipitacion_mm: Number(item.precipitacion_mm) || 0,
        temp_maxima_c: Number(item.temp_maxima_c) || 0,
        camas_totales: Number(item.camas_totales) || 0,
        camas_ocupadas: Number(item.camas_ocupadas) || 0,
        medicos_disponibles: Number(item.medicos_disponibles) || 0,
        ocupacion_pct: Number(item.ocupacion_pct) || 0,
        nivel_saturacion: item.nivel_saturacion || 'N/D',
      }));

      const totalCasos = this.mapaDatos.reduce((acc, curr) => acc + curr.casos_totales, 0);
      const lluviaPromedio = this.mapaDatos.length
        ? this.mapaDatos.reduce((acc, curr) => acc + curr.precipitacion_mm, 0) /
          this.mapaDatos.length
        : 0;
      const ocupacionPromedio = this.mapaDatos.length
        ? this.mapaDatos.reduce((acc, curr) => acc + curr.ocupacion_pct, 0) / this.mapaDatos.length
        : 0;
      const cantonCritico =
        this.mapaDatos.length > 0
          ? [...this.mapaDatos].sort((a, b) => b.tasa_incidencia_100k - a.tasa_incidencia_100k)[0]
              .canton
          : 'Santa Elena';

      this.mapaResumen = {
        totalCasos,
        lluviaPromedio: Number(lluviaPromedio.toFixed(2)),
        ocupacionPromedio: Number(ocupacionPromedio.toFixed(2)),
        cantonCritico,
      };

      if (this.mapaActivo) {
        void this.renderizarMapa();
      }
    });
  }

  private async obtenerLeaflet(): Promise<any> {
    if (!this.leafletModule) {
      const module = await import('leaflet');
      let leaflet: any = module;
      if (!leaflet.map && (module as any).default && (module as any).default.map) {
        leaflet = (module as any).default;
      }
      this.leafletModule = leaflet;
      if (leaflet && leaflet.Icon && leaflet.Icon.Default) {
        delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
        leaflet.Icon.Default.mergeOptions({
          iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
          iconUrl: 'assets/leaflet/marker-icon.png',
          shadowUrl: 'assets/leaflet/marker-shadow.png',
        });
      }
    }

    return this.leafletModule;
  }

  private async renderizarMapa(): Promise<void> {
    if (!this.mapaActivo || !this.mapContainer?.nativeElement || this.mapaDatos.length === 0) {
      return;
    }

    const leaflet = await this.obtenerLeaflet();

    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
    }

    const map = leaflet.map(this.mapContainer.nativeElement, {
      zoomControl: true,
      scrollWheelZoom: false,
      preferCanvas: true,
    });

    let tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    let attrib = '&copy; OpenStreetMap contributors | Capas analíticas UPSE BI';
    if (this.mapaBase === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attrib = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
    } else if (this.mapaBase === 'dark') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      attrib = '&copy; CartoDB | Capas analíticas UPSE BI';
    }

    leaflet
      .tileLayer(tileUrl, {
        maxZoom: 18,
        attribution: attrib,
      })
      .addTo(map);

    const layerCasos = leaflet.layerGroup().addTo(map);
    const layerLluvia = leaflet.layerGroup().addTo(map);
    const layerInfraestructura = leaflet.layerGroup().addTo(map);
    const bounds = leaflet.latLngBounds([]);

    [...this.mapaDatos]
      .sort((a, b) => b.casos_totales - a.casos_totales)
      .forEach((punto) => {
        const coords: [number, number] = [punto.lat, punto.lng];
        bounds.extend(coords);

        if (this.capasMapa.casos) {
          leaflet
            .circleMarker(coords, {
              radius: Math.max(8, Math.min(26, punto.tasa_incidencia_100k / 15.0)),
              color: BRAND.navy,
              weight: 2,
              fillColor: BRAND.navy,
              fillOpacity: 0.26,
            })
            .bindPopup(
              `<strong>${punto.canton}</strong><br/>Casos: ${punto.casos_totales}<br/>Tasa: ${punto.tasa_incidencia_100k} por 100k`,
            )
            .addTo(layerCasos);
        }

        if (this.capasMapa.lluvia) {
          leaflet
            .circleMarker([punto.lat + 0.015, punto.lng - 0.012], {
              radius: Math.max(7, Math.min(22, punto.precipitacion_mm / 2 + 6)),
              color: BRAND.blue,
              weight: 2,
              fillColor: BRAND.blue,
              fillOpacity: 0.24,
            })
            .bindPopup(
              `<strong>${punto.canton}</strong><br/>Lluvia promedio: ${punto.precipitacion_mm} mm<br/>Temp. máxima: ${punto.temp_maxima_c} °C`,
            )
            .addTo(layerLluvia);
        }

        if (this.capasMapa.infraestructura) {
          leaflet
            .circleMarker([punto.lat - 0.015, punto.lng + 0.012], {
              radius: Math.max(7, Math.min(24, punto.ocupacion_pct / 4 + 6)),
              color: BRAND.green,
              weight: 2,
              fillColor: BRAND.green,
              fillOpacity: 0.24,
            })
            .bindPopup(
              `<strong>${punto.canton}</strong><br/>Ocupación: ${punto.ocupacion_pct}%<br/>Camas: ${punto.camas_ocupadas}/${punto.camas_totales}<br/>Médicos: ${punto.medicos_disponibles}`,
            )
            .addTo(layerInfraestructura);
        }
      });

    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.2));
    } else {
      map.setView([this.mapaCentro.lat, this.mapaCentro.lng], this.mapaCentro.zoom);
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 50);

    this.mapInstance = map;
    this.mapaCargado = true;
  }
}
