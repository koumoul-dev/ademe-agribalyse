const fs = require('fs-extra')
const path = require('path')
const parse = require('csv-parse/lib/sync')

const expected = {
  'Agribalyse_Synthese 4.0.csv': {
    cols: 32,
    first: 'Code AGB',
    contains: ["Matériau d'emballage", 'Changement climatique - Biogenic', 'Changement climatique - Fossil', 'Changement climatique - Land use and Land use change'],
    minRows: 2000
  },
  'Agribalyse_Detail etape 4.0.csv': {
    cols: 131,
    first: 'Code AGB',
    contains: ['DQR - Global', 'Changement climatique - Biogenic - Agriculture', 'Changement climatique - Land use and Land use change - Consommation'],
    minRows: 2000
  },
  'Agribalyse_Detail ingredient 4.0.csv': {
    cols: 27,
    first: 'Ciqual  AGB',
    contains: ['Ingredients', 'Changement climatique - Biogenic'],
    minRows: 5000
  }
}

Object.keys(expected).forEach(file => {
  const exp = expected[file]
  const rows = parse(fs.readFileSync(path.join(__dirname, 'out', file)), { delimiter: ',' })
  const headers = rows[0]
  const errors = []
  if (headers.length !== exp.cols) errors.push(headers.length + ' colonnes au lieu de ' + exp.cols)
  if (headers[0] !== exp.first) errors.push('première colonne "' + headers[0] + '" au lieu de "' + exp.first + '"')
  exp.contains.forEach(c => { if (!headers.includes(c)) errors.push('colonne manquante "' + c + '"') })
  const lines = rows.slice(1).filter(r => r.length > 1)
  if (lines.length < exp.minRows) errors.push(lines.length + ' lignes de données au lieu de >= ' + exp.minRows)
  if (errors.length) {
    console.error('KO ' + file + ' : ' + errors.join(', '))
    process.exitCode = 1
  } else {
    console.log('OK ' + file + ' : ' + headers.length + ' colonnes, ' + lines.length + ' lignes')
  }
})
