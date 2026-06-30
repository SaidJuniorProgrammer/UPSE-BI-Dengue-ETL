# Arquitectura del Pipeline ETL de Inteligencia de Negocios para Gestión de Dengue

Este documento presenta el diseño arquitectónico de la plataforma de extracción, transformación y carga (ETL) para la toma de decisiones en salud pública en la provincia de Santa Elena.

## 1. Visión General y Flujo de Datos

El pipeline sigue el paradigma clásico por capas para garantizar la **inmutabilidad de los datos crudos (Zona RAW)** y asegurar el **procesamiento analítico de alto rendimiento (Zona STAGING en Parquet)**.

```mermaid
graph TD
    subgraph Fuentes Extracción [Capa de Extracción]
        E1[Web Scraping: Clima INAMHI/Open-Meteo] --> R1[raw/scraping/clima/]
        E2[Web Scraping: Noticias Medios] --> R2[raw/scraping/noticias/]
        E3[Web Scraping: Farmacias y Precios] --> R3[raw/scraping/farmacias/]
        E4[Web Scraping: Infraestructura Médica] --> R4[raw/scraping/infraestructura/]
        E5[Consumo API: Banco Mundial & OPS] --> R5[raw/api/]
        E6[Archivos Oficiales: Gacetas MSP CSV] --> R6[raw/archivos/]
        E7[Encuesta Ciudadana: Google Forms] --> R7[raw/fuente_propia/]
    end

    subgraph Staging ETL [Capa de Transformación y Calidad]
        R1 & R2 & R3 & R4 & R5 & R6 & R7 --> QC[scripts/quality/: Limpieza, Estandarización INEC e Imputación]
        QC --> STG[scripts/staging/: Exportación a Parquet]
    end

    subgraph Salidas Almacenamiento [Zona de Staging & Auditoría]
        STG --> P1[stg_clima.parquet]
        STG --> P2[stg_farmacias.parquet]
        STG --> P3[stg_infraestructura.parquet]
        STG --> P4[stg_casos_dengue.parquet]
        STG --> P5[stg_encuesta.parquet]
        STG --> P6[stg_api_indicadores.parquet]
        STG --> LOG[error_log.csv & reporte_calidad.json]
    end
```

## 2. Principios del Framework de Calidad

- **Estandarización Geográfica**: Los nombres de cantones se normalizan rigurosamente al catálogo oficial del Instituto Nacional de Estadística y Censos (INEC): `SANTA ELENA`, `LA LIBERTAD` y `SALINAS`.
- **Formato Parquet**: Toda la capa Staging abandona el uso de archivos CSV temporales para emplear formato **Parquet**, optimizando el espacio en disco, manteniendo la tipificación estricta y mejorando los tiempos de lectura para las dimensiones y hechos en el Data Warehouse.
- **Tratamiento Avanzado de Nulos**: Se aplican estrategias de imputación por mediana según agrupaciones lógicas (ej. precio de medicamentos por principio activo, o temperaturas y tiempos de espera hospitalaria por cantón).
