import * as XLSX from 'xlsx'

export const exportToExcel = (data: any[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')
  XLSX.writeFile(workbook, `${fileName}.xlsx`)
}

export const generateSQLDump = (tableName: string, data: any[]): string => {
  if (!data.length) return ''

  // Get column names from the first row
  const columns = Object.keys(data[0])
  
  // Create table schema
  let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`
  sql += columns.map(col => {
    let dataType = 'text' // default type
    const sampleValue = data[0][col]
    
    // Determine SQL data type based on JavaScript type
    if (typeof sampleValue === 'number') {
      dataType = Number.isInteger(sampleValue) ? 'integer' : 'numeric'
    } else if (typeof sampleValue === 'boolean') {
      dataType = 'boolean'
    } else if (sampleValue instanceof Date) {
      dataType = 'timestamp'
    } else if (typeof sampleValue === 'object' && sampleValue !== null) {
      dataType = 'jsonb'
    }
    
    return `    ${col} ${dataType}`
  }).join(',\n')
  sql += '\n);\n\n'

  // Generate insert statements
  data.forEach(row => {
    const values = columns.map(col => {
      const value = row[col]
      if (value === null) return 'NULL'
      if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`
      if (typeof value === 'object') return `'${JSON.stringify(value)}'`
      return value
    })
    
    sql += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`
  })

  return sql
}

export const downloadFile = (content: string, fileName: string, contentType: string) => {
  const blob = new Blob([content], { type: contentType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const createLocalBackupFolder = async (tableName: string, data: any[]) => {
  try {
    // Request permission to use the File System Access API
    // @ts-ignore - File System Access API types
    const dirHandle = await window.showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'downloads'
    })

    // Create a backup folder with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const folderName = `${tableName}_backup_${timestamp}`
    const backupDirHandle = await dirHandle.getDirectoryHandle(folderName, { create: true })

    // Save Excel file
    const excelBlob = await new Promise<Blob>((resolve) => {
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(data)
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      resolve(new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
    })

    // Save SQL file
    const sqlContent = generateSQLDump(tableName, data)
    const sqlBlob = new Blob([sqlContent], { type: 'application/sql' })

    // Write files using the File System Access API
    const excelFileHandle = await backupDirHandle.getFileHandle(`${tableName}.xlsx`, { create: true })
    const sqlFileHandle = await backupDirHandle.getFileHandle(`${tableName}.sql`, { create: true })

    const excelWritable = await excelFileHandle.createWritable()
    const sqlWritable = await sqlFileHandle.createWritable()

    await excelWritable.write(excelBlob)
    await sqlWritable.write(sqlBlob)

    await excelWritable.close()
    await sqlWritable.close()

    return folderName
  } catch (error) {
    console.error('Error creating local backup:', error)
    // Fallback to regular downloads if File System Access API is not supported
    exportToExcel(data, `${tableName}_backup`)
    const sqlContent = generateSQLDump(tableName, data)
    downloadFile(sqlContent, `${tableName}_backup.sql`, 'application/sql')
    return null
  }
} 