# Guión de Exposición: Monitor Epidemiológico Multipatología Nacional
**Integrantes:** Gino y Said  
**Duración Máxima:** 7 Minutos  
**Contexto Visual:** Grabación de pantalla mostrando diapositivas, base de datos (MySQL Workbench) y el Dashboard en ejecución (producción).

---

## Estructura de Tiempos Recomendada

| Sección | Contenido | Responsable | Tiempo Estimado |
|---|---|---|---|
| **Introducción** | Presentación y Definición del Problema (E1) | Said | 0:00 - 1:00 (1 min) |
| **Arquitectura** | Modelo Estrella y Topología del DW (E2) | Gino | 1:00 - 2:15 (1m 15s) |
| **Pipeline (ETL)** | Extracción y Limpieza de Calidad (E2/Staging) | Said | 2:15 - 3:45 (1m 30s) |
| **Data Warehouse** | Estructura Física y Consultas SQL (E4) | Gino | 3:45 - 5:00 (1m 15s) |
| **Dashboard BI** | Tablero Reactivo y Demostración Práctica (E5) | Gino y Said | 5:00 - 7:00 (2 min) |

---

## Guión y Diálogos

### 1. Entregables 1 y 2: Definición del Problema, Arquitectura y Modelo Dimensional (0:00 - 2:15)

#### [0:00 - 1:00] Presentación y Problema de Negocio (Said)
*(Visual en pantalla: Diapositiva de portada del proyecto y mapa conceptual del problema nacional)*

* **Said:** "Buenas tardes con todos. Mi nombre es Said, y junto a mi compañero Gino presentaremos la plataforma de Inteligencia de Negocios para el Monitoreo Epidemiológico Multipatología en Ecuador. 
* El problema central radica en que los sistemas de salud pública manejan gacetas clínicas fragmentadas. Esto impide correlacionar de forma inmediata el comportamiento de más de 100 patologías (como Dengue, Malaria o IRAS) con factores climatológicos extremos o con la capacidad asistencial real en el territorio. 
* Nuestra propuesta metodológica y técnica unifica estas fuentes heterogéneas para transformar reportes reactivos en decisiones preventivas estratégicas."

#### [1:00 - 2:15] Modelo Dimensional y Topología (Gino)
*(Visual en pantalla: Diagrama del Modelo Estrella con la tabla fact_incidencia y sus 5 dimensiones)*

* **Gino:** "Para sustentar este volumen nacional de datos, diseñamos un **Modelo Estrella (Star Schema)**. Como pueden observar en pantalla, la tabla de hechos central es `fact_incidencia`, la cual registra los casos confirmados desglosados en demografía rural y urbana, stock de insumos farmacéuticos y tiempos de espera en consulta.
* Rodeando a esta tabla, estructuramos cinco dimensiones desnormalizadas: `dim_tiempo` con granularidad diaria y semanal; `dim_geografia` que cubre los 220+ cantones y 24 provincias; `dim_enfermedad` con el catálogo CIE-10 y su origen etiológico; `dim_clima` para variables de lluvia y temperatura; y `dim_infraestructura` para medir el estrés clínico de camas y personal médico.
* Decidimos utilizar un esquema en estrella para reducir las uniones o *joins* en base de datos, garantizando tiempos de respuesta del API inferiores a 50ms."

---

### 2. Entregables 2 y 4: Pipeline de Datos, Calidad y Data Warehouse (2:15 - 5:00)

#### [2:15 - 3:45] Pipeline ETL y Framework de Calidad (Said)
*(Visual en pantalla: Código de scripts de extracción en Python o estructura de carpetas raw/ y staging/)*

* **Said:** "El pipeline de datos consta de cuatro capas. En la **Capa Raw**, ejecutamos cuatro extractores asíncronos en Python que realizan Web Scraping de variables climáticas del INAMHI, inventario farmacéutico, directorios del MSP y alertas de prensa. Además, consumimos APIs de la OPS/OMS y archivos estructurados.
* En la **Capa de Staging**, implementamos Pandas para depurar y homologar cantones de acuerdo al diccionario oficial del INEC. Un aspecto clave de innovación fue migrar del formato CSV clásico al formato **Parquet columnar**. Esto nos permite asegurar tipos de datos estrictos en disco y optimizar drásticamente la velocidad de almacenamiento.
* Para asegurar la calidad, aplicamos estrategias analíticas de imputación por mediana agrupada ante datos climáticos o de precios nulos, registrando cada anomalía corregida en un reporte de errores tabular."

#### [3:45 - 5:00] Data Warehouse y Consultas SQL (Gino)
*(Visual en pantalla: MySQL Workbench mostrando la ejecución de una consulta con JOINs y funciones analíticas como LAG)*

* **Gino:** "Aquí en MySQL Workbench pueden observar la materialización física de nuestra base de datos analítica con más de 10,000 registros nacionales consolidados.
* Para responder a nuestras preguntas de negocio, diseñamos consultas SQL avanzadas. Por ejemplo, en esta consulta de correlación multivariable, cruzamos los hechos de contagio con la capacidad hospitalaria y el clima.
* También empleamos funciones de ventana como `LAG` para contrastar históricamente cómo un incremento de lluvias acumuladas en un mes predice con precisión matemática la tasa de contagios del mes subsiguiente a escala cantonal."

---

### 3. Entregable 5: Dashboard Interactivo y Demostración (5:00 - 7:00)

#### [5:00 - 6:00] Recorrido Funcional del Tablero (Gino)
*(Visual en pantalla: Interfaz web activa, navegando en la pestaña 'Visión General' y 'Patologías' del Sidebar)*

* **Gino:** "Pasando a la solución analítica final, aquí observan el frontend desplegado en Angular, conectado asíncronamente a nuestra API en Node.js. 
* El diseño cuenta con un Sidebar fijo que distribuye la experiencia en secciones reactivas. En la *Visión General*, visualizamos de inmediato los 5 KPIs estratégicos: Tasa de Incidencia, Riesgo Climático, Disponibilidad de Insumos, Ocupación Hospitalaria y Tiempos de Espera Asistenciales.
* Si navegamos a la pestaña de *Patologías*, el sistema renderiza un gráfico correlacional de barras dinámico y una tabla detallada con el catálogo CIE-10, permitiendo al analista interactuar y filtrar por provincia o cantón de forma instantánea."

#### [6:00 - 7:00] Análisis Etiológico, Alertas y Cierre (Said)
*(Visual en pantalla: Pestaña 'Análisis Etiológico' mostrando el gráfico de rosca y pestaña 'Alertas Críticas' mostrando tarjetas rojas)*

* **Said:** "En la pestaña de *Análisis Etiológico*, integramos este gráfico de rosca interactivo de Chart.js que divide en tiempo real los brotes según su origen biológico: Virus, Bacterias, Hongos o Parásitos.
* Finalmente, en *Alertas Críticas*, el sistema desactiva la barra de filtros automáticos y expone tarjetas con semáforo rojo que advierten a las autoridades sanitarias cuáles cantones han superado los umbrales críticos de seguridad, como una ocupación hospitalaria mayor al 80% o un desabastecimiento de insumos médicos severo.
* Con esto, demostramos un ecosistema de Inteligencia de Negocios robusto y funcional de extremo a extremo para la salud pública del Ecuador. Muchas gracias."
