# ENTREGABLE 2: Pipeline de Datos y Calidad (Multipatología Nacional)

## 1. Fuentes de Datos y Extracción

### 1.1 Web Scraping (4 Extractores Especializados)
Se desarrollaron 4 scripts modulares en **Python** ubicados en `scripts/extraction/` utilizando las librerías **BeautifulSoup** y **requests**. El proceso de extracción cumple rigurosamente con los requisitos establecidos:

- Headers HTTP con **User-Agent** personalizado (`BI-Dengue-ETL/1.0`) para simular peticiones legítimas.
- Manejo preventivo y auditable de excepciones mediante bloques `try-except` ante errores de conexión o bloqueos anti-bots.
- Retrasos aleatorios controlados (`time.sleep(1.5, 5.0)`) entre solicitudes para evitar la sobrecarga de los servidores.
- Almacenamiento organizado de los datos extraídos en formato **JSON** dentro de subdirectorios por dominio en la **Zona RAW** (`raw/scraping/`).

### Sitios y dominios procesados

| Script / Módulo | Fuente / Dominio | Descripción |
|-----------------|------------------|-------------|
| `extract_clima.py` | **INAMHI / Open-Meteo** | Extracción de variables meteorológicas clave (precipitación en mm, temperaturas máxima y mínima en °C y humedad relativa) para los cantones de Ecuador. |
| `extract_noticias.py` | **Medios de Comunicación (El Universo, El Comercio, La Hora, Ecuavisa)** | Extracción de titulares, fechas de publicación y cantones mencionados en alertas de brotes infecciosos y vectoriales. |
| `extract_farmacias.py` | **Cadenas Farmacéuticas (Fybeca, Pharmacy's, Sana Sana, Económicas, Cruz Azul)** | Monitoreo de inventarios, disponibilidad de stock físico y precios en USD de medicamentos críticos a nivel nacional. |
| `extract_infraestructura.py` | **Directorio MSP e Infraestructura Hospitalaria** | Consulta del estado operativo en centros médicos del Ministerio de Salud Pública (camas totales/ocupadas, médicos disponibles y tiempos de espera). |

---

### 1.2 Consumo de APIs (`extract_api_health.py`)
Se implementó el consumo formal de interfaces de datos públicos con paginación y validación de esquema:

| Campo | Detalle |
|--------|----------|
| **API 1** | **World Bank Open Data API v2** |
| **Endpoint** | `/v2/country/ECU/indicator/SP.POP.TOTL` |
| **Parámetros y Paginación** | `format=json`, `date=2015:2026`, `per_page=100`, paginación implementada mediante ciclo `while`. |
| **API 2** | **OPS / OMS - PLISA Epidemiología** |
| **Registros obtenidos** | Datos agregados de población y tendencias de incidencia epidemiológica semanal para el Ecuador. |

---

### 1.3 Archivos Estructurados
- **Origen:** Gacetas Epidemiológicas y subsistemas del Ministerio de Salud Pública (MSP).
- **Ubicación en RAW:** `raw/archivos/`
- **Formato:** CSV (`casos_dengue_oficial_*.csv` y catálogo de patologías CIE-10).
- **Campos extraídos:** canton, provincia, cie10, nombre_enfermedad, tipo_causa, categoria_origen, anio, semana_epidemiologica, casos_confirmados, casos_urbanos, casos_rurales.

---

### 1.4 Fuente Propia
- **Metodología:** Encuesta digital estructurada sobre percepción de sintomatologías y tiempos de atención médica.
- **Ubicación en RAW:** `raw/fuente_propia/`
- **Instrumento:** Google Forms exportado (CSV / JSON).
- **Campos principales:** id_encuesta, canton_residencia, edad, tiempo_espera_horas, calificacion_servicio.

---

## 2. Gestión de Capas de Datos

### 2.1 Zona RAW
Garantiza la **inmutabilidad absoluta** de la información recolectada. Los datos se almacenan exactamente como fueron extraídos en subdirectorios temáticos (`raw/scraping/clima`, `raw/scraping/farmacias`, `raw/api`, etc.).

### 2.2 Zona STAGING (Innovación a Formato Parquet)
En esta capa se ejecutan los transformadores especializados coordinados por el orquestador maestro `stg_all_sources.py`.

> [!IMPORTANT]
> **Exportación a Parquet:** Toda la capa de Staging migró del formato CSV al formato **Parquet (`.parquet`)** mediante `pyarrow`. Esto optimiza el almacenamiento columnar en disco y preserva estrictamente los tipos de datos nativos para la carga directa en el Data Warehouse.

---

## 3. Framework de Calidad de Datos

### 3.1 Control de Duplicados
Se definieron claves de unicidad compuestas adaptadas a la escala nacional:
- **Clima:** `canton + fecha`
- **Farmacias:** `canton + cadena + medicamento + fecha_extraccion`
- **Infraestructura:** `nombre_centro + fecha_corte`
- **Casos Oficiales:** `canton + cie10 + anio + semana_epidemiologica`
- **Encuesta:** `id_encuesta`

### 3.2 Control Avanzado de Valores Nulos (Imputación)
- **Imputación por Mediana Agrupada:** Valores nulos en `precio_usd` de farmacias se imputan con la mediana del producto. Las temperaturas o tiempos de espera faltantes se imputan con la mediana del cantón correspondiente.
- **Imputación Constante:** Vacíos en `cantidad_unidades` se asignan a `0`. Registros de `serotipo_detectado` vacíos se catalogan como `"No identificado"`.

### 3.3 Estandarización Geográfica (Catálogo INEC)
Todos los nombres geográficos se normalizan en mayúsculas y se concilian contra el catálogo INEC de las 24 provincias y 220+ cantones de Ecuador. El validador homologa sinónimos comunes:
- `ST. ELENA`, `SANTAELENA` ➔ **SANTA ELENA**
- `LIBERTAD`, `LALIBERTAD` ➔ **LA LIBERTAD**
- `BABAHOYO`, `BABA_HOYO` ➔ **BABAHOYO**
- `UIO`, `quito` ➔ **QUITO**

### 3.4 Registro Centralizado de Errores e Ingesta
Todas las correcciones, imputaciones o descartes realizados se auditan en el registro tabular `staging/error_log.csv` y logs en `logs/quality.log`.