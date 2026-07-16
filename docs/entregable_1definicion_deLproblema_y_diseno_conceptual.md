# ENTREGABLE 1: Definición del Problema y Diseño Conceptual

## 1. Título del Proyecto

**Plataforma de Inteligencia de Negocios para la predicción y gestión de brotes de enfermedades vectoriales (Dengue) en el dominio de la salud pública mediante integración de datos heterogéneos.**

---

## 2. Abstract (Resumen)

El presente proyecto aborda la ineficiencia en la gestión y prevención de brotes de Dengue en la provincia de Santa Elena (período 2022-2024), problema que satura el sistema hospitalario local debido a una toma de decisiones basada en reportes clínicos aislados y reactivos.

Para resolverlo, se propone implementar un enfoque técnico de Inteligencia de Negocios que centraliza la información mediante un proceso ETL hacia un Data Warehouse estructurado bajo un Modelo Estrella (Star Schema), culminando en un dashboard interactivo desarrollado en Angular.

Se integran siete fuentes de datos heterogéneas que combinan variables epidemiológicas, factores climáticos (Web Scraping meteorológico), disponibilidad farmacéutica e infraestructura médica (Scraping de portales), y percepción ciudadana.

Como resultado, se espera proporcionar a las autoridades sanitarias una herramienta analítica unificada que identifique patrones de riesgo entre el clima y la incidencia de casos, permitiendo anticipar picos de contagio, optimizar la distribución de medicamentos y mejorar la capacidad de respuesta proactiva.

---

## 3. Problema de Negocio

Las autoridades sanitarias y los directores de la red de salud pública en la provincia de Santa Elena sufren de una grave falta de herramientas centralizadas para monitorear y anticipar los brotes de Dengue.

Actualmente, los analistas de salud evalúan los casos confirmados de manera aislada, sin poder cruzar esta información rápidamente con detonantes críticos como las anomalías climáticas (precipitaciones fuertes) o el inventario real en las farmacias de la zona.

Las consecuencias de no resolver esta desconexión de datos incluyen:

- Saturación repentina de las salas de emergencia (clínicas y dispensarios locales) durante la época invernal.
- Desabastecimiento de insumos paliativos básicos.
- Dificultad para tomar decisiones preventivas que reduzcan las tasas de morbilidad en los cantones afectados.

---

## 4. Pregunta de Investigación Principal

> **¿De qué manera la correlación entre las anomalías climáticas (precipitación y temperatura), la densidad de infraestructura médica y la disponibilidad de insumos farmacéuticos impacta en la tasa de incidencia de casos de Dengue reportados en la provincia de Santa Elena durante el período 2022-2024?**

---

## 5. Preguntas Analíticas Secundarias

1. ¿Cuál es la relación histórica entre los picos de precipitación mensual y el aumento de casos confirmados de Dengue en el mes inmediatamente posterior?

2. ¿Qué zonas o cantones presentan un mayor déficit de infraestructura médica en proporción a su tasa de incidencia de enfermedades vectoriales?

3. ¿Cómo fluctúa la disponibilidad de medicamentos básicos (paracetamol, sueros) en farmacias locales durante las semanas epidemiológicas de mayor nivel de contagio?

---

## 6. Objetivos

### Objetivo General

Diseñar una solución integral de Inteligencia de Negocios que integre datos epidemiológicos, climáticos y hospitalarios para identificar patrones de riesgo y optimizar la toma de decisiones preventivas frente a brotes de Dengue.

### Objetivos Específicos

1. Integrar datos provenientes de siete fuentes heterogéneas mediante técnicas de Web Scraping, consumo de APIs y lectura de archivos estructurados.

2. Implementar un Data Warehouse centralizado utilizando un modelo analítico Star Schema para relacionar las dimensiones de tiempo, geografía y clima con los hechos de salud.

3. Construir un dashboard funcional utilizando el framework Angular que visualice los KPIs definidos y facilite la generación de insights para las autoridades.

4. Evaluar la calidad de los datos recopilados aplicando métricas de completitud y estandarización durante el proceso de transformación (ETL).

---

## 7. KPIs Preliminares

| KPI / Indicador | Fórmula de Cálculo | Fuente Esperada | Frecuencia |
|-----------------|--------------------|-----------------|------------|
| **Tasa de incidencia mensual** | (Total casos nuevos en el mes / Población total) × 100000 | Dataset oficial (CSV + API) | Mensual |
| **Índice de riesgo climático** | (Días con lluvia > 10 mm + Días con Temp > 28°C) / Total días del mes | Scraping de portales de clima | Mensual |
| **Disponibilidad farmacéutica** | (Farmacias con stock / Total de farmacias evaluadas) × 100 | Scraping de farmacias locales | Semanal |
| **Cobertura de infraestructura** | Número de centros de salud / (Total de casos reportados / 1000) | Scraping de directorios médicos | Semestral |
| **Tasa de síntomas no clínicos** | (Encuestados con fiebre reciente / Total encuestados) × 100 | Fuente propia (Encuesta) | Quincenal |

---

## 8. Fuentes de Datos

### 1. Web Scraping #1 (Clima)

Extracción del histórico de precipitaciones y temperaturas desde portales meteorológicos (ej. AccuWeather o INAMHI).

### 2. Web Scraping #2 (Noticias/Alertas)

Extracción del volumen de noticias relacionadas con **"Dengue"** en diarios locales para medir la percepción social.

### 3. Web Scraping #3 (Farmacias)

Extracción del inventario de medicamentos (paracetamol, repelentes) desde sitios web de cadenas farmacéuticas.

### 4. Web Scraping #4 (Infraestructura)

Mapeo de directorios médicos online para contabilizar dispensarios activos en la provincia.

### 5. API Pública

Conexión a la API de Datos Abiertos de Salud o a la OMS para obtener indicadores epidemiológicos estandarizados.

### 6. CSV / Excel / JSON (Datos Duros)

Descarga de datasets oficiales gubernamentales con el registro histórico de casos vectoriales.

### 7. Fuente Propia

Formulario de Google Forms distribuido a estudiantes y residentes locales para levantar información sobre prevalencia de síntomas no reportados y tiempos de espera.

---

## 9. Arquitectura Conceptual

### Zona RAW

- Ingreso de las siete fuentes de datos.
- Python/Scrapy para los cuatro procesos de Web Scraping.
- Consumo de API pública.
- CSV oficial.
- Exportación de la encuesta.
- Almacenamiento inicial en un repositorio temporal o bucket.

### Zona STAGING

Script desarrollado en Python utilizando Pandas para:

- Limpieza de datos.
- Estandarización de fechas.
- Homologación de nombres de cantones.

### Zona DATA WAREHOUSE

Base de datos analítica en PostgreSQL implementando un **Modelo Estrella (Star Schema)**.

**Tabla de hechos:**

- Hechos_Incidencia

**Dimensiones:**

- Dim_Tiempo
- Dim_Geografia
- Dim_Clima
- Dim_Infraestructura

### Zona DASHBOARD

Frontend desarrollado en Angular conectado mediante un Backend o API REST al Data Warehouse para visualizar los KPIs en tiempo real.

---

## 10. Justificación y Referencias

### Justificación

El proyecto aborda una problemática crítica en las regiones tropicales y costeras de Ecuador, donde el Dengue genera altas cargas en el sistema de salud [1].

La integración de tecnologías de Inteligencia de Negocios (BI) en el sector salud ha demostrado ser fundamental para pasar de un registro pasivo de datos a una toma de decisiones proactiva [2].

Al centralizar datos climáticos, epidemiológicos y de recursos médicos en un modelo dimensional estructurado [3][4], se proporciona a los administradores hospitalarios y autoridades sanitarias una visión panorámica mediante un dashboard [5].

Esto permite no solo reaccionar ante los brotes, sino también anticipar picos de demanda basándose en umbrales climáticos, optimizando la distribución de suministros farmacéuticos y mejorando la capacidad de respuesta del sistema sanitario.