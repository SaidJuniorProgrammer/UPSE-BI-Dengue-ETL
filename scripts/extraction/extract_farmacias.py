import os
import json
import time
import random
import requests
from datetime import datetime, timedelta

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RAW_DIR = os.path.join(BASE_DIR, 'raw', 'scraping', 'farmacias')
os.makedirs(RAW_DIR, exist_ok=True)

def extraer_farmacias():
    print("[INFO] Iniciando recoleccion de inventarios farmaceuticos (antipyreticos y rehidratantes)...")
    cadenas = ["Fybeca", "Pharmacy's", "Sana Sana", "Económicas", "Cruz Azul"]
    medicamentos = [
        {"nombre": "Paracetamol 500mg Caja", "precio_ref": 2.50},
        {"nombre": "Acetaminofén Jarabe Pediátrico", "precio_ref": 3.80},
        {"nombre": "Suero Oral Rehidratante 500ml", "precio_ref": 1.90},
        {"nombre": "Paracetamol 1000mg Gotas/Sobres", "precio_ref": 4.20},
        {"nombre": "Repelente contra Mosquitos Aerosol", "precio_ref": 5.75}
    ]
    cantones = ["SANTA ELENA", "LA LIBERTAD", "SALINAS"]
    
    datos_extraidos = []
    
    for cadena in cadenas:
        time.sleep(random.uniform(1.0, 2.0))
        print(f"   -> Consultando disponibilidad en cadena: {cadena}")
        for cant in cantones:
            for med in medicamentos:
                # Simulación de consulta a endpoints JSON de inventario por cantón/cadena
                unidades = random.choice([0, random.randint(15, 120), random.randint(5, 50), None]) # Incluir algunos nulos para probar imputación en Staging
                precio = round(med["precio_ref"] * random.uniform(0.9, 1.15), 2) if random.random() > 0.05 else None # 5% nulo para probar mediana
                
                # Ocasionalmente simular formato en string "$5,99" como especifica nuevas_partes.md
                if precio and random.random() < 0.2:
                    precio_val = f"${str(precio).replace('.', ',')}"
                else:
                    precio_val = precio
                
                fecha_venc = (datetime.now() + timedelta(days=random.randint(90, 600))).strftime("%Y-%m-%d")
                
                datos_extraidos.append({
                    "cadena": cadena,
                    "canton": cant,
                    "medicamento": med["nombre"],
                    "stock_disponible": "SI" if (unidades and unidades > 0) else "NO",
                    "cantidad_unidades": unidades,
                    "precio_usd": precio_val,
                    "fecha_vencimiento": fecha_venc,
                    "fecha_extraccion": datetime.now().strftime("%Y-%m-%d")
                })

    fecha_hoy = datetime.now().strftime("%Y-%m-%d")
    archivo_salida = os.path.join(RAW_DIR, f"farmacias_{fecha_hoy}.json")
    
    with open(archivo_salida, 'w', encoding='utf-8') as f:
        json.dump(datos_extraidos, f, ensure_ascii=False, indent=4)
        
    print(f"[SUCCESS] Extraccion farmaceutica finalizada. Guardados {len(datos_extraidos)} registros en: {archivo_salida}")
    return archivo_salida

if __name__ == "__main__":
    extraer_farmacias()
