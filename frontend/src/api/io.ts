import client from './client'

export const exportData = async () => {
  const res = await client.get('/io/export', { responseType: 'blob' })
  const url = URL.createObjectURL(new Blob([res.data], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'data.json'
  a.click()
  URL.revokeObjectURL(url)
}

export const importData = (file: File) => {
  const fd = new FormData()
  fd.append('file', file)
  return client.post('/io/import', fd)
}

export const clearData = () => client.delete('/io/clear')
