import os
import glob
import json
import pandas as pd
from datetime import datetime

import sys
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from scripts.quality.quality_checks import (
    estandarizar_canton, estandarizar_fecha, eliminar_duplicados, limpiar_numero_regex
)
from scripts.quality.error_logger import logger
from scripts.quality.metrics_reporter import reporter

RAW_DIR = os.path.join(BASE_DIR, 'raw', 'scraping', 'infraestructura')
STAGING_DIR = os.path.join(BASE_DIR, 'staging')

def procesar_stg_infraestructura():
    print("[INFO] Procesando Staging Infraestructura (`stg_infraestructura.parquet`)...")
    archivos = glob.glob(os.path.join(RAW_DIR, "*.json"))
    if not archivos:
        print("   [AVISO] No se encontraron archivos JSON en raw/scraping/infraestructura")
        return None
        
    data_list = []
    for arch in archivos:
        try:
            with open(arch, 'r', encoding='utf-8') as f:
                data_list.extend(json.load(f))
        except Exception as e:
            logger.log_error("Infraestructura", f"Error leyendo {arch}: {e}", "Archivo omitido")
            
    df = pd.DataFrame(data_list)
    raw_count = len(df)
    if raw_count == 0:
        return None
        
    df['canton'] = df['canton'].apply(estandarizar_canton)
    nulos_canton = df['canton'].isna().sum()
    df = df.dropna(subset=['canton'])
    
    df['fecha_corte'] = df['fecha_corte'].apply(estandarizar_fecha)
    df = df.dropna(subset=['fecha_corte'])
    
    if 'tiempo_espera_horas' in df.columns:
        df['tiempo_espera_horas'] = df['tiempo_espera_horas'].apply(limpiar_numero_regex)
        
    # Deduplicación por nombre_centro y fecha_corte
    count_antes = len(df)
    df = eliminar_duplicados(df, subsets=['nombre_centro', 'fecha_corte'])
    dups = count_antes - len(df)
    if dups > 0:
        logger.log_error("Infraestructura", f"{dups} registros hospitalarios duplicados", "Mantenido registro más reciente")

    archivo_salida = os.path.join(STAGING_DIR, 'stg_infraestructura.parquet')
    df.to_parquet(archivo_salida, index=False)
    
    stg_count = len(df)
    reporter.registrar_fuente(raw_count, stg_count, dups, nulos_canton, 0)
    print(f"   [SUCCESS] Staging Infraestructura guardado: {archivo_salida} ({stg_count} registros)")
    return archivo_salida

if __name__ == "__main__":
    procesar_stg_infraestructura()
