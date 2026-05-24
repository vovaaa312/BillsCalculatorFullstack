import client from './client'

export const getReportText = (lang = 'cs') =>
  client.get<string>('/report/text', { params: { lang }, responseType: 'text' }).then(r => r.data)

export const downloadReportPdf = async (lang = 'cs') => {
  const res = await client.get('/report/pdf', { params: { lang }, responseType: 'blob' })
  const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'report.pdf'
  a.click()
  URL.revokeObjectURL(url)
}
