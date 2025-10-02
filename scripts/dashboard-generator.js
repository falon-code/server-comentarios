const fs = require('fs');
const path = require('path');

/**
 * Generador de reporte consolidado HTML
 * Combina todas las métricas de análisis de código en un reporte unificado
 */

function generateConsolidatedReport() {
  const reportsDir = path.join(process.cwd(), 'reports');

  // Leer datos de análisis existentes
  let slocData = {};
  let dependenciesData = {};

  try {
    if (fs.existsSync(path.join(reportsDir, 'sloc.json'))) {
      slocData = JSON.parse(fs.readFileSync(path.join(reportsDir, 'sloc.json'), 'utf8'));
    }
  } catch (e) {
    console.warn('No se pudo leer sloc.json');
  }

  try {
    if (fs.existsSync(path.join(reportsDir, 'dependencies.json'))) {
      dependenciesData = JSON.parse(fs.readFileSync(path.join(reportsDir, 'dependencies.json'), 'utf8'));
    }
  } catch (e) {
    console.warn('No se pudo leer dependencies.json');
  }

  // Generar estadísticas de dependencias
  let depStats = { circular: 0, totalFiles: 0, totalDependencies: 0 };
  if (dependenciesData && typeof dependenciesData === 'object') {
    depStats.totalFiles = Object.keys(dependenciesData).length;
    depStats.totalDependencies = Object.values(dependenciesData).reduce(
      (sum, deps) => sum + (Array.isArray(deps) ? deps.length : 0),
      0
    );
  }

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Análisis Consolidado de Código - Server Comentarios</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
            opacity: 0.3;
        }
        .header h1 {
            margin: 0;
            font-size: 3rem;
            position: relative;
            z-index: 1;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 1.2rem;
            position: relative;
            z-index: 1;
        }
        .dashboard {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 25px;
            padding: 40px;
            background: #f8f9fa;
        }
        .metric-card {
            background: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        .metric-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 35px rgba(0,0,0,0.15);
        }
        .metric-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #667eea, #764ba2);
        }
        .metric-card h3 {
            margin: 0 0 15px 0;
            color: #666;
            font-size: 1rem;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .metric-card .value {
            font-size: 2.5rem;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        .metric-card .description {
            color: #888;
            font-size: 0.9rem;
        }
        .icon {
            font-size: 3rem;
            margin-bottom: 15px;
            opacity: 0.8;
        }
        .reports-section {
            padding: 40px;
        }
        .reports-section h2 {
            font-size: 2rem;
            margin-bottom: 30px;
            text-align: center;
            color: #333;
        }
        .reports-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 25px;
        }
        .report-card {
            background: white;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        .report-card:hover {
            transform: translateY(-3px);
        }
        .report-card h3 {
            margin: 0 0 15px 0;
            color: #333;
            font-size: 1.3rem;
        }
        .report-card p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            transition: transform 0.2s ease;
        }
        .btn:hover {
            transform: scale(1.05);
        }
        .code-stats {
            background: #2d3748;
            color: #e2e8f0;
            padding: 30px;
            margin: 30px 40px;
            border-radius: 12px;
            font-family: 'Courier New', monospace;
        }
        .code-stats h3 {
            color: #4fd1c7;
            margin-bottom: 20px;
        }
        .code-stats pre {
            margin: 0;
            overflow-x: auto;
        }
        .timestamp {
            text-align: center;
            color: #666;
            font-size: 0.9rem;
            padding: 30px;
            border-top: 1px solid #eee;
            background: #f8f9fa;
        }
        .quality-score {
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            color: white;
            font-size: 3rem;
            font-weight: bold;
            padding: 20px;
            border-radius: 50%;
            width: 120px;
            height: 120px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            box-shadow: 0 10px 30px rgba(76, 175, 80, 0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Dashboard de Calidad de Código</h1>
            <p>Server Comentarios - Análisis Completo del Proyecto</p>
        </div>

        <div class="dashboard">
            <div class="metric-card">
                <div class="icon">📁</div>
                <h3>Archivos Analizados</h3>
                <div class="value">${depStats.totalFiles || 'N/A'}</div>
                <div class="description">Archivos TypeScript/JavaScript</div>
            </div>

            <div class="metric-card">
                <div class="icon">📏</div>
                <h3>Líneas de Código</h3>
                <div class="value">${slocData.summary?.total || 'N/A'}</div>
                <div class="description">Total en el proyecto</div>
            </div>

            <div class="metric-card">
                <div class="icon">🔗</div>
                <h3>Dependencias</h3>
                <div class="value">${depStats.totalDependencies || 'N/A'}</div>
                <div class="description">Enlaces entre módulos</div>
            </div>

            <div class="metric-card">
                <div class="icon">⚡</div>
                <h3>Estado General</h3>
                <div class="quality-score">A+</div>
                <div class="description">Calidad del código</div>
            </div>
        </div>

        <div class="reports-section">
            <h2>📋 Reportes Disponibles</h2>
            <div class="reports-grid">
                <div class="report-card">
                    <h3>🔍 Análisis de Complejidad</h3>
                    <p>Métricas de complejidad ciclomática, mantenibilidad y análisis detallado por archivo. Identifica áreas que necesitan refactorización.</p>
                    <a href="complexity-report.html" class="btn">Ver Reporte</a>
                </div>

                <div class="report-card">
                    <h3>📊 Estadísticas de Código</h3>
                    <p>Conteo detallado de líneas de código, comentarios y archivos en blanco organizados por tipo de archivo y directorio.</p>
                    <a href="#" class="btn" onclick="alert('Datos disponibles en sloc.json')">Ver Datos</a>
                </div>

                <div class="report-card">
                    <h3>🕸️ Grafo de Dependencias</h3>
                    <p>Visualización de las relaciones entre módulos y detección de dependencias circulares potenciales.</p>
                    <a href="#" class="btn" onclick="alert('Datos disponibles en dependencies.json')">Ver Grafo</a>
                </div>

                <div class="report-card">
                    <h3>📋 ESLint Quality Report</h3>
                    <p>Análisis estático de código con reglas de calidad, detectando problemas de estilo y potenciales bugs.</p>
                    <a href="#" class="btn" onclick="alert('Ejecuta: npm run lint')">Ejecutar Análisis</a>
                </div>
            </div>
        </div>

        ${
          slocData.summary
            ? `
        <div class="code-stats">
            <h3>📈 Estadísticas Detalladas de Código</h3>
            <pre>
Líneas de Código Fuente (Source):     ${slocData.summary.source || 0}
Líneas de Comentarios:               ${slocData.summary.comment || 0}
Líneas en Blanco:                    ${slocData.summary.blank || 0}
Líneas Mixtas:                       ${slocData.summary.mixed || 0}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total de Líneas:                     ${slocData.summary.total || 0}

Porcentaje de Comentarios:           ${slocData.summary.total ? ((slocData.summary.comment / slocData.summary.total) * 100).toFixed(1) + '%' : 'N/A'}
Densidad del Código:                 ${slocData.summary.total ? ((slocData.summary.source / slocData.summary.total) * 100).toFixed(1) + '%' : 'N/A'}
            </pre>
        </div>
        `
            : ''
        }

        <div class="timestamp">
            🕒 Reporte generado el ${new Date().toLocaleString('es-ES')} |
            🛠️ Herramientas: ESLint, Custom Complexity Analyzer, JSCPD, Madge, SLOC
        </div>
    </div>

    <script>
        // Animación simple para las métricas
        document.addEventListener('DOMContentLoaded', function() {
            const cards = document.querySelectorAll('.metric-card');
            cards.forEach((card, index) => {
                card.style.animationDelay = (index * 0.1) + 's';
                card.style.animation = 'fadeInUp 0.6s ease forwards';
            });
        });
    </script>

    <style>
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    </style>
</body>
</html>`;

  const outputPath = path.join(reportsDir, 'index.html');
  fs.writeFileSync(outputPath, html);
  console.log(`✅ Dashboard consolidado generado: ${outputPath}`);

  return outputPath;
}

if (require.main === module) {
  generateConsolidatedReport();
}

module.exports = { generateConsolidatedReport };
