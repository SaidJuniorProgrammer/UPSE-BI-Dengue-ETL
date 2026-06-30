import requests
from bs4 import BeautifulSoup
import json
import os
import time
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(BASE_DIR, 'raw', 'scraping')
os.makedirs(RAW_DIR, exist_ok=True)

def ejecutar_scraping_multiple():
    print("--- INICIANDO WEB SCRAPING MÚLTIPLE (FUENTES OFICIALES 100% VERIFICADAS) ---")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9'
    }
    
    # 4 URLs formales, oficiales y que NO tienen bloqueo anti-bots
    sitios_web = {
        "ops_salud_dengue": "https://www.paho.org/es/temas/dengue",
        "oms_datos_dengue": "https://www.who.int/es/news-room/fact-sheets/detail/dengue-and-severe-dengue",
        "cdc_dengue_espanol": "https://www.cdc.gov/dengue/es/index.html", # <-- AQUÍ ESTÁ EL CAMBIO DE FUENTE
        "edicion_medica_ec": "https://www.edicionmedica.ec/"
    }
    
    for nombre_fuente, url in sitios_web.items():
        print(f"-> Extrayendo datos de: {nombre_fuente}...")
        try:
            time.sleep(3) # Delay preventivo para no saturar
            response = requests.get(url, headers=headers, timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extraemos los párrafos
            elementos = soup.find_all('p')
            datos_extraidos = []
            
            # Sacamos los primeros 10 fragmentos de texto relevantes
            for elemento in elementos[:10]: 
                texto = elemento.get_text(strip=True)
                if len(texto) > 15: # Solo guardamos si el texto tiene sentido
                    datos_extraidos.append({
                        "fuente": nombre_fuente,
                        "contenido_extraido": texto,
                        "fecha_extraccion": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    })
            
            fecha_hoy = datetime.now().strftime("%Y-%m-%d")
            archivo_salida = os.path.join(RAW_DIR, f"scraping_{nombre_fuente}_{fecha_hoy}.json")
            
            with open(archivo_salida, 'w', encoding='utf-8') as f:
                json.dump(datos_extraidos, f, ensure_ascii=False, indent=4)
                
            print(f"   [ÉXITO] Guardado en: {archivo_salida}")
            
        except requests.exceptions.RequestException as err:
            print(f"   [ERROR] Falló la conexión en {nombre_fuente}: {err}")

if __name__ == "__main__":
    ejecutar_scraping_multiple()