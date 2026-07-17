# Diccionario de Datos - Capa Staging (Parquet) - Multipatología Nacional

Este documento detalla las estructuras, esquemas y tipos de datos de los archivos Parquet generados por el pipeline ETL asíncrono para el monitoreo nacional.

## 1. `stg_clima.parquet`
Variables meteorológicas y climatológicas consolidadas por cantón y semana epidemiológica en Ecuador.

| Campo | Tipo de Dato | Descripción | Ejemplo |
|---|---|---|---|
| `canton` | string | Cantón oficial según catálogo INEC | `CHONE` |
| `provincia` | string | Provincia correspondiente | `MANABI` |
| `fecha` | string (ISO 8601) | Fecha de registro climático (`YYYY-MM-DD`) | `2024-05-12` |
| `anio` | integer | Año extraído de la fecha | `2024` |
| `semana` | integer | Semana epidemiológica ISO | `19` |
| `precipitacion_mm` | float | Milímetros de lluvia acumulada semanal | `85.5` |
| `temp_maxima_c` | float | Temperatura máxima registrada en °C | `31.2` |
| `temp_minima_c` | float | Temperatura mínima registrada en °C | `22.4` |
| `humedad_relativa` | float | Humedad relativa promedio en % | `82.0` |

---

## 2. `stg_farmacias.parquet`
Inventario de medicamentos antipiréticos, antibióticos e insumos preventivos del MSP y redes privadas.

| Campo | Tipo de Dato | Descripción | Ejemplo |
|---|---|---|---|
| `cadena` | string | Nombre de la cadena farmacéutica o red MSP | `Farmacias Cruz Azul` |
| `canton` | string | Cantón oficial INEC de ubicación | `LA LIBERTAD` |
| `provincia` | string | Provincia de ubicación | `SANTA ELENA` |
| `medicamento` | string | Descripción comercial y tipo de insumo | `Paracetamol 500mg` |
| `stock_disponible` | string | Indicador booleano en texto (`SI` / `NO`) | `SI` |
| `cantidad_unidades` | integer | Unidades físicas disponibles | `120` |
| `precio_usd` | float | Precio unitario en dólares | `0.15` |

---

## 3. `stg_infraestructura.parquet`
Métricas hospitalarias, camas y saturación del sistema de salud a nivel cantonal.

| Campo | Tipo de Dato | Descripción | Ejemplo |
|---|---|---|---|
| `nombre_centro` | string | Nombre formal del centro médico / hospital | `Hospital General Rodríguez Zambrano` |
| `canton` | string | Cantón de ubicación | `MANTA` |
| `provincia` | string | Provincia de ubicación | `MANABI` |
| `camas_totales` | integer | Capacidad máxima de hospitalización | `150` |
| `camas_ocupadas` | integer | Camas ocupadas al corte semanal | `128` |
| `medicos_disponibles`| integer| Personal médico activo en la semana | `24` |
| `tiempo_espera_horas`| float | Tiempo promedio para triaje o atención | `2.3` |
| `nivel_saturacion` | string | Categoría evaluada (`BAJA`, `MEDIA`, `ALTA`) | `ALTA` |

---

## 4. `stg_casos_dengue.parquet` (Casos Multipatología)
Estadísticas consolidadas de las gacetas epidemiológicas y registros del Ministerio de Salud (MSP) para las 100+ patologías.

| Campo | Tipo de Dato | Descripción | Ejemplo |
|---|---|---|---|
| `canton` | string | Cantón oficial INEC de residencia | `SALINAS` |
| `provincia` | string | Provincia de residencia | `SANTA ELENA` |
| `cie10` | string | Código CIE-10 de clasificación internacional | `A90` |
| `nombre_enfermedad`| string | Nombre común o clínico de la patología | `Dengue clásico` |
| `tipo_causa` | string | Origen etiológico (Virus, Bacteria, Hongo, Parásito, Genético) | `Virus` |
| `categoria_origen` | string | Modo de adquisición (Adquirida, Hereditaria, Congénita) | `Adquirida` |
| `anio` | integer | Año del reporte | `2024` |
| `semana_epidemiologica`| integer| Semana de reporte epidemiológico | `14` |
| `casos_confirmados` | integer | Casos confirmados por nexo o laboratorio | `22` |
| `casos_urbanos` | integer | Subtotal de casos en zona urbana | `15` |
| `casos_rurales` | integer | Subtotal de casos en zona rural | `7` |

---

## 5. `stg_encuesta.parquet`
Mapeo de percepción ciudadana y reportes directos sobre la red asistencial.

| Campo | Tipo de Dato | Descripción | Ejemplo |
|---|---|---|---|
| `id_encuesta` | string | Identificador único de encuesta | `ENC-1082` |
| `canton` | string | Cantón de residencia del encuestado | `QUITO` |
| `provincia` | string | Provincia del encuestado | `PICHINCHA` |
| `edad` | integer | Edad del encuestado | `45` |
| `tiempo_espera_horas`| float | Tiempo de espera reportado en emergencias | `3.5` |
