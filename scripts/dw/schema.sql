-- SCHEMA DEFINITION FOR UPSE DENGUE DATA WAREHOUSE (MySQL)

CREATE DATABASE IF NOT EXISTS upse_dengue_dw;
USE upse_dengue_dw;

-- Drop existing tables to ensure a clean deployment (order matters due to FKs)
DROP TABLE IF EXISTS Fact_Incidencia;
DROP TABLE IF EXISTS Dim_Enfermedad;
DROP TABLE IF EXISTS Dim_Infraestructura;
DROP TABLE IF EXISTS Dim_Clima;
DROP TABLE IF EXISTS Dim_Geografia;
DROP TABLE IF EXISTS Dim_Tiempo;

-- 1. Dim_Tiempo
CREATE TABLE Dim_Tiempo (
    id_tiempo INT PRIMARY KEY, -- Formato YYYYMMDD
    fecha DATE NOT NULL,
    anio INT NOT NULL,
    semana_epidem INT NOT NULL,
    mes INT NOT NULL,
    nombre_mes VARCHAR(20) NOT NULL,
    UNIQUE KEY (fecha)
);

-- 2. Dim_Geografia
CREATE TABLE Dim_Geografia (
    id_geografia INT AUTO_INCREMENT PRIMARY KEY,
    canton VARCHAR(100) NOT NULL UNIQUE,
    provincia VARCHAR(100) NOT NULL,
    poblacion INT NOT NULL
);

-- 2.5 Dim_Enfermedad
CREATE TABLE Dim_Enfermedad (
    id_enfermedad INT AUTO_INCREMENT PRIMARY KEY,
    cie10 VARCHAR(10) NOT NULL UNIQUE,
    nombre_enfermedad VARCHAR(150) NOT NULL,
    categoria_origen VARCHAR(50) NOT NULL, -- Hereditaria, Adquirida, Congénita
    tipo_causa VARCHAR(50) NOT NULL       -- Virus, Bacteria, Hongo, Parásito, Genético, etc.
);

-- 3. Dim_Clima
CREATE TABLE Dim_Clima (
    id_clima INT AUTO_INCREMENT PRIMARY KEY,
    canton VARCHAR(100) NOT NULL,
    semana_epidem INT NOT NULL,
    anio INT NOT NULL,
    precipitacion_mm DECIMAL(5,2) NOT NULL,
    temp_maxima_c DECIMAL(4,2) NOT NULL,
    temp_minima_c DECIMAL(4,2) NOT NULL,
    humedad_relativa DECIMAL(5,2) NOT NULL
);

-- 4. Dim_Infraestructura
CREATE TABLE Dim_Infraestructura (
    id_infraestructura INT AUTO_INCREMENT PRIMARY KEY,
    canton VARCHAR(100) NOT NULL,
    semana_epidem INT NOT NULL,
    anio INT NOT NULL,
    nivel_saturacion VARCHAR(50) NOT NULL,
    camas_totales INT NOT NULL,
    camas_ocupadas INT NOT NULL,
    medicos_disponibles INT NOT NULL,
    pacientes_dengue INT NOT NULL
);

-- 5. Fact_Incidencia
CREATE TABLE Fact_Incidencia (
    id_hecho INT AUTO_INCREMENT PRIMARY KEY,
    id_tiempo INT NOT NULL,
    id_geografia INT NOT NULL,
    id_clima INT NOT NULL,
    id_infraestructura INT NOT NULL,
    id_enfermedad INT NOT NULL,
    casos_confirmados INT NOT NULL DEFAULT 0,
    casos_urbanos INT NOT NULL DEFAULT 0,
    casos_rurales INT NOT NULL DEFAULT 0,
    alertas_mediaticas INT NOT NULL DEFAULT 0,
    pct_stock_meds DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    espera_promedio_h DECIMAL(4,2) NOT NULL DEFAULT 0.00,
    FOREIGN KEY (id_tiempo) REFERENCES Dim_Tiempo(id_tiempo),
    FOREIGN KEY (id_geografia) REFERENCES Dim_Geografia(id_geografia),
    FOREIGN KEY (id_clima) REFERENCES Dim_Clima(id_clima),
    FOREIGN KEY (id_infraestructura) REFERENCES Dim_Infraestructura(id_infraestructura),
    FOREIGN KEY (id_enfermedad) REFERENCES Dim_Enfermedad(id_enfermedad)
);

-- VIEWS FOR KPIs (GOVERNANCE NATIVE IN DW)

-- KPI 1: Tasa de Incidencia Semanal por cada 100,000 habitantes
CREATE OR REPLACE VIEW kpi_tasa_incidencia AS
SELECT 
    dg.canton,
    dg.provincia,
    dt.anio,
    dt.semana_epidem,
    fi.id_enfermedad,
    de.nombre_enfermedad,
    de.categoria_origen,
    de.tipo_causa,
    fi.casos_confirmados,
    fi.casos_urbanos,
    fi.casos_rurales,
    dg.poblacion,
    ROUND((fi.casos_confirmados / dg.poblacion) * 100000, 2) AS tasa_incidencia_100k
FROM Fact_Incidencia fi
JOIN Dim_Geografia dg ON fi.id_geografia = dg.id_geografia
JOIN Dim_Tiempo dt ON fi.id_tiempo = dt.id_tiempo
JOIN Dim_Enfermedad de ON fi.id_enfermedad = de.id_enfermedad;

-- KPI 2: Índice de Riesgo Climático Semanal
CREATE OR REPLACE VIEW kpi_riesgo_climatico AS
SELECT 
    dc.canton,
    dc.anio,
    dc.semana_epidem,
    dc.precipitacion_mm,
    dc.temp_maxima_c,
    CASE 
        WHEN dc.precipitacion_mm > 20.00 AND dc.temp_maxima_c > 26.00 THEN 'ALTO'
        WHEN dc.precipitacion_mm > 5.00 OR dc.temp_maxima_c > 24.00 THEN 'MEDIO'
        ELSE 'BAJO'
    END AS indice_riesgo_climatico
FROM Dim_Clima dc;

-- KPI 3: Disponibilidad Farmacéutica
CREATE OR REPLACE VIEW kpi_disponibilidad_farmaceutica AS
SELECT 
    dg.canton,
    dg.provincia,
    dt.anio,
    dt.semana_epidem,
    ROUND(fi.pct_stock_meds, 2) AS pct_disponibilidad_medicamentos
FROM Fact_Incidencia fi
JOIN Dim_Geografia dg ON fi.id_geografia = dg.id_geografia
JOIN Dim_Tiempo dt ON fi.id_tiempo = dt.id_tiempo;

-- KPI 4: Cobertura de Infraestructura Médica (Casos por cada centro activo / capacidad)
CREATE OR REPLACE VIEW kpi_ocupacion_hospitalaria AS
SELECT 
    di.canton,
    di.anio,
    di.semana_epidem,
    di.camas_totales,
    di.camas_ocupadas,
    ROUND((di.camas_ocupadas / di.camas_totales) * 100, 2) AS tasa_ocupacion_pct
FROM Dim_Infraestructura di;

-- KPI 5: Tasa de Síntomas No Clínicos y Tiempo de Espera Promedio
CREATE OR REPLACE VIEW kpi_tiempos_espera AS
SELECT 
    dg.canton,
    dg.provincia,
    dt.anio,
    dt.semana_epidem,
    ROUND(fi.espera_promedio_h, 2) AS tiempo_espera_promedio_horas
FROM Fact_Incidencia fi
JOIN Dim_Geografia dg ON fi.id_geografia = dg.id_geografia
JOIN Dim_Tiempo dt ON fi.id_tiempo = dt.id_tiempo;
