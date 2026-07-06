import os
import sys
import pymysql

# Add project root to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from scripts.dw.db_connection import get_connection

def escape_val(val):
    if val is None:
        return 'NULL'
    elif isinstance(val, (int, float)):
        return str(val)
    else:
        # Escape string quotes
        escaped = str(val).replace("'", "''").replace("\\", "\\\\")
        return f"'{escaped}'"

def dump_database():
    dump_path = os.path.join(BASE_DIR, 'upse_dengue_dw_dump.sql')
    print(f"[DUMP] Generando dump de base de datos en: {dump_path}")
    
    conn = get_connection(with_db=True)
    
    tables = ['Dim_Tiempo', 'Dim_Geografia', 'Dim_Clima', 'Dim_Infraestructura', 'Fact_Incidencia']
    views = ['kpi_tasa_incidencia', 'kpi_riesgo_climatico', 'kpi_disponibilidad_farmaceutica', 'kpi_ocupacion_hospitalaria', 'kpi_tiempos_espera']
    
    with open(dump_path, 'w', encoding='utf-8') as f:
        f.write("-- =======================================================================\n")
        f.write("-- UPSE DENGUE DATA WAREHOUSE DUMP\n")
        f.write(f"-- Generado el: {pymysql.__name__} dumper\n")
        f.write("-- =======================================================================\n\n")
        
        f.write("CREATE DATABASE IF NOT EXISTS upse_dengue_dw;\n")
        f.write("USE upse_dengue_dw;\n\n")
        
        # Write DDL for tables
        for table in tables:
            f.write(f"DROP TABLE IF EXISTS {table};\n")
            with conn.cursor() as cur:
                cur.execute(f"SHOW CREATE TABLE {table}")
                res = cur.fetchone()
                ddl = res['Create Table']
                f.write(f"{ddl};\n\n")
                
        # Write DML (inserts) for tables
        for table in tables:
            f.write(f"-- Datos para la tabla {table}\n")
            with conn.cursor() as cur:
                cur.execute(f"SELECT * FROM {table}")
                rows = cur.fetchall()
                if not rows:
                    f.write(f"-- (Sin registros para {table})\n\n")
                    continue
                
                # We can write inserts in chunks of 100
                cols = list(rows[0].keys())
                cols_str = ", ".join([f"`{c}`" for c in cols])
                
                records = []
                for row in rows:
                    vals_str = ", ".join([escape_val(row[c]) for c in cols])
                    records.append(f"({vals_str})")
                
                # Write in chunks
                chunk_size = 100
                for i in range(0, len(records), chunk_size):
                    chunk = records[i:i+chunk_size]
                    f.write(f"INSERT INTO `{table}` ({cols_str}) VALUES \n" + ",\n".join(chunk) + ";\n")
                f.write("\n")
                
        # Write Views
        for view in views:
            f.write(f"DROP VIEW IF EXISTS {view};\n")
            with conn.cursor() as cur:
                cur.execute(f"SHOW CREATE VIEW {view}")
                res = cur.fetchone()
                ddl = res['Create View']
                # Clean up DEFINER if present to ensure portability
                if 'DEFINER=' in ddl:
                    parts = ddl.split('DEFINER=')
                    # Definer looks like `root`@`localhost` SQL SECURITY DEFINER VIEW ...
                    # We can skip to VIEW
                    view_part = parts[1].split(' VIEW ')
                    ddl = f"CREATE VIEW {view_part[1]}"
                f.write(f"{ddl};\n\n")
                
    conn.close()
    print(f"   [SUCCESS] Dump generado exitosamente en {dump_path}")

if __name__ == "__main__":
    dump_database()
