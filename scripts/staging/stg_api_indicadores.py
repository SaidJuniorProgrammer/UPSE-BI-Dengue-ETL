import os
import glob
import json
import pandas as pd
from datetime import datetime

import sys
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from scripts.quality.error_logger import logger
from scripts.quality.metrics_reporter import reporter

RAW_DIR = os.path.join(BASE_DIR, 'raw', 'api')
STAGING_DIR = os.path.join(BASE_DIR, 'staging')

def procesar_stg_api_indicadores():
    print("[INFO] Procesando Staging Indicadores API (`stg_api_indicadores.parquet`)...")
    archivos = glob.glob(os.path.join(RAW_DIR, "*.json"))
    if not archivos:
        print("   [AVISO] No se encontraron archivos JSON en raw/api")
        return None
        
    wb_list = []
    ops_list = []
    
    for arch in archivos:
        try:
            with open(arch, 'r', encoding='utf-8') as f:
                data = json.load(f)
                nombre_arch = os.path.basename(arch).lower()
                if "worldbank" in nombre_arch:
                    wb_list.extend(data) if isinstance(data, list) else wb_list.append(data)
                elif "ops" in nombre_arch or "plisa" in nombre_arch or "dengue" in nombre_arch:
                    ops_list.extend(data) if isinstance(data, list) else ops_list.append(data)
        except Exception as e:
            logger.log_error("API Indicadores", f"Error leyendo {arch}: {e}", "Omitido")
            
    df_wb = pd.DataFrame(wb_list) if wb_list else pd.DataFrame()
    df_ops = pd.DataFrame(ops_list) if ops_list else pd.DataFrame()
    
    raw_count = len(df_wb) + len(df_ops)
    if raw_count == 0:
        return None
        
    if not df_wb.empty:
        df_wb = df_wb.dropna(subset=['valor'])
        for col in df_wb.columns:
            if df_wb[col].dtype == 'object':
                df_wb[col] = df_wb[col].astype(str)
                
    if not df_ops.empty:
        df_ops = df_ops.drop_duplicates()
        for col in df_ops.columns:
            if df_ops[col].dtype == 'object':
                df_ops[col] = df_ops[col].astype(str)
        
    stg_count = len(df_wb) + len(df_ops)
    
    archivo_salida = os.path.join(STAGING_DIR, 'stg_api_indicadores.parquet')
    if not df_ops.empty:
        df_ops.to_parquet(archivo_salida, index=False)
    elif not df_wb.empty:
        df_wb.to_parquet(archivo_salida, index=False)
        
    reporter.registrar_fuente(raw_count, stg_count, 0, 0, 0)
    print(f"   [SUCCESS] Staging API Indicadores guardado: {archivo_salida} ({stg_count} registros)")
    return archivo_salida

if __name__ == "__main__":
    procesar_stg_api_indicadores()
