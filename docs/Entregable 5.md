# Plataforma de Inteligencia de Negocios para el Monitoreo Epidemiológico Multipatología Nacional en Ecuador

## 2. Abstract

La fragmentación y dispersión de datos clínicos, meteorológicos y de capacidad sanitaria impiden una respuesta coordinada ante brotes infecciosos y crónicos. Este proyecto presenta el diseño y despliegue de una plataforma de Inteligencia de Negocios (BI) basada en una arquitectura web distribuida multi-capa para el monitoreo epidemiológico nacional de más de 100 patologías en Ecuador. Se implementó un Data Warehouse (DW) relacional en estrella con ingesta de datos automatizada y soporte multivariable: demografía rural y urbana, origen patogénico (Virus, Bacteria, Hongo, Parásito, Genético) y modo de adquisición. Una API RESTful en Node.js expone de forma agregada los indicadores sanitarios de los 220+ cantones y 24 provincias ecuatorianas, los cuales son consumidos por un Frontend reactivo de alto impacto visual en Angular. El sistema integra un menú de control por Sidebar, gráficos interactivos de líneas temporales, radar de estrés hospitalario, diagramas de rosca de composición etiológica y mapas dinámicos coropléticos. Los resultados demuestran que la consolidación analítica agiliza la toma de decisiones, facilitando la detección de brotes críticos por medio de semáforos inteligentes de alerta temprana y la redistribución eficiente de recursos clínicos.

**Palabras clave:** Inteligencia de Negocios, Data Warehouse, Multipatología, Infecciones Epidémicas, Node.js, Angular, Semáforo de Alerta Temprana.

## 3. Introducción y Justificación

El monitoreo de enfermedades infectocontagiosas y crónicas impone un enorme reto de gestión sobre los sistemas sanitarios del Ecuador. Históricamente, patologías complejas y metaxénicas como el dengue, la malaria o las IRAS se han monitoreado de manera aislada, limitando la visualización espacial y temporal de factores ambientales determinantes (lluvia, temperatura, humedad) y recursos clínicos en los centros del Ministerio de Salud Pública (MSP).

Este trabajo implementa una solución de Inteligencia de Negocios a gran escala nacional. Expandiendo el alcance de Santa Elena hacia todo el territorio ecuatoriano, la plataforma procesa indicadores demográficos detallados (casos en zonas urbanas vs. rurales), tipos de transmisión (adquiridas, hereditarias) y el origen biológico del patógeno. Gracias al desacoplamiento físico de la lógica analítica (Data Warehouse dimensional), los microservicios de agregación y una interfaz de usuario interactiva estructurada por Sidebar, las autoridades sanitarias pueden identificar en segundos cantones saturados o desabastecidos de medicamentos, facilitando la movilización de suministros médicos e infraestructura en base a datos reales.

## 4. Marco Teórico (Actualizado y Expandido)

### 4.1. Inteligencia de Negocios y Toma de Decisiones Sanitarias

La Inteligencia de Negocios (BI) engloba las metodologías y tecnologías que transforman datos crudos en información para la toma de decisiones operativas y estratégicas [2]. En salud pública, el almacenamiento multidimensional unificado es el estándar recomendado para predecir brotes de vectores, realizar comparativas demográficas regionales y evitar la fragmentación de la información analítica de clínicas y laboratorios [3].

### 4.2. Modelado Dimensional de Granularidad Fina y ETL

El diseño dimensional de Ralph Kimball promueve optimizar los tiempos de lectura y consulta mediante esquemas de estrella de alto rendimiento [4]. En este sistema, la tabla de hechos unifica la contabilidad demográfica detallada (urbana vs. rural) y la cruza con dimensiones de granularidad fina como el catálogo de enfermedades CIE-10, posibilitando la exploración drill-down y rollup por cantón, provincia o grupo etiológico.

### 4.3. Arquitecturas Modernas: SPA y APIs RESTful

Para soportar miles de consultas geográficas simultáneas, se adopta una arquitectura desacoplada. Node.js actúa como el motor del backend debido a su capacidad de procesamiento asíncrono y no bloqueante de consultas agregadas [9]. En la interfaz cliente, Angular (SPA) permite a los analistas sanitarios conmutar secciones en tiempo real (Visión General, Patologías, Etiología, Infraestructura, Mapa) sin recargar la página, agilizando el flujo de trabajo de campo.en tiempo real que es fundamental para el monitoreo interactivo de KPIs [10].

### 4.4. Dinámica Epidemiológica del Dengue en la Costa Ecuatoriana

El ciclo de reproducción del vector *Aedes aegypti* está intrínsecamente ligado a variaciones meteorológicas. Investigaciones específicas realizadas en la región costera del Ecuador han demostrado una fuerte correlación estadística positiva y retardada entre los altos niveles de precipitación y la incidencia de epidemias de dengue [11]. Modelar estas variables climáticas junto con la capacidad de infraestructura clínica a través de herramientas de visualización de datos [12] es fundamental para la emisión de alertas tempranas.

## 5. Metodología e Infraestructura

La investigación aplicó un enfoque cuantitativo y descriptivo, apoyado en la metodología del ciclo de vida de Kimball para la construcción del sistema de Inteligencia de Negocios nacional.

**Capa de Datos:** Se construyó un Data Warehouse en MySQL bajo un esquema de estrella. La tabla principal (`fact_incidencia`) almacena las métricas sanitarias (casos confirmados, desglose de casos urbanos y rurales, alertas de prensa, stock de medicamentos y tiempos de espera). Esta se enlaza con cinco dimensiones: `dim_tiempo` (fechas y semanas epidemiológicas), `dim_geografia` (provincias y cantones de Ecuador con población base), `dim_clima` (humedad, precipitación y temperatura semanal por cantón), `dim_infraestructura` (camas, ocupación y médicos disponibles) y `dim_enfermedad` (catálogo de más de 100 patologías con código CIE-10, origen y etiología).

**Capa Lógica (API REST):** Desarrollada en Node.js y Express.js. Se añadieron endpoints dinámicos de agregación territorial (`/api/kpis`, `/api/grafico-temporal`, `/api/grafico-etiologia`, `/api/alertas-criticas`) que extraen métricas filtradas según provincia, cantón, año, etiología o tipo de patología y devuelven estructuras en JSON con baja latencia.

**Capa de Presentación:** Construida en Angular. Se estructuró un Sidebar lateral de navegación fija que distribuye el análisis en 5 vistas modulares (`*ngIf`): Visión General, Patologías, Composición Etiológica, Infraestructura y Mapa Territorial. El sistema es reactivo, usando Chart.js para renderizar diagramas temporales, radares multivariables, y diagramas de rosca etiológicos. La plataforma está completamente desplegada en producción y es accesible para los usuarios y analistas a través del dominio público: [https://eldominiodedesarrollo.tech/](https://eldominiodedesarrollo.tech/).

## 6. Análisis y KPIs Obtenidos

El Monitor Epidemiológico Nacional consolida el análisis a través de las siguientes secciones interactivas:

1. **Visión General**: Muestra KPIs consolidados de casos nacionales, promedios de espera médica, stock farmacéutico y tasa de ocupación de camas, cruzados con la curva temporal lineal de precipitación y alertas de prensa.
2. **Patologías**: Expone la distribución de casos por enfermedad en gráficos de barras y provee una tabla interactiva detallando el catálogo de las 100+ patologías (CIE-10, origen rural/urbano, etiología).
3. **Análisis Etiológico**: Renderiza un diagrama de rosca que visualiza el origen biológico del brote (Virus vs. Bacterias vs. Hongos vs. Parásitos vs. Genéticos).
4. **Infraestructura Hospitalaria**: Correlaciona el estrés operativo comparando la afluencia de pacientes frente a la disponibilidad de personal médico activo.
5. **Mapa Territorial**: Un mapa nacional de calor basado en Leaflet con capas activables de casos, precipitaciones y saturación clínica.
6. **Alertas Críticas**: Tarjetas con semáforos rojos automáticos que señalan aquellos cantones con brotes activos o capacidad al límite.

## 7. Discusión Crítica y Límites

La implementación a escala nacional demostró la viabilidad de unificar registros dispares de climatología e infraestructura hospitalaria.

* **Desafío de Calidad de Datos Transnacional**: La ingesta de datos proveniente de múltiples distritos de salud del MSP reveló problemas de codificación CIE-10 inconsistente y valores nulos en demografías rurales. Se requirió del uso de pipelines ETL robustos en Python para limpiar e imputar valores de coordenadas y censos de población.
* **Latencia del Procesamiento Batch**: El Data Warehouse se actualiza mediante un proceso programado (batch). Aunque es óptimo para la planeación estratégica, la ausencia de un pipeline de streaming limita la reacción inmediata ante catástrofes en tiempo real.

**Lecciones Aprendidas:**
1. **Contención del Scroll y Viewport**: Al diseñar dashboards enriquecidos con Sidebar, es vital restringir el scroll general del `:host` a `100vh` con `overflow: hidden`, delegando el scroll a los contenedores internos para evitar scrollbars anidados.
2. **Pre-Agregación e Índices**: Con más de 10,000 registros nacionales en el DW, la indexación de las llaves foráneas en `fact_incidencia` es indispensable para mantener respuestas de API inferiores a 50ms.

## 8. Conclusiones Explícitas

- El rediseño de interfaz basado en Sidebar y vistas modulares reactivas mejora significativamente la usabilidad y experiencia de usuario en tareas de análisis epidemiológico.
- El modelo estrella diseñado (`fact_incidencia` + 5 dimensiones) demostró ser altamente flexible para almacenar no solo dengue, sino un espectro de más de 100 enfermedades de orígenes diversos en todo el Ecuador.
- La automatización de alertas críticas mediante semaforización dota al sistema de un valor preventivo real, permitiendo a los epidemiólogos anticipar colapsos de infraestructura antes de que ocurran picos de contagio.

## 9. Bibliografía

[1] Organización Panamericana de la Salud (OPS), "Dengue: Guías para la atención de enfermos en la Región de las Américas," 2da ed. Washington, D.C.: OPS, 2016.

[2] R. Kimball y M. Ross, *The Data Warehouse Toolkit: The Definitive Guide to Dimensional Modeling*, 3ra ed. Indianápolis, IN: Wiley, 2013.

[3] Y. M. M. Asuncion, C. O. R. L. R. C. M. Silva, y E. R. M. F. Silva, "Business Intelligence Applied to Healthcare: A Systematic Literature Review," *IEEE Access*, vol. 9, pp. 104523-104538, 2021.

[4] W. Inmon, *Building the Data Warehouse*, 4ta ed. Indianápolis, IN: Wiley, 2005.

[5] A. Casalboni, *Building Serverless Web Applications: Develop scalable web apps using Node.js*, Birmingham, UK: Packt Publishing, 2017.

[6] E. W. R. Zubieta, et al., "Desarrollo de un sistema de información espacial para la vigilancia epidemiológica del dengue," *Revista Panamericana de Salud Pública*, vol. 27, no. 5, pp. 361-367, 2010.

[7] M. R. Karim y M. Rahman, "Decision Making in Healthcare using Data Warehousing and Data Mining," en *IEEE International Conference on Informatics, Electronics & Vision (ICIEV)*, Dhaka, Bangladesh, 2013, pp. 1-4.

[8] V. Kumar y B. S. Saini, "Data Quality Management in Healthcare Data Warehouse," en *IEEE 2nd International Conference on Computing for Sustainable Global Development (INDIACom)*, Nueva Delhi, India, 2015, pp. 1256-1260.

[9] S. Tilkov y S. Vinoski, "Node.js: Using JavaScript to Build High-Performance Network Programs," *IEEE Internet Computing*, vol. 14, no. 6, pp. 80-83, 2010.

[10] M. S. A. K. Al-Ani et al., "Evaluation of Single Page Application Frameworks: Angular vs React," en *IEEE 8th International Conference on Computing for Sustainable Global Development (INDIACom)*, 2021, pp. 845-849.

[11] A. M. Stewart-Ibarra et al., "The social and spatial ecology of dengue epidemics in Machala, Ecuador," *PLoS Neglected Tropical Diseases*, vol. 8, no. 10, e3358, 2014.

[12] S. Few, *Information Dashboard Design: The Effective Visual Communication of Data*, Sebastopol, CA: O'Reilly Media, 2006.

## 10. Anexos

### Anexo A: Modelo Multidimensional (Esquema de Estrella)

![Modelo Multidimensional — Esquema de Estrella del Data Warehouse](anexo_a_esquema_estrella.png)

*Figura A.1. Esquema de estrella del Data Warehouse: la tabla de hechos `fact_incidencia` se relaciona con las dimensiones `dim_tiempo`, `dim_geografia`, `dim_clima` y `dim_infraestructura` mediante claves foráneas (FK).*

### Anexo B: Fragmento del Diccionario de Datos

#### Tablas de Dimensiones

##### 1. `dim_tiempo`

**Propósito:** Dimensión de tiempo que permite el análisis epidemiológico a distintas granularidades (diaria, semanal, mensual, anual). Cada fila representa un día calendario.

| # | Columna | Tipo | Nulo | Llave | Descripción | Ejemplo |
|---|---------|------|------|-------|-------------|---------|
| 1 | `id_tiempo` | INT | NO | PK | Clave surrogada de tiempo con formato AAAAMMDD. No usa AUTO_INCREMENT; su valor se genera externamente con la fecha. | 20240115 |
| 2 | `fecha` | DATE | NO | UNIQUE | Fecha calendario completa en formato ISO 8601. Garantiza unicidad de la fila. | 2024-01-15 |
| 3 | `anio` | INT | NO | — | Año calendario de la fecha. Rango de datos: 2022 – 2026. | 2024 |
| 4 | `semana_epidem` | INT | NO | — | Número de semana epidemiológica según el estándar CDC/OPS (semana 1–52/53). Puede cruzar límites de año. | 3 |
| 5 | `mes` | INT | NO | — | Número de mes (1 = enero … 12 = diciembre). | 1 |
| 6 | `nombre_mes` | VARCHAR(20) | NO | — | Nombre del mes en español. Valores posibles: Enero, Febrero, Marzo, Abril, Mayo, Junio, Julio, Agosto, Septiembre, Octubre, Noviembre, Diciembre. | Enero |

> **Nota:** `id_tiempo` actúa como una *surrogate key* de fecha (formato AAAAMMDD). Las semanas epidemiológicas pueden comenzar en la semana 52 del año anterior (p. ej., 2023-01-01 → semana 52 de 2022).

##### 2. `dim_geografia`

**Propósito:** Dimensión geográfica que identifica las provincias y cantones del Ecuador donde se registran los eventos epidemiológicos. Incluye censos de población base para tasas de incidencia por 100k hab.

| # | Columna | Tipo | Nulo | Llave | Descripción | Ejemplo |
|---|---------|------|------|-------|-------------|---------|
| 1 | `id_geografia` | INT | NO | PK (AUTO_INCREMENT) | Clave surrogada de la dimensión geográfica. | 1 |
| 2 | `canton` | VARCHAR(100) | NO | UNIQUE | Nombre del cantón en mayúsculas (220+ cantones). | GUAYAQUIL |
| 3 | `provincia` | VARCHAR(100) | NO | — | Nombre de la provincia correspondiente (24 provincias). | GUAYAS |
| 4 | `poblacion` | INT | NO | — | Población total estimada del cantón. | 2600000 |

> **Nota:** Cubre todo el territorio continental e insular de la República del Ecuador.

##### 3. `dim_enfermedad`

**Propósito:** Catálogo unificado de más de 100 patologías infectocontagiosas y crónicas bajo el estándar CIE-10, incluyendo su origen y etiología.

| # | Columna | Tipo | Nulo | Llave | Descripción | Ejemplo |
|---|---------|------|------|-------|-------------|---------|
| 1 | `id_enfermedad` | INT | NO | PK (AUTO_INCREMENT) | Clave surrogada de la enfermedad. | 1 |
| 2 | `cie10` | VARCHAR(10) | NO | UNIQUE | Código de clasificación internacional CIE-10. | A90 |
| 3 | `nombre_enfermedad`| VARCHAR(150) | NO | — | Nombre común o clínico de la patología. | Dengue clásico |
| 4 | `categoria_origen` | VARCHAR(50) | NO | — | Origen de transmisión: Hereditaria, Adquirida, Congénita. | Adquirida |
| 5 | `tipo_causa` | VARCHAR(50) | NO | — | Etiología biológica: Virus, Bacteria, Hongo, Parásito, Genético. | Virus |

##### 4. `dim_clima`

**Propósito:** Dimensión de condiciones climáticas por cantón, año y semana epidemiológica.

| # | Columna | Tipo | Nulo | Llave | Descripción | Ejemplo |
|---|---------|------|------|-------|-------------|---------|
| 1 | `id_clima` | INT | NO | PK (AUTO_INCREMENT) | Clave surrogada. | 1 |
| 2 | `canton` | VARCHAR(100) | NO | — | Cantón relacionado a las lecturas meteorológicas. | PAUTE |
| 3 | `semana_epidem` | INT | NO | — | Semana epidemiológica. | 27 |
| 4 | `anio` | INT | NO | — | Año de las lecturas. | 2026 |
| 5 | `precipitacion_mm` | DECIMAL(5,2) | NO | — | Lluvia acumulada semanal en mm. | 12.50 |
| 6 | `temp_maxima_c` | DECIMAL(4,2) | NO | — | Temperatura máxima (°C). | 28.40 |
| 7 | `temp_minima_c` | DECIMAL(4,2) | NO | — | Temperatura mínima (°C). | 22.10 |
| 8 | `humedad_relativa` | DECIMAL(5,2) | NO | — | Porcentaje de humedad relativa promedio semanal. | 78.00 |

##### 5. `dim_infraestructura`

**Propósito:** Capacidad hospitalaria de la red pública y del MSP por cantón y período semanal.

| # | Columna | Tipo | Nulo | Llave | Descripción | Ejemplo |
|---|---------|------|------|-------|-------------|---------|
| 1 | `id_infraestructura`| INT | NO | PK (AUTO_INCREMENT) | Clave surrogada. | 1 |
| 2 | `canton` | VARCHAR(100) | NO | — | Cantón del centro de salud. | PAUTE |
| 3 | `semana_epidem` | INT | NO | — | Semana epidemiológica. | 27 |
| 4 | `anio` | INT | NO | — | Año. | 2026 |
| 5 | `nivel_saturacion` | VARCHAR(50) | NO | — | Nivel de saturación: BAJA, MODERADA, ALTA. | ALTA |
| 6 | `camas_totales` | INT | NO | — | Capacidad de camas del cantón. | 22 |
| 7 | `camas_ocupadas` | INT | NO | — | Camas ocupadas en el período. | 19 |
| 8 | `medicos_disponibles`| INT | NO | — | Médicos activos en la semana. | 14 |

#### Tabla de Hechos

##### 6. `fact_incidencia`

**Propósito:** Tabla de hechos central del esquema estrella. Registra las incidencias y casos acumulados a nivel nacional.

| # | Columna | Tipo | Nulo | Llave | Descripción | Ejemplo |
|---|---------|------|------|-------|-------------|---------|
| 1 | `id_hecho` | INT | NO | PK (AUTO_INCREMENT) | Clave de registro. | 1 |
| 2 | `id_tiempo` | INT | NO | FK → `dim_tiempo` | Fecha del hecho. | 20260716 |
| 3 | `id_geografia` | INT | NO | FK → `dim_geografia` | Identificador geográfico (provincia/cantón). | 1 |
| 4 | `id_clima` | INT | NO | FK → `dim_clima` | Condiciones climáticas. | 22 |
| 5 | `id_infraestructura`| INT | NO | FK → `dim_infraestructura` | Capacidad y ocupación médica. | 4 |
| 6 | `id_enfermedad` | INT | NO | FK → `dim_enfermedad` | Enfermedad del caso (CIE-10). | 5 |
| 7 | `casos_confirmados` | INT | NO | — | Total de casos confirmados. | 50 |
| 8 | `casos_urbanos` | INT | NO | — | Casos registrados en zona urbana. | 35 |
| 9 | `casos_rurales` | INT | NO | — | Casos registrados en zona rural. | 15 |
| 10| `alertas_mediaticas`| INT | NO | — | Cantidad de alertas de prensa emitidas. | 2 |
| 11| `pct_stock_meds` | DECIMAL(5,2) | NO | — | Stock de insumos y medicamentos para la patología. | 48.00 |
| 12| `espera_promedio_h` | DECIMAL(4,2) | NO | — | Tiempos de espera promedio en emergencias (horas). | 3.75 |

#### Vistas KPI

| Vista | Métricas Calculadas | Fuente Principal | Descripción |
|-------|--------------------|------------------|-------------|
| `kpi_tasa_incidencia` | `tasa_incidencia_100k` | `fact_incidencia`, `dim_geografia` | Tasa de incidencia nacional acumulada por cada 100k habitantes. |
| `kpi_riesgo_climatico` | `indice_riesgo_climatico` | `dim_clima` | Clasificación de riesgo de brote según humedad, precipitaciones y temperaturas. |
| `kpi_disponibilidad_farmaceutica` | `pct_disponibilidad_medicamentos` | `fact_incidencia` | Stock promedio disponible en los centros del MSP. |
| `kpi_ocupacion_hospitalaria` | `tasa_ocupacion_pct` | `dim_infraestructura` | Ocupación de la red nacional de camas. |

#### Reglas de Negocio e Integridad

| Regla | Descripción |
|-------|-------------|
| RN-01 | Cada registro en `fact_incidencia` debe tener una fecha (`id_tiempo`) válida existente en `dim_tiempo`. |
| RN-02 | El cantón y la provincia deben existir y estar mapeados en la base territorial de `dim_geografia`. |
| RN-03 | Los valores de `pct_stock_meds` deben estar en el rango [0.00, 100.00]. |
| RN-04 | Las columnas cuantitativas de casos y recursos médicos no pueden ser valores negativos. |
| RN-05 | `camas_ocupadas` no debe superar a `camas_totales`. |
| RN-06 | La `semana_epidem` debe estar en el rango [1, 53] conforme al estándar epidemiológico OPS/CDC. |
| RN-07 | `espera_promedio_h` representa horas, por lo que no debe ser negativo ni exceder valores físicamente posibles. |
| RN-08 | El identificador de patología `id_enfermedad` debe estar registrado en el catálogo de `dim_enfermedad`. |
| RN-09 | El acumulado de `casos_urbanos` + `casos_rurales` debe coincidir exactamente con `casos_confirmados`. |
