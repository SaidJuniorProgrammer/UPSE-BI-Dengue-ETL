import os
import json
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
STAGING_DIR = os.path.join(BASE_DIR, 'staging')

os.makedirs(STAGING_DIR, exist_ok=True)

class MetricsReporter:
    def __init__(self):
        self.reset()

    def reset(self):
        self.metricas = {
            "fecha_reporte": datetime.now().strftime("%Y-%m-%d"),
            "fuentes_procesadas": 0,
            "registros_raw": 0,
            "registros_staging": 0,
            "duplicados_eliminados": 0,
            "nulos_criticos_eliminados": 0,
            "corregidos_por_formato": 0
        }

    def registrar_fuente(self, raw_count: int, stg_count: int, dups: int = 0, nulos: int = 0, corregidos: int = 0):
        self.metricas["fuentes_procesadas"] += int(1)
        self.metricas["registros_raw"] += int(raw_count)
        self.metricas["registros_staging"] += int(stg_count)
        self.metricas["duplicados_eliminados"] += int(dups)
        self.metricas["nulos_criticos_eliminados"] += int(nulos)
        self.metricas["corregidos_por_formato"] += int(corregidos)

    def generar_reporte(self):
        raw = int(self.metricas["registros_raw"])
        stg = int(self.metricas["registros_staging"])
        nulos = int(self.metricas["nulos_criticos_eliminados"])
        
        tasa_retencion = round((stg / raw * 100), 2) if raw > 0 else 100.0
        completitud = round((stg / (stg + nulos) * 100), 2) if (stg + nulos) > 0 else 100.0
        tasa_error = round(100.0 - tasa_retencion, 2)

        reporte_final = {
            "fecha_reporte": str(self.metricas["fecha_reporte"]),
            "fuentes_procesadas": int(self.metricas["fuentes_procesadas"]),
            "registros_raw": raw,
            "registros_staging": stg,
            "duplicados_eliminados": int(self.metricas["duplicados_eliminados"]),
            "nulos_criticos_eliminados": nulos,
            "corregidos_por_formato": int(self.metricas["corregidos_por_formato"]),
            "completitud_porcentaje": float(completitud),
            "tasa_promedio_error_porcentaje": float(tasa_error),
            "tasa_global_retencion_porcentaje": float(tasa_retencion)
        }

        fecha_hoy = self.metricas["fecha_reporte"]
        archivo_salida = os.path.join(STAGING_DIR, f"reporte_calidad_{fecha_hoy}.json")
        with open(archivo_salida, 'w', encoding='utf-8') as f:
            json.dump(reporte_final, f, ensure_ascii=False, indent=4)
            
        print(f"[INFO] Reporte de calidad generado en: {archivo_salida}")
        return archivo_salida

reporter = MetricsReporter()
