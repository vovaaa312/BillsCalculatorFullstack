import client from './client'
import type { Cash } from '../types/hotovost'

export const getCash = () =>
  client.get<Cash>('/cash').then(r => r.data)

export const updateCash = (c: Cash) =>
  client.put<Cash>('/cash', c).then(r => r.data)
