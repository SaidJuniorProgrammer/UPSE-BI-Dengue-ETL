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
    },
    scales: {
      x: {
        ticks: { color: '#667085' },
        grid: { color: 'rgba(5, 58, 144, 0.08)' },
      },
      y: {
        ticks: { color: '#667085' },
        grid: { color: 'rgba(5, 58, 144, 0.08)' },
      },
    },
  };
  public lineChartType: 'line' = 'line';

  public barChartData: ChartData<'bar'> = { datasets: [], labels: [] };
  public barChartOptions: ChartOptions<'bar'> = {
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
        grid: { display: false },
      },
      y: {
        ticks: { color: '#667085' },
        grid: { color: 'rgba(5, 58, 144, 0.08)' },
      },
    },
  };
  public barChartType: 'bar' = 'bar';

  public radarChartData: ChartData<'radar'> = { datasets: [], labels: [] };
  public radarChartOptions: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: BRAND.navy,
        },
      },
    },
    scales: {
      r: {
        angleLines: { color: 'rgba(5, 58, 144, 0.12)' },
        grid: { color: 'rgba(5, 58, 144, 0.12)' },
        pointLabels: { color: '#475467', font: { size: 12, weight: 600 } },
        ticks: {
          color: '#667085',
          backdropColor: 'transparent',
        },
      },
    },
  };
  public radarChartType: 'radar' = 'radar';

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
    this.actualizarTodo();
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

  cargarGraficos(filters: DashboardFilters) {
    this.dashboardService.getGraficoTemporal(filters).subscribe((data: any[]) => {
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
      } else {
        this.camasTotales = 0;
        this.camasOcupadas = 0;
        this.ocupacionPct = 0;
      }

      this.radarChartData = {
        labels: data.map((d) => d.canton || 'Centro Médico'),
        datasets: [
          {
            data: data.map((d) => d.carga_pacientes),
            label: 'Pacientes Febriles',
            backgroundColor: 'rgba(71, 152, 228, 0.28)',
            borderColor: BRAND.blue,
            pointBackgroundColor: BRAND.blue,
            pointBorderColor: '#ffffff',
          },
          {
            data: data.map((d) => d.medicos_disponibles),
            label: 'Médicos Operativos',
            backgroundColor: 'rgba(5, 126, 63, 0.28)',
            borderColor: BRAND.green,
            pointBackgroundColor: BRAND.green,
            pointBorderColor: '#ffffff',
          },
        ],
      };
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

    leaflet
      .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap contributors | Capas analíticas UPSE BI',
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
