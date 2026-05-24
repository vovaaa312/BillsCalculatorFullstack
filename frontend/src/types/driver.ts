export interface DriverShift {
  id?: number
  driverName: string
  start: string
  end: string
  kmStart: number
  kmEnd: number
  hourlyRate: number
  drivenKm?: number
  earnings?: number
  totalMinutes?: number
  totalHours?: number
}
