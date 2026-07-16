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
  if (req.query.provincia) {
    parts.push(`dg.provincia = '${req.query.provincia}'`);
  }
  if (req.query.canton) {
    parts.push(`dg.canton = '${req.query.canton}'`);
  }
  if (req.query.anio) {
    parts.push(`dt.anio = ${req.query.anio}`);
  }
  if (req.query.enfermedad) {
    parts.push(`de.nombre_enfermedad = '${req.query.enfermedad}'`);
  }
  if (req.query.causa) {
    parts.push(`de.tipo_causa = '${req.query.causa}'`);
  }
  if (req.query.origen) {
    parts.push(`de.categoria_origen = '${req.query.origen}'`);
  }
  return parts.length > 0 ? "WHERE " + parts.join(" AND ") : "";
}

const cantonCenters = {
  "SANTA ELENA": { lat: -2.2266, lng: -80.8588 },
  "LA LIBERTAD": { lat: -2.2336, lng: -80.9101 },
  SALINAS: { lat: -2.2145, lng: -80.9514 },
  GUAYAQUIL: { lat: -2.1894, lng: -79.8890 },
  SAMBORONDON: { lat: -2.0158, lng: -79.8808 },
  DURAN: { lat: -2.1691, lng: -79.8256 },
  QUITO: { lat: -0.1807, lng: -78.4678 },
  CUENCA: { lat: -2.9001, lng: -79.0059 },
  AMBATO: { lat: -1.2491, lng: -78.6168 },
  LOJA: { lat: -3.9931, lng: -79.2042 },
  PORTOVIEJO: { lat: -1.0546, lng: -80.4542 },
  MANTA: { lat: -0.9621, lng: -80.7127 },
  IBARRA: { lat: 0.3517, lng: -78.1223 },
  ESMERALDAS: { lat: 0.9682, lng: -79.6517 },
  MACHALA: { lat: -3.2581, lng: -79.9553 },
  RIOBAMBA: { lat: -1.6731, lng: -78.6530 },
  "SANTO DOMINGO": { lat: -0.2530, lng: -79.1754 },
  TENA: { lat: -0.9938, lng: -77.8129 },
  PUYO: { lat: -1.4821, lng: -77.9991 },
  LATACUNGA: { lat: -0.9316, lng: -78.6056 },
  AZOGUES: { lat: -2.7396, lng: -78.8486 },
  GUARANDA: { lat: -1.5905, lng: -79.0024 },
  TULCAN: { lat: 0.8119, lng: -77.7176 },
  MACAS: { lat: -2.3087, lng: -78.1184 },
  ZAMORA: { lat: -4.0622, lng: -78.9566 },
  "SAN CRISTOBAL": { lat: -0.9016, lng: -89.6101 },
  "LAGO AGRIO": { lat: 0.0847, lng: -76.8828 },
  COCA: { lat: -0.4665, lng: -76.9872 }
};

const provinceCenters = {
  AZUAY: { lat: -2.90, lng: -79.00 },
  BOLIVAR: { lat: -1.60, lng: -79.00 },
  CANAR: { lat: -2.74, lng: -78.85 },
  CARCHI: { lat: 0.81, lng: -77.72 },
  COTOPAXI: { lat: -0.93, lng: -78.61 },
  CHIMBORAZO: { lat: -1.67, lng: -78.65 },
  "EL ORO": { lat: -3.26, lng: -79.96 },
  ESMERALDAS: { lat: 0.97, lng: -79.65 },
  GUAYAS: { lat: -2.19, lng: -79.89 },
  IMBABURA: { lat: 0.35, lng: -78.12 },
  LOJA: { lat: -3.99, lng: -79.20 },
  "LOS RIOS": { lat: -1.80, lng: -79.53 },
  MANABI: { lat: -1.05, lng: -80.45 },
  "MORONA SANTIAGO": { lat: -2.31, lng: -78.12 },
  NAPO: { lat: -0.99, lng: -77.81 },
  PASTAZA: { lat: -1.48, lng: -78.00 },
  PICHINCHA: { lat: -0.18, lng: -78.47 },
  ORELLANA: { lat: -0.47, lng: -76.99 },
  SUCUMBIOS: { lat: 0.08, lng: -76.88 },
  TUNGURAHUA: { lat: -1.25, lng: -78.62 },
  "ZAMORA CHINCHIPE": { lat: -4.06, lng: -78.96 },
  GALAPAGOS: { lat: -0.90, lng: -89.61 },
  "SANTO DOMINGO DE LOS TSACILAS": { lat: -0.25, lng: -79.18 },
  "SANTA ELENA": { lat: -2.23, lng: -80.88 }
};

// --------------------------------------------------------
// NUEVO ENDPOINT: Catálogo de Enfermedades
// --------------------------------------------------------
app.get("/api/enfermedades", (req, res) => {
  db.query("SELECT DISTINCT nombre_enfermedad, categoria_origen, tipo_causa, cie10 FROM dim_enfermedad ORDER BY nombre_enfermedad", (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// --------------------------------------------------------
// NUEVO ENDPOINT: Catálogo de Geografía
// --------------------------------------------------------
app.get("/api/geografia", (req, res) => {
  db.query("SELECT canton, provincia, poblacion FROM dim_geografia ORDER BY provincia, canton", (err, results) => {
    if (err) return res.status(500).send(err);
    const geo = {};
    results.forEach(row => {
      const prov = row.provincia.toUpperCase();
      if (!geo[prov]) geo[prov] = [];
      geo[prov].push({ canton: row.canton, poblacion: row.poblacion });
    });
    res.json(geo);
  });
});

// --------------------------------------------------------
// ENDPOINT 1: Los 5 KPIs Estratégicos (Calculados en tiempo real)
// --------------------------------------------------------
app.get("/api/kpis", (req, res) => {
  let filter = getFilters(req);
  
  let subqueryParts = [];
  if (req.query.canton) subqueryParts.push(`canton = '${req.query.canton}'`);
  if (req.query.provincia) subqueryParts.push(`provincia = '${req.query.provincia}'`);
  let subqueryFilter = subqueryParts.length > 0 ? 'WHERE ' + subqueryParts.join(' AND ') : '';

  const query = `
        SELECT 
            SUM(fi.casos_confirmados) AS total_casos,
            SUM(fi.casos_urbanos) AS total_casos_urbanos,
            SUM(fi.casos_rurales) AS total_casos_rurales,
            ROUND(AVG(fi.espera_promedio_h), 2) AS espera_promedio, 
            ROUND(AVG(fi.pct_stock_meds), 2) AS disponibilidad_farmacias,
            ROUND(AVG(di.camas_ocupadas / di.camas_totales * 100), 2) AS ocupacion_hospitalaria,
            ROUND(AVG(dc.precipitacion_mm), 2) AS precipitacion_promedio,
            ROUND((SUM(fi.casos_confirmados) / COALESCE((SELECT SUM(poblacion) FROM dim_geografia ${subqueryFilter}), 17500000)) * 100000, 2) AS tasa_incidencia_100k,
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
        JOIN dim_enfermedad de ON fi.id_enfermedad = de.id_enfermedad
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
        JOIN dim_enfermedad de ON fi.id_enfermedad = de.id_enfermedad
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
// ENDPOINT 3: Gráfico de Barras (Comparativa por Cantón / Provincia)
// --------------------------------------------------------
app.get("/api/grafico-cantones", (req, res) => {
  let filter = getFilters(req);
  
  // If a canton is selected, we group by canton anyway, but if a province is selected we can compare its cantons.
  // If no province is selected (national view), we group by PROVINCE instead of canton to keep the chart readable!
  const groupByField = req.query.provincia || req.query.canton ? "dg.canton" : "dg.provincia";

  const query = `
        SELECT 
            ${groupByField} AS canton, 
            SUM(fi.casos_confirmados) AS casos_totales,
            ROUND((SUM(fi.casos_confirmados) / MAX(dg.poblacion)) * 100000, 2) AS tasa_incidencia_100k
        FROM fact_incidencia fi
        JOIN dim_geografia dg ON fi.id_geografia = dg.id_geografia
        JOIN dim_tiempo dt ON fi.id_tiempo = dt.id_tiempo
        JOIN dim_enfermedad de ON fi.id_enfermedad = de.id_enfermedad
        ${filter}
        GROUP BY ${groupByField}
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
  
  const groupByField = req.query.provincia || req.query.canton ? "di.canton" : "dg.provincia";
  
  const query = `
        SELECT 
            ${groupByField} AS canton, 
            di.nivel_saturacion, 
            di.medicos_disponibles, 
            SUM(fi.casos_confirmados) as carga_pacientes,
            ROUND(AVG(di.camas_totales), 0) AS camas_totales,
            ROUND(AVG(di.camas_ocupadas), 0) AS camas_ocupadas
        FROM fact_incidencia fi
        JOIN dim_infraestructura di ON fi.id_infraestructura = di.id_infraestructura
        JOIN dim_tiempo dt ON fi.id_tiempo = dt.id_tiempo
        JOIN dim_geografia dg ON fi.id_geografia = dg.id_geografia
        JOIN dim_enfermedad de ON fi.id_enfermedad = de.id_enfermedad
        ${filter}
        GROUP BY ${groupByField}, di.nivel_saturacion, di.medicos_disponibles
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
  
  // If national view, show centers by canton, otherwise show cantons within province
  const query = `
        SELECT 
            dg.canton,
            dg.provincia,
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
        JOIN dim_enfermedad de ON fi.id_enfermedad = de.id_enfermedad
        ${filter}
        GROUP BY dg.canton, dg.provincia
        ORDER BY casos_totales DESC
    `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).send(err);
    
    const data = results.map((row, index) => {
      let coords = cantonCenters[row.canton.toUpperCase()];
      if (!coords) {
        const provCenter = provinceCenters[row.provincia.toUpperCase()] || { lat: -2.22, lng: -80.9 };
        // Add dynamic offset so markers in same province don't overlap
        const offsetLat = ((index % 5) - 2) * 0.05;
        const offsetLng = ((Math.floor(index / 5) % 5) - 2) * 0.05;
        coords = { lat: provCenter.lat + offsetLat, lng: provCenter.lng + offsetLng };
      }
      return {
        ...row,
        ...coords
      };
    });
    
    res.json(data);
  });
});

// --------------------------------------------------------
// NUEVOS ENDPOINTS PARA ANALISIS AVANZADO
// --------------------------------------------------------
app.get("/api/grafico-etiologia", (req, res) => {
  let filter = getFilters(req);
  const query = `
    SELECT 
      de.tipo_causa,
      de.categoria_origen,
      SUM(fi.casos_confirmados) AS casos
    FROM fact_incidencia fi
    JOIN dim_enfermedad de ON fi.id_enfermedad = de.id_enfermedad
    JOIN dim_geografia dg ON fi.id_geografia = dg.id_geografia
    JOIN dim_tiempo dt ON fi.id_tiempo = dt.id_tiempo
    ${filter}
    GROUP BY de.tipo_causa, de.categoria_origen
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

app.get("/api/alertas-criticas", (req, res) => {
  const query = `
    SELECT 
      dg.canton,
      dg.provincia,
      ROUND(AVG(di.camas_ocupadas / di.camas_totales * 100), 2) AS ocupacion_pct,
      ROUND(AVG(fi.pct_stock_meds), 2) AS stock_pct,
      ROUND((SUM(fi.casos_confirmados) / MAX(dg.poblacion)) * 100000, 2) AS tasa_incidencia_100k
    FROM fact_incidencia fi
    JOIN dim_geografia dg ON fi.id_geografia = dg.id_geografia
    JOIN dim_infraestructura di ON fi.id_infraestructura = di.id_infraestructura
    JOIN dim_tiempo dt ON fi.id_tiempo = dt.id_tiempo
    GROUP BY dg.canton, dg.provincia
    HAVING ocupacion_pct > 80.0 OR stock_pct < 60.0 OR tasa_incidencia_100k > 150.0
    ORDER BY tasa_incidencia_100k DESC
    LIMIT 15
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// Iniciar el servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(
    ` API REST de Inteligencia de Negocios corriendo en http://localhost:${PORT}`,
  );
});
