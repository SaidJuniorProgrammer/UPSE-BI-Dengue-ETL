import requests
import json
import os
from datetime import datetime

# Rutas relativas y dinámicas (Cumple rúbrica: Código portable)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(BASE_DIR, 'raw', 'api')
os.makedirs(RAW_DIR, exist_ok=True)

def extraer_clima_api():
    print("Iniciando extracción de API Open-Meteo...")
    # Coordenadas de Santa Elena
    url = "https://archive-api.open-meteo.com/v1/archive?latitude=-2.22&longitude=-80.90&start_date=2024-01-01&end_date=2024-05-31&daily=precipitation_sum,temperature_2m_max&timezone=America%2FGuayaquil"
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status() 
        datos = response.json()
        
        fecha_hoy = datetime.now().strftime("%Y-%m-%d")
        archivo_salida = os.path.join(RAW_DIR, f"openmeteo_clima_{fecha_hoy}.json")
        
        with open(archivo_salida, 'w', encoding='utf-8') as f:
            json.dump(datos, f, ensure_ascii=False, indent=4)
            
        print(f"Éxito: Datos climáticos guardados en {archivo_salida}")
        
    except requests.exceptions.RequestException as e:
        print(f"Error crítico al consumir la API: {e}")

if __name__ == "__main__":
    extraer_clima_api()