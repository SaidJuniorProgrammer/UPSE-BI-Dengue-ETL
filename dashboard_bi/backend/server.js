const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());

// Configuración de la conexión a tu Data Warehouse local
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'ghil3412', 
    database: 'upse_dengue_dw'
});

db.connect(err => {
    if (err) throw err;
    console.log(' Conectado exitosamente al Data Warehouse MySQL');
});

function getFilters(req) {
    let parts = [];
    if (req.query.canton) {
        parts.push(`dg.canton = '${req.query.canton}'`);
    }
    if (req.query.anio) {
        parts.push(`dt.anio = ${req.query.anio}`);
    }
    return parts.length > 0 ? 'WHERE ' + parts.join(' AND ') : '';
}

// --------------------------------------------------------
// ENDPOINT 1: Los 5 KPIs Estratégicos (Calculados en tiempo real)
// --------------------------------------------------------
app.get('/api/kpis', (req, res) => {
    let filter = getFilters(req);
    let subqueryFilter = req.query.canton ? `WHERE canton = '${req.query.canton}'` : '';
    
    const query = `
        SELECT 
            SUM(fi.casos_confirmados) AS total_casos,
            ROUND(AVG(fi.espera_promedio_h), 2) AS espera_promedio, 
            ROUND(AVG(fi.pct_stock_meds), 2) AS disponibilidad_farmacias,
            ROUND(AVG(di.camas_ocupadas / di.camas_totales * 100), 2) AS ocupacion_hospitalaria,
            ROUND(AVG(dc.precipitacion_mm), 2) AS precipitacion_promedio,
            ROUND((SUM(fi.casos_confirmados) / (SELECT SUM(poblacion) FROM Dim_Geografia ${subqueryFilter})) * 100000, 2) AS tasa_incidencia_100k,
            CASE 
                WHEN AVG(dc.precipitacion_mm) > 20.00 AND AVG(dc.temp_maxima_c) > 26.00 THEN 'ALTO'
                WHEN AVG(dc.precipitacion_mm) > 5.00 OR AVG(dc.temp_maxima_c) > 24.00 THEN 'MEDIO'
                ELSE 'BAJO'
            END AS riesgo_climatico
        FROM Fact_Incidencia fi
        JOIN Dim_Geografia dg ON fi.id_geografia = dg.id_geografia
        JOIN Dim_Infraestructura di ON fi.id_infraestructura = di.id_infraestructura
        JOIN Dim_Clima dc ON fi.id_clima = dc.id_clima
        JOIN Dim_Tiempo dt ON fi.id_tiempo = dt.id_tiempo
        ${filter}
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results[0]);
    });
});

// --------------------------------------------------------
// ENDPOINT 2: Gráfico de Líneas (Serie Temporal de Casos vs Clima vs Alertas)
// --------------------------------------------------------
app.get('/api/grafico-temporal', (req, res) => {
    let filter = getFilters(req);
    const query = `
        SELECT 
            dt.anio,
            dt.semana_epidem,
            MIN(dt.nombre_mes) AS mes,
            SUM(fi.casos_confirmados) AS casos,
            ROUND(AVG(dc.precipitacion_mm), 2) AS lluvia,
            SUM(fi.alertas_mediaticas) AS alertas
        FROM Fact_Incidencia fi
        JOIN Dim_Tiempo dt ON fi.id_tiempo = dt.id_tiempo
        JOIN Dim_Clima dc ON fi.id_clima = dc.id_clima
        JOIN Dim_Geografia dg ON fi.id_geografia = dg.id_geografia
        ${filter}
        GROUP BY dt.anio, dt.semana_epidem
        ORDER BY dt.anio ASC, dt.semana_epidem ASC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// --------------------------------------------------------
// ENDPOINT 3: Gráfico de Barras (Comparativa por Cantón)
// --------------------------------------------------------
app.get('/api/grafico-cantones', (req, res) => {
    let filter = getFilters(req);
    const query = `
        SELECT 
            dg.canton, 
            SUM(fi.casos_confirmados) AS casos_totales,
            ROUND((SUM(fi.casos_confirmados) / MAX(dg.poblacion)) * 100000, 2) AS tasa_incidencia_100k
        FROM Fact_Incidencia fi
        JOIN Dim_Geografia dg ON fi.id_geografia = dg.id_geografia
        JOIN Dim_Tiempo dt ON fi.id_tiempo = dt.id_tiempo
        ${filter}
        GROUP BY dg.canton
        ORDER BY casos_totales DESC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// --------------------------------------------------------
// ENDPOINT 4: Gráfico de Dispersión/Radar (Infraestructura Médica)
// --------------------------------------------------------
app.get('/api/grafico-infraestructura', (req, res) => {
    let filter = getFilters(req);
    const query = `
        SELECT 
            di.canton, 
            di.nivel_saturacion, 
            di.medicos_disponibles, 
            SUM(fi.casos_confirmados) as carga_pacientes,
            ROUND(AVG(di.camas_totales), 0) AS camas_totales,
            ROUND(AVG(di.camas_ocupadas), 0) AS camas_ocupadas
        FROM Fact_Incidencia fi
        JOIN Dim_Infraestructura di ON fi.id_infraestructura = di.id_infraestructura
        JOIN Dim_Tiempo dt ON fi.id_tiempo = dt.id_tiempo
        JOIN Dim_Geografia dg ON fi.id_geografia = dg.id_geografia
        ${filter}
        GROUP BY di.canton, di.nivel_saturacion, di.medicos_disponibles
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Iniciar el servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(` API REST de Inteligencia de Negocios corriendo en http://localhost:${PORT}`);
});