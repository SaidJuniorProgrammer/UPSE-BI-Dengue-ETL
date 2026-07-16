import os
import sys
import json
import glob
import random
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
        schema_sql = f.read()
        
    # Remove single line comments
    clean_lines = []
    for line in schema_sql.split('\n'):
        if not line.strip().startswith('--') and not line.strip().startswith('#'):
            clean_lines.append(line)
    clean_sql = '\n'.join(clean_lines)
    
    # Split by semicolon
    statements = clean_sql.split(';')
        
    with conn.cursor() as cursor:
        # Disable foreign key checks to avoid duplicate constraint errors during dropping/creation
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
        for stmt in statements:
            stmt = stmt.strip()
            if stmt:
                cursor.execute(stmt)
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
    conn.commit()

def get_latest_multipatologia_file():
    files = glob.glob(os.path.join(BASE_DIR, 'raw', 'archivos', 'casos_multipatologia_nacional_*.json'))
    if not files:
        raise FileNotFoundError("No se encontró el archivo de casos multipatología nacional.")
    return max(files, key=os.path.getctime)

def generate_dim_tiempo(conn):
    print("[ETL] Generando Dim_Tiempo (2022 a 2026)...")
    start_date = datetime(2022, 1, 1)
    end_date = datetime(2026, 12, 31)
    delta = timedelta(days=1)
    
    current_date = start_date
    records = []
    
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
        
    sql = """
        INSERT INTO dim_tiempo (id_tiempo, fecha, anio, semana_epidem, mes, nombre_mes)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE anio=VALUES(anio)
    """
    with conn.cursor() as cursor:
        cursor.executemany(sql, records)
    conn.commit()
    print(f"   [SUCCESS] Dim_Tiempo poblada con {len(records)} registros.")

def load_dim_geografia(conn, json_data):
    print("[ETL] Poblando Dim_Geografia...")
    unique_geos = {}
    for item in json_data:
        canton = item["canton"].upper()
        provincia = item["provincia"].upper()
        if canton not in unique_geos:
            # Guayaquil and Quito get bigger populations
            if canton == "GUAYAQUIL":
                pop = 2700000
            elif canton == "QUITO":
                pop = 2000000
            elif canton == "CUENCA":
                pop = 600000
            elif canton == "SANTO DOMINGO":
                pop = 450000
            elif canton == "PORTOVIEJO":
                pop = 320000
            elif canton == "MANTA":
                pop = 260000
            else:
                pop = random.randint(30000, 220000)
            unique_geos[canton] = (canton, provincia, pop)
            
    sql = """
        INSERT INTO dim_geografia (canton, provincia, poblacion)
        VALUES (%s, %s, %s)
        ON DUPLICATE KEY UPDATE provincia=VALUES(provincia), poblacion=VALUES(poblacion)
    """
    with conn.cursor() as cursor:
        cursor.executemany(sql, list(unique_geos.values()))
    conn.commit()
    print(f"   [SUCCESS] Dim_Geografia poblada con {len(unique_geos)} cantones.")

def load_dim_enfermedad(conn, json_data):
    print("[ETL] Poblando Dim_Enfermedad...")
    unique_diseases = {}
    for item in json_data:
        cie10 = item["cie10"]
        if cie10 not in unique_diseases:
            unique_diseases[cie10] = (
                cie10,
                item["nombre_enfermedad"],
                item["categoria_origen"],
                item["tipo_causa"]
            )
            
    sql = """
        INSERT INTO dim_enfermedad (cie10, nombre_enfermedad, categoria_origen, tipo_causa)
        VALUES (%s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE nombre_enfermedad=VALUES(nombre_enfermedad)
    """
    with conn.cursor() as cursor:
        cursor.executemany(sql, list(unique_diseases.values()))
    conn.commit()
    print(f"   [SUCCESS] Dim_Enfermedad poblada con {len(unique_diseases)} enfermedades.")

def build_fact_incidencia(conn, json_data):
    print("[ETL] Construyendo Fact_Incidencia (Multipatología)...")
    
    with conn.cursor() as cursor:
        cursor.execute("SELECT id_geografia, canton FROM dim_geografia")
        geo_map = {row['canton'].upper(): row['id_geografia'] for row in cursor.fetchall()}
        
        cursor.execute("SELECT id_enfermedad, cie10 FROM dim_enfermedad")
        disease_map = {row['cie10']: row['id_enfermedad'] for row in cursor.fetchall()}
        
        cursor.execute("SELECT id_clima, canton, semana_epidem, anio FROM dim_clima")
        clima_map = {(row['canton'].upper(), row['semana_epidem'], row['anio']): row['id_clima'] for row in cursor.fetchall()}
        
        cursor.execute("SELECT id_infraestructura, canton, semana_epidem, anio FROM dim_infraestructura")
        infra_map = {(row['canton'].upper(), row['semana_epidem'], row['anio']): row['id_infraestructura'] for row in cursor.fetchall()}
        
        cursor.execute("SELECT MIN(id_tiempo) as min_t, semana_epidem, anio FROM dim_tiempo GROUP BY semana_epidem, anio")
        time_map = {(row['semana_epidem'], row['anio']): row['min_t'] for row in cursor.fetchall()}

    fact_records = []
    missing_clima = []
    missing_infra = []
    
    for item in json_data:
        cant = item["canton"].upper()
        sem = int(item["semana_epidem"])
        yr = int(item["anio"])
        cie10 = item["cie10"]
        
        if cant not in geo_map or cie10 not in disease_map:
            continue
            
        id_tiempo = time_map.get((sem, yr))
        if not id_tiempo:
            continue
            
        id_clima = clima_map.get((cant, sem, yr))
        if not id_clima:
            missing_clima.append((cant, sem, yr))
            
        id_infra = infra_map.get((cant, sem, yr))
        if not id_infra:
            missing_infra.append((cant, sem, yr))

    # Insert missing weather
    if missing_clima:
        unique_missing_clima = list(set(missing_clima))
        print(f"   [INFO] Generando {len(unique_missing_clima)} registros de clima de respaldo...")
        clima_insert_sql = """
            INSERT INTO dim_clima (canton, semana_epidem, anio, precipitacion_mm, temp_maxima_c, temp_minima_c, humedad_relativa)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        clima_records = []
        for (c, s, y) in unique_missing_clima:
            clima_records.append((c, s, y, round(random.uniform(0.0, 18.0), 1), round(random.uniform(22.0, 31.0), 1), round(random.uniform(16.0, 22.0), 1), round(random.uniform(70.0, 85.0), 1)))
        
        with conn.cursor() as cursor:
            cursor.executemany(clima_insert_sql, clima_records)
        conn.commit()
        
        # Reload clima_map
        with conn.cursor() as cursor:
            cursor.execute("SELECT id_clima, canton, semana_epidem, anio FROM dim_clima")
            clima_map = {(row['canton'].upper(), row['semana_epidem'], row['anio']): row['id_clima'] for row in cursor.fetchall()}

    # Insert missing infra
    if missing_infra:
        unique_missing_infra = list(set(missing_infra))
        print(f"   [INFO] Generando {len(unique_missing_infra)} registros de infraestructura de respaldo...")
        infra_insert_sql = """
            INSERT INTO dim_infraestructura (canton, semana_epidem, anio, nivel_saturacion, camas_totales, camas_ocupadas, medicos_disponibles, pacientes_dengue)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 0)
        """
        infra_records = []
        for (c, s, y) in unique_missing_infra:
            tot = random.randint(15, 150)
            oc = int(tot * random.uniform(0.1, 0.7))
            sat = "ALTO" if (oc / tot) > 0.7 else ("MEDIO" if (oc / tot) > 0.4 else "BAJO")
            infra_records.append((c, s, y, sat, tot, oc, random.randint(5, 50)))
            
        with conn.cursor() as cursor:
            cursor.executemany(infra_insert_sql, infra_records)
        conn.commit()
        
        # Reload infra_map
        with conn.cursor() as cursor:
            cursor.execute("SELECT id_infraestructura, canton, semana_epidem, anio FROM dim_infraestructura")
            infra_map = {(row['canton'].upper(), row['semana_epidem'], row['anio']): row['id_infraestructura'] for row in cursor.fetchall()}

    # Build facts list
    for item in json_data:
        cant = item["canton"].upper()
        sem = int(item["semana_epidem"])
        yr = int(item["anio"])
        cie10 = item["cie10"]
        
        if cant not in geo_map or cie10 not in disease_map:
            continue
            
        id_geo = geo_map[cant]
        id_enfermedad = disease_map[cie10]
        id_tiempo = time_map.get((sem, yr))
        if not id_tiempo:
            continue
            
        id_clima = clima_map[(cant, sem, yr)]
        id_infra = infra_map[(cant, sem, yr)]
        
        casos_val = int(item["casos_confirmados"])
        urbanos = int(item["casos_urbanos"])
        rurales = int(item["casos_rurales"])
        
        alertas_val = random.randint(0, 4) if casos_val > 8 else 0
        stock_val = round(random.uniform(55.0, 97.0), 2)
        espera_val = round(random.uniform(0.4, 4.0), 2)
        
        fact_records.append((id_tiempo, id_geo, id_clima, id_infra, id_enfermedad, casos_val, urbanos, rurales, alertas_val, stock_val, espera_val))

    sql_fact = """
        INSERT INTO fact_incidencia (id_tiempo, id_geografia, id_clima, id_infraestructura, id_enfermedad, casos_confirmados, casos_urbanos, casos_rurales, alertas_mediaticas, pct_stock_meds, espera_promedio_h)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    with conn.cursor() as cursor:
        cursor.executemany(sql_fact, fact_records)
    conn.commit()
    print(f"   [SUCCESS] fact_incidencia poblada con {len(fact_records)} registros multipatológicos.")

def main():
    print("=======================================================================")
    print("[ETL DW] INICIANDO PROCESO DE CARGA DEL DATA WAREHOUSE MULTIPATOLOGICO")
    print("=======================================================================")
    
    # 1. Get latest generated cases data
    try:
        json_path = get_latest_multipatologia_file()
        print(f"[ETL] Leyendo datos raw desde: {json_path}")
        with open(json_path, 'r', encoding='utf-8') as f:
            json_data = json.load(f)
    except Exception as e:
        print(f"[ERROR] No se pudieron cargar los datos de multipatología raw: {e}")
        return

    # 2. Init Database Schema
    try:
        conn = get_connection(with_db=False)
        with conn.cursor() as cursor:
            cursor.execute("CREATE DATABASE IF NOT EXISTS upse_dengue_dw;")
        conn.close()
        print("[SQL] Base de datos 'upse_dengue_dw' asegurada.")
    except Exception as e:
        print(f"[ERROR] No se pudo conectar a MySQL o crear la base de datos: {e}")
        return
        
    try:
        conn = get_connection(with_db=True)
    except Exception as e:
        print(f"[ERROR] No se pudo conectar a 'upse_dengue_dw': {e}")
        return
        
    try:
        # 3. Run schema
        sql_schema_path = os.path.join(BASE_DIR, 'scripts', 'dw', 'schema.sql')
        run_sql_file(conn, sql_schema_path)
        
        # 4. Load Dimensions
        generate_dim_tiempo(conn)
        load_dim_geografia(conn, json_data)
        load_dim_enfermedad(conn, json_data)
        
        # 5. Load Fact
        build_fact_incidencia(conn, json_data)
        
        print("=======================================================================")
        print("[ETL DW] PROCESO DE CARGA MULTIPATOLOGICA COMPLETADO CON EXITO")
        print("=======================================================================")
    except Exception as e:
        print(f"[ERROR] Error durante la ejecucion de la carga del DW: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == "__main__":
    main()
