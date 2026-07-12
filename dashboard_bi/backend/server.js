const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());

// Configuración de la conexión a tu Data Warehouse local
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'upse_dengue_dw'
});

db.connect(err => {
    if (err) throw err;
    console.log(' Conectado exitosamente al Data Warehouse MySQL');
});

// --------------------------------------------------------
// ENDPOINT 1: Los 5 KPIs Estratégicos (Calculados en tiempo real)
// --------------------------------------------------------
app.get('/api/kpis', (req, res) => {
    let filter = req.query.canton ? `WHERE dg.canton = '${req.query.canton}'` : '';
    
    const query = `
        SELECT 
            SUM(fi.casos_confirmados) AS total_casos,
            ROUND(AVG(fi.espera_promedio_h), 2) AS espera_promedio, 
            ROUND(AVG(fi.pct_stock_meds), 2) AS disponibilidad_farmacias,
            ROUND(AVG(di.camas_ocupadas / di.camas_totales * 100), 2) AS ocupacion_hospitalaria,
            ROUND(AVG(dc.precipitacion_mm), 2) AS precipitacion_promedio
        FROM Fact_Incidencia fi
        JOIN Dim_Geografia dg ON fi.id_geografia = dg.id_geografia
        JOIN Dim_Infraestructura di ON fi.id_infraestructura = di.id_infraestructura
        JOIN Dim_Clima dc ON fi.id_clima = dc.id_clima
        ${filter}
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results[0]);
    });
});

// --------------------------------------------------------
// ENDPOINT 2: Gráfico de Líneas (Serie Temporal de Casos vs Clima)
// --------------------------------------------------------
app.get('/api/grafico-temporal', (req, res) => {
    const query = `
        SELECT dt.semana_epidem, SUM(fi.casos_confirmados) AS casos, ROUND(AVG(dc.precipitacion_mm), 2) AS lluvia
        FROM Fact_Incidencia fi
        JOIN Dim_Tiempo dt ON fi.id_tiempo = dt.id_tiempo
        JOIN Dim_Clima dc ON fi.id_clima = dc.id_clima
        GROUP BY dt.semana_epidem
        ORDER BY dt.semana_epidem ASC
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
    const query = `
        SELECT dg.canton, SUM(fi.casos_confirmados) AS casos_totales
        FROM Fact_Incidencia fi
        JOIN Dim_Geografia dg ON fi.id_geografia = dg.id_geografia
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
    const query = `
        SELECT di.canton, di.nivel_saturacion, di.medicos_disponibles, SUM(fi.casos_confirmados) as carga_pacientes
        FROM Fact_Incidencia fi
        JOIN Dim_Infraestructura di ON fi.id_infraestructura = di.id_infraestructura
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