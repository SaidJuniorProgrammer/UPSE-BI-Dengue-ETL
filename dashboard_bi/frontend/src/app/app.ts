import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { DashboardService } from './services/dashboard';

const BRAND = {
  navy: '#053a90',
  blue: '#4798e4',
  green: '#057e3f',
  navySoft: 'rgba(5, 58, 144, 0.14)',
  blueSoft: 'rgba(71, 152, 228, 0.16)',
  greenSoft: 'rgba(5, 126, 63, 0.16)',
};

const CANTON_CENTERS = {
  'SANTA ELENA': { lat: -2.2266, lng: -80.8588 },
  'LA LIBERTAD': { lat: -2.2336, lng: -80.9101 },
  SALINAS: { lat: -2.2145, lng: -80.9514 },
};

type MapLayerKey = 'casos' | 'lluvia' | 'infraestructura';

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

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, AfterViewInit, OnDestroy {
  kpis: any = {};
  filtroActual: string = 'Toda la Península'; // Estado del filtro del cantón
  cantonActual: string = '';
  anioActual: string = '';
  mapaDatos: MapaPunto[] = [];
  mapaActivo = false;
  mapaCargado = false;
  mapaCentro = { lat: -2.224, lng: -80.905, zoom: 11.4 };
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

  private leafletModule: typeof import('leaflet') | null = null;
  private mapInstance: import('leaflet').Map | null = null;

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

  // Nueva función interactiva para filtrar por cantón
  filtrarPorCanton(canton: string, nombreVista: string) {
    this.cantonActual = canton;
    this.filtroActual = nombreVista;
    this.actualizarTodo();
  }

  // Nueva función interactiva para filtrar por año
  filtrarPorAnio(anio: string) {
    this.anioActual = anio;
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

  actualizarTodo() {
    this.cargarKpis(this.cantonActual, this.anioActual);
    this.cargarGraficos(this.cantonActual, this.anioActual);
    this.cargarMapa(this.cantonActual, this.anioActual);
  }

  cargarKpis(canton: string, anio: string) {
    this.dashboardService.getKpis(canton, anio).subscribe((data) => {
      this.kpis = data || {};
    });
  }

  cargarGraficos(canton: string, anio: string) {
    this.dashboardService.getGraficoTemporal(canton, anio).subscribe((data: any[]) => {
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

    this.dashboardService.getGraficoCantones(canton, anio).subscribe((data: any[]) => {
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

    this.dashboardService.getGraficoInfraestructura(canton, anio).subscribe((data: any[]) => {
      // Calcular ocupación agregada
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

  cargarMapa(canton: string, anio: string) {
    this.dashboardService.getMapaProvincia(canton, anio).subscribe((data: any[]) => {
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

  private async obtenerLeaflet() {
    if (!this.leafletModule) {
      this.leafletModule = await import('leaflet');
      const leaflet = this.leafletModule;
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
        attribution: '&copy; OpenStreetMap contributors | Capas analíticas UPSE BI - Dengue',
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
              radius: Math.max(11, Math.min(28, punto.tasa_incidencia_100k / 2.2)),
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
            .circleMarker([punto.lat + 0.012, punto.lng - 0.01], {
              radius: Math.max(10, Math.min(24, punto.precipitacion_mm / 2 + 8)),
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
            .circleMarker([punto.lat - 0.01, punto.lng + 0.01], {
              radius: Math.max(10, Math.min(26, punto.ocupacion_pct / 4 + 8)),
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
      map.fitBounds(bounds.pad(0.25));
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
