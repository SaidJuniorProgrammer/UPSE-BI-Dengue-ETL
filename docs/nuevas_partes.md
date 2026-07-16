# Pipeline ETL: Fuentes de Datos, Staging y Framework de Calidad

## 1. Fuentes de Datos y Extracción

### 1.1 Web Scraping

#### Sitio 1. Datos Climáticos (`extract_clima.py`)

| Atributo | Detalle |
|----------|----------|
| **Fuente** | INAMHI / meteoblue (datos históricos 1985–2009) |
| **Tecnología** | `requests` + `BeautifulSoup` |
| **Datos extraídos** | Precipitación (mm), temperatura máxima (°C), temperatura mínima (°C), humedad relativa (%) |
| **Delays** | 1.5–3.5 segundos entre peticiones |
| **Headers** | User-Agent personalizado, `Accept-Language: es-EC` |

---

#### Sitio 2. Noticias y Alertas Mediáticas (`extract_noticias.py`)

| Atributo | Detalle |
|----------|----------|
| **Fuentes** | El Universo, El Comercio, La Hora, Ecuavisa |
| **Tecnología** | `requests` + `BeautifulSoup` |
| **Datos extraídos** | Título, fuente, fecha, cantón mencionado, categoría, URL |
| **Delays** | 2–5 segundos entre peticiones |

---

#### Sitio 3. Inventario Farmacéutico (`extract_farmacias.py`)

| Atributo | Detalle |
|----------|----------|
| **Fuentes** | Fybeca, Pharmacy's, Sana Sana, Económicas, Cruz Azul |
| **Tecnología** | `requests` + `BeautifulSoup` + API JSON |
| **Datos extraídos** | Stock, cantidad, precio (USD), fecha de vencimiento más próxima |

---

#### Sitio 4. Directorios Médicos e Infraestructura (`extract_infraestructura.py`)

| Atributo | Detalle |
|----------|----------|
| **Fuentes** | Directorio MSP, portales municipales |
| **Tecnología** | `requests` + `BeautifulSoup` |
| **Datos extraídos** | Camas totales, camas ocupadas, pacientes con dengue, tiempo de espera, médicos disponibles, nivel de saturación |

---

### 1.2 Consumo de APIs

#### API 1. World Bank Open Data

| Campo | Detalle |
|--------|----------|
| **API** | World Bank Open Data API v2 |
| **Endpoint** | `/country/ECU/indicator/SP.POP.TOTL` |
| **Autenticación** | Pública (sin API Key) |
| **Parámetros** | `format=json`, `date=2022:2024`, `per_page=100` |
| **Registros obtenidos** | 9 |
| **Frecuencia** | Anual |
| **Paginación** | Parámetro `page` mediante ciclo `while` |

---

#### API 2. OPS / OMS - PLISA Dengue

| Campo | Detalle |
|--------|----------|
| **API** | OPS/OMS PLISA Dengue |
| **Endpoint** | `/dengue/cases` |
| **Autenticación** | Pública |
| **Parámetros** | `country=ECU`, `years=2022,2023,2024`, `format=json` |
| **Frecuencia** | Semanal |

---

### 1.3 Archivos Estructurados

| Atributo | Valor |
|----------|-------|
| **Origen** | Ministerio de Salud Pública del Ecuador |
| **Fuente** | Gacetas Vectoriales |
| **Formato** | CSV |
| **Filas** | 468 |
| **Columnas** | 8 |
| **Campos** | canton, anio, semana_epidemiologica, casos_confirmados, casos_sospechosos, casos_graves, defunciones, serotipo_detectado |

---

### 1.4 Fuente Propia

| Atributo | Valor |
|----------|-------|
| **Instrumento** | Google Forms |
| **Metodología** | Encuesta estructurada |
| **Registros** | 500 |
| **Campos** | 12 |
| **Consideraciones éticas** | Anonimización completa, sin datos PII, consentimiento implícito |

---

## 2. Zona RAW

### 2.1 Estructura de Carpetas

```text
raw/
├── scraping/
│   ├── clima/
│   │   └── clima_2026-06-29.json
│   ├── noticias/
│   │   └── noticias_2026-06-29.json
│   ├── farmacias/
│   │   └── farmacias_2026-06-29.json
│   └── infraestructura/
│       └── infraestructura_2026-06-29.json
├── api/
│   ├── worldbank_health_2026-06-29.json
│   └── api_documentation_2026-06-29.json
├── archivos/
│   └── casos_dengue_oficial_2026-06-29.csv
└── fuente_propia/
    └── encuesta_percepcion_2026-06-29.csv
```

### 2.2 Resumen de Datos RAW

| Fuente | Registros | Tamaño |
|---------|----------:|--------:|
| Clima | 468 | 0.15 MB |
| Noticias | 376 | 0.12 MB |
| Farmacias | 11,700 | 2.80 MB |
| Infraestructura | 1,872 | 0.45 MB |
| API World Bank | 9 | 0.01 MB |
| Casos oficiales | 468 | 0.03 MB |
| Encuesta | 500 | 0.04 MB |

> **Total de registros RAW:** **14,393**

---

## 3. Zona STAGING

### 3.1 Scripts de Transformación

| Script | Descripción |
|----------|------------|
| `stg_clima.py` | Transformación de datos climáticos |
| `stg_farmacias.py` | Transformación de inventario farmacéutico |
| `stg_infraestructura.py` | Limpieza de infraestructura médica |
| `stg_casos_dengue.py` | Procesamiento de casos oficiales |
| `stg_encuesta.py` | Limpieza de encuesta ciudadana |
| `stg_api_indicadores.py` | Procesamiento de APIs |
| `stg_all_sources.py` | Pipeline consolidado |

---

### 3.2 Funcionalidades implementadas

Cada script ejecuta automáticamente:

- Carga de datos RAW
- Eliminación de duplicados
- Tratamiento de valores nulos
- Validación de formatos
- Estandarización
- Homologación de campos
- Generación de métricas
- Exportación a Parquet
- Registro de logs

---

## 4. Framework de Calidad de Datos

### 4.1 Control de Duplicados

| Fuente | Clave de unicidad | Estrategia |
|---------|-------------------|------------|
| Clima | canton + año + semana | Mantener registro más completo |
| Farmacias | canton + cadena + medicamento + año + semana | Mantener registro más completo |
| Infraestructura | nombre_centro + año + semana | Mantener registro más completo |
| Casos oficiales | canton + año + semana | Mantener registro más completo |
| Encuesta | id_encuesta | Mantener primero |

**Resultado**

- **3,102 registros duplicados eliminados**

---

### 4.2 Control de Valores Nulos

| Campo | Fuente | % Nulos | Estrategia |
|--------|---------|---------:|------------|
| tiempo_espera_horas | Encuesta | 12% | Mediana por cantón |
| cantidad_unidades | Farmacias | 8% | Imputar 0 |
| precio_usd | Farmacias | 5% | Mediana por medicamento |
| temp_maxima_c | Clima | 3% | Mediana por cantón |
| serotipo_detectado | Casos | 2% | "No identificado" |

---

### 4.3 Formatos y Casting

| Campo | Problema | Transformación | Resultado |
|--------|----------|---------------|-----------|
| stg_lluvia_bruta | "45.2mm" | Regex + Float | 45.2 |
| stg_temp_raw | "28.5 °C" | Regex + Float | 28.5 |
| precio_usd | "$5,99" | Regex + Decimal | 5.99 |
| fecha_publicacion | Formatos mixtos | `pd.to_datetime()` | ISO 8601 |

---

### 4.4 Estandarización

Se normalizan los siguientes aspectos:

- Codificación UTF-8
- Fechas ISO 8601 (`YYYY-MM-DD`)
- Unidades:
  - mm
  - °C
  - USD
  - horas
- Catálogo oficial INEC para nombres de cantones

---

### 4.5 Homologación Inter-Fuentes

| Scraping | API | CSV | Campo Staging |
|----------|-----|-----|---------------|
| stg_lluvia_bruta | precipitacion | mm_lluvia | precipitacion_mm |
| stg_temp_raw | temperature | temp_max | temp_maxima_c |
| stg_ciudad_texto | city | canton | canton |
| stock_disponible | in_stock | disponible | stock_disponible |

---

### 4.6 Registro de Errores

| Timestamp | Fuente | Error | Acción tomada |
|------------|---------|-------|---------------|
| 2026-06-29 08:15 | Clima | Timeout | Reintento con mayor delay |
| 2026-06-29 08:22 | Farmacias | HTTP 403 | Rotación de User-Agent |
| 2026-06-29 08:35 | Noticias | URL nula | Registros eliminados |
| 2026-06-29 08:41 | Farmacias | Formato de precio | Regex |
| 2026-06-29 08:52 | Clima | Temperatura 85°C | Corrección mediante mediana |
| 2026-06-29 09:10 | Encuesta | Edad 150 años | Registro eliminado |

---

### 4.7 Métricas Globales de Calidad

| Métrica | Valor |
|----------|------:|
| Registros RAW | 14,393 |
| Registros STAGING | 12,891 |
| Completitud | 89.6% |
| Duplicados eliminados | 3,102 |
| Registros eliminados por nulos críticos | 400 |
| Registros corregidos por formato | 156 |
| Tasa promedio de error | 10.4% |
| Tasa global de retención | 89.6% |

---

## 5. Estructura del Repositorio Git

```text
pipeline_dengue_santa_elena/
├── README.md
├── requirements.txt
├── .gitignore
│
├── raw/
│   ├── scraping/
│   ├── api/
│   ├── archivos/
│   └── fuente_propia/
│
├── staging/
│   ├── stg_clima.parquet
│   ├── stg_farmacias.parquet
│   ├── stg_infraestructura.parquet
│   ├── stg_casos_dengue.parquet
│   ├── stg_encuesta.parquet
│   ├── stg_api_indicadores.parquet
│   └── reporte_calidad_2026-06-29.json
│
├── scripts/
│   ├── extraction/
│   │   ├── extract_clima.py
│   │   ├── extract_noticias.py
│   │   ├── extract_farmacias.py
│   │   ├── extract_infraestructura.py
│   │   └── extract_api_health.py
│   │
│   ├── staging/
│   │   ├── stg_clima.py
│   │   ├── stg_farmacias.py
│   │   ├── stg_infraestructura.py
│   │   ├── stg_casos_dengue.py
│   │   ├── stg_encuesta.py
│   │   └── stg_all_sources.py
│   │
│   └── quality/
│       ├── quality_checks.py
│       ├── error_logger.py
│       └── metrics_reporter.py
│
├── logs/
│   ├── extraction.log
│   ├── staging.log
│   └── quality.log
│
└── docs/
    ├── arquitectura_pipeline.md
    ├── diccionario_datos.md
    └── manual_operacion.md
```