const fs = require('fs');
const path = require('path');

/**
 * Análisis básico de complejidad ciclomática para archivos JavaScript/TypeScript
 * Genera un reporte HTML con métricas de calidad de código
 */

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Métricas básicas
  const metrics = {
    fileName: path.basename(filePath),
    filePath: filePath,
    linesOfCode: lines.length,
    linesOfActualCode: lines.filter(line => line.trim() && !line.trim().startsWith('//')).length,
    functions: (content.match(/function\s+\w+|=>\s*{|async\s+function|\w+\s*\(/g) || []).length,
    classes: (content.match(/class\s+\w+/g) || []).length,
    complexity: calculateComplexity(content),
    maintainabilityIndex: 0,
    dependencies: extractDependencies(content),
  };

  // Calcular índice de mantenibilidad simplificado
  metrics.maintainabilityIndex = Math.max(0, 100 - metrics.complexity * 2 - Math.log(metrics.linesOfActualCode) * 5);

  return metrics;
}

function calculateComplexity(content) {
  // Patrones que incrementan la complejidad ciclomática
  const complexityPatterns = [
    /if\s*\(/g, // if statements
    /else\s+if/g, // else if
    /while\s*\(/g, // while loops
    /for\s*\(/g, // for loops
    /case\s+/g, // switch cases
    /catch\s*\(/g, // catch blocks
    /&&/g, // logical AND
    /\|\|/g, // logical OR
    /\?\s*:/g, // ternary operator
    /throw\s+/g, // throw statements
  ];

  let complexity = 1; // Base complexity

  complexityPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      complexity += matches.length;
    }
  });

  return complexity;
}

function extractDependencies(content) {
  const importMatches = content.match(/import.*from\s+['"]([^'"]+)['"]/g) || [];
  const requireMatches = content.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g) || [];

  const deps = [];

  importMatches.forEach(match => {
    const dep = match.match(/from\s+['"]([^'"]+)['"]/);
    if (dep) deps.push(dep[1]);
  });

  requireMatches.forEach(match => {
    const dep = match.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
    if (dep) deps.push(dep[1]);
  });

  return deps;
}

function generateHTMLReport(allMetrics, outputPath) {
  const totalFiles = allMetrics.length;
  const totalLOC = allMetrics.reduce((sum, m) => sum + m.linesOfCode, 0);
  const totalComplexity = allMetrics.reduce((sum, m) => sum + m.complexity, 0);
  const avgComplexity = totalComplexity / totalFiles;
  const avgMaintainability = allMetrics.reduce((sum, m) => sum + m.maintainabilityIndex, 0) / totalFiles;

  // Clasificar archivos por complejidad
  const highComplexity = allMetrics.filter(m => m.complexity > 10);
  const mediumComplexity = allMetrics.filter(m => m.complexity > 5 && m.complexity <= 10);
  const lowComplexity = allMetrics.filter(m => m.complexity <= 5);

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Análisis de Código - Server Comentarios</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5rem;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
        }
        .summary-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            color: #666;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .summary-card .value {
            font-size: 2rem;
            font-weight: bold;
            color: #333;
        }
        .complexity-high { color: #e74c3c; }
        .complexity-medium { color: #f39c12; }
        .complexity-low { color: #27ae60; }
        .section {
            padding: 30px;
        }
        .section h2 {
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .file-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 15px;
        }
        .file-card {
            border: 1px solid #ddd;
            border-radius: 6px;
            padding: 15px;
            background: #fafafa;
        }
        .file-card h4 {
            margin: 0 0 10px 0;
            color: #333;
            font-size: 1rem;
        }
        .file-metrics {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            font-size: 0.9rem;
        }
        .metric {
            display: flex;
            justify-content: space-between;
        }
        .metric-label {
            color: #666;
        }
        .metric-value {
            font-weight: bold;
        }
        .complexity-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: bold;
            color: white;
        }
        .complexity-badge.high { background-color: #e74c3c; }
        .complexity-badge.medium { background-color: #f39c12; }
        .complexity-badge.low { background-color: #27ae60; }
        .timestamp {
            text-align: center;
            color: #666;
            font-size: 0.9rem;
            padding: 20px;
            border-top: 1px solid #eee;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Análisis de Complejidad de Código</h1>
            <p>Server Comentarios - Reporte Generado el ${new Date().toLocaleString('es-ES')}</p>
        </div>

        <div class="summary">
            <div class="summary-card">
                <h3>Total de Archivos</h3>
                <div class="value">${totalFiles}</div>
            </div>
            <div class="summary-card">
                <h3>Líneas de Código</h3>
                <div class="value">${totalLOC.toLocaleString()}</div>
            </div>
            <div class="summary-card">
                <h3>Complejidad Promedio</h3>
                <div class="value complexity-${avgComplexity > 10 ? 'high' : avgComplexity > 5 ? 'medium' : 'low'}">${avgComplexity.toFixed(1)}</div>
            </div>
            <div class="summary-card">
                <h3>Mantenibilidad</h3>
                <div class="value complexity-${avgMaintainability > 70 ? 'low' : avgMaintainability > 50 ? 'medium' : 'high'}">${avgMaintainability.toFixed(0)}%</div>
            </div>
        </div>

        <div class="section">
            <h2>🔴 Archivos de Alta Complejidad (> 10)</h2>
            ${highComplexity.length === 0 ? '<p>¡Excelente! No hay archivos con alta complejidad.</p>' : ''}
            <div class="file-grid">
                ${highComplexity
                  .map(
                    file => `
                    <div class="file-card">
                        <h4>${file.fileName}</h4>
                        <div class="file-metrics">
                            <div class="metric">
                                <span class="metric-label">Complejidad:</span>
                                <span class="metric-value"><span class="complexity-badge high">${file.complexity}</span></span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">LOC:</span>
                                <span class="metric-value">${file.linesOfCode}</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Funciones:</span>
                                <span class="metric-value">${file.functions}</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Mantenibilidad:</span>
                                <span class="metric-value">${file.maintainabilityIndex.toFixed(0)}%</span>
                            </div>
                        </div>
                    </div>
                `
                  )
                  .join('')}
            </div>
        </div>

        <div class="section">
            <h2>🟡 Archivos de Complejidad Media (6-10)</h2>
            <div class="file-grid">
                ${mediumComplexity
                  .map(
                    file => `
                    <div class="file-card">
                        <h4>${file.fileName}</h4>
                        <div class="file-metrics">
                            <div class="metric">
                                <span class="metric-label">Complejidad:</span>
                                <span class="metric-value"><span class="complexity-badge medium">${file.complexity}</span></span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">LOC:</span>
                                <span class="metric-value">${file.linesOfCode}</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Funciones:</span>
                                <span class="metric-value">${file.functions}</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Mantenibilidad:</span>
                                <span class="metric-value">${file.maintainabilityIndex.toFixed(0)}%</span>
                            </div>
                        </div>
                    </div>
                `
                  )
                  .join('')}
            </div>
        </div>

        <div class="section">
            <h2>🟢 Archivos de Baja Complejidad (≤ 5)</h2>
            <div class="file-grid">
                ${lowComplexity
                  .slice(0, 12)
                  .map(
                    file => `
                    <div class="file-card">
                        <h4>${file.fileName}</h4>
                        <div class="file-metrics">
                            <div class="metric">
                                <span class="metric-label">Complejidad:</span>
                                <span class="metric-value"><span class="complexity-badge low">${file.complexity}</span></span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">LOC:</span>
                                <span class="metric-value">${file.linesOfCode}</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Funciones:</span>
                                <span class="metric-value">${file.functions}</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Mantenibilidad:</span>
                                <span class="metric-value">${file.maintainabilityIndex.toFixed(0)}%</span>
                            </div>
                        </div>
                    </div>
                `
                  )
                  .join('')}
                ${lowComplexity.length > 12 ? `<p><em>... y ${lowComplexity.length - 12} archivos más con baja complejidad</em></p>` : ''}
            </div>
        </div>

        <div class="timestamp">
            Reporte generado el ${new Date().toLocaleString('es-ES')} |
            Herramienta de análisis personalizada para Server Comentarios
        </div>
    </div>
</body>
</html>`;

  fs.writeFileSync(outputPath, html);
  console.log(`✅ Reporte HTML generado: ${outputPath}`);
}

function findFiles(dir, extensions = ['.js', '.ts']) {
  const files = [];

  function scan(currentDir) {
    const items = fs.readdirSync(currentDir);

    items.forEach(item => {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== 'build') {
        scan(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    });
  }

  scan(dir);
  return files;
}

// Script principal
function main() {
  const srcDir = path.join(process.cwd(), 'src');
  const reportsDir = path.join(process.cwd(), 'reports');
  const outputFile = path.join(reportsDir, 'complexity-report.html');

  // Crear directorio de reportes si no existe
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  console.log('🔍 Analizando archivos TypeScript/JavaScript...');

  const files = findFiles(srcDir, ['.ts', '.js']);
  console.log(`📁 Encontrados ${files.length} archivos para analizar`);

  const allMetrics = files.map(file => {
    console.log(`  📄 Analizando: ${path.relative(process.cwd(), file)}`);
    return analyzeFile(file);
  });

  console.log('📊 Generando reporte HTML...');
  generateHTMLReport(allMetrics, outputFile);

  console.log(`\n✨ Análisis completado!`);
  console.log(`📈 Reporte disponible en: ${outputFile}`);
  console.log(`🌐 Abre el archivo en tu navegador para ver los resultados`);
}

if (require.main === module) {
  main();
}

module.exports = { analyzeFile, generateHTMLReport, findFiles };
