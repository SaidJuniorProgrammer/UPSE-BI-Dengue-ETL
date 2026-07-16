import os
import json
import random
from datetime import datetime, timedelta

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RAW_DIR = os.path.join(BASE_DIR, 'raw', 'archivos')
os.makedirs(RAW_DIR, exist_ok=True)

# List of 100 diseases (multipatologia) with CIE-10 codes, categories and causes
DISEASES = [
    # VIRUS (30)
    {"cie10": "A90", "nombre": "Dengue clásico", "origen": "Adquirida", "causa": "Virus"},
    {"cie10": "A91", "nombre": "Dengue grave", "origen": "Adquirida", "causa": "Virus"},
    {"cie10": "B01", "nombre": "Varicela", "origen": "Adquirida", "causa": "Virus"},
    {"cie10": "B05", "nombre": "Sarampión", "origen": "Adquirida", "causa": "Virus"},
    {"cie10": "B06", "nombre": "Rubéola", "origen": "Adquirida", "causa": "Virus"},
    {"cie10": "A92.0", "nombre": "Enfermedad por virus Chikungunya", "origen": "Adquirida", "causa": "Virus"},
    {"cie10": "A92.5", "nombre": "Enfermedad por virus Zika", "origen": "Adquirida", "causa": "Virus"},
    {"cie10": "A95", "nombre": "Fiebre amarilla", "origen": "Adquirida", "causa": "Virus"},
    {"cie10": "B26", "nombre": "Parotiditis infecciosa (Paperas)", "origen": "Adquirida", "causa": "Virus"},
    {"cie10": "B15", "nombre": "Hepatitis aguda tipo A", "origen": "Adquirida", "causa": "Virus"},
    {"cie10": "B16", "nombre": "Hepatitis aguda tipo B", "origen": "Adquirida", "causa": "Virus"},
    {"cie10": "B17", "nombre": "Hepatitis aguda tipo C", "origen": "Adquirida", "causa": "Virus"},
    {"cie10": "B20", "nombre": "Infección por VIH", "origen": "Adquirida", "causa": "Virus"},
    {"cie10": "A82", "nombre": "Rabia humana", "origen": "Adquirida", "causa": "Virus"},
    {"cie10": "B00", "nombre": "Infección por virus del herpes simple", "origen": "Adquirida", "causa": "Virus"},
    {"cie10": "B08", "nombre": "Infección por Coxsackievirus (Boca-Mano-Pie)", "origen": "Adquirida", "causa": "Virus"},
    {"cie10": "B02", "nombre": "Herpes zóster", "origen": "Adquirida", "causa": "Virus"},
    {"cie10": "B25", "nombre": "Enfermedad por Citomegalovirus", "origen": "Adquirida", "causa": "Virus"},
    {"cie10": "B27", "nombre": "Mononucleosis infecciosa", "origen": "Adquirida", "causa": "Virus"},
    {"cie10": "A85", "nombre": "Encefalitis viral", "origen": "Adquirida", "causa": "Virus"},
    {"cie10": "A87", "nombre": "Meningitis viral", "origen": "Adquirida", "causa": "Virus"},
    {"cie10": "J10", "nombre": "Influenza por virus identificado", "origen": "Adquirida", "causa": "Virus"},
    {"cie10": "J11", "nombre": "Influenza por virus no identificado", "origen": "Adquirida", "causa": "Virus"},
    {"cie10": "J12", "nombre": "Neumonía viral", "origen": "Adquirida", "causa": "Virus"},
    {"cie10": "A08", "nombre": "Gastroenteritis por Rotavirus", "origen": "Adquirida", "causa": "Virus"},
    {"cie10": "B07", "nombre": "Verrugas víricas (VPH)", "origen": "Adquirida", "causa": "Virus"},
    {"cie10": "U07.1", "nombre": "COVID-19 (SARS-CoV-2)", "origen": "Adquirida", "causa": "Virus"},
    {"cie10": "A98.4", "nombre": "Enfermedad por virus Ébola", "origen": "Adquirida", "causa": "Virus"},
    {"cie10": "A96", "nombre": "Fiebre hemorrágica por Arenavirus", "origen": "Adquirida", "causa": "Virus"},
    {"cie10": "A92.3", "nombre": "Fiebre del Nilo Occidental", "origen": "Adquirida", "causa": "Virus"},

    # BACTERIAS (30)
    {"cie10": "A00", "nombre": "Cólera", "origen": "Adquirida", "causa": "Bacteria"},
    {"cie10": "A01", "nombre": "Fiebre tifoidea", "origen": "Adquirida", "causa": "Bacteria"},
    {"cie10": "A02", "nombre": "Salmonelosis no tifoidea", "origen": "Adquirida", "causa": "Bacteria"},
    {"cie10": "A03", "nombre": "Shigelosis (Disentería bacilar)", "origen": "Adquirida", "causa": "Bacteria"},
    {"cie10": "A15", "nombre": "Tuberculosis respiratoria", "origen": "Adquirida", "causa": "Bacteria"},
    {"cie10": "A17", "nombre": "Tuberculosis del sistema nervioso", "origen": "Adquirida", "causa": "Bacteria"},
    {"cie10": "A20", "nombre": "Peste bubónica", "origen": "Adquirida", "causa": "Bacteria"},
    {"cie10": "A27", "nombre": "Leptospirosis", "origen": "Adquirida", "causa": "Bacteria"},
    {"cie10": "A30", "nombre": "Lepra (Enfermedad de Hansen)", "origen": "Adquirida", "causa": "Bacteria"},
    {"cie10": "A35", "nombre": "Tétanos neonatal", "origen": "Adquirida", "causa": "Bacteria"},
    {"cie10": "A36", "nombre": "Difteria", "origen": "Adquirida", "causa": "Bacteria"},
    {"cie10": "A37", "nombre": "Tos ferina (Pertussis)", "origen": "Adquirida", "causa": "Bacteria"},
    {"cie10": "A39", "nombre": "Infección meningocócica", "origen": "Adquirida", "causa": "Bacteria"},
    {"cie10": "A40", "nombre": "Sepsis estreptocócica", "origen": "Adquirida", "causa": "Bacteria"},
    {"cie10": "A41", "nombre": "Sepsis estafilocócica", "origen": "Adquirida", "causa": "Bacteria"},
    {"cie10": "A46", "nombre": "Erisipela", "origen": "Adquirida", "causa": "Bacteria"},
    {"cie10": "A48.0", "nombre": "Gangrena gaseosa", "origen": "Adquirida", "causa": "Bacteria"},
    {"cie10": "A48.3", "nombre": "Síndrome de shock tóxico", "origen": "Adquirida", "causa": "Bacteria"},
    {"cie10": "A50", "nombre": "Sífilis congénita", "origen": "Congénita", "causa": "Bacteria"},
    {"cie10": "A51", "nombre": "Sífilis precoz adquirida", "origen": "Adquirida", "causa": "Bacteria"},
    {"cie10": "A54", "nombre": "Infección gonocócica (Gonorrea)", "origen": "Adquirida", "causa": "Bacteria"},
    {"cie10": "A69.2", "nombre": "Enfermedad de Lyme", "origen": "Adquirida", "causa": "Bacteria"},
    {"cie10": "A70", "nombre": "Psitacosis (Infección por Chlamydia psittaci)", "origen": "Adquirida", "causa": "Bacteria"},
    {"cie10": "A75", "nombre": "Tifus epidémico por piojos", "origen": "Adquirida", "causa": "Bacteria"},
    {"cie10": "A04.7", "nombre": "Enterocolitis por Clostridium difficile", "origen": "Adquirida", "causa": "Bacteria"},
    {"cie10": "L03", "nombre": "Celulitis bacteriana", "origen": "Adquirida", "causa": "Bacteria"},
    {"cie10": "J13", "nombre": "Neumonía por Streptococcus pneumoniae", "origen": "Adquirida", "causa": "Bacteria"},
    {"cie10": "J14", "nombre": "Neumonía por Haemophilus influenzae", "origen": "Adquirida", "causa": "Bacteria"},
    {"cie10": "J15", "nombre": "Neumonía bacteriana no clasificada", "origen": "Adquirida", "causa": "Bacteria"},
    {"cie10": "A23", "nombre": "Brucelosis", "origen": "Adquirida", "causa": "Bacteria"},

    # HONGOS (15)
    {"cie10": "B35", "nombre": "Dermatofitosis (Tiña)", "origen": "Adquirida", "causa": "Hongo"},
    {"cie10": "B37", "nombre": "Candidiasis mucocutánea", "origen": "Adquirida", "causa": "Hongo"},
    {"cie10": "B37.7", "nombre": "Sepsis por Candida (Candidemia)", "origen": "Adquirida", "causa": "Hongo"},
    {"cie10": "B38", "nombre": "Coccidioidomicosis", "origen": "Adquirida", "causa": "Hongo"},
    {"cie10": "B39", "nombre": "Histoplasmosis", "origen": "Adquirida", "causa": "Hongo"},
    {"cie10": "B40", "nombre": "Blastomicosis", "origen": "Adquirida", "causa": "Hongo"},
    {"cie10": "B42", "nombre": "Esporotricosis", "origen": "Adquirida", "causa": "Hongo"},
    {"cie10": "B44", "nombre": "Aspergilosis pulmonar", "origen": "Adquirida", "causa": "Hongo"},
    {"cie10": "B45", "nombre": "Criptococosis meníngea", "origen": "Adquirida", "causa": "Hongo"},
    {"cie10": "B46", "nombre": "Cigomicosis (Mucormicosis)", "origen": "Adquirida", "causa": "Hongo"},
    {"cie10": "B47", "nombre": "Micetoma", "origen": "Adquirida", "causa": "Hongo"},
    {"cie10": "B48.0", "nombre": "Lobomicosis", "origen": "Adquirida", "causa": "Hongo"},
    {"cie10": "B48.7", "nombre": "Micosis oportunistas", "origen": "Adquirida", "causa": "Hongo"},
    {"cie10": "B49", "nombre": "Micosis no especificada", "origen": "Adquirida", "causa": "Hongo"},
    {"cie10": "B59", "nombre": "Neumocistosis (Pneumocystis jirovecii)", "origen": "Adquirida", "causa": "Hongo"},

    # PARASITOS / OTROS INFECCIOSOS (15)
    {"cie10": "B50", "nombre": "Paludismo por Plasmodium falciparum (Malaria)", "origen": "Adquirida", "causa": "Parásito"},
    {"cie10": "B51", "nombre": "Paludismo por Plasmodium vivax (Malaria)", "origen": "Adquirida", "causa": "Parásito"},
    {"cie10": "B55", "nombre": "Leishmaniasis cutánea", "origen": "Adquirida", "causa": "Parásito"},
    {"cie10": "B57", "nombre": "Enfermedad de Chagas aguda (Tripanosomiasis)", "origen": "Adquirida", "causa": "Parásito"},
    {"cie10": "B58", "nombre": "Toxoplasmosis adquirida", "origen": "Adquirida", "causa": "Parásito"},
    {"cie10": "B65", "nombre": "Esquistosomiasis", "origen": "Adquirida", "causa": "Parásito"},
    {"cie10": "B67", "nombre": "Equinococosis (Quiste hidatídico)", "origen": "Adquirida", "causa": "Parásito"},
    {"cie10": "B68", "nombre": "Teniasis intestinal", "origen": "Adquirida", "causa": "Parásito"},
    {"cie10": "B69", "nombre": "Cisticercosis del sistema nervioso", "origen": "Adquirida", "causa": "Parásito"},
    {"cie10": "B75", "nombre": "Triquinosis", "origen": "Adquirida", "causa": "Parásito"},
    {"cie10": "B76", "nombre": "Anquilostomiasis y Necatoriasis", "origen": "Adquirida", "causa": "Parásito"},
    {"cie10": "B77", "nombre": "Ascariasis", "origen": "Adquirida", "causa": "Parásito"},
    {"cie10": "B80", "nombre": "Enterobiasis (Oxiuriasis)", "origen": "Adquirida", "causa": "Parásito"},
    {"cie10": "B86", "nombre": "Escabiosis (Sarna)", "origen": "Adquirida", "causa": "Parásito"},
    {"cie10": "A06", "nombre": "Amebiasis intestinal", "origen": "Adquirida", "causa": "Parásito"},

    # GENETICAS / HEREDITARIAS (10)
    {"cie10": "E84", "nombre": "Fibrosis quística", "origen": "Hereditaria", "causa": "Genético"},
    {"cie10": "Q78.0", "nombre": "Osteogénesis imperfecta", "origen": "Hereditaria", "causa": "Genético"},
    {"cie10": "D66", "nombre": "Hemofilia A", "origen": "Hereditaria", "causa": "Genético"},
    {"cie10": "D67", "nombre": "Hemofilia B", "origen": "Hereditaria", "causa": "Genético"},
    {"cie10": "G71.0", "nombre": "Distrofia muscular de Duchenne", "origen": "Hereditaria", "causa": "Genético"},
    {"cie10": "E70.0", "nombre": "Fenilcetonuria clásica", "origen": "Hereditaria", "causa": "Genético"},
    {"cie10": "Q90", "nombre": "Síndrome de Down", "origen": "Congénita", "causa": "Genético"},
    {"cie10": "Q96", "nombre": "Síndrome de Turner", "origen": "Congénita", "causa": "Genético"},
    {"cie10": "Q98", "nombre": "Síndrome de Klinefelter", "origen": "Congénita", "causa": "Genético"},
    {"cie10": "Q85.0", "nombre": "Neurofibromatosis tipo I", "origen": "Hereditaria", "causa": "Genético"}
]

# 24 provinces and main cantons of Ecuador
PROVINCES_CANTONS = {
    "AZUAY": ["CUENCA", "GUALACEO", "PAUTE"],
    "BOLIVAR": ["GUARANDA", "SAN MIGUEL"],
    "CANAR": ["AZOGUES", "LA TRONCAL"],
    "CARCHI": ["TULCAN", "MONTUFAR"],
    "COTOPAXI": ["LATACUNGA", "SALCEDO"],
    "CHIMBORAZO": ["RIOBAMBA", "ALAUSI"],
    "EL ORO": ["MACHALA", "PASAJE", "HUAQUILLAS"],
    "ESMERALDAS": ["ESMERALDAS", "QUININDE", "ATACAMES"],
    "GUAYAS": ["GUAYAQUIL", "SAMBORONDON", "DURAN", "MILAGRO", "DAULE"],
    "IMBABURA": ["IBARRA", "OTAVALO", "COTACACHI"],
    "LOJA": ["LOJA", "CATAMAYO", "CARIAMANGA"],
    "LOS RIOS": ["BABAHOYO", "QUEVEDO", "MOCACHE", "VINCES"],
    "MANABI": ["PORTOVIEJO", "MANTA", "CHONE", "MONTECRISTI", "BAHIA DE CARAQUEZ"],
    "MORONA SANTIAGO": ["MACAS", "GUALAQUIZA"],
    "NAPO": ["TENA", "ARCHIDONA"],
    "PASTAZA": ["PUYO", "MERA"],
    "PICHINCHA": ["QUITO", "CAYAMBE", "MEJIA", "RUMINAHUI"],
    "ORELLANA": ["FRANCISCO DE ORELLANA", "COCA"],
    "SUCUMBIOS": ["NUEVA LOJA", "LAGO AGRIO"],
    "TUNGURAHUA": ["AMBATO", "BANOS", "PELILEO"],
    "ZAMORA CHINCHIPE": ["ZAMORA", "YANTZAZA"],
    "GALAPAGOS": ["SAN CRISTOBAL", "SANTA CRUZ", "ISABELA"],
    "SANTO DOMINGO DE LOS TSACILAS": ["SANTO DOMINGO"],
    "SANTA ELENA": ["SANTA ELENA", "LA LIBERTAD", "SALINAS"]
}

def generar_datos_multipatologia():
    print("[INFO] Generando y simulando datos epidemiológicos a nivel nacional (24 Provincias, 100+ Enfermedades)...")
    datos = []
    
    # We generate data for years 2024 to 2026, weekly
    semanas = 12 # generate a smaller subset for performance, e.g. 12 weeks of 2024, 2025, 2026
    
    for anio in [2024, 2025, 2026]:
        for sem in range(1, semanas + 1):
            for prov, cantones in PROVINCES_CANTONS.items():
                for canton in cantones:
                    # Select 3-7 random diseases that had cases in this canton/week to keep the database size reasonable
                    selected_diseases = random.sample(DISEASES, k=random.randint(3, 7))
                    for dis in selected_diseases:
                        # Base cases
                        total_casos = random.randint(1, 28) if dis["causa"] == "Virus" else random.randint(1, 10)
                        
                        # Genetic diseases have much lower incidence rates
                        if dis["causa"] == "Genético":
                            total_casos = 1 if random.random() < 0.1 else 0
                            
                        if total_casos > 0:
                            # Divide cases between urban and rural areas
                            casos_urbanos = int(total_casos * random.uniform(0.3, 0.8))
                            casos_rurales = total_casos - casos_urbanos
                            
                            datos.append({
                                "provincia": prov,
                                "canton": canton,
                                "anio": anio,
                                "semana_epidem": sem,
                                "cie10": dis["cie10"],
                                "nombre_enfermedad": dis["nombre"],
                                "categoria_origen": dis["origen"],
                                "tipo_causa": dis["causa"],
                                "casos_confirmados": total_casos,
                                "casos_urbanos": casos_urbanos,
                                "casos_rurales": casos_rurales,
                                "fuente": "MSP SIVE-Alerta / INEC"
                            })
                            
    fecha_hoy = datetime.now().strftime("%Y-%m-%d")
    archivo_salida = os.path.join(RAW_DIR, f"casos_multipatologia_nacional_{fecha_hoy}.json")
    
    with open(archivo_salida, 'w', encoding='utf-8') as f:
        json.dump(datos, f, ensure_ascii=False, indent=4)
        
    print(f"[SUCCESS] Datos multipatología generados. Guardados {len(datos)} registros en: {archivo_salida}")
    return archivo_salida

if __name__ == "__main__":
    generar_datos_multipatologia()
