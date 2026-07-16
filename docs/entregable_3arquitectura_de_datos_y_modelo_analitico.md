# ENTREGABLE 2: Arquitectura de Datos y Modelo Analítico

## 1. Arquitectura de Datos Técnica

La solución propuesta se estructura en un pipeline de datos de cuatro capas principales, diseñadas para extraer, transformar, almacenar y visualizar la información de manera eficiente.

### Orígenes de datos

#### Mecanismos de extracción

- **Web Scraping** (mediante Python con librerías como Scrapy y BeautifulSoup) para extraer:
  - Datos meteorológicos.
  - Inventario de farmacias.
  - Directorios hospitalarios.
  - Noticias locales.

- **Consumo de APIs REST** para obtener información de la OMS y del Ministerio de Salud.

- **Carga manual automatizada** para:
  - Archivos CSV oficiales.
  - Exportaciones en Excel.
  - Archivos JSON provenientes de encuestas de Google Forms.

### Interconexión

#### Naturaleza de los scripts

Se desarrollarán scripts en Python utilizando:

- **Pandas** para el procesamiento y limpieza de datos (ETL).
- **SQLAlchemy** o **psycopg2** para conectar con PostgreSQL e insertar los datos transformados mediante sentencias SQL.

### Zonas del Data Warehouse

#### Almacenamiento RAW

Directorio de archivos locales o Data Lake temporal donde aterrizan los archivos originales:

- JSON
- CSV
- HTML

sin modificaciones.

#### Staging

Entorno temporal de procesamiento (DataFrames de Pandas en memoria) donde se realizan las siguientes tareas:

- Estandarización de formatos.
- Manejo de valores nulos.
- Homologación de nombres de cantones (La Libertad, Santa Elena, Salinas, etc.).

#### Motor definitivo

Base de datos relacional orientada a analítica implementada en **PostgreSQL**, estructurada mediante un **Modelo Estrella (Star Schema)**.

### Capa de BI

#### Herramienta de visualización

Frontend web interactivo desarrollado completamente en **Angular**, que consumirá los datos del Data Warehouse mediante una API REST para renderizar el dashboard analítico.

---

# 2. Modelo Dimensional

## 2.1 Declaración de Granularidad

> **Cada fila dentro de la tabla de hechos representará el registro semanal consolidado de incidencia de casos de Dengue, junto con las métricas promedio de factores climáticos y saturación de servicios médicos, asociado a un ID de tiempo (semana epidemiológica) y un ID de geografía (cantón).**

---

## 2.2 Matriz del Modelo de Hechos

### Tabla: `Fact_Incidencia`

| Campo Destino | Tipo SQL | Descripción Funcional | Rol Estructural |
|---------------|----------|-----------------------|-----------------|
| `id_hecho` | INT | Clave primaria surrogada autoincremental. | PK |
| `id_tiempo` | INT | Clave foránea hacia la dimensión de tiempo (semanas). | FK |
| `id_geografia` | INT | Clave foránea hacia la dimensión de cantones o zonas. | FK |
| `id_clima` | INT | Clave foránea hacia la dimensión climática. | FK |
| `id_infraestructura` | INT | Clave foránea hacia la dimensión de capacidad médica. | FK |
| `casos_confirmados` | INT | Total de contagios nuevos registrados. | Métrica |
| `alertas_mediaticas` | INT | Volumen de noticias relacionadas con el riesgo epidemiológico. | Métrica |
| `pct_stock_meds` | DECIMAL(5,2) | Porcentaje de farmacias abastecidas. | Métrica |
| `espera_promedio_h` | DECIMAL(4,2) | Tiempo promedio de atención hospitalaria (horas). | Métrica |

---

# 3. Justificación de la Topología del Esquema

| Criterio Evaluativo | Star Schema (Estrella) | Snowflake (Copo de Nieve) | Galaxy Schema (Galaxia) |
|---------------------|-----------------------|---------------------------|-------------------------|
| Rendimiento (Joins) | Alto | Medio | Alto |
| Redundancia | Alta | Baja | Media |
| Complejidad | Baja | Media | Alta |
| ¿Aplica al caso? | ✅ Sí | ❌ No | ❌ No |

## Justificación de la elección

Se selecciona el **Star Schema** por ser la topología óptima para el proyecto.

Al existir un único proceso de negocio central (el monitoreo de la incidencia del Dengue), una tabla de hechos centralizada rodeada de dimensiones desnormalizadas garantiza un alto rendimiento en las consultas SQL.

Esta baja complejidad en los *joins* resulta fundamental para que el dashboard desarrollado en Angular pueda renderizar los KPIs en tiempo real utilizando PostgreSQL como motor analítico, evitando la sobre-normalización propia del esquema Snowflake, la cual incrementaría la latencia de las consultas.

---

# 4. Diccionario de Datos

# 5. Trazabilidad (Mapeo)

A continuación se presenta el diccionario de datos junto con las reglas de transformación utilizadas durante el proceso ETL.

## Tabla: Fact_Incidencia

| Tabla DW | Campo DW | Tipo | Regla / Valores | Atributo Staging | Transformación | Fuente Origen |
|-----------|----------|------|-----------------|------------------|----------------|----------------|
| Fact_Incidencia | `casos_confirmados` | INT | ≥ 0 | `stg_nuevos_casos` | Suma agrupada por cantón y semana epidemiológica. | CSV Oficial (Salud) |
| Fact_Incidencia | `pct_stock_meds` | DECIMAL | 0 a 100 | `stg_disp_farmacias` | Promedio ponderado de farmacias con stock activo. | Scraping (Farmacias) |
| Fact_Incidencia | `espera_promedio_h` | DECIMAL | > 0 | `stg_horas_espera` | Cálculo de la media aritmética de las encuestas. | Formularios propios |

---

## Tabla: Dim_Tiempo

| Tabla DW | Campo DW | Tipo | Regla / Valores | Atributo Staging | Transformación | Fuente Origen |
|-----------|----------|------|-----------------|------------------|----------------|----------------|
| Dim_Tiempo | `id_tiempo` | INT | Formato YYYYMMDD | `stg_fecha_registro` | Extracción, formateo y conversión a entero. | Todas las fuentes |
| Dim_Tiempo | `semana_epidem` | INT | 1 a 52 | `stg_fecha_registro` | Aplicación de `isocalendar().week` de Pandas. | Todas las fuentes |

---

## Tabla: Dim_Geografia

| Tabla DW | Campo DW | Tipo | Regla / Valores | Atributo Staging | Transformación | Fuente Origen |
|-----------|----------|------|-----------------|------------------|----------------|----------------|
| Dim_Geografia | `canton` | VARCHAR | La Libertad, Santa Elena, Salinas, etc. | `stg_ciudad_texto` | Homologación (mayúsculas) y mapeo de sinónimos. | Scraping / API / CSV |

---

## Tabla: Dim_Clima

| Tabla DW | Campo DW | Tipo | Regla / Valores | Atributo Staging | Transformación | Fuente Origen |
|-----------|----------|------|-----------------|------------------|----------------|----------------|
| Dim_Clima | `precipitacion_mm` | DECIMAL | ≥ 0.0 | `stg_lluvia_bruta` | Eliminación del texto "mm" y conversión a `FLOAT`. | Scraping (Clima) |
| Dim_Clima | `temp_maxima_c` | DECIMAL | — | `stg_temp_raw` | Extracción del valor numérico y conversión a grados Celsius. | Scraping (Clima) |

---

## Tabla: Dim_Infraestructura

| Tabla DW | Campo DW | Tipo | Regla / Valores | Atributo Staging | Transformación | Fuente Origen |
|-----------|----------|------|-----------------|------------------|----------------|----------------|
| Dim_Infraestructura | `nivel_saturacion` | VARCHAR | Bajo, Medio, Alto | `stg_camas_disp` | Regla IF/ELSE: si la ocupación > 85% ⇒ **Alto**. | Scraping / API |
| Dim_Infraestructura | `centros_activos` | INT | ≥ 0 | `stg_dir_medicos` | Conteo distinto (`COUNT`) de clínicas abiertas. | Scraping (Directorios) |