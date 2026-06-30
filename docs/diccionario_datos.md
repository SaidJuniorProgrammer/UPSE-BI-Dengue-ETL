# Diccionario de Datos - Capa Staging (Parquet)

Este documento detalla las estructuras, esquemas y tipos de datos resultantes en los archivos Parquet generados por el pipeline ETL.

## 1. `stg_clima.parquet`
Variables meteorológicas y climatológicas por cantón de la provincia de Santa Elena.

| Campo | Tipo de Dato | Descripción | Ejemplo |
|---|---|---|---|
| `canton` | string | Cantón oficial según catálogo INEC | `SANTA ELENA` |
| `fecha` | string (ISO 8601) | Fecha de registro climático (`YYYY-MM-DD`) | `2024-05-12` |
| `anio` | integer | Año extraído de la fecha | `2024` |
| `semana` | integer | Semana epidemiológica ISO | `19` |
| `precipitacion_mm` | float | Milímetros de lluvia acumulada en 24h | `14.5` |
| `temp_maxima_c` | float | Temperatura máxima registrada en °C | `31.2` |

---

## 2. `stg_farmacias.parquet`
Inventario y disponibilidad de medicamentos antipiréticos e insumos preventivos.

| Campo | Tipo de Dato | Descripción | Ejemplo |
|---|---|---|---|
| `cadena` | string | Nombre de la cadena farmacéutica | `Fybeca` |
| `canton` | string | Cantón oficial INEC de ubicación | `LA LIBERTAD` |
| `medicamento` | string | Descripción comercial y gramaje del producto | `Paracetamol 500mg Caja` |
| `stock_disponible` | string | Indicador booleano en texto (`SI` / `NO`) | `SI` |
| `cantidad_unidades` | integer | Unidades físicas disponibles en local | `45` |
| `precio_usd` | float | Precio unitario en dólares estadounidenses | `2.50` |

---

## 3. `stg_infraestructura.parquet`
Métricas hospitalarias y capacidad instalada del sistema de salud local.

| Campo | Tipo de Dato | Descripción | Ejemplo |
|---|---|---|---|
| `nombre_centro` | string | Nombre formal de la casa de salud | `Hospital General Liborio Panchana` |
| `canton` | string | Cantón de ubicación | `SANTA ELENA` |
| `camas_totales` | integer | Capacidad máxima de hospitalización | `120` |
| `camas_ocupadas` | integer | Camas ocupadas al corte | `98` |
| `pacientes_dengue` | integer | Pacientes internados con cuadro de dengue | `14` |
| `tiempo_espera_horas`| float | Tiempo promedio estimado para triaje/consulta | `2.3` |
| `nivel_saturacion` | string | Categoría evaluada (`BAJA`, `MEDIA`, `ALTA`) | `ALTA` |

---

## 4. `stg_casos_dengue.parquet`
Estadísticas oficiales consolidadas de las gacetas epidemiológicas del Ministerio de Salud.

| Campo | Tipo de Dato | Descripción | Ejemplo |
|---|---|---|---|
| `canton` | string | Cantón oficial de residencia | `SALINAS` |
| `anio` | integer | Año del reporte | `2024` |
| `semana_epidemiologica`| integer| Semana de reporte | `14` |
| `casos_confirmados` | integer | Casos confirmados por laboratorio o nexo | `22` |
| `casos_sospechosos` | integer | Pacientes sintomáticos probables | `45` |
| `serotipo_detectado` | string | Serotipo predominante (`DENV-1`, etc.) | `DENV-2` |

---

## 5. `stg_encuesta.parquet`
Mapeo de percepción ciudadana y atención en centros médicos.

| Campo | Tipo de Dato | Descripción | Ejemplo |
|---|---|---|---|
| `id_encuesta` | string | Identificador único anonimizado | `ENC-0042` |
| `canton` | string | Cantón oficial INEC del ciudadano | `LA LIBERTAD` |
| `edad` | integer | Edad en años cumplidos (depurado <= 105) | `34` |
| `tiempo_espera_horas` | float | Horas reportadas de espera médica | `1.8` |
