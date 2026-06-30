import os
import pandas as pd
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LOGS_DIR = os.path.join(BASE_DIR, 'logs')
STAGING_DIR = os.path.join(BASE_DIR, 'staging')

os.makedirs(LOGS_DIR, exist_ok=True)
os.makedirs(STAGING_DIR, exist_ok=True)

class ErrorLogger:
    def __init__(self):
        self.errores = []
        self.log_file = os.path.join(LOGS_DIR, 'quality.log')
        self.error_csv = os.path.join(STAGING_DIR, 'error_log.csv')

    def log_error(self, fuente: str, error_msg: str, accion: str):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        registro = {
            "Timestamp": timestamp,
            "Fuente": fuente,
            "Error": error_msg,
            "Acción tomada": accion
        }
        self.errores.append(registro)
        
        # Registrar en archivo log de texto
        with open(self.log_file, 'a', encoding='utf-8') as f:
            f.write(f"[{timestamp}] [{fuente}] ERROR: {error_msg} -> ACCIÓN: {accion}\n")

    def guardar_errores_csv(self):
        if self.errores:
            df = pd.DataFrame(self.errores)
            # Si ya existe, concatenamos o sobrescribimos para el lote actual
            df.to_csv(self.error_csv, index=False, encoding='utf-8')
        else:
            df = pd.DataFrame(columns=["Timestamp", "Fuente", "Error", "Acción tomada"])
            df.to_csv(self.error_csv, index=False, encoding='utf-8')
        return self.error_csv

logger = ErrorLogger()
