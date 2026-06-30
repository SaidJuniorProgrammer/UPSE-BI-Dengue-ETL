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
    estandarizar_canton, limpiar_numero_regex, estandarizar_fecha,
    eliminar_duplicados, imputar_nulos_mediana
)
from scripts.quality.error_logger import logger
from scripts.quality.metrics_reporter import reporter

RAW_DIR = os.path.join(BASE_DIR, 'raw', 'scraping', 'clima')
STAGING_DIR = os.path.join(BASE_DIR, 'staging')
os.makedirs(STAGING_DIR, exist_ok=True)

def procesar_stg_clima():
    print("[INFO] Procesando Staging Clima (`stg_clima.parquet`)...")
    archivos = glob.glob(os.path.join(RAW_DIR, "*.json"))
    if not archivos:
        print("   [AVISO] No se encontraron archivos JSON en raw/scraping/clima")
        return None
        
    data_list = []
    for arch in archivos:
        try:
            with open(arch, 'r', encoding='utf-8') as f:
                data_list.extend(json.load(f))
        except Exception as e:
            logger.log_error("Clima", f"Error leyendo archivo {arch}: {e}", "Archivo omitido")
            
    df = pd.DataFrame(data_list)
    raw_count = len(df)
    if raw_count == 0:
        return None
        
    # Estandarización de cantón
    df['canton'] = df['canton'].apply(estandarizar_canton)
    nulos_canton = df['canton'].isna().sum()
    if nulos_canton > 0:
        logger.log_error("Clima", f"{nulos_canton} registros con cantón inválido o nulo", "Registros depurados")
        df = df.dropna(subset=['canton'])
        
    # Formato de fecha
    df['fecha'] = df['fecha'].apply(estandarizar_fecha)
    df = df.dropna(subset=['fecha'])
    df['anio'] = pd.to_datetime(df['fecha']).dt.year
    df['semana'] = pd.to_datetime(df['fecha']).dt.isocalendar().week
    
    # Casting con Regex
    corregidos_formato = 0
    if 'stg_lluvia_bruta' in df.columns:
        df['precipitacion_mm'] = df['stg_lluvia_bruta'].apply(limpiar_numero_regex)
        corregidos_formato += len(df)
    else:
        df['precipitacion_mm'] = 0.0
        
    if 'stg_temp_raw' in df.columns:
        df['temp_maxima_c'] = df['stg_temp_raw'].apply(limpiar_numero_regex)
        corregidos_formato += len(df)
    elif 'temp_maxima_c' not in df.columns:
        df['temp_maxima_c'] = 28.0
        
    # Imputación de temperatura por mediana según el cantón
    if df['temp_maxima_c'].isna().sum() > 0:
        logger.log_error("Clima", f"{df['temp_maxima_c'].isna().sum()} temperaturas nulas/atípicas detectadas", "Imputación mediante mediana por cantón")
        df = imputar_nulos_mediana(df, 'temp_maxima_c', 'canton')
        
    # Deduplicación
    count_antes_dup = len(df)
    df = eliminar_duplicados(df, subsets=['canton', 'fecha'])
    dups_eliminados = count_antes_dup - len(df)
    if dups_eliminados > 0:
        logger.log_error("Clima", f"Detectados {dups_eliminados} registros duplicados de clima por cantón y fecha", "Mantenido último registro verificado")

    # Guardar en Parquet
    cols_salida = ['canton', 'fecha', 'anio', 'semana', 'precipitacion_mm', 'temp_maxima_c']
    if 'temp_minima_c' in df.columns:
        cols_salida.append('temp_minima_c')
    if 'humedad_relativa' in df.columns:
        cols_salida.append('humedad_relativa')
        
    df_final = df[cols_salida]
    archivo_salida = os.path.join(STAGING_DIR, 'stg_clima.parquet')
    df_final.to_parquet(archivo_salida, index=False)
    
    stg_count = len(df_final)
    reporter.registrar_fuente(raw_count, stg_count, dups_eliminados, nulos_canton, corregidos_formato)
    print(f"   [SUCCESS] Staging Clima guardado: {archivo_salida} ({stg_count} registros)")
    return archivo_salida

if __name__ == "__main__":
    procesar_stg_clima()
