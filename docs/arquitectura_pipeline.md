# Arquitectura del Pipeline ETL de Inteligencia de Negocios para Gestión Multipatología Nacional

Este documento presenta el diseño arquitectónico de la plataforma de extracción, transformación y carga (ETL) para la toma de decisiones en salud pública a nivel nacional en Ecuador.

## 1. Visión General y Flujo de Datos

El pipeline sigue el paradigma clásico por capas para garantizar la **inmutabilidad de los datos crudos (Zona RAW)** y asegurar el **procesamiento analítico de alto rendimiento (Zona STAGING en Parquet)**.

```mermaid
graph TD
    subgraph Fuentes Extracción [Capa de Extracción]
        E1[Web Scraping: Clima INAMHI/Open-Meteo] --> R1[raw/scraping/clima/]
        E2[Web Scraping: Noticias Medios] --> R2[raw/scraping/noticias/]
        E3[Web Scraping: Farmacias y Precios] --> R3[raw/scraping/farmacias/]
        E4[Web Scraping: Infraestructura Médica] --> R4[raw/scraping/infraestructura/]
        E5[Consumo API: Banco Mundial & PLISA OPS] --> R5[raw/api/]
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
        STG --> LOG[error_log.csv & reporte_calidad.json]
    end
```

## 2. Principios del Framework de Calidad

- **Estandarización Geográfica Nacional:** Los nombres de provincias y cantones se normalizan rigurosamente de acuerdo con el catálogo del Instituto Nacional de Estadística y Censos (INEC), abarcando los 220+ cantones y 24 provincias de Ecuador.
- **Formato Parquet Columnar:** Toda la capa Staging emplea formato **Parquet**, optimizando la compresión en disco, manteniendo la tipificación estricta de las variables de clima, infraestructura y casos sanitarios, mejorando la velocidad de carga al Data Warehouse en MySQL.
- **Tratamiento Avanzado de Nulos:** Se aplican estrategias de imputación por mediana agrupada por cantón (temperaturas, humedad y tiempos de espera hospitalarios) o por medicamento (precios y stocks farmacéuticos).
