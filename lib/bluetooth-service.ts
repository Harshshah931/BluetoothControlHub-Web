export type BluetoothTechnology = 'BLE' | 'Classic'

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'

export type CapabilityState =
  | 'supported'
  | 'unsupported'
  | 'unknown'

export type BluetoothCapability = {
  name: string
  state: CapabilityState
  description?: string
}

export type BluetoothDeviceRecord = {
  id: string
  name: string
  technology: BluetoothTechnology
  connectionState: ConnectionState
  capabilities: BluetoothCapability[]
}

export type GATTServerRecord = {
  id: string
  deviceId: string
  connected: boolean
}

export type GATTCharacteristicProperties = {
  read: boolean
  write: boolean
  writeWithoutResponse: boolean
  notify: boolean
  indicate: boolean
}

export type GATTServiceRecord = {
  id: string
  uuid: string
  name: string
  standard: boolean
}

export type GATTCharacteristicRecord = {
  id: string
  uuid: string
  name: string
  properties: GATTCharacteristicProperties
}

export type TelemetryData = {
  deviceId: string
  timestamp: number
  values: Record<string, number | string | boolean | null>
}

export type BluetoothNotificationListener = (
  value: Uint8Array,
) => void

export type BluetoothDisconnectListener = () => void

export interface BluetoothService {
  isSupported(): boolean
  getAvailability(): Promise<boolean>
  requestDevice(): Promise<BluetoothDeviceRecord>
  connect(device: BluetoothDeviceRecord): Promise<GATTServerRecord>
  disconnect(device: BluetoothDeviceRecord): void
  addDisconnectListener(
    device: BluetoothDeviceRecord,
    listener: BluetoothDisconnectListener,
  ): void
  removeDisconnectListener(
    device: BluetoothDeviceRecord,
    listener: BluetoothDisconnectListener,
  ): void
  getServices(device: BluetoothDeviceRecord): Promise<GATTServiceRecord[]>
  getCharacteristics(
    service: GATTServiceRecord,
  ): Promise<GATTCharacteristicRecord[]>
  readCharacteristic(
    characteristic: GATTCharacteristicRecord,
  ): Promise<Uint8Array>
  writeCharacteristic(
    characteristic: GATTCharacteristicRecord,
    value: Uint8Array,
  ): Promise<void>
  subscribeToNotifications(
    characteristic: GATTCharacteristicRecord,
    listener: BluetoothNotificationListener,
  ): Promise<void>
  unsubscribeFromNotifications(
    characteristic: GATTCharacteristicRecord,
    listener?: BluetoothNotificationListener,
  ): Promise<void>
}