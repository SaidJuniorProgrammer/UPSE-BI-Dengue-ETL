import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  // La URL de tu API en Node.js
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  private buildUrl(endpoint: string, canton: string, anio: string): string {
    let params: string[] = [];
    if (canton) params.push(`canton=${encodeURIComponent(canton)}`);
    if (anio) params.push(`anio=${encodeURIComponent(anio)}`);
    return params.length > 0
      ? `${this.apiUrl}/${endpoint}?${params.join('&')}`
      : `${this.apiUrl}/${endpoint}`;
  }

  // Obtener los 5 KPIs
  getKpis(canton: string = '', anio: string = ''): Observable<any> {
    return this.http.get<any>(this.buildUrl('kpis', canton, anio));
  }

  // Obtener datos para el gráfico de líneas (Serie Temporal)
  getGraficoTemporal(canton: string = '', anio: string = ''): Observable<any> {
    return this.http.get<any>(this.buildUrl('grafico-temporal', canton, anio));
  }

  // Obtener datos para el gráfico de barras (Cantones)
  getGraficoCantones(canton: string = '', anio: string = ''): Observable<any> {
    return this.http.get<any>(this.buildUrl('grafico-cantones', canton, anio));
  }

  // Obtener datos para el gráfico de infraestructura
  getGraficoInfraestructura(canton: string = '', anio: string = ''): Observable<any> {
    return this.http.get<any>(this.buildUrl('grafico-infraestructura', canton, anio));
  }

  // Obtener los datos agregados para el mapa territorial
  getMapaProvincia(canton: string = '', anio: string = ''): Observable<any> {
    return this.http.get<any>(this.buildUrl('mapa-provincia', canton, anio));
  }
}
