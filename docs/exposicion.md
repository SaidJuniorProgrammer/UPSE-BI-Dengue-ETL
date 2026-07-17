# Guía y Libreto de Exposición: Defensa Práctica del Pipeline de BI y Analytics
**Proyecto:** Plataforma de Inteligencia de Negocios para el Monitoreo Epidemiológico Multipatología Nacional en Ecuador  
**Carrera:** Tecnologías de la Información — UPSE  
**Integrantes:** Integrante 1 (Gino) e Integrante 2 (Compañero/a)  
**Duración Estimada:** 6 Minutos (Límite Estricto: 5–7 minutos)  

---

## 📅 Estructura de Tiempos y Roles

| Bloque | Contenido | Responsable | Tiempo Estimado | Herramienta / Recurso en Pantalla |
|---|---|---|---|---|
| **00:00 - 01:15** | Introducción, Definición del Problema y Modelo Dimensional (E1 y E2) | **Gino (Integrante 1)** | 1m 15s | Diapositivas o PDF del [Entregable 1](file:///c:/Users/Gino/Proyectos/UPSE-BI-Dengue-ETL/docs/entregable_1definicion_deLproblema_y_diseno_conceptual.md) y [Entregable 2](file:///c:/Users/Gino/Proyectos/UPSE-BI-Dengue-ETL/docs/entregable_2arquitectura_de_datos_y_modelo_analitico.md). |
| **01:15 - 03:15** | Demostración del Pipeline ETL y Calidad de Datos (E2/E3) | **Integrante 2** | 2m 00s | VS Code (ejecución de scripts Python) y archivos Parquet. |
| **03:15 - 04:30** | Data Warehouse Físico y Consultas SQL (E4) | **Gino (Integrante 1)** | 1m 15s | MySQL Workbench (Tablas de Hechos/Dimensiones y ejecución de queries). |
| **04:30 - 05:45** | Visualización en vivo y Dashboard Interactivo (E5) | **Integrante 2** | 1m 15s | Navegador Web (Dashboard en Angular interactuando en vivo). |
| **05:45 - 06:00** | Cierre y Enlace del Video | **Ambos** | 15s | Cámara activa y diapositiva final de agradecimiento. |

---

## 🎙️ Libreto Detallado por Secciones

### Bloque 1: Introducción y Modelo Dimensional (00:00 - 01:15)
**Expositor: Gino (Integrante 1)**

* **(Cámara activa enfocando a Gino)**
* **Voz de Gino:** *"Saludos cordiales, estimado docente. Mi nombre es Gino y junto con mi compañero/a expondremos el proyecto de Inteligencia de Negocios para el Monitoreo Epidemiológico Multipatología Nacional en Ecuador."*
* **(Gino comparte pantalla mostrando el Modelo Estrella de datos en el PDF/Documento)**
* **Voz de Gino:** *"El problema de negocio identificado es la fragmentación de la información de salud pública en Ecuador, donde enfermedades vectoriales, respiratorias y crónicas se gestionan en silos. Para resolver esto, diseñamos un esquema estrella en MySQL. Como observamos en pantalla, la tabla de hechos central `fact_incidencia` agrupa los casos confirmados (desglosados en zonas urbanas y rurales), stock farmacéutico y tiempos de espera. Esta tabla de hechos está rodeada por 5 dimensiones: Tiempo, Clima, Infraestructura, Enfermedades (con su codificación CIE-10 e identificación etiológica) y Geografía, que cubre los 220+ cantones y las 24 provincias de Ecuador. Doy paso a mi compañero para explicar la ingesta."*

---

### Bloque 2: Pipeline ETL, Calidad y Staging Parquet (01:15 - 03:15)
**Expositor: Integrante 2**

* **(Cámara activa enfocando al Integrante 2, quien comparte pantalla mostrando el código en VS Code)**
* **Voz del Integrante 2:** *"Gracias, Gino. Para poblar este modelo multidimensional, construimos un pipeline de datos estructurado en tres capas utilizando Python y Pandas. Extraemos información mediante Web Scraping autónomo de promedios climáticos del INAMHI, stock de farmacias locales y capacidad de camas del MSP, complementado con el consumo de la API de salud PLISA de la OPS."*
* **(Integrante 2 abre una terminal integrada de VS Code y ejecuta en vivo `python scripts/staging/stg_all_sources.py`)**
* **Voz del Integrante 2:** *"En este momento ejecuto nuestro orquestador central de calidad. Este script toma los archivos en bruto de la zona RAW, aplica nuestro Framework de Calidad que homologa automáticamente la geografía contra el catálogo oficial del INEC, imputa valores nulos de temperatura y tiempos de espera mediante la mediana de su cantón, remueve registros duplicados y escribe los archivos definitivos en la zona Staging."*
* **(Integrante 2 muestra los archivos `.parquet` generados en la carpeta `staging/`)**
* **Voz del Integrante 2:** *"Una innovación técnica clave de nuestro grupo fue la migración de archivos planos CSV a formato Apache Parquet, reduciendo el peso de almacenamiento en un 60% y manteniendo la tipificación nativa de los datos para su posterior carga en caliente."*

---

### Bloque 3: Auditoría del Data Warehouse en Caliente (03:15 - 04:30)
**Expositor: Gino (Integrante 1)**

* **(Gino comparte pantalla mostrando MySQL Workbench en vivo)**
* **Voz de Gino:** *"Ahora auditaremos el estado físico del Data Warehouse. Como se observa en el panel izquierdo de MySQL Workbench, tenemos desplegada la base de datos `upse_dengue_dw` con la tabla de hechos `fact_incidencia` y las cinco dimensiones indexadas por claves foráneas."*
* **(Gino ejecuta en vivo la Query de Correlación Multivariable que une hechos, geografía, clima y dimensiones)**
* **Voz de Gino:** *"Ejecutamos en vivo esta consulta de correlación multivariable. Con un tiempo de respuesta de apenas 12 milisegundos, el motor nos devuelve la relación directa entre el porcentaje de stock de medicamentos, el nivel de saturación hospitalaria y las lluvias acumuladas de cada cantón. Podemos observar que cantones costeros como La Libertad o Chone registraron las tasas de incidencia más altas durante los picos de precipitación invernal del 2024, coincidiendo con caídas críticas del stock farmacéutico. Doy paso a mi compañero para la demostración del Dashboard interactivo."*

---

### Bloque 4: Dashboard y Reporte de Toma de Decisiones (04:30 - 05:45)
**Expositor: Integrante 2**

* **(Integrante 2 comparte pantalla mostrando el navegador web interactuando con el dominio de desarrollo en vivo: https://eldominiodedesarrollo.tech/)**
* **Voz del Integrante 2:** *"Para consumir esta arquitectura analítica de forma estratégica, desplegamos un Frontend SPA reactivo desarrollado en Angular y estilizado con Vanilla CSS. El dashboard se organiza mediante un Sidebar fijo que permite navegar entre las vistas analíticas."*
* **(Integrante 2 hace clic en la pestaña "Visión General" y luego en "Patologías")**
* **Voz del Integrante 2:** *"En la pestaña de Visión General observamos los 5 KPIs estratégicos calculados directamente desde el DW. Al cambiar a la pestaña de Patologías, el usuario puede filtrar dinámicamente por Provincia, Cantón o Patógeno específico. Observen cómo al hacer clic sobre el filtro de provincia 'Guayas', todos los gráficos de series temporales y radar de personal médico se actualizan dinámicamente gracias a la reactividad de Angular y las peticiones agregadas a nuestra API en Node.js."*
* **(Integrante 2 hace clic en la pestaña "Alertas Críticas")**
* **Voz del Integrante 2:** *"Finalmente, en la pestaña de Alertas Críticas, el sistema oculta inteligentemente los filtros que no aplican y visualiza tarjetas con semáforos rojos automáticos para cantones que superan umbrales de saturación hospitalaria mayor al 80% o disponibilidad farmacéutica menor al 60%, sirviendo como un sistema activo de alerta temprana."*

---

### Bloque 5: Cierre de Exposición (05:45 - 06:00)
**Expositores: Ambos integrantes**

* **(Ambos integrantes con cámara activa enfocada en pantalla de cierre con el enlace al video de exposición)**
* **Voz de Gino:** *"Esta plataforma demuestra el valor estratégico de la Inteligencia de Negocios en la salud pública, traduciendo millones de datos crudos en decisiones visuales. El enlace público a este video y los accesos correspondientes se detallan en el PDF formal cargado en Moodle. Muchas gracias por su atención."*

---

## ⚠️ Checklist para la Grabación del Video

1. **Cámara encendida:** Asegurar que las cámaras web de ambos integrantes estén capturando video en todo momento durante el screen-recording.
2. **Acción en vivo:** Nunca usar capturas de pantalla fijas. Todo debe ser demostrado haciendo clic y ejecutando en tiempo real (ejecutar script de Python, ejecutar query SQL en Workbench, usar los filtros del dashboard).
3. **Control del tiempo:** Utilizar un cronómetro de respaldo. El video debe durar estrictamente entre **5:00 y 7:00 minutos**. Si dura menos de 5 o más de 7 minutos, habrá penalización en la calificación.
4. **Verificación de Enlace:** Al subir el video a YouTube, OneDrive o Google Drive, abrir una ventana de incógnito en el navegador para comprobar que el video se reproduce correctamente sin necesidad de iniciar sesión o requerir permisos privados.
