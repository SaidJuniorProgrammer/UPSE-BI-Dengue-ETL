# Plataforma de Inteligencia de Negocios: Gestión de Brotes de Dengue

**Universidad Estatal Península de Santa Elena (UPSE)**  
**Carrera:** Ingeniería de Software  
**Materia:** Inteligencia de Negocios  
**Período:** 2026-1

## Equipo de Desarrollo
* Gino Bermudes
* Said Pinto

---

## Descripción del Proyecto
Este repositorio contiene el pipeline de extracción, transformación y carga (ETL) empresarial desarrollado para la recolección, limpieza, estandarización e integración de datos provenientes de 7 fuentes heterogéneas relacionadas con factores climáticos, epidemiológicos, farmacéuticos y de infraestructura hospitalaria en la provincia de Santa Elena. Los datos limpios se exportan en formato **Parquet (`.parquet`)** hacia la zona Staging para su ingesta al Data Warehouse (Modelo Estrella).

## Arquitectura de Carpetas Modular

```text
PROYECTO_BI_DENGUE/
├── requirements.txt
├── README.md
│
├── raw/                      # Zona de inmutabilidad (Datos crudos)
│   ├── api/                  # JSONs de World Bank & OPS PLISA
│   ├── archivos/             # Gacetas epidemiológicas MSP (CSV)
│   ├── fuente_propia/        # Encuestas ciudadanas de percepción
│   └── scraping/             # Extractores web especializados
│       ├── clima/
│       ├── farmacias/
│       ├── infraestructura/
│       └── noticias/
│
├── scripts/                  # Framework ETL Modular
│   ├── extraction/           # Extractores por dominio (Clima, Farmacias, Hospitales, Noticias, APIs)
│   ├── quality/              # Framework de Calidad (Estandarización INEC, Regex, Logging, Métricas)
│   └── staging/              # Transformadores hacia Parquet y orquestador maestro
│
├── staging/                  # Zona Staging analítica
│   ├── stg_*.parquet         # Dimensiones y hechos limpios
│   ├── error_log.csv         # Registro auditable de excepciones
│   └── reporte_calidad_*.json# Métricas globales de calidad
│
├── logs/                     # Registro de trazas de ejecución
└── docs/                     # Documentación técnica (Arquitectura, Diccionario, Manual)
```

## Tecnologías Utilizadas
* **Lenguaje:** Python 3.9+
* **Extracción (Scraping/API):** `requests`, `beautifulsoup4`, `json`
* **Procesamiento y Almacenamiento Analítico:** `pandas`, `pyarrow`, `numpy`

## Instrucciones de Ejecución

### 1. Instalación de Dependencias
```powershell
pip install -r requirements.txt
```

### 2. Ejecución de Extractores (Zona RAW)
Recolecta información climática, hospitalaria, mediática y epidemiológica:
```powershell
python scripts/extraction/extract_clima.py
python scripts/extraction/extract_noticias.py
python scripts/extraction/extract_farmacias.py
python scripts/extraction/extract_infraestructura.py
python scripts/extraction/extract_api_health.py
```

### 3. Ejecución del Orquestador Staging y Calidad (Zona STAGING)
Aplica limpieza avanzada, homologación al catálogo INEC de cantones, deduplicación y exportación a Parquet:
```powershell
python scripts/staging/stg_all_sources.py
```
