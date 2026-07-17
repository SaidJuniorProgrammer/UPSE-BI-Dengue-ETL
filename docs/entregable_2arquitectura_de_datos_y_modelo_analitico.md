# ENTREGABLE 2: Arquitectura de Datos y Modelo Analítico (Multipatología Nacional)

## 1. Arquitectura de Datos Técnica

La solución analítica de cobertura nacional se estructura en un pipeline de datos de cuatro capas principales, diseñadas para extraer, transformar, almacenar y visualizar la información epidemiológica.

### Orígenes de Datos
- **Web Scraping** (mediante scripts autónomos en Python) para extraer promedios climáticos del INAMHI/Open-Meteo, inventario y disponibilidad farmacéutica, directorios de capacidad hospitalaria del MSP, y alertas epidemiológicas en medios.
- **Consumo de APIs REST** para obtener registros consolidados internacionales (PLISA OPS/OMS).
- **Carga manual automatizada** para el catálogo oficial de CIE-10 (100+ enfermedades en CSV), datos demográficos e históricos del MSP y encuestas directas en Google Forms (JSON/CSV).

### Interconexión
- **Pandas** actúa como el motor central de normalización, imputación y aseguramiento de la calidad de datos.
- **mysql-connector-python** o librerías de conexión nativas cargan los DataFrames depurados y en formato columnar Parquet directamente al Data Warehouse.

### Zonas del Data Warehouse
- **Almacenamiento RAW:** Directorio local (`raw/`) organizado por subcarpetas (`scraping/`, `api/`, `archivos/`) donde aterrizan los archivos en bruto JSON, HTML y CSV sin alteración alguna.
- **Staging:** Espacio de transformación temporal que procesa los datos y los convierte a formato columnar **Parquet**, asegurando una tipificación homogénea, imputación de nulos y estandarización geográfica según el catálogo INEC para los 220+ cantones y 24 provincias de Ecuador.
- **Data Warehouse Analítico:** Base de datos relacional robusta implementada en **MySQL**, estructurada bajo un **Modelo Estrella (Star Schema)** con llaves indexadas.

### Capa de BI (Frontend)
- Interfaz reactiva desarrollada en **Angular** estructurada mediante Sidebar. Consume agregaciones JSON expuestas por una API RESTful asíncrona desarrollada en **Node.js/Express**, lo que disminuye tiempos de consulta a menos de 50ms.

---

# 2. Modelo Dimensional

## 2.1 Declaración de Granularidad

> **Cada fila dentro de la tabla de hechos representará el registro semanal consolidado de incidencia de casos por patología específica, junto con las métricas promedio de factores climáticos e infraestructura asistencial, asociado a un ID de tiempo (semana epidemiológica), un ID de geografía (cantón) y un ID de enfermedad (catálogo CIE-10) en el Ecuador.**

---

## 2.2 Matriz del Modelo de Hechos

### Tabla: `fact_incidencia`

| Campo Destino | Tipo SQL | Descripción Funcional | Rol Estructural |
|---------------|----------|-----------------------|-----------------|
| `id_hecho` | INT | Clave primaria autoincremental del registro. | PK |
| `id_tiempo` | INT | Clave foránea que enlaza a la dimensión temporal (AAAAMMDD). | FK |
| `id_geografia` | INT | Clave foránea que enlaza al cantón y provincia. | FK |
| `id_clima` | INT | Clave foránea que enlaza a las lecturas meteorológicas correspondientes. | FK |
| `id_infraestructura` | INT | Clave foránea que relaciona la capacidad y ocupación hospitalaria. | FK |
| `id_enfermedad` | INT | Clave foránea que relaciona la patología con el catálogo CIE-10. | FK |
| `casos_confirmados` | INT | Total de contagios registrados de la patología en el período. | Métrica |
| `casos_urbanos` | INT | Total de contagios registrados en la zona urbana del cantón. | Métrica |
| `casos_rurales` | INT | Total de contagios registrados en la zona rural del cantón. | Métrica |
| `alertas_mediaticas` | INT | Volumen de noticias de prensa local sobre el brote. | Métrica |
| `pct_stock_meds` | DECIMAL(5,2) | Disponibilidad porcentual de medicamentos esenciales. | Métrica |
| `espera_promedio_h` | DECIMAL(4,2) | Tiempo de espera promedio reportado en emergencias (horas). | Métrica |

---

# 3. Justificación de la Topología del Esquema

| Criterio Evaluativo | Star Schema (Estrella) | Snowflake (Copo de Nieve) | Galaxy Schema (Galaxia) |
|---------------------|-----------------------|---------------------------|-------------------------|
| Rendimiento (Joins) | Alto | Medio | Alto |
| Redundancia | Alta | Baja | Media |
| Complejidad | Baja | Media | Alta |
| ¿Aplica al caso? | ✅ Sí | ❌ No | ❌ No |

## Justificación de la elección

Se seleccionó el **Star Schema** como la estructura analítica óptima para el Data Warehouse nacional. 

Al centralizar las métricas cuantitativas en una tabla de hechos (`fact_incidencia`) rodeada por dimensiones totalmente desnormalizadas (`dim_tiempo`, `dim_geografia`, `dim_clima`, `dim_infraestructura`, `dim_enfermedad`), se minimiza el número de uniones (JOINs) requeridas por las consultas analíticas de la API. Esta baja complejidad de procesamiento garantiza que las múltiples vistas reactivas del Sidebar del Frontend Angular (composición etiológica, mapas de calor y semáforos de riesgo) carguen casi instantáneamente al consultar millones de registros históricos a nivel nacional, superando el cuello de botella que causaría un esquema Snowflake.

---

# 4. Trazabilidad y Mapeo ETL

A continuación se presenta la procedencia de los atributos del Data Warehouse desde la zona de Staging y sus reglas de transformación:

### Tabla: `fact_incidencia`
- `casos_confirmados`: Suma de casos agrupados por cantón, semana epidemiológica y CIE-10 desde `stg_casos_dengue.parquet`.
- `pct_stock_meds`: Promedio de stock disponible en perchas locales para la patología evaluada desde `stg_farmacias.parquet`.
- `espera_promedio_h`: Media de tiempo reportado en encuestas para emergencias desde `stg_encuesta.parquet`.

### Tabla: `dim_geografia`
- `canton` / `provincia`: Mapeados y homologados al catálogo INEC de cantones de Ecuador desde `stg_casos_dengue.parquet`.

### Tabla: `dim_enfermedad`
- `cie10` / `nombre_enfermedad` / `tipo_causa` / `categoria_origen`: Extraídos del catálogo oficial de 100+ patologías con su clasificación etiológica biológica.

### Tabla: `dim_clima`
- `precipitacion_mm` / `temp_maxima_c` / `humedad_relativa`: Promedios e históricos meteorológicos del INAMHI desde `stg_clima.parquet`.

### Tabla: `dim_infraestructura`
- `nivel_saturacion` / `camas_totales` / `camas_ocupadas` / `medicos_disponibles`: Datos de capacidad hospitalaria depurados desde `stg_infraestructura.parquet`.