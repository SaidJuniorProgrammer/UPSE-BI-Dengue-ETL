# ENTREGABLE 1: Definición del Problema y Diseño Conceptual (Multipatología Nacional)

## 1. Título del Proyecto

**Plataforma de Inteligencia de Negocios para el Monitoreo Epidemiológico Multipatología Nacional en el Dominio de la Salud Pública mediante Integración de Datos Heterogéneos.**

---

## 2. Abstract (Resumen)

El presente proyecto aborda la ineficiencia en la gestión y prevención de brotes de enfermedades infecciosas, vectoriales y crónicas (multipatología) a nivel nacional en el Ecuador, problema que satura la capacidad hospitalaria debido a una toma de decisiones basada en reportes clínicos aislados y reactivos.

Para resolverlo, se propone implementar una solución de Inteligencia de Negocios (BI) de extremo a extremo que centraliza la información a través de pipelines de datos asíncronos y robustos. El sistema procesa registros multidimensionales provenientes de múltiples fuentes heterogéneas, consolidándolos en un Data Warehouse (DW) estructurado bajo un Modelo Estrella (Star Schema) de granularidad fina en MySQL.

Las dimensiones capturan detalladamente la geografía de los 220+ cantones y 24 provincias ecuatorianas, información climatológica semanal del INAMHI, capacidad asistencial del Ministerio de Salud Pública (MSP), stock farmacéutico, noticias locales y encuestas ciudadanas. Finalmente, se diseñó un Frontend reactivo y de alta usabilidad en Angular, organizado mediante Sidebar, que expone KPIs críticos, composición etiológica (Virus, Bacteria, Hongo, Parásito, Genético), mapas territoriales de calor y semáforos de brotes en tiempo real. Esto permite a las autoridades sanitarias tomar decisiones estratégicas fundamentadas en datos de cobertura nacional.

---

## 3. Problema de Negocio

Las autoridades sanitarias y los directores de la red de salud pública en el Ecuador sufren de una grave fragmentación y desconexión de datos epidemiológicos. Históricamente, patologías complejas como el dengue, la malaria o las IRAS (Infecciones Respiratorias Agudas) se han monitoreado de manera aislada por distritos de salud del MSP, limitando la visualización espacial y temporal de factores ambientales determinantes (lluvia, temperatura, humedad) y recursos clínicos disponibles.

Las consecuencias de no resolver esta desconexión de datos a escala país incluyen:

- Saturación repentina de salas de emergencia y camas de hospitalización durante brotes infecciosos.
- Desabastecimiento severo de medicamentos básicos en farmacias locales al incrementarse los casos.
- Dificultad para movilizar proactivamente suministros médicos y personal clínico hacia cantones críticos.
- Falta de un semáforo de alerta temprana unificado que correlacione el clima y la capacidad de la red pública nacional.

---

## 4. Pregunta de Investigación Principal

> **¿De qué manera la correlación entre las anomalías climáticas (precipitación y temperatura), la capacidad de la infraestructura médica y la disponibilidad de insumos farmacéuticos impacta en la tasa de incidencia de casos de enfermedades epidemiológicas (multipatología) registradas en los cantones del Ecuador durante el período 2022-2026?**

---

## 5. Preguntas Analíticas Secundarias

1. ¿Cuál es la relación histórica entre los picos de precipitación mensual y el aumento de casos confirmados de enfermedades vectoriales (Virus y Parásitos) en el mes inmediatamente posterior a nivel cantonal?
2. ¿Qué cantones del Ecuador presentan un mayor déficit de infraestructura médica y saturación de camas de hospitalización en proporción a su tasa de incidencia acumulada por 100,000 habitantes?
3. ¿Cómo fluctúa la disponibilidad de medicamentos en farmacias locales durante las semanas epidemiológicas de mayor nivel de contagio?
4. ¿Cuál es la composición etiológica de los brotes y qué proporción representan las causas de origen bacteriano o parasitario frente a las víricas a escala nacional?

---

## 6. Objetivos

### Objetivo General

Diseñar una solución de Inteligencia de Negocios de cobertura nacional que integre datos epidemiológicos (100+ patologías), climáticos y hospitalarios para identificar patrones de riesgo, composición biológica y optimizar la toma de decisiones preventivas en el Ecuador.

### Objetivos Específicos

1. Integrar datos históricos y en tiempo real de múltiples fuentes heterogéneas mediante Web Scraping, APIs y archivos estructurados.
2. Implementar un Data Warehouse centralizado con un modelo analítico en estrella (Star Schema) que relacione las dimensiones de tiempo, geografía nacional, clima e infraestructura asistencial con la tabla de hechos de incidencias.
3. Construir una API RESTful en Node.js y un Frontend reactivo en Angular estructurado por Sidebar y múltiples vistas para la auditoría de KPIs sanitarios y semáforos de alertas.
4. Validar la calidad de los datos depurados mediante métricas de completitud y estandarización cantonal homologada al catálogo del INEC.

---

## 7. KPIs Preliminares (Alineados al Monitor de Negocio)

| KPI / Indicador | Fórmula de Cálculo | Fuente Esperada | Frecuencia |
|-----------------|--------------------|-----------------|------------|
| **Tasa de incidencia regional** | (Total casos nuevos de la patología / Población del cantón) × 100,000 | Dataset oficial MSP (CIE-10) | Semanal |
| **Índice de riesgo climático** | Evaluación de umbrales: Precipitación > 50 mm y Temp > 28°C | Scraping / API Clima (INAMHI) | Semanal |
| **Disponibilidad farmacéutica** | Promedio de stock disponible en la red evaluada | Scraping de farmacias locales | Semanal |
| **Ocupación hospitalaria** | (Camas ocupadas / Camas totales del cantón) × 100 | Directorio asistencial MSP | Semanal |
| **Espera promedio de atención** | Promedio de horas transcurridas antes del triaje | Encuesta ciudadana directa | Semanal |

---

## 8. Fuentes de Datos Expandidas

1. **Web Scraping Meteorológico:** Extracción semanal de precipitación, temperatura mínima, máxima y humedad relativa de los cantones desde portales oficiales.
2. **Web Scraping de Medios:** Registro de alertas de prensa locales para medir la percepción de brotes epidemiológicos.
3. **Web Scraping de Farmacias:** Monitoreo del inventario y disponibilidad comercial de medicamentos para patologías críticas.
4. **Scraping de Infraestructura:** Mapeo de la capacidad operativa (camas de hospitalización, médicos de turno y saturación) en los centros de salud del MSP.
5. **API Pública Sanitaria:** Obtención de casos agregados y gacetas internacionales (como la base PLISA OPS/OMS).
6. **Datasets Oficiales MSP (CSV/Excel):** Archivos del subsistema de vigilancia con clasificación CIE-10 (100+ enfermedades).
7. **Encuestas Propias (Google Forms/JSON):** Levantamiento directo de tiempos de espera clínica y prevalencia de sintomatologías a nivel ciudadano.

---

## 9. Arquitectura Conceptual

### Capa Raw (Extracción y Ingesta)
Ingreso y almacenamiento en bruto de las siete fuentes mediante scripts autónomos en Python.

### Capa Staging (Transformación y Calidad)
Normalización con Pandas: estandarización de nombres cantonales homologados con el catálogo del INEC (Ecuador continental e insular), imputación por mediana, cálculo de completitud de datos y exportación a formato columnar **Parquet**.

### Capa Data Warehouse (Carga y Almacenamiento)
Base de datos MySQL en estrella. Consiste en una tabla de hechos (`fact_incidencia`) y 5 dimensiones (`dim_tiempo`, `dim_geografia`, `dim_clima`, `dim_infraestructura`, `dim_enfermedad`) que permiten consultas agregadas eficientes y baja latencia.

### Capa Dashboard (Presentación)
Frontend en Angular y backend asíncrono en Node.js/Express, brindando una arquitectura SPA fluida estructurada en Sidebar con 5 vistas interactivas principales y tarjetas de alertas semaforizadas.

---

## 10. Justificación y Referencias

El proyecto aborda una problemática estructural crítica de salud pública en el Ecuador. La incorporación de Inteligencia de Negocios descentralizada y desacoplada permite a las autoridades cambiar el paradigma reactivo por un esquema analítico preventivo, visualizando la propagación y saturación de la infraestructura médica a nivel de cantones antes de que ocurran colapsos sanitarios.