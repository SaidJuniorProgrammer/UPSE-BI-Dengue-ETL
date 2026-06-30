# Manual de Operación y Automatización del Pipeline ETL

Esta guía describe cómo operar, verificar y programar la ejecución periódica del pipeline ETL modular.

## 1. Prerrequisitos e Instalación

Asegúrese de ejecutar en una terminal con Python 3.9+ e instalar las dependencias exactas:

```powershell
pip install -r requirements.txt
```

---

## 2. Ejecución Manual Paso a Paso

El pipeline puede ejecutarse en dos etapas claramente diferenciadas o invocarse por componentes individuales.

### Paso 1: Extracción de Fuentes (Zona RAW)
Para recolectar datos climáticos, epidemiológicos, de farmacias, noticias y APIs:

```powershell
python scripts/extraction/extract_clima.py
python scripts/extraction/extract_noticias.py
python scripts/extraction/extract_farmacias.py
python scripts/extraction/extract_infraestructura.py
python scripts/extraction/extract_api_health.py
```
*Los datos recolectados se depositarán como archivos JSON en las carpetas `raw/scraping/` y `raw/api/`.*

### Paso 2: Transformación Staging y Auditoría (Zona STAGING)
Ejecute el orquestador maestro para depurar anomalías, estandarizar cantones, imputar nulos por mediana y exportar a **Parquet**:

```powershell
python scripts/staging/stg_all_sources.py
```

Al finalizar, se generarán en la carpeta `staging/`:
1. Los 6 archivos `.parquet` listos para ingesta multidimensional.
2. El registro auditable de correcciones en `error_log.csv`.
3. El reporte general con porcentajes de completitud en `reporte_calidad_YYYY-MM-DD.json`.

---

## 3. Revisión de Auditoría y Logs

Consulte la carpeta `logs/quality.log` para revisar la traza histórica detallada de cada registro depurado o imputado.
