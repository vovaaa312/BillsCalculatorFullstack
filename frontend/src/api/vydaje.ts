import client from './client'
import type { Expense } from '../types/vydaj'

export const getExpenses = () =>
  client.get<Expense[]>('/expenses').then(r => r.data)

export const createExpense = (v: Expense) =>
  client.post<Expense>('/expenses', v).then(r => r.data)

export const updateExpense = (id: number, v: Expense) =>
  client.put<Expense>(`/expenses/${id}`, v).then(r => r.data)

export const deleteExpense = (id: number) =>
  client.delete(`/expenses/${id}`)
