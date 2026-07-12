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
  filtroActual: string = 'Toda la Península'; // Estado del filtro

 
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
    this.cargarKpis(''); 
    this.cargarGraficos();
  }

  // Nueva función interactiva para el menú desplegable
  filtrarPorCanton(canton: string, nombreVista: string) {
    this.filtroActual = nombreVista;
    this.cargarKpis(canton);
  }

  cargarKpis(canton: string) {
    this.dashboardService.getKpis(canton).subscribe(data => {
      this.kpis = data || {};
    });
  }

  cargarGraficos() {
    this.dashboardService.getGraficoTemporal().subscribe((data: any[]) => {
      this.lineChartData = {
        labels: data.map(d => `Sem ${d.semana_epidem}`),
        datasets: [
          { data: data.map(d => d.casos), label: 'Casos Confirmados', borderColor: '#e74c3c', fill: false, tension: 0.3 },
          { data: data.map(d => d.lluvia), label: 'Precipitación (mm)', borderColor: '#3498db', fill: false, tension: 0.3 }
        ]
      };
    });

    this.dashboardService.getGraficoCantones().subscribe((data: any[]) => {
      this.barChartData = {
        labels: data.map(d => d.canton),
        datasets: [
          { data: data.map(d => d.casos_totales), label: 'Incidencia Vectorial', backgroundColor: '#2ecc71', borderRadius: 5 }
        ]
      };
    });

    this.dashboardService.getGraficoInfraestructura().subscribe((data: any[]) => {
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