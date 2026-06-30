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
    eliminar_duplicados, imputar_nulos_mediana, imputar_nulos_constante
)
from scripts.quality.error_logger import logger
from scripts.quality.metrics_reporter import reporter

RAW_DIR = os.path.join(BASE_DIR, 'raw', 'scraping', 'farmacias')
STAGING_DIR = os.path.join(BASE_DIR, 'staging')

def procesar_stg_farmacias():
    print("[INFO] Procesando Staging Farmacias (`stg_farmacias.parquet`)...")
    archivos = glob.glob(os.path.join(RAW_DIR, "*.json"))
    if not archivos:
        print("   [AVISO] No se encontraron archivos JSON en raw/scraping/farmacias")
        return None
        
    data_list = []
    for arch in archivos:
        try:
            with open(arch, 'r', encoding='utf-8') as f:
                data_list.extend(json.load(f))
        except Exception as e:
            logger.log_error("Farmacias", f"Error leyendo {arch}: {e}", "Archivo omitido")
            
    df = pd.DataFrame(data_list)
    raw_count = len(df)
    if raw_count == 0:
        return None
        
    df['canton'] = df['canton'].apply(estandarizar_canton)
    nulos_canton = df['canton'].isna().sum()
    df = df.dropna(subset=['canton'])
    
    # Limpieza de precio_usd con Regex ("$5,99" -> 5.99)
    corregidos_formato = 0
    if 'precio_usd' in df.columns:
        df['precio_usd'] = df['precio_usd'].apply(limpiar_numero_regex)
        corregidos_formato += len(df)
        if df['precio_usd'].isna().sum() > 0:
            logger.log_error("Farmacias", f"{df['precio_usd'].isna().sum()} medicamentos con precio nulo/inválido", "Imputar mediana por medicamento")
            df = imputar_nulos_mediana(df, 'precio_usd', 'medicamento')
            
    # Limpieza e imputación de cantidad_unidades (imputar 0 si es nulo según tabla 4.2)
    if 'cantidad_unidades' in df.columns:
        nulos_unid = df['cantidad_unidades'].isna().sum()
        if nulos_unid > 0:
            logger.log_error("Farmacias", f"{nulos_unid} registros con cantidad_unidades nula", "Imputar 0 unidades")
            df = imputar_nulos_constante(df, 'cantidad_unidades', 0)
    else:
        df['cantidad_unidades'] = 0
        
    df['fecha_extraccion'] = df['fecha_extraccion'].apply(estandarizar_fecha)
    df = df.dropna(subset=['fecha_extraccion'])
    
    # Deduplicación según tabla 4.1: canton + cadena + medicamento + fecha/semana
    count_antes_dup = len(df)
    df = eliminar_duplicados(df, subsets=['canton', 'cadena', 'medicamento', 'fecha_extraccion'])
    dups_eliminados = count_antes_dup - len(df)
    if dups_eliminados > 0:
        logger.log_error("Farmacias", f"{dups_eliminados} registros duplicados eliminados", "Mantener registro más completo")

    archivo_salida = os.path.join(STAGING_DIR, 'stg_farmacias.parquet')
    df.to_parquet(archivo_salida, index=False)
    
    stg_count = len(df)
    reporter.registrar_fuente(raw_count, stg_count, dups_eliminados, nulos_canton, corregidos_formato)
    print(f"   [SUCCESS] Staging Farmacias guardado: {archivo_salida} ({stg_count} registros)")
    return archivo_salida

if __name__ == "__main__":
    procesar_stg_farmacias()
