import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { DashboardService } from './services/dashboard';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './app.html',
  styleUrl: './app.css'
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
 
  public lineChartData: ChartConfiguration['data'] = { datasets: [], labels: [] };
  public lineChartOptions: ChartConfiguration['options'] = { responsive: true, maintainAspectRatio: false };
  public lineChartType: ChartType = 'line';

  public barChartData: ChartConfiguration['data'] = { datasets: [], labels: [] };
  public barChartOptions: ChartConfiguration['options'] = { responsive: true, maintainAspectRatio: false };
  public barChartType: ChartType = 'bar';

  public radarChartData: ChartConfiguration['data'] = { datasets: [], labels: [] };
  public radarChartOptions: ChartConfiguration['options'] = { responsive: true, maintainAspectRatio: false };
  public radarChartType: ChartType = 'radar';

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
    this.dashboardService.getKpis(canton, anio).subscribe(data => {
      this.kpis = data || {};
    });
  }

  cargarGraficos(canton: string, anio: string) {
    this.dashboardService.getGraficoTemporal(canton, anio).subscribe((data: any[]) => {
      this.lineChartData = {
        labels: data.map(d => `${d.anio} - Sem ${d.semana_epidem} (${d.mes.substring(0, 3)})`),
        datasets: [
          { data: data.map(d => d.casos), label: 'Casos Confirmados', borderColor: '#e74c3c', fill: false, tension: 0.3 },
          { data: data.map(d => d.lluvia), label: 'Precipitación (mm)', borderColor: '#3498db', fill: false, tension: 0.3 },
          { data: data.map(d => d.alertas), label: 'Alertas de Prensa', borderColor: '#9b59b6', fill: false, tension: 0.3 }
        ]
      };
    });

    this.dashboardService.getGraficoCantones(canton, anio).subscribe((data: any[]) => {
      this.barChartData = {
        labels: data.map(d => d.canton),
        datasets: [
          { data: data.map(d => d.tasa_incidencia_100k), label: 'Tasa de Incidencia (por 100k hab)', backgroundColor: '#e67e22', borderRadius: 5 }
        ]
      };
    });

    this.dashboardService.getGraficoInfraestructura(canton, anio).subscribe((data: any[]) => {
      // Calcular ocupación agregada
      if (data && data.length > 0) {
        this.camasTotales = data.reduce((acc, curr) => acc + (Number(curr.camas_totales) || 0), 0);
        this.camasOcupadas = data.reduce((acc, curr) => acc + (Number(curr.camas_ocupadas) || 0), 0);
        this.ocupacionPct = this.camasTotales > 0 ? Math.round((this.camasOcupadas / this.camasTotales) * 100) : 0;
      } else {
        this.camasTotales = 0;
        this.camasOcupadas = 0;
        this.ocupacionPct = 0;
      }

      this.radarChartData = {
        labels: data.map(d => d.canton || 'Centro Médico'),
        datasets: [
          { data: data.map(d => d.carga_pacientes), label: 'Pacientes Febriles', backgroundColor: 'rgba(52, 152, 219, 0.4)', borderColor: '#3498db' },
          { data: data.map(d => d.medicos_disponibles), label: 'Médicos Operativos', backgroundColor: 'rgba(231, 76, 60, 0.4)', borderColor: '#e74c3c' }
        ]
      };
    });
  }
}