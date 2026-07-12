// @ts-ignore
import 'zone.js';

import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

// Importaciones necesarias para nuestra API y gráficos
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes), 
    
    // Agregamos los proveedores aquí
    provideHttpClient(withFetch()),
    provideCharts(withDefaultRegisterables())
  ]
};