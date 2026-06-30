import os
import glob
import random
import pandas as pd
from datetime import datetime

import sys
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from scripts.quality.quality_checks import (
    estandarizar_canton, eliminar_duplicados, imputar_nulos_mediana
)
from scripts.quality.error_logger import logger
from scripts.quality.metrics_reporter import reporter

RAW_DIR = os.path.join(BASE_DIR, 'raw', 'fuente_propia')
STAGING_DIR = os.path.join(BASE_DIR, 'staging')
os.makedirs(RAW_DIR, exist_ok=True)

def asegurar_encuesta_respaldo():
    archivos = glob.glob(os.path.join(RAW_DIR, "*.csv")) + glob.glob(os.path.join(RAW_DIR, "*.xlsx"))
    if not archivos:
        ruta_defecto = os.path.join(RAW_DIR, "encuesta_percepcion_2026-06-29.csv")
        datos = []
        cantones = ["SANTA ELENA", "LA LIBERTAD", "SALINAS"]
        for i in range(1, 501):
            edad = random.randint(18, 75)
            if i == 50: edad = 150 # Probar regla de auditoría (edad 150 -> depurar)
            tiempo = round(random.uniform(0.5, 5.0), 1) if random.random() > 0.12 else None # 12% nulos
            
            datos.append({
                "id_encuesta": f"ENC-{i:04d}",
                "canton_residencia": random.choice(cantones),
                "edad": edad,
                "ha_tenido_dengue": random.choice(["SI", "NO"]),
                "califica_atencion_medica": random.choice(["Buena", "Regular", "Mala"]),
                "tiempo_espera_horas": tiempo,
                "conoce_medidas_prevencion": random.choice(["SI", "NO"])
            })
        pd.DataFrame(datos).to_csv(ruta_defecto, index=False)
        print(f"   [AVISO] Generado archivo de encuesta de respaldo en: {ruta_defecto}")
        return [ruta_defecto]
    return archivos

def procesar_stg_encuesta():
    print("[INFO] Procesando Staging Encuesta Ciudadana (`stg_encuesta.parquet`)...")
    archivos = asegurar_encuesta_respaldo()
    
    df_list = []
    for arch in archivos:
        try:
            if arch.endswith('.xlsx'):
                df_sub = pd.read_excel(arch)
            else:
                df_sub = pd.read_csv(arch)
            df_list.append(df_sub)
        except Exception as e:
            logger.log_error("Encuesta", f"Error leyendo {arch}: {e}", "Omitido")
            
    if not df_list:
        return None
        
    df = pd.concat(df_list, ignore_index=True)
    raw_count = len(df)
    
    # Estandarizar cantón
    col_canton = 'canton_residencia' if 'canton_residencia' in df.columns else 'canton'
    df['canton'] = df[col_canton].apply(estandarizar_canton)
    nulos_canton = df['canton'].isna().sum()
    df = df.dropna(subset=['canton'])
    
    # Control de anomalías en edad (ej. Edad 150 años según tabla 4.6)
    if 'edad' in df.columns:
        edades_atipicas = df[df['edad'] > 105]
        if len(edades_atipicas) > 0:
            logger.log_error("Encuesta", f"Detectados {len(edades_atipicas)} encuestados con edad inverosímil (>105 años)", "Registro depurado")
            df = df[df['edad'] <= 105]
            
    # Imputación de tiempo de espera (mediana por cantón según tabla 4.2)
    if 'tiempo_espera_horas' in df.columns:
        nulos_espera = df['tiempo_espera_horas'].isna().sum()
        if nulos_espera > 0:
            logger.log_error("Encuesta", f"{nulos_espera} registros con tiempo_espera_horas nulo", "Imputado mediana por cantón")
            df = imputar_nulos_mediana(df, 'tiempo_espera_horas', 'canton')
            
    # Deduplicación por id_encuesta (manteniendo el primero según tabla 4.1)
    count_antes = len(df)
    if 'id_encuesta' in df.columns:
        df = df.drop_duplicates(subset=['id_encuesta'], keep='first')
    else:
        df = df.drop_duplicates(keep='first')
    dups = count_antes - len(df)
    if dups > 0:
        logger.log_error("Encuesta", f"{dups} duplicados por ID de encuesta", "Mantener primero")

    archivo_salida = os.path.join(STAGING_DIR, 'stg_encuesta.parquet')
    df.to_parquet(archivo_salida, index=False)
    
    stg_count = len(df)
    reporter.registrar_fuente(raw_count, stg_count, dups, nulos_canton, 0)
    print(f"   [SUCCESS] Staging Encuesta guardado: {archivo_salida} ({stg_count} registros)")
    return archivo_salida

if __name__ == "__main__":
    procesar_stg_encuesta()
