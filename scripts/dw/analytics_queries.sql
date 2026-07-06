-- =======================================================================
-- CONSULTAS ANALÍTICAS - ENTREGABLE 4
-- =======================================================================

USE upse_dengue_dw;

-- =======================================================================
-- PREGUNTA PRINCIPAL:
-- Correlación entre anomalías climáticas, infraestructura médica y disponibilidad de insumos
-- versus la tasa de incidencia de casos de Dengue.
-- =======================================================================
SELECT 
    dg.canton,
    dt.anio,
    dt.semana_epidem,
    fi.casos_confirmados,
    ROUND((fi.casos_confirmados / dg.poblacion) * 100000, 2) AS tasa_incidencia_100k,
    ROUND(dc.temp_maxima_c, 2) AS temp_maxima,
    ROUND(dc.precipitacion_mm, 2) AS precipitacion,
    di.nivel_saturacion,
    ROUND(fi.pct_stock_meds, 2) AS disponibilidad_meds_pct
FROM Fact_Incidencia fi
JOIN Dim_Geografia dg ON fi.id_geografia = dg.id_geografia
JOIN Dim_Tiempo dt ON fi.id_tiempo = dt.id_tiempo
JOIN Dim_Clima dc ON fi.id_clima = dc.id_clima
JOIN Dim_Infraestructura di ON fi.id_infraestructura = di.id_infraestructura
ORDER BY fi.casos_confirmados DESC;


-- =======================================================================
-- PREGUNTA SECUNDARIA 1 (Uso de Función de Ventana LAG):
-- Relación histórica entre picos de precipitación mensual y aumento de casos 
-- en el mes inmediatamente posterior.
-- =======================================================================
WITH Mensualizado AS (
    SELECT 
        dg.canton,
        dt.anio,
        dt.mes,
        dt.nombre_mes,
        SUM(fi.casos_confirmados) AS total_casos,
        AVG(dc.precipitacion_mm) AS promedio_precipitacion_mensual
    FROM Fact_Incidencia fi
    JOIN Dim_Geografia dg ON fi.id_geografia = dg.id_geografia
    JOIN Dim_Tiempo dt ON fi.id_tiempo = dt.id_tiempo
    JOIN Dim_Clima dc ON fi.id_clima = dc.id_clima
    GROUP BY dg.canton, dt.anio, dt.mes, dt.nombre_mes
)
SELECT 
    canton,
    anio,
    nombre_mes,
    promedio_precipitacion_mensual AS precip_mes_actual,
    total_casos AS casos_mes_actual,
    -- Obtener la precipitación del mes anterior
    LAG(promedio_precipitacion_mensual, 1) OVER (PARTITION BY canton ORDER BY anio, mes) AS precip_mes_anterior,
    -- Comparación porcentual de incremento
    ROUND(
        ((total_casos - LAG(total_casos, 1) OVER (PARTITION BY canton ORDER BY anio, mes)) / 
        NULLIF(LAG(total_casos, 1) OVER (PARTITION BY canton ORDER BY anio, mes), 0)) * 100, 
        2
    ) AS pct_incremento_casos
FROM Mensualizado
ORDER BY canton, anio, mes;


-- =======================================================================
-- PREGUNTA SECUNDARIA 2:
-- Cantones con mayor déficit de infraestructura médica en proporción a su tasa de incidencia.
-- =======================================================================
SELECT 
    dg.canton,
    SUM(fi.casos_confirmados) AS total_casos,
    ROUND(AVG(di.camas_ocupadas / di.camas_totales * 100), 2) AS ocupacion_hospitalaria_pct,
    AVG(di.medicos_disponibles) AS promedio_medicos_disp,
    MAX(di.nivel_saturacion) AS saturacion_maxima_registrada,
    ROUND((SUM(fi.casos_confirmados) / dg.poblacion) * 100000, 2) AS tasa_incidencia_acumulada_100k
FROM Fact_Incidencia fi
JOIN Dim_Geografia dg ON fi.id_geografia = dg.id_geografia
JOIN Dim_Infraestructura di ON fi.id_infraestructura = di.id_infraestructura
GROUP BY dg.canton, dg.poblacion
ORDER BY tasa_incidencia_acumulada_100k DESC;


-- =======================================================================
-- PREGUNTA SECUNDARIA 3:
-- Fluctuación de la disponibilidad de medicamentos en farmacias durante las semanas 
-- de mayor nivel de contagio.
-- =======================================================================
SELECT 
    dt.anio,
    dt.semana_epidem,
    SUM(fi.casos_confirmados) AS total_casos_provincial,
    ROUND(AVG(fi.pct_stock_meds), 2) AS disponibilidad_farmaceutica_promedio_pct,
    ROUND(AVG(fi.espera_promedio_h), 2) AS tiempo_espera_promedio_h
FROM Fact_Incidencia fi
JOIN Dim_Tiempo dt ON fi.id_tiempo = dt.id_tiempo
GROUP BY dt.anio, dt.semana_epidem
ORDER BY total_casos_provincial DESC;
