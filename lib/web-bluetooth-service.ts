import type {
  BluetoothDeviceRecord,
  BluetoothDisconnectListener,
  BluetoothNotificationListener,
  BluetoothService,
  GATTCharacteristicProperties,
  GATTCharacteristicRecord,
  GATTServerRecord,
  GATTServiceRecord,
} from './bluetooth-service'

type BluetoothCharacteristicProperties = {
  read: boolean
  write: boolean
  writeWithoutResponse: boolean
  notify: boolean
  indicate: boolean
}

type BluetoothRemoteGATTCharacteristic = {
  uuid: string
  properties: BluetoothCharacteristicProperties
  value?: DataView | null
  readValue(): Promise<DataView>
  writeValue(value: ArrayBuffer): Promise<void>
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
  addEventListener(type: string, listener: EventListener): void
  removeEventListener(type: string, listener: EventListener): void
}

type BluetoothRemoteGATTService = {
  uuid: string
  getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>
}

type BluetoothRemoteGATTServer = {
  connected: boolean
  connect(): Promise<BluetoothRemoteGATTServer>
  disconnect(): void
  getPrimaryServices(): Promise<BluetoothRemoteGATTService[]>
}

type BluetoothDevice = {
  id: string
  name?: string | null
  gatt?: BluetoothRemoteGATTServer
  addEventListener?: (type: string, listener: EventListener) => void
  removeEventListener?: (type: string, listener: EventListener) => void
}

type RequestDeviceOptions = {
  acceptAllDevices: boolean
  optionalServices: string[]
}

type WebBluetoothAPI = {
  getAvailability?: () => Promise<boolean>
  requestDevice(
    options: RequestDeviceOptions,
  ): Promise<BluetoothDevice>
}

type BluetoothNavigator = Navigator & {
  bluetooth?: WebBluetoothAPI
}

export type WebBluetoothStatus = 'SUPPORTED' | 'UNSUPPORTED'

export type BluetoothServiceErrorCode =
  | 'unsupported'
  | 'unavailable'
  | 'permission-denied'
  | 'device-cancelled'
  | 'request-failed'
  | 'gatt-unavailable'
  | 'not-connected'
  | 'connection-failed'
  | 'service-discovery-failed'
  | 'characteristic-unavailable'
  | 'read-failed'
  | 'write-failed'
  | 'notification-subscription-failed'

export class BluetoothServiceError extends Error {
  constructor(
    public readonly code: BluetoothServiceErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = 'BluetoothServiceError'
  }
}

type NativeServerReference = {
  record: GATTServerRecord
  server: BluetoothRemoteGATTServer
}

type NotificationListenerMap = Map<
  BluetoothNotificationListener,
  EventListener
>

const optionalServices = [
  'battery_service',
  'device_information',
  'generic_access',
]

const standardServiceNames: Record<string, string> = {
  '1800': 'Generic Access',
  '1801': 'Generic Attribute',
  '180a': 'Device Information',
  '180f': 'Battery Service',
}

const standardCharacteristicNames: Record<string, string> = {
  '2a00': 'Device Name',
  '2a01': 'Appearance',
  '2a19': 'Battery Level',
  '2a26': 'Firmware Revision String',
  '2a29': 'Manufacturer Name String',
}

function assignedBluetoothUUID(uuid: string): string | undefined {
  const normalized = uuid.toLowerCase().replaceAll('-', '')

  if (/^[0-9a-f]{4}$/.test(normalized)) {
    return normalized
  }

  const baseUUIDMatch = normalized.match(
    /^0000([0-9a-f]{4})00001000800000805f9b34fb$/,
  )

  return baseUUIDMatch?.[1]
}

function errorName(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'name' in error) {
    return String(error.name)
  }

  return undefined
}

function serviceError(
  code: BluetoothServiceErrorCode,
  message: string,
  cause?: unknown,
): BluetoothServiceError {
  return new BluetoothServiceError(
    code,
    message,
    cause === undefined ? undefined : { cause },
  )
}

export class WebBluetoothService implements BluetoothService {
  private readonly deviceHandles = new WeakMap<
    BluetoothDeviceRecord,
    BluetoothDevice
  >()
  private readonly serverReferences = new WeakMap<
    BluetoothDeviceRecord,
    NativeServerReference
  >()
  private readonly serviceHandles = new WeakMap<
    GATTServiceRecord,
    BluetoothRemoteGATTService
  >()
  private readonly characteristicHandles = new WeakMap<
    GATTCharacteristicRecord,
    BluetoothRemoteGATTCharacteristic
  >()
  private readonly notificationListeners = new WeakMap<
    BluetoothRemoteGATTCharacteristic,
    NotificationListenerMap
  >()
  private readonly disconnectListeners = new WeakMap<
    BluetoothDeviceRecord,
    Map<BluetoothDisconnectListener, EventListener>
  >()

  isSupported(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false
    }

    return (
      window.isSecureContext &&
      typeof (navigator as BluetoothNavigator).bluetooth !== 'undefined'
    )
  }

  async getAvailability(): Promise<boolean> {
    const bluetooth = this.getBluetooth()

    if (!bluetooth.getAvailability) {
      return true
    }

    try {
      return await bluetooth.getAvailability()
    } catch (error) {
      throw serviceError(
        'unavailable',
        'The browser could not determine Bluetooth availability.',
        error,
      )
    }
  }

  async requestDevice(): Promise<BluetoothDeviceRecord> {
    const bluetooth = this.getBluetooth()

    try {
      const device = await bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices,
      })
      const record: BluetoothDeviceRecord = {
        id: device.id,
        name: device.name || 'Unnamed BLE Device',
        technology: 'BLE',
        connectionState: 'disconnected',
        capabilities: [],
      }

      this.deviceHandles.set(record, device)
      return record
    } catch (error) {
      if (error instanceof BluetoothServiceError) {
        throw error
      }

      const name = errorName(error)
      if (name === 'NotFoundError' || name === 'AbortError') {
        if (name === 'NotFoundError' && bluetooth.getAvailability) {
          try {
            if (!(await bluetooth.getAvailability())) {
              throw serviceError(
                'unavailable',
                'Bluetooth is unavailable on this device.',
                error,
              )
            }
          } catch (availabilityError) {
            if (availabilityError instanceof BluetoothServiceError) {
              throw availabilityError
            }
          }
        }

        throw serviceError(
          'device-cancelled',
          'The Bluetooth device chooser was cancelled.',
          error,
        )
      }
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        throw serviceError(
          'permission-denied',
          'Bluetooth access was denied. Choose a device and grant permission in the browser.',
          error,
        )
      }

      throw serviceError(
        'request-failed',
        'The browser could not open the Bluetooth device chooser.',
        error,
      )
    }
  }

  async connect(
    deviceRecord: BluetoothDeviceRecord,
  ): Promise<GATTServerRecord> {
    const device = this.getDeviceHandle(deviceRecord)
    const gatt = device.gatt

    if (!gatt) {
      throw serviceError(
        'gatt-unavailable',
        'This BLE device does not expose a GATT server.',
      )
    }

    try {
      const server = gatt.connected ? gatt : await gatt.connect()
      deviceRecord.connectionState = 'connected'

      const reference: NativeServerReference = {
        record: {
          id: deviceRecord.id,
          deviceId: deviceRecord.id,
          connected: true,
        },
        server,
      }
      this.serverReferences.set(deviceRecord, reference)
      return reference.record
    } catch (error) {
      deviceRecord.connectionState = 'disconnected'
      const name = errorName(error)
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        throw serviceError(
          'permission-denied',
          'Bluetooth access was denied.',
          error,
        )
      }
      if (name === 'NotFoundError') {
        throw serviceError(
          'unavailable',
          'The Bluetooth device is unavailable.',
          error,
        )
      }

      throw serviceError(
        'connection-failed',
        'Could not connect to the device GATT server.',
        error,
      )
    }
  }

  disconnect(deviceRecord: BluetoothDeviceRecord): void {
    const device = this.getDeviceHandle(deviceRecord)
    deviceRecord.connectionState = 'disconnected'

    const reference = this.serverReferences.get(deviceRecord)
    if (reference) {
      reference.record.connected = false
    }

    device.gatt?.disconnect()
  }

  addDisconnectListener(
    deviceRecord: BluetoothDeviceRecord,
    listener: BluetoothDisconnectListener,
  ): void {
    const device = this.getDeviceHandle(deviceRecord)
    if (!device.addEventListener || !device.removeEventListener) {
      return
    }

    let listeners = this.disconnectListeners.get(deviceRecord)
    if (listeners?.has(listener)) {
      return
    }

    const eventListener: EventListener = () => {
      if (deviceRecord.connectionState !== 'connected') {
        return
      }

      deviceRecord.connectionState = 'disconnected'
      listener()
    }

    device.addEventListener('gattserverdisconnected', eventListener)
    listeners ??= new Map()
    listeners.set(listener, eventListener)
    this.disconnectListeners.set(deviceRecord, listeners)
  }

  removeDisconnectListener(
    deviceRecord: BluetoothDeviceRecord,
    listener: BluetoothDisconnectListener,
  ): void {
    const device = this.getDeviceHandle(deviceRecord)
    const listeners = this.disconnectListeners.get(deviceRecord)
    const eventListener = listeners?.get(listener)

    if (eventListener) {
      device.removeEventListener?.(
        'gattserverdisconnected',
        eventListener,
      )
      listeners?.delete(listener)
    }

    if (listeners?.size === 0) {
      this.disconnectListeners.delete(deviceRecord)
    }
  }

  async getServices(
    deviceRecord: BluetoothDeviceRecord,
  ): Promise<GATTServiceRecord[]> {
    const device = this.getDeviceHandle(deviceRecord)
    const reference = this.serverReferences.get(deviceRecord)

    if (!device.gatt) {
      throw serviceError(
        'gatt-unavailable',
        'This BLE device does not expose a GATT server.',
      )
    }

    if (!reference || !reference.server.connected) {
      throw serviceError(
        'not-connected',
        'Connect to the BLE device before discovering GATT services.',
      )
    }

    try {
      const services = await reference.server.getPrimaryServices()
      return services.map((service, index) => {
        const assignedUUID = assignedBluetoothUUID(service.uuid)
        const record: GATTServiceRecord = {
          id: `${deviceRecord.id}:service:${index}`,
          uuid: service.uuid,
          name: assignedUUID
            ? standardServiceNames[assignedUUID] || 'Unknown Service'
            : 'Unknown Service',
          standard: assignedUUID !== undefined,
        }
        this.serviceHandles.set(record, service)
        return record
      })
    } catch (error) {
      const name = errorName(error)
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        throw serviceError(
          'permission-denied',
          'The browser denied access to one or more GATT services.',
          error,
        )
      }

      throw serviceError(
        'service-discovery-failed',
        'Could not discover the device GATT services.',
        error,
      )
    }
  }

  async getCharacteristics(
    serviceRecord: GATTServiceRecord,
  ): Promise<GATTCharacteristicRecord[]> {
    const service = this.serviceHandles.get(serviceRecord)
    if (!service) {
      throw serviceError(
        'characteristic-unavailable',
        'The requested GATT service is no longer available.',
      )
    }

    try {
      const characteristics = await service.getCharacteristics()
      return characteristics.map((characteristic, index) => {
        const assignedUUID = assignedBluetoothUUID(characteristic.uuid)
        const properties: GATTCharacteristicProperties = {
          read: characteristic.properties.read,
          write: characteristic.properties.write,
          writeWithoutResponse:
            characteristic.properties.writeWithoutResponse,
          notify: characteristic.properties.notify,
          indicate: characteristic.properties.indicate,
        }
        const record: GATTCharacteristicRecord = {
          id: `${serviceRecord.id}:characteristic:${index}`,
          uuid: characteristic.uuid,
          name: assignedUUID
            ? standardCharacteristicNames[assignedUUID] ||
              'Unknown Characteristic'
            : 'Unknown Characteristic',
          properties,
        }
        this.characteristicHandles.set(record, characteristic)
        return record
      })
    } catch (error) {
      const name = errorName(error)
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        throw serviceError(
          'permission-denied',
          'The browser denied access to one or more GATT characteristics.',
          error,
        )
      }

      throw serviceError(
        'characteristic-unavailable',
        'Could not discover the GATT characteristics.',
        error,
      )
    }
  }

  getCharacteristicProperties(
    characteristic: GATTCharacteristicRecord,
  ): GATTCharacteristicProperties {
    return { ...characteristic.properties }
  }

  async readCharacteristic(
    characteristicRecord: GATTCharacteristicRecord,
  ): Promise<Uint8Array> {
    const characteristic = this.getCharacteristicHandle(characteristicRecord)

    try {
      const value = await characteristic.readValue()
      const bytes = new Uint8Array(value.byteLength)
      bytes.set(
        new Uint8Array(value.buffer, value.byteOffset, value.byteLength),
      )
      return bytes
    } catch (error) {
      throw serviceError(
        'read-failed',
        'Could not read the GATT characteristic value.',
        error,
      )
    }
  }

  async writeCharacteristic(
    characteristicRecord: GATTCharacteristicRecord,
    value: Uint8Array,
  ): Promise<void> {
    const characteristic = this.getCharacteristicHandle(characteristicRecord)

    try {
      const buffer = new ArrayBuffer(value.byteLength)
      new Uint8Array(buffer).set(value)
      await characteristic.writeValue(buffer)
    } catch (error) {
      throw serviceError(
        'write-failed',
        'Could not write the GATT characteristic value.',
        error,
      )
    }
  }

  async subscribeToNotifications(
    characteristicRecord: GATTCharacteristicRecord,
    listener: BluetoothNotificationListener,
  ): Promise<void> {
    const characteristic = this.getCharacteristicHandle(characteristicRecord)
    let listeners = this.notificationListeners.get(characteristic)

    if (listeners?.has(listener)) {
      return
    }

    const eventListener: EventListener = () => {
      const value = characteristic.value
      if (value) {
        const bytes = new Uint8Array(value.byteLength)
        bytes.set(
          new Uint8Array(value.buffer, value.byteOffset, value.byteLength),
        )
        listener(bytes)
      }
    }

    try {
      await characteristic.startNotifications()
      characteristic.addEventListener(
        'characteristicvaluechanged',
        eventListener,
      )
      listeners ??= new Map()
      listeners.set(listener, eventListener)
      this.notificationListeners.set(characteristic, listeners)
    } catch (error) {
      throw serviceError(
        'notification-subscription-failed',
        'Could not subscribe to GATT characteristic notifications.',
        error,
      )
    }
  }

  async unsubscribeFromNotifications(
    characteristicRecord: GATTCharacteristicRecord,
    listener?: BluetoothNotificationListener,
  ): Promise<void> {
    const characteristic = this.getCharacteristicHandle(characteristicRecord)
    const listeners = this.notificationListeners.get(characteristic)

    if (listeners) {
      const entries = listener
        ? [[listener, listeners.get(listener)] as const]
        : Array.from(listeners.entries())

      for (const [currentListener, eventListener] of entries) {
        if (eventListener) {
          characteristic.removeEventListener(
            'characteristicvaluechanged',
            eventListener,
          )
          listeners.delete(currentListener)
        }
      }
    }

    if (listeners?.size) {
      return
    }

    try {
      await characteristic.stopNotifications()
      this.notificationListeners.delete(characteristic)
    } catch (error) {
      throw serviceError(
        'notification-subscription-failed',
        'Could not unsubscribe from GATT characteristic notifications.',
        error,
      )
    }
  }

  private getBluetooth(): WebBluetoothAPI {
    if (
      typeof window === 'undefined' ||
      typeof navigator === 'undefined'
    ) {
      throw serviceError(
        'unsupported',
        'Web Bluetooth is only available in a supported browser context.',
      )
    }

    const bluetooth = (navigator as BluetoothNavigator).bluetooth
    if (!bluetooth) {
      throw serviceError(
        'unsupported',
        'Web Bluetooth is not supported by this browser.',
      )
    }

    return bluetooth
  }

  private getDeviceHandle(
    device: BluetoothDeviceRecord,
  ): BluetoothDevice {
    const handle = this.deviceHandles.get(device)
    if (!handle) {
      throw serviceError(
        'gatt-unavailable',
        'This device was not selected by this Web Bluetooth service instance.',
      )
    }

    return handle
  }

  private getCharacteristicHandle(
    characteristic: GATTCharacteristicRecord,
  ): BluetoothRemoteGATTCharacteristic {
    const handle = this.characteristicHandles.get(characteristic)
    if (!handle) {
      throw serviceError(
        'characteristic-unavailable',
        'The requested GATT characteristic is no longer available.',
      )
    }

    return handle
  }
}

export const webBluetoothService = new WebBluetoothService()