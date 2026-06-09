import client from './client'
import type { Archive, ArchiveDetail } from '../types/archive'

export const getArchives = () =>
  client.get<Archive[]>('/archives').then(r => r.data)

export const createArchive = (name: string) =>
  client.post<Archive>('/archives', { name }).then(r => r.data)

export const getArchiveDetail = (id: number) =>
  client.get<ArchiveDetail>(`/archives/${id}`).then(r => r.data)

export const deleteArchive = (id: number) =>
  client.delete(`/archives/${id}`)

export const downloadArchiveReport = async (id: number, lang: string) => {
  const response = await client.get(`/archives/${id}/report`, {
    params: { lang },
    responseType: 'blob',
  })
  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `archive-report-${id}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
