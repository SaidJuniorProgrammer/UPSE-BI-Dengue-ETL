import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  // La URL de tu API en Node.js
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  // Obtener los 5 KPIs
  getKpis(canton: string = ''): Observable<any> {
    const url = canton ? `${this.apiUrl}/kpis?canton=${canton}` : `${this.apiUrl}/kpis`;
    return this.http.get<any>(url);
  }

  // Obtener datos para el gráfico de líneas (Serie Temporal)
  getGraficoTemporal(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/grafico-temporal`);
  }

  // Obtener datos para el gráfico de barras (Cantones)
  getGraficoCantones(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/grafico-cantones`);
  }

  // Obtener datos para el gráfico de infraestructura
  getGraficoInfraestructura(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/grafico-infraestructura`);
  }
}