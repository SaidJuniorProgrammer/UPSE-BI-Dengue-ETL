import re
import pandas as pd
import numpy as np
from typing import List, Optional

CANTONES_INEC = {
    'SANTA ELENA': ['SANTA ELENA', 'ST. ELENA', 'SANTAELENA'],
    'LA LIBERTAD': ['LA LIBERTAD', 'LIBERTAD', 'LALIBERTAD'],
    'SALINAS': ['SALINAS', 'SALINA']
}

def estandarizar_canton(valor: str) -> Optional[str]:
    """Normaliza el nombre del cantón al catálogo oficial INEC de la provincia de Santa Elena."""
    if pd.isna(valor) or not str(valor).strip():
        return None
    val_norm = re.sub(r'[^A-Z\s]', '', str(valor).upper()).strip()
    
    for canton_oficial, variaciones in CANTONES_INEC.items():
        if val_norm in variaciones or any(var in val_norm for var in variaciones):
            return canton_oficial
    return val_norm if val_norm else None

def limpiar_numero_regex(valor, tipo=float):
    """Extrae números flotantes o decimales de textos como '45.2mm', '28.5 °C' o '$5,99'."""
    if pd.isna(valor):
        return np.nan
    if isinstance(valor, (int, float)):
        return tipo(valor)
    
    val_str = str(valor).replace(',', '.')
    match = re.search(r'[-+]?\d*\.?\d+', val_str)
    if match:
        try:
            return tipo(match.group(0))
        except ValueError:
            return np.nan
    return np.nan

def estandarizar_fecha(fecha) -> Optional[str]:
    """Convierte fechas a formato estándar ISO 8601 (YYYY-MM-DD)."""
    if pd.isna(fecha):
        return None
    try:
        dt = pd.to_datetime(fecha, errors='coerce')
        if pd.isna(dt):
            return None
        return dt.strftime('%Y-%m-%d')
    except Exception:
        return None

def eliminar_duplicados(df: pd.DataFrame, subsets: List[str], keep: str = 'last') -> pd.DataFrame:
    """Deduplica un DataFrame manteniendo el registro especificado."""
    cols_existentes = [col for col in subsets if col in df.columns]
    if not cols_existentes:
        return df.drop_duplicates(keep=keep)
    return df.drop_duplicates(subset=cols_existentes, keep=keep)

def imputar_nulos_mediana(df: pd.DataFrame, columna: str, group_col: Optional[str] = None) -> pd.DataFrame:
    """Imputa valores nulos usando la mediana, opcionalmente agrupada por otra columna."""
    if columna not in df.columns:
        return df
    
    if group_col and group_col in df.columns:
        mediana_por_grupo = df.groupby(group_col)[columna].transform('median')
        df[columna] = df[columna].fillna(mediana_por_grupo)
    
    # Si aún quedan nulos (ej. un grupo entero nulo), usar mediana global
    mediana_global = df[columna].median()
    if not pd.isna(mediana_global):
        df[columna] = df[columna].fillna(mediana_global)
    return df

def imputar_nulos_constante(df: pd.DataFrame, columna: str, valor_defecto) -> pd.DataFrame:
    """Imputa valores nulos con una constante dada."""
    if columna in df.columns:
        df[columna] = df[columna].fillna(valor_defecto)
    return df
