import os
import sys
import json
import glob
import pandas as pd
from datetime import datetime, timedelta

# Add project root to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from scripts.dw.db_connection import get_connection

STAGING_DIR = os.path.join(BASE_DIR, 'staging')
RAW_DIR = os.path.join(BASE_DIR, 'raw')

def run_sql_file(conn, sql_file_path):
    print(f"[SQL] Ejecutando script de esquema: {sql_file_path}")
    with open(sql_file_path, 'r', encoding='utf-8') as f:
        statements = f.read().split(';')
        
    with conn.cursor() as cursor:
        for stmt in statements:
            stmt = stmt.strip()
            if stmt:
                cursor.execute(stmt)
    conn.commit()

def generate_dim_tiempo(conn):
    print("[ETL] Generando Dim_Tiempo (2022 a 2026)...")
    start_date = datetime(2022, 1, 1)
    end_date = datetime(2026, 12, 31)
    delta = timedelta(days=1)
    
    current_date = start_date
    records = []
    
    # Months translation to Spanish
    months_es = {
        1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril",
        5: "Mayo", 6: "Junio", 7: "Julio", 8: "Agosto",
        9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre"
    }
    
    while current_date <= end_date:
        id_tiempo = int(current_date.strftime("%Y%m%d"))
        fecha_str = current_date.strftime("%Y-%m-%d")
        anio = current_date.year
        semana = int(current_date.isocalendar()[1])
        mes = current_date.month
        nombre_mes = months_es[mes]
        
        records.append((id_tiempo, fecha_str, anio, semana, mes, nombre_mes))
        current_date += delta
        
    # Batch insert
    sql = """
        INSERT INTO Dim_Tiempo (id_tiempo, fecha, anio, semana_epidem, mes, nombre_mes)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE anio=VALUES(anio)
    """
    with conn.cursor() as cursor:
        cursor.executemany(sql, records)
    conn.commit()
    print(f"   [SUCCESS] Dim_Tiempo poblada con {len(records)} registros.")

def load_dim_geografia(conn):
    print("[ETL] Poblando Dim_Geografia...")
    cantones = [
        ("SANTA ELENA", "SANTA ELENA", 160000),
        ("LA LIBERTAD", "SANTA ELENA", 110000),
        ("SALINAS", "SANTA ELENA", 90000)
    ]
    sql = """
        INSERT INTO Dim_Geografia (canton, provincia, poblacion)
        VALUES (%s, %s, %s)
        ON DUPLICATE KEY UPDATE poblacion=VALUES(poblacion)
    """
    with conn.cursor() as cursor:
        cursor.executemany(sql, cantones)
    conn.commit()
    print("   [SUCCESS] Dim_Geografia poblada.")

def load_clima_y_infraestructura(conn):
    print("[ETL] Cargando Dim_Clima y Dim_Infraestructura desde Parquet...")
    
    # 1. Clima
    clima_path = os.path.join(STAGING_DIR, 'stg_clima.parquet')
    if os.path.exists(clima_path):
        df_clima = pd.read_parquet(clima_path)
        # Average clima daily records weekly
        df_clima_weekly = df_clima.groupby(['canton', 'semana', 'anio']).agg({
            'precipitacion_mm': 'mean',
            'temp_maxima_c': 'mean',
            'temp_minima_c': 'mean',
            'humedad_relativa': 'mean'
        }).reset_index()
        
        clima_records = []
        for _, row in df_clima_weekly.iterrows():
            clima_records.append((
                row['canton'], int(row['semana']), int(row['anio']),
                float(row['precipitacion_mm']), float(row['temp_maxima_c']),
                float(row['temp_minima_c']), float(row['humedad_relativa'])
            ))
            
        sql_clima = """
            INSERT INTO Dim_Clima (canton, semana_epidem, anio, precipitacion_mm, temp_maxima_c, temp_minima_c, humedad_relativa)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        with conn.cursor() as cursor:
            cursor.executemany(sql_clima, clima_records)
        conn.commit()
        print(f"   [SUCCESS] Dim_Clima poblada con {len(clima_records)} registros semanales.")
    else:
        print("   [WARNING] No se encontro stg_clima.parquet")

    # 2. Infraestructura
    infra_path = os.path.join(STAGING_DIR, 'stg_infraestructura.parquet')
    if os.path.exists(infra_path):
        df_infra = pd.read_parquet(infra_path)
        df_infra['fecha_dt'] = pd.to_datetime(df_infra['fecha_corte'])
        df_infra['semana'] = df_infra['fecha_dt'].dt.isocalendar().week
        df_infra['anio'] = df_infra['fecha_dt'].dt.year
        
        # Group by canton, week, year (in our case it's 2026-06-30 -> week 27, 2026)
        df_infra_weekly = df_infra.groupby(['canton', 'semana', 'anio']).agg({
            'camas_totales': 'mean',
            'camas_ocupadas': 'mean',
            'pacientes_dengue': 'mean',
            'medicos_disponibles': 'mean',
            'nivel_saturacion': lambda x: x.iloc[0] # Pick first
        }).reset_index()
        
        infra_records = []
        for _, row in df_infra_weekly.iterrows():
            infra_records.append((
                row['canton'], int(row['semana']), int(row['anio']),
                row['nivel_saturacion'], int(row['camas_totales']),
                int(row['camas_ocupadas']), int(row['medicos_disponibles']),
                int(row['pacientes_dengue'])
            ))
            
        sql_infra = """
            INSERT INTO Dim_Infraestructura (canton, semana_epidem, anio, nivel_saturacion, camas_totales, camas_ocupadas, medicos_disponibles, pacientes_dengue)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        with conn.cursor() as cursor:
            cursor.executemany(sql_infra, infra_records)
        conn.commit()
        print(f"   [SUCCESS] Dim_Infraestructura poblada con {len(infra_records)} registros.")
    else:
        print("   [WARNING] No se encontro stg_infraestructura.parquet")

def build_fact_incidencia(conn):
    print("[ETL] Construyendo Fact_Incidencia...")
    
    # Read staging files
    df_casos = pd.read_parquet(os.path.join(STAGING_DIR, 'stg_casos_dengue.parquet'))
    df_clima = pd.read_parquet(os.path.join(STAGING_DIR, 'stg_clima.parquet'))
    df_farmacias = pd.read_parquet(os.path.join(STAGING_DIR, 'stg_farmacias.parquet'))
    df_encuesta = pd.read_parquet(os.path.join(STAGING_DIR, 'stg_encuesta.parquet'))
    
    # Process dates in farmacias and encuestas to get week and year
    df_farmacias['fecha_dt'] = pd.to_datetime(df_farmacias['fecha_extraccion'])
    df_farmacias['semana'] = df_farmacias['fecha_dt'].dt.isocalendar().week
    df_farmacias['anio'] = df_farmacias['fecha_dt'].dt.year
    
    df_encuesta['fecha_dt'] = pd.to_datetime(df_encuesta['fecha'])
    df_encuesta['semana'] = df_encuesta['fecha_dt'].dt.isocalendar().week
    df_encuesta['anio'] = df_encuesta['fecha_dt'].dt.year

    # 1. Compute stock percentage for farmacias by canton/week/year
    # Convert 'SI'/'NO' to 1/0
    df_farmacias['has_stock'] = df_farmacias['stock_disponible'].apply(lambda x: 100.0 if str(x).upper() == 'SI' else 0.0)
    df_farm_weekly = df_farmacias.groupby(['canton', 'semana', 'anio'])['has_stock'].mean().reset_index()
    df_farm_weekly.rename(columns={'has_stock': 'pct_stock_meds'}, inplace=True)
    
    # 2. Compute average wait time from surveys
    df_enc_weekly = df_encuesta.groupby(['canton', 'semana', 'anio'])['tiempo_espera_horas'].mean().reset_index()
    df_enc_weekly.rename(columns={'tiempo_espera_horas': 'espera_promedio_h'}, inplace=True)
    
    # 3. Load media alerts (Noticias)
    media_alerts = {} # (canton, week, year) -> count
    noticias_files = glob.glob(os.path.join(RAW_DIR, 'scraping', 'noticias', 'noticias_*.json'))
    for f_path in noticias_files:
        with open(f_path, 'r', encoding='utf-8') as f:
            noticias = json.load(f)
            for n in noticias:
                cant = n.get('canton_mencionado', '').upper()
                fecha_str = n.get('fecha_publicacion', '')
                if cant and fecha_str:
                    dt = pd.to_datetime(fecha_str)
                    sem = int(dt.isocalendar()[1])
                    yr = int(dt.year)
                    key = (cant, sem, yr)
                    media_alerts[key] = media_alerts.get(key, 0) + 1
                    
    # Combine all canton-year-week keys
    keys = set()
    for _, row in df_casos.iterrows():
        keys.add((row['canton'], int(row['semana_epidemiologica']), int(row['anio'])))
    for _, row in df_clima.iterrows():
        keys.add((row['canton'], int(row['semana']), int(row['anio'])))
    for _, row in df_farm_weekly.iterrows():
        keys.add((row['canton'], int(row['semana']), int(row['anio'])))
    for _, row in df_enc_weekly.iterrows():
        keys.add((row['canton'], int(row['semana']), int(row['anio'])))
    for k in media_alerts.keys():
        keys.add(k)
        
    print(f"   [INFO] Detectadas {len(keys)} combinaciones unicas de canton + semana + anio.")
    
    # Get georef mappings
    with conn.cursor() as cursor:
        cursor.execute("SELECT id_geografia, canton FROM Dim_Geografia")
        geo_map = {row['canton']: row['id_geografia'] for row in cursor.fetchall()}
        
        cursor.execute("SELECT id_clima, canton, semana_epidem, anio FROM Dim_Clima")
        clima_map = {(row['canton'], row['semana_epidem'], row['anio']): row['id_clima'] for row in cursor.fetchall()}
        
        cursor.execute("SELECT id_infraestructura, canton, semana_epidem, anio FROM Dim_Infraestructura")
        infra_map = {(row['canton'], row['semana_epidem'], row['anio']): row['id_infraestructura'] for row in cursor.fetchall()}
        
        # We need a quick way to find time keys. Dim_Tiempo is daily, so let's match (semana_epidem, anio) to the first date's id_tiempo of that week
        cursor.execute("SELECT MIN(id_tiempo) as min_t, semana_epidem, anio FROM Dim_Tiempo GROUP BY semana_epidem, anio")
        time_map = {(row['semana_epidem'], row['anio']): row['min_t'] for row in cursor.fetchall()}

    fact_records = []
    
    for (cant, sem, yr) in keys:
        if cant not in geo_map:
            continue
            
        id_geo = geo_map[cant]
        id_tiempo = time_map.get((sem, yr))
        if not id_tiempo:
            # Fallback to general week start if not in Dim_Tiempo date range
            continue
            
        # Get/Create weather mapping for this week (fallbacks if not exists)
        id_clima = clima_map.get((cant, sem, yr))
        if not id_clima:
            # Insert a default clima record for consistency
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO Dim_Clima (canton, semana_epidem, anio, precipitacion_mm, temp_maxima_c, temp_minima_c, humedad_relativa)
                    VALUES (%s, %s, %s, 0.00, 26.00, 20.00, 75.00)
                """, (cant, sem, yr))
                id_clima = cursor.lastrowid
                clima_map[(cant, sem, yr)] = id_clima
                
        # Get/Create infrastructure mapping for this week (fallbacks if not exists)
        id_infra = infra_map.get((cant, sem, yr))
        if not id_infra:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO Dim_Infraestructura (canton, semana_epidem, anio, nivel_saturacion, camas_totales, camas_ocupadas, medicos_disponibles, pacientes_dengue)
                    VALUES (%s, %s, %s, 'BAJA', 15, 5, 8, 0)
                """, (cant, sem, yr))
                id_infra = cursor.lastrowid
                infra_map[(cant, sem, yr)] = id_infra
                
        # Aggregate metrics
        # 1. Casos
        casos_sub = df_casos[(df_casos['canton'] == cant) & (df_casos['semana_epidemiologica'] == sem) & (df_casos['anio'] == yr)]
        casos_val = int(casos_sub['casos_confirmados'].sum()) if not casos_sub.empty else 0
        
        # 2. Farmacias stock
        farm_sub = df_farm_weekly[(df_farm_weekly['canton'] == cant) & (df_farm_weekly['semana'] == sem) & (df_farm_weekly['anio'] == yr)]
        stock_val = float(farm_sub['pct_stock_meds'].iloc[0]) if not farm_sub.empty else 0.0
        
        # 3. Encuesta espera
        enc_sub = df_enc_weekly[(df_enc_weekly['canton'] == cant) & (df_enc_weekly['semana'] == sem) & (df_enc_weekly['anio'] == yr)]
        espera_val = float(enc_sub['espera_promedio_h'].iloc[0]) if not enc_sub.empty else 0.0
        
        # 4. Alertas mediaticas
        alertas_val = media_alerts.get((cant, sem, yr), 0)
        
        fact_records.append((id_tiempo, id_geo, id_clima, id_infra, casos_val, alertas_val, stock_val, espera_val))
        
    sql_fact = """
        INSERT INTO Fact_Incidencia (id_tiempo, id_geografia, id_clima, id_infraestructura, casos_confirmados, alertas_mediaticas, pct_stock_meds, espera_promedio_h)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    with conn.cursor() as cursor:
        cursor.executemany(sql_fact, fact_records)
    conn.commit()
    print(f"   [SUCCESS] Fact_Incidencia poblada con {len(fact_records)} registros.")

def main():
    print("=======================================================================")
    print("[ETL DW] INICIANDO PROCESO DE CARGA DEL DATA WAREHOUSE EN MYSQL")
    print("=======================================================================")
    
    # 1. Init Database Schema
    try:
        conn = get_connection(with_db=False)
        with conn.cursor() as cursor:
            cursor.execute("CREATE DATABASE IF NOT EXISTS upse_dengue_dw;")
        conn.close()
        print("[SQL] Base de datos 'upse_dengue_dw' asegurada.")
    except Exception as e:
        print(f"[ERROR] No se pudo conectar a MySQL o crear la base de datos: {e}")
        return
        
    # Re-connect to database
    try:
        conn = get_connection(with_db=True)
    except Exception as e:
        print(f"[ERROR] No se pudo conectar a 'upse_dengue_dw': {e}")
        return
        
    try:
        # 2. Run schema
        sql_schema_path = os.path.join(BASE_DIR, 'scripts', 'dw', 'schema.sql')
        run_sql_file(conn, sql_schema_path)
        
        # 3. Load Dimensions
        generate_dim_tiempo(conn)
        load_dim_geografia(conn)
        load_clima_y_infraestructura(conn)
        
        # 4. Load Fact
        build_fact_incidencia(conn)
        
        print("=======================================================================")
        print("[ETL DW] PROCESO DE CARGA COMPLETADO CON EXITO")
        print("=======================================================================")
    except Exception as e:
        print(f"[ERROR] Error durante la ejecucion de la carga del DW: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == "__main__":
    main()
