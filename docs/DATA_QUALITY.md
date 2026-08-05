# Control de Calidad de Datos (Data Quality)

Este documento describe detalladamente el framework de calidad de datos (Data Quality) implementado en el pipeline ETL de la plataforma de Inteligencia de Negocios para la Gestión de Brotes de Dengue. El objetivo principal es asegurar la integridad, consistencia y validez de la información recolectada de múltiples fuentes heterogéneas antes de su ingesta en el Data Warehouse.

---

## 1. Reglas de Control de Duplicados
Para evitar la sobreestimación de casos e indicadores médicos y climáticos, se aplican validaciones de unicidad basadas en claves compuestas específicas para cada dominio de datos:

| Origen / Dominio | Clave Compuesta de Unicidad | Acción ante Duplicados |
| :--- | :--- | :--- |
| **Clima** | `canton` + `fecha` | Conservar el registro más reciente (última lectura). |
| **Farmacias** | `canton` + `cadena` + `medicamento` + `fecha_extraccion` | Eliminación de duplicados exactos y retención de la última actualización de precio/stock. |
| **Infraestructura** | `nombre_centro` + `fecha_corte` | Sobrescribir registros anteriores para el mismo centro de salud en la misma fecha. |
| **Casos Oficiales** | `canton` + `cie10` + `anio` + `semana_epidemiologica` | Sumarización de casos si existen registros idénticos o retención del registro principal. |
| **Encuestas de Percepción** | `id_encuesta` | Exclusión inmediata de envíos duplicados con el mismo identificador único. |

---

## 2. Tratamiento de Valores Nulos e Imputación
La presencia de valores nulos o vacíos provenientes de scraping o APIs se resuelve mediante dos estrategias principales para no sesgar las métricas globales:

### A. Imputación por Mediana Agrupada
Se utiliza para variables numéricas continuas donde un promedio simple podría verse afectado por valores extremos o atípicos:
* **Medicamentos (`precio_usd`):** Si el precio de un fármaco no es capturado por el scrapers, se le asigna la mediana del precio de ese mismo producto a nivel provincial o nacional.
* **Clima (`temp_maxima_c`, `temp_minima_c`, `humedad_relativa`):** En caso de lecturas meteorológicas fallidas, se imputa el valor mediano histórico registrado para ese cantón específico durante el mes en curso.
* **Tiempos de Espera (`tiempo_espera_horas`):** Los valores vacíos de encuestas de atención de emergencias se completan utilizando la mediana histórica de tiempos de espera reportados en el mismo cantón.

### B. Imputación Constante (Valores Fijos)
Se aplica cuando la ausencia del dato representa un estado o categoría conocida:
* **Inventario (`cantidad_unidades`):** Se asume que el valor nulo significa que no hay stock disponible, por lo que se imputa con `0`.
* **Identificación del Virus (`serotipo_detectado`):** Si no se reportó el serotipo específico del virus del dengue en el laboratorio, se le asigna la cadena `"No identificado"`.

---

## 3. Estandarización Geográfica (Catálogo INEC)
Uno de los mayores desafíos en la integración de datos del Ecuador es la inconsistencia en los nombres de las demarcaciones político-territoriales. El pipeline valida y homologa todos los campos geográficos contra el catálogo oficial del **Instituto Nacional de Estadística y Censos (INEC)**, que contiene las 24 provincias y los 220+ cantones oficiales.

El validador de calidad aplica las siguientes transformaciones de limpieza:
1. Conversión de todo el texto a mayúsculas sostenidas.
2. Eliminación de tildes, caracteres especiales y dobles espacios.
3. Conciliación y mapeo de sinónimos comunes:

| Entrada Cruda (Raw) | Valor Homologado (INEC Staging) |
| :--- | :--- |
| `ST. ELENA`, `SANTAELENA`, `santa elena` | **SANTA ELENA** |
| `LIBERTAD`, `LALIBERTAD`, `la libertad` | **LA LIBERTAD** |
| `BABAHOYO`, `BABA_HOYO` | **BABAHOYO** |
| `UIO`, `quito` | **QUITO** |
| `GYE`, `guayaquil` | **GUAYAQUIL** |

Cualquier registro cuyo nombre geográfico no pueda ser mapeado con un margen de confianza aceptable al catálogo INEC se descarta y se envía al log de errores para su revisión manual.

---

## 4. Registro Centralizado de Errores e Ingesta
El pipeline de calidad no detiene su ejecución ante registros anómalos o corruptos, sino que los aísla para auditoría:
* **Log Tabular de Excepciones (`staging/error_log.csv`):** Guarda la fecha del incidente, el archivo fuente, el identificador del registro, la columna causante del error y una descripción del problema (ej. *"Formato de fecha inválido"*, *"Cantón no identificado en catálogo INEC"*).
* **Logs de Sistema (`logs/quality.log`):** Trazas en tiempo de ejecución con marcas de tiempo para seguimiento de rendimiento y depuración.
* **Métricas Globales (`staging/reporte_calidad_*.json`):** Al final de cada corrida, se genera un archivo de auditoría resumido que reporta:
  - Total de registros procesados por fuente.
  - Cantidad y porcentaje de registros limpios.
  - Cantidad y porcentaje de registros corregidos (imputados/estandarizados).
  - Cantidad de registros descartados.
