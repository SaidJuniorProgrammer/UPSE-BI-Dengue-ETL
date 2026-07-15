import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  kpis: any = {};
  filtroActual: string = 'Toda la Península'; // Estado del filtro del cantón
  cantonActual: string = '';
  anioActual: string = '';

  // Capacity variables
  camasTotales: number = 0;
  camasOcupadas: number = 0;
  ocupacionPct: number = 0;

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

  actualizarTodo() {
    this.cargarKpis(this.cantonActual, this.anioActual);
    this.cargarGraficos(this.cantonActual, this.anioActual);
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
}
