const fs = require('fs');
const path = require('path');

/**
 * Script para corregir automáticamente warnings comunes de ESLint
 * - Reemplaza || por ?? donde es apropiado
 * - Mejora algunos tipos any
 * - Corrige acceso a hasOwnProperty
 */

function fixNullishCoalescing(content) {
  // Patrones comunes de || que deben ser ??
  const patterns = [
    {
      // process.env['VAR'] || 'default'
      from: /process\.env\['([^']+)'\]\s*\|\|\s*(['"][^'"]+['"])/g,
      to: "process.env['$1'] ?? $2",
    },
    {
      // variable || 'default'
      from: /(\w+)\s*\|\|\s*(['"][^'"]+['"])/g,
      to: '$1 ?? $2',
    },
    {
      // req.body?.property || ''
      from: /req\.body\?\.(\w+)\s*\|\|\s*(['"][^'"]*['"])/g,
      to: 'req.body?.$1 ?? $2',
    },
    {
      // options?.property || 'default'
      from: /(\w+)\?\.(\w+)\s*\|\|\s*(['"][^'"]+['"])/g,
      to: '$1?.$2 ?? $3',
    },
  ];

  let result = content;
  patterns.forEach(pattern => {
    result = result.replace(pattern.from, pattern.to);
  });

  return result;
}

function fixHasOwnProperty(content) {
  // input.hasOwnProperty('prop') -> Object.prototype.hasOwnProperty.call(input, 'prop')
  return content.replace(/(\w+)\.hasOwnProperty\(([^)]+)\)/g, 'Object.prototype.hasOwnProperty.call($1, $2)');
}

function fixCommonAnyTypes(content) {
  const patterns = [
    {
      // (req as any).auth -> (req as Request & { auth?: AuthType }).auth
      from: /\(req as any\)\.auth/g,
      to: "(req as Request & { auth?: { user: string; role: 'player' | 'admin' } }).auth",
    },
    {
      // catch (e: any) -> catch (e: unknown)
      from: /catch\s*\(\s*(\w+):\s*any\s*\)/g,
      to: 'catch ($1: unknown)',
    },
    {
      // : any = {} -> : Record<string, unknown> = {}
      from: /:\s*any\s*=\s*\{\}/g,
      to: ': Record<string, unknown> = {}',
    },
  ];

  let result = content;
  patterns.forEach(pattern => {
    result = result.replace(pattern.from, pattern.to);
  });

  return result;
}

function processFile(filePath) {
  console.log(`🔧 Procesando: ${path.relative(process.cwd(), filePath)}`);

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Aplicar correcciones
  content = fixNullishCoalescing(content);
  content = fixHasOwnProperty(content);
  content = fixCommonAnyTypes(content);

  // Solo escribir si hubo cambios
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`   ✅ Corregido`);
    return true;
  } else {
    console.log(`   ⚪ Sin cambios`);
    return false;
  }
}

function findTSFiles(dir) {
  const files = [];

  function scan(currentDir) {
    const items = fs.readdirSync(currentDir);

    items.forEach(item => {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (
        stat.isDirectory() &&
        !item.startsWith('.') &&
        item !== 'node_modules' &&
        item !== 'build' &&
        item !== 'reports'
      ) {
        scan(fullPath);
      } else if (stat.isFile() && item.endsWith('.ts')) {
        files.push(fullPath);
      }
    });
  }

  scan(dir);
  return files;
}

function main() {
  const srcDir = path.join(process.cwd(), 'src');

  console.log('🚀 Iniciando corrección automática de warnings de ESLint...');

  const files = findTSFiles(srcDir);
  console.log(`📁 Encontrados ${files.length} archivos TypeScript`);

  let modifiedCount = 0;
  files.forEach(file => {
    if (processFile(file)) {
      modifiedCount++;
    }
  });

  console.log(`\n✨ Proceso completado!`);
  console.log(`📝 ${modifiedCount} de ${files.length} archivos modificados`);
  console.log(`\n🔍 Ejecuta 'npm run lint' para ver el progreso`);
}

if (require.main === module) {
  main();
}

module.exports = { fixNullishCoalescing, fixHasOwnProperty, fixCommonAnyTypes };
