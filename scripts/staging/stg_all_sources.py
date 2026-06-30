import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from scripts.staging.stg_clima import procesar_stg_clima
from scripts.staging.stg_farmacias import procesar_stg_farmacias
from scripts.staging.stg_infraestructura import procesar_stg_infraestructura
from scripts.staging.stg_casos_dengue import procesar_stg_casos_dengue
from scripts.staging.stg_encuesta import procesar_stg_encuesta
from scripts.staging.stg_api_indicadores import procesar_stg_api_indicadores
from scripts.quality.error_logger import logger
from scripts.quality.metrics_reporter import reporter

def ejecutar_staging_completo():
    print("=======================================================================")
    print("[INICIO] PIPELINE DE STAGING Y CALIDAD (7 FUENTES -> PARQUET)")
    print("=======================================================================")
    
    reporter.reset()
    
    procesar_stg_clima()
    procesar_stg_farmacias()
    procesar_stg_infraestructura()
    procesar_stg_casos_dengue()
    procesar_stg_encuesta()
    procesar_stg_api_indicadores()
    
    # Guardar logs de errores auditable
    csv_errores = logger.guardar_errores_csv()
    print(f"\n[LOG] Log de errores y auditoria de calidad guardado en: {csv_errores}")
    
    # Generar reporte de métricas JSON
    print("\n-----------------------------------------------------------------------")
    archivo_reporte = reporter.generar_reporte()
    print("=======================================================================")
    print("[EXITO] PIPELINE STAGING FINALIZADO CON EXITO")
    print("=======================================================================")
    return archivo_reporte

if __name__ == "__main__":
    ejecutar_staging_completo()
