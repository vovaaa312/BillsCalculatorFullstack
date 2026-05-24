import client from './client'
import type { Hotovost } from '../types/hotovost'

export const getHotovost = () =>
  client.get<Hotovost>('/hotovost').then(r => r.data)

export const updateHotovost = (h: Hotovost) =>
  client.put<Hotovost>('/hotovost', h).then(r => r.data)
