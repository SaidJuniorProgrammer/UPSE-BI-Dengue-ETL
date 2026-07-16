# ENTREGABLE 3: Pipeline de Datos y Calidad

## 1. Fuentes de Datos y Extracción Obligatoria

### 1.1 Web Scraping (4 Extractores Especializados)

Se desarrollaron 4 scripts modulares en **Python** ubicados en `scripts/extraction/` utilizando las librerías **BeautifulSoup** y **requests**.

El proceso de extracción cumple rigurosamente con los requisitos establecidos en la rúbrica:

- Headers HTTP con **User-Agent** personalizado (`BI-Dengue-ETL/1.0`) para simular peticiones legítimas.
- Manejo preventivo y auditable de excepciones mediante bloques `try-except` ante errores de conexión o bloqueos anti-bots, incorporando muestreos de respaldo estructurados.
- Retrasos aleatorios controlados (`time.sleep(1.5, 5.0)`) entre solicitudes para evitar la sobrecarga de los servidores.
- Almacenamiento organizado de los datos extraídos en formato **JSON** dentro de subdirectorios por dominio en la **Zona RAW** (`raw/scraping/`).

### Sitios y dominios procesados

| Script / Módulo | Fuente / Dominio | Descripción |
|-----------------|------------------|-------------|
| `extract_clima.py` | **INAMHI / Open-Meteo** | Extracción de variables meteorológicas clave (precipitación en mm, temperaturas máxima y mínima en °C y humedad relativa). |
| `extract_noticias.py` | **Medios de Comunicación (El Universo, El Comercio, La Hora, Ecuavisa)** | Extracción de titulares, fechas de publicación y cantón mencionado en alertas epidemiológicas sobre Dengue. |
| `extract_farmacias.py` | **Cadenas Farmacéuticas (Fybeca, Pharmacy's, Sana Sana, Económicas, Cruz Azul)** | Monitoreo de inventarios, disponibilidad de stock físico y precios en USD de medicamentos antipiréticos y rehidratantes. |
| `extract_infraestructura.py` | **Directorio MSP e Infraestructura Hospitalaria** | Consulta del estado operativo en 7 centros médicos y hospitales de Santa Elena (camas totales/ocupadas, saturación y tiempos de espera). |

---

### 1.2 Consumo de APIs (`extract_api_health.py`)

Se implementó el consumo formal de dos interfaces de datos públicos con paginación y validación de esquema:

| Campo | Detalle |
|--------|----------|
| **API 1** | **World Bank Open Data API v2** |
| **Endpoint** | `/v2/country/ECU/indicator/SP.POP.TOTL` |
| **Parámetros y Paginación** | `format=json`, `date=2015:2024`, `per_page=100`, paginación implementada mediante ciclo `while`. |
| **API 2** | **OPS / OMS - PLISA Dengue** |
| **Registros obtenidos** | 166 registros consolidados de población e incidencia epidemiológica semanal para Ecuador. |

---

### 1.3 Archivos Estructurados

| Atributo | Valor |
|----------|-------|
| **Origen** | Ministerio de Salud Pública del Ecuador (Gacetas Vectoriales) |
| **Ubicación en RAW** | `raw/archivos/` |
| **Formato** | CSV (`casos_dengue_oficial_*.csv`) |
| **Campos extraídos** | canton, anio, semana_epidemiologica, casos_confirmados, casos_sospechosos, casos_graves, defunciones, serotipo_detectado |

---

### 1.4 Fuente Propia

| Atributo | Descripción |
|----------|-------------|
| **Metodología** | Encuesta estructurada digital sobre percepción ciudadana y tiempos de atención médica |
| **Ubicación en RAW** | `raw/fuente_propia/` |
| **Instrumento** | Google Forms (CSV / XLSX) |
| **Campos principales** | id_encuesta, canton_residencia, edad, califica_atencion_medica, tiempo_espera_horas |
| **Consideraciones éticas** | Anonimización total, sin datos de identificación personal (PII). |

---

## 2. Gestión de Capas de Datos

### 2.1 Zona RAW

#### Principios

La Zona RAW garantiza la **inmutabilidad absoluta** de la información recolectada. Los datos se almacenan exactamente como fueron extraídos en subdirectorios temáticos (`raw/scraping/clima`, `raw/scraping/farmacias`, `raw/api`, etc.), utilizando rutas dinámicas basadas en `os.path.abspath(__file__)` para asegurar portabilidad en cualquier sistema operativo.

### Evidencias de almacenamiento en RAW

| Fuente | Subdirectorio RAW | Archivo generado | Registros | Formato |
|---------|-------------------|------------------|----------:|:-------:|
| Clima | `raw/scraping/clima/` | `clima_YYYY-MM-DD.json` | 111 | JSON |
| Farmacias | `raw/scraping/farmacias/` | `farmacias_YYYY-MM-DD.json` | 75 | JSON |
| Infraestructura | `raw/scraping/infraestructura/` | `infraestructura_YYYY-MM-DD.json` | 7 | JSON |
| Noticias | `raw/scraping/noticias/` | `noticias_YYYY-MM-DD.json` | 5 | JSON |
| APIs Indicadores | `raw/api/` | `worldbank_health_*.json` / `ops_plisa_*.json` | 166 | JSON |
| Casos Oficiales | `raw/archivos/` | `casos_dengue_oficial_*.csv` | 3 | CSV |
| Encuesta | `raw/fuente_propia/` | `encuesta_percepcion_*.csv` | 10 | CSV |

---

### 2.2 Zona STAGING (Innovación a Formato Parquet)

En esta capa se ejecutan los transformadores especializados (`stg_clima.py`, `stg_farmacias.py`, `stg_infraestructura.py`, `stg_casos_dengue.py`, `stg_encuesta.py`, `stg_api_indicadores.py`) coordinados por el orquestador maestro `stg_all_sources.py`.

> [!IMPORTANT]
> **Exportación a Parquet**: Toda la capa de Staging migró del formato CSV convencional al formato **Parquet (`.parquet`)** mediante `pyarrow`. Esto optimiza la compresión en disco y preserva estrictamente los tipos de datos nativos (fechas ISO, numéricos de precisión), preparando los datos para el Data Warehouse en Modelo Estrella.

| Transformación | Descripción técnica | Módulo / Script |
|----------------|--------------------|-----------------|
| Estandarización INEC | Homologación estricta al catálogo oficial de cantones (`SANTA ELENA`, `LA LIBERTAD`, `SALINAS`). | `scripts/quality/quality_checks.py` |
| Limpieza con Regex | Extracción numérica de textos complejos como `"$5,99" -> 5.99` o `"45.2mm" -> 45.2`. | `scripts/quality/quality_checks.py` |
| Imputación por Mediana | Tratamiento de nulos imputando la mediana por agrupación lógica (ej. por cantón o medicamento). | `scripts/quality/quality_checks.py` |
| Deduplicación Multicampo | Depuración de registros idénticos basada en claves primarias compuestas. | `scripts/quality/quality_checks.py` |

---

## 3. Framework de Calidad de Datos

### 3.1 Control de Duplicados

Se definieron claves de unicidad compuestas adaptadas a cada dominio de información:

- **Clima**: `canton + fecha`
- **Farmacias**: `canton + cadena + medicamento + fecha_extraccion`
- **Infraestructura**: `nombre_centro + fecha_corte`
- **Casos Oficiales**: `canton + anio + semana_epidemiologica`
- **Encuesta**: `id_encuesta`

---

### 3.2 Control Avanzado de Valores Nulos

Se sustituyó la eliminación indiscriminada de filas por estrategias analíticas profesionales:

- **Imputación por Mediana Agrupada**: Valores nulos en `precio_usd` de farmacias se imputan con la mediana del medicamento específico. Tiempos de espera o temperaturas nulas se imputan con la mediana de su cantón.
- **Imputación Constante**: Valores vacíos en `cantidad_unidades` se estandarizan a `0`. Campos en `serotipo_detectado` vacíos se asignan como `"No identificado"`.

---

### 3.3 Formatos y Casting con Expresiones Regulares

A través de la función `limpiar_numero_regex()` se resuelven inconsistencias sintácticas comunes en fuentes web:

```python
match = re.search(r'[-+]?\d*\.?\d+', val_str.replace(',', '.'))
```
Esto asegura que las columnas monetarias (`precio_usd`) y pluviométricas (`precipitacion_mm`) ingresen como tipos flotantes (`float64`) verificados al archivo Parquet.

---

### 3.4 Estandarización Geográfica (Catálogo INEC)

Todos los nombres geográficos se normalizan en mayúsculas y se concilian contra el diccionario oficial del INEC en `CANTONES_INEC`:

| Entrada detectada en RAW | Cantón normalizado en Staging |
|--------------------------|-------------------------------|
| `ST. ELENA`, `SANTAELENA` | **SANTA ELENA** |
| `LIBERTAD`, `LALIBERTAD` | **LA LIBERTAD** |
| `SALINA`, `salinas` | **SALINAS** |

---

### 3.5 Registro Centralizado de Errores (`error_logger.py`)

Todas las correcciones, imputaciones o descartes realizados por el framework se auditan en doble salida:

1. **Log de texto**: `logs/quality.log`
2. **Registro tabular auditable**: `staging/error_log.csv`

| Timestamp | Fuente | Error detectado | Acción tomada |
|-----------|--------|-----------------|---------------|
| `2026-06-30 06:12:49` | Farmacias | Medicamentos con precio nulo/inválido | Imputar mediana por medicamento |
| `2026-06-30 06:12:49` | Clima | Registros duplicados por cantón y fecha | Mantenido último registro verificado |

---

### 3.6 Reporte Final de Métricas de Calidad (`reporte_calidad_YYYY-MM-DD.json`)

Métricas reales obtenidas en la ejecución de consolidación del pipeline modular en la Zona Staging:

| Métrica de Calidad | Valor Consolidado |
|--------------------|------------------:|
| **Fuentes procesadas** | **6** |
| **Registros RAW procesados** | **385** |
| **Registros STAGING consolidados** | **372** |
| **Registros duplicados eliminados** | **13** |
| **Registros eliminados por nulos críticos** | **0** |
| **Registros corregidos por formato (Regex/Casting)** | **297** |
| **Tasa de completitud global** | **100.0%** |
| **Tasa promedio de error por fuente** | **3.38%** |
| **Tasa global de retención del pipeline** | **96.62%** |