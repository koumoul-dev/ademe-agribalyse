const XLSX = require('xlsx')
const path = require('path')
const fs = require('fs-extra')
const parse = require('csv-parse/lib/sync')
const stringify = require('csv-stringify/lib/sync')

const fileName = '2026-09-14 - Tableur alimentaire AGB40_sans_comapraison.xlsx'

fs.ensureDirSync(path.join(__dirname, 'out'))

const workbook = XLSX.readFile(path.join(__dirname, 'in', fileName))

console.log('generating synthesis CSV')
const synthesisSheet = 'Synthese 4.0'
const synthesisWS = workbook.Sheets[synthesisSheet]
let csvToks = XLSX.utils.sheet_to_csv(synthesisWS, {FS:';', rawNumbers: true}).replace(/\r\n/g, ' ').split('\n')
const synthesisHeaders = stringify([parse(csvToks[2], {delimiter: ';'})[0].slice(0,12).map(d => d.split(' (')[0])]).split(' - ')[0]+','+ stringify([parse(csvToks[1], {delimiter: ';'})[0].slice(12).map(d => d.replace(' 3.1', ''))])
const synthesisCsvString = synthesisHeaders+stringify(parse(csvToks.slice(3).filter(l => l.split(';')[0].length > 0).join('\n'), {delimiter: ';'}))
fs.writeFileSync(path.join(__dirname, 'out','Agribalyse_' + synthesisSheet + '.csv'), synthesisCsvString)

console.log('generating steps details CSV')
const stepsSheet = 'Detail etape 4.0'
const stepsWS = workbook.Sheets[stepsSheet]
csvToks = XLSX.utils.sheet_to_csv(stepsWS, {FS:';', rawNumbers: true}).replace(/\r\n/g, ' ').split('\n')
const stepsCategories = parse(csvToks[0], {delimiter: ';'})[0].filter(f => f.length).slice(1,-1).map(f => f.split(' 3.1')[0])
stepsCategories.push('DQR')
const stepsHeaders = csvToks[2].split(';').map((f,i) => {
  if(i<=7) return f
  else return stepsCategories[Math.floor((i-8)/7)] + ' - ' + f.replace('"DQR  Overall"', 'Global')
})
const excludes = [6, 7]
stepsHeaders.forEach((f, i) => {if(f.split(' - ').pop() === 'Total') excludes.push(i)})
const stepsCsvStringHeader = stringify([stepsHeaders.filter((s, i) => !excludes.includes(i))])
const stepsCsvStringBody = stringify(csvToks.slice(3).map(l => l.split(';').filter((s, i) => !excludes.includes(i)).map(s => s !== '-' ? s : '')).filter(l => l.length > 101 && l[0].length > 0))
const stepsCsvString = stepsCsvStringHeader + stepsCsvStringBody
fs.writeFileSync(path.join(__dirname, 'out','Agribalyse_' + stepsSheet + '.csv'), stepsCsvString)

console.log('generating ingredients details CSV')
const ingredientsSheet = 'Detail ingredient 4.0'
const ingredientsWS = workbook.Sheets[ingredientsSheet]
const sheetCsv = XLSX.utils.sheet_to_csv(ingredientsWS, {FS:';', rawNumbers: true})
csvToks = sheetCsv.replace(/\r\n/g, ' ').split('\n').slice(1)
const ingredientsHeaders = [].concat(parse(csvToks[1], {delimiter: ';'})[0].slice(0,10),parse(csvToks[0], {delimiter: ';'})[0].slice(10, 30).map(f => f.split(' 3.1')[0]))
const lines = csvToks.slice(2).map(r => r.split(';').slice(0, 30)).filter(line => line.length === 30 && line[0].length > 0 && line[6] !== 'Total')
const ingredientsCsvString = stringify([ingredientsHeaders.filter((h, i) => i<7 || i > 9)]) + stringify(lines.map(line => line.filter((d, i) => i<7 || i > 9).map(s => s !== '-' ? s : '')))
fs.writeFileSync(path.join(__dirname, 'out','Agribalyse_' + ingredientsSheet + '.csv'), ingredientsCsvString)
