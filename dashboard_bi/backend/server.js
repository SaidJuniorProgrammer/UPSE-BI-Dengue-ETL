require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());

// Configuración de la conexión al Data Warehouse
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "ghil3412",
  database: process.env.DB_NAME || "upse_dengue_dw",
  port: process.env.DB_PORT || 3306,
});

db.connect((err) => {
  if (err) throw err;
  console.log(" Conectado exitosamente al Data Warehouse MySQL");
});

function getFilters(req) {
  let parts = [];
  if (req.query.canton) {
    parts.push(`dg.canton = '${req.query.canton}'`);
  }
  if (req.query.anio) {
    parts.push(`dt.anio = ${req.query.anio}`);
  }
  return parts.length > 0 ? "WHERE " + parts.join(" AND ") : "";
}

const cantonCenters = {
  "SANTA ELENA": { lat: -2.2266, lng: -80.8588 },
  "LA LIBERTAD": { lat: -2.2336, lng: -80.9101 },
  SALINAS: { lat: -2.2145, lng: -80.9514 },
};

// --------------------------------------------------------
// ENDPOINT 1: Los 5 KPIs Estratégicos (Calculados en tiempo real)
// --------------------------------------------------------
app.get("/api/kpis", (req, res) => {
  let filter = getFilters(req);
  let subqueryFilter = req.query.canton
    ? `WHERE canton = '${req.query.canton}'`
    : "";

  const query = `
        SELECT 
            SUM(fi.casos_confirmados) AS total_casos,
            ROUND(AVG(fi.espera_promedio_h), 2) AS espera_promedio, 
            ROUND(AVG(fi.pct_stock_meds), 2) AS disponibilidad_farmacias,
            ROUND(AVG(di.camas_ocupadas / di.camas_totales * 100), 2) AS ocupacion_hospitalaria,
            ROUND(AVG(dc.precipitacion_mm), 2) AS precipitacion_promedio,
            ROUND((SUM(fi.casos_confirmados) / (SELECT SUM(poblacion) FROM dim_geografia ${subqueryFilter})) * 100000, 2) AS tasa_incidencia_100k,
            CASE 
                WHEN AVG(dc.precipitacion_mm) > 20.00 AND AVG(dc.temp_maxima_c) > 26.00 THEN 'ALTO'
                WHEN AVG(dc.precipitacion_mm) > 5.00 OR AVG(dc.temp_maxima_c) > 24.00 THEN 'MEDIO'
                ELSE 'BAJO'
            END AS riesgo_climatico
        FROM fact_incidencia fi
        JOIN dim_geografia dg ON fi.id_geografia = dg.id_geografia
        JOIN dim_infraestructura di ON fi.id_infraestructura = di.id_infraestructura
        JOIN dim_clima dc ON fi.id_clima = dc.id_clima
        JOIN dim_tiempo dt ON fi.id_tiempo = dt.id_tiempo
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
app.get("/api/grafico-temporal", (req, res) => {
  let filter = getFilters(req);
  const query = `
        SELECT 
            dt.anio,
            dt.semana_epidem,
            MIN(dt.nombre_mes) AS mes,
            SUM(fi.casos_confirmados) AS casos,
            ROUND(AVG(dc.precipitacion_mm), 2) AS lluvia,
            SUM(fi.alertas_mediaticas) AS alertas
        FROM fact_incidencia fi
        JOIN dim_tiempo dt ON fi.id_tiempo = dt.id_tiempo
        JOIN dim_clima dc ON fi.id_clima = dc.id_clima
        JOIN dim_geografia dg ON fi.id_geografia = dg.id_geografia
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
app.get("/api/grafico-cantones", (req, res) => {
  let filter = getFilters(req);
  const query = `
        SELECT 
            dg.canton, 
            SUM(fi.casos_confirmados) AS casos_totales,
            ROUND((SUM(fi.casos_confirmados) / MAX(dg.poblacion)) * 100000, 2) AS tasa_incidencia_100k
        FROM fact_incidencia fi
        JOIN dim_geografia dg ON fi.id_geografia = dg.id_geografia
        JOIN dim_tiempo dt ON fi.id_tiempo = dt.id_tiempo
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
app.get("/api/grafico-infraestructura", (req, res) => {
  let filter = getFilters(req);
  const query = `
        SELECT 
            di.canton, 
            di.nivel_saturacion, 
            di.medicos_disponibles, 
            SUM(fi.casos_confirmados) as carga_pacientes,
            ROUND(AVG(di.camas_totales), 0) AS camas_totales,
            ROUND(AVG(di.camas_ocupadas), 0) AS camas_ocupadas
        FROM fact_incidencia fi
        JOIN dim_infraestructura di ON fi.id_infraestructura = di.id_infraestructura
        JOIN dim_tiempo dt ON fi.id_tiempo = dt.id_tiempo
        JOIN dim_geografia dg ON fi.id_geografia = dg.id_geografia
        ${filter}
        GROUP BY di.canton, di.nivel_saturacion, di.medicos_disponibles
    `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// --------------------------------------------------------
// ENDPOINT 5: Mapa analítico territorial
// --------------------------------------------------------
app.get("/api/mapa-provincia", (req, res) => {
  let filter = getFilters(req);
  const query = `
        SELECT 
            dg.canton,
            SUM(fi.casos_confirmados) AS casos_totales,
            ROUND((SUM(fi.casos_confirmados) / MAX(dg.poblacion)) * 100000, 2) AS tasa_incidencia_100k,
            ROUND(AVG(dc.precipitacion_mm), 2) AS precipitacion_mm,
            ROUND(AVG(dc.temp_maxima_c), 2) AS temp_maxima_c,
            ROUND(AVG(di.camas_totales), 0) AS camas_totales,
            ROUND(AVG(di.camas_ocupadas), 0) AS camas_ocupadas,
            ROUND(AVG(di.medicos_disponibles), 0) AS medicos_disponibles,
            ROUND(AVG(di.camas_ocupadas / di.camas_totales * 100), 2) AS ocupacion_pct,
            MAX(di.nivel_saturacion) AS nivel_saturacion
        FROM fact_incidencia fi
        JOIN dim_geografia dg ON fi.id_geografia = dg.id_geografia
        JOIN dim_infraestructura di ON fi.id_infraestructura = di.id_infraestructura
        JOIN dim_clima dc ON fi.id_clima = dc.id_clima
        JOIN dim_tiempo dt ON fi.id_tiempo = dt.id_tiempo
        ${filter}
        GROUP BY dg.canton
        ORDER BY casos_totales DESC
    `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).send(err);
    const data = results.map((row) => ({
      ...row,
      ...(cantonCenters[row.canton] || { lat: -2.22, lng: -80.9 }),
    }));
    res.json(data);
  });
});

// Iniciar el servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(
    ` API REST de Inteligencia de Negocios corriendo en http://localhost:${PORT}`,
  );
});
