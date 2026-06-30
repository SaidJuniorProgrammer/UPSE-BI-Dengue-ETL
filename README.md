# 📊 Plataforma de Inteligencia de Negocios: Gestión de Brotes de Dengue

**Universidad Estatal Península de Santa Elena (UPSE)** **Carrera:** Ingeniería de Software  
**Materia:** Inteligencia de Negocios  
**Período:** 2026-1

## 👥 Equipo de Desarrollo
* Gino Bermudes
* Said Pinto

---

## 📝 Descripción del Proyecto
Este repositorio contiene el pipeline de extracción, transformación y carga (ETL) desarrollado para el **Entregable 3**. El objetivo central es recolectar, limpiar e integrar datos provenientes de 7 fuentes heterogéneas relacionadas con factores climáticos, epidemiológicos y de infraestructura de salud en la provincia de Santa Elena, preparando la información para su posterior ingesta en un Data Warehouse (Modelo Estrella).

## 🗂️ Arquitectura de Carpetas

La estructura del proyecto garantiza la inmutabilidad de los datos de origen (Zona Raw) y centraliza el procesamiento automatizado hacia la Zona Staging.

    PROYECTO_BI_DENGUE/
    │
    ├── .gitignore
    ├── README.md
    │
    ├── raw/                      # Zona de inmutabilidad (Datos crudos)
    │   ├── api/                  # JSON de Open-Meteo (Clima)
    │   ├── archivos/             # Dataset oficial CSV (Ministerio de Salud)
    │   ├── fuente_propia/        # Excel de encuestas ciudadanas anónimas
    │   └── scraping/             # JSONs de CDC, OMS, OPS y Edición Médica
    │
    ├── scripts/                  # Pipeline automatizado en Python
    │   ├── 1_extraer_api.py      # Consumo de API REST (Open-Meteo)
    │   ├── 2_scraping_web.py     # Extracción múltiple con BeautifulSoup
    │   └── 3_staging_etl.py      # Limpieza, deduplicación y calidad con Pandas
    │
    └── staging/                  # Datos limpios y listos para el Data Warehouse
        ├── error_log.csv         # Registro auditable de excepciones
        ├── stg_casos_...csv      # Hechos y dimensiones limpios
        └── stg_encuestas_...csv

## ⚙️ Tecnologías Utilizadas
* **Lenguaje:** Python 3.x
* **Extracción (Scraping/API):** `requests`, `beautifulsoup4`, `json`
* **Procesamiento de Datos (Staging):** `pandas`, `openpyxl`
* **Control de Versiones:** Git / GitHub

## 🚀 Instrucciones de Ejecución

Para replicar el pipeline de extracción y calidad de datos de manera local, sigue estos pasos:

### 1. Instalación de Dependencias
Abre la terminal en la raíz del proyecto e instala las librerías necesarias:
    
    pip install pandas requests beautifulsoup4 openpyxl

### 2. Ejecución del Pipeline (Scripts)
Los scripts deben ejecutarse en orden para garantizar el flujo correcto de los datos. Desde la terminal en la carpeta raíz:

**Paso A: Extracción de la API Climática**
    
    python scripts/1_extraer_api.py

*Resultado:* Descarga el clima histórico en `raw/api/`.

**Paso B: Web Scraping de Fuentes Oficiales**
    
    python scripts/2_scraping_web.py

*Resultado:* Extrae datos médicos y epidemiológicos guardándolos en `raw/scraping/`.

**Paso C: Integración y Limpieza (ETL)**
    
    python scripts/3_staging_etl.py

*Resultado:* Lee las 7 fuentes de la zona `raw/`, aplica reglas de estandarización, elimina valores nulos/duplicados y deposita los CSV finales limpios en la carpeta `staging/`, junto con el reporte de calidad `error_log.csv`.

---
*Desarrollado para la toma de decisiones proactivas en salud pública mediante la integración de datos.*
