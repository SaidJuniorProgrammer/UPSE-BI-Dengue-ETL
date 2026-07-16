import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardFilters {
  provincia?: string;
  canton?: string;
  anio?: string;
  enfermedad?: string;
  causa?: string;
  origen?: string;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private apiUrl = typeof window !== 'undefined' 
    ? (window.location.origin.includes('localhost') ? 'http://localhost:3000/api' : window.location.origin + '/api')
    : 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  private buildUrl(endpoint: string, filters: DashboardFilters = {}): string {
    let params: string[] = [];
    if (filters.provincia) params.push(`provincia=${encodeURIComponent(filters.provincia)}`);
    if (filters.canton) params.push(`canton=${encodeURIComponent(filters.canton)}`);
    if (filters.anio) params.push(`anio=${encodeURIComponent(filters.anio)}`);
    if (filters.enfermedad) params.push(`enfermedad=${encodeURIComponent(filters.enfermedad)}`);
    if (filters.causa) params.push(`causa=${encodeURIComponent(filters.causa)}`);
    if (filters.origen) params.push(`origen=${encodeURIComponent(filters.origen)}`);
    
    return params.length > 0
      ? `${this.apiUrl}/${endpoint}?${params.join('&')}`
      : `${this.apiUrl}/${endpoint}`;
  }

  // Obtener los 5 KPIs
  getKpis(filters: DashboardFilters = {}): Observable<any> {
    return this.http.get<any>(this.buildUrl('kpis', filters));
  }

  // Obtener datos para el gráfico de líneas (Serie Temporal)
  getGraficoTemporal(filters: DashboardFilters = {}): Observable<any> {
    return this.http.get<any>(this.buildUrl('grafico-temporal', filters));
  }

  // Obtener datos para el gráfico de barras (Cantones)
  getGraficoCantones(filters: DashboardFilters = {}): Observable<any> {
    return this.http.get<any>(this.buildUrl('grafico-cantones', filters));
  }

  // Obtener datos para el gráfico de infraestructura
  getGraficoInfraestructura(filters: DashboardFilters = {}): Observable<any> {
    return this.http.get<any>(this.buildUrl('grafico-infraestructura', filters));
  }

  // Obtener los datos agregados para el mapa territorial
  getMapaProvincia(filters: DashboardFilters = {}): Observable<any> {
    return this.http.get<any>(this.buildUrl('mapa-provincia', filters));
  }

  // Obtener catálogo de enfermedades
  getEnfermedades(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/enfermedades`);
  }

  // Obtener catálogo de geografía (provincias y cantones)
  getGeografia(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/geografia`);
  }
}
