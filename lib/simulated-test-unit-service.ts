import type {
  BluetoothDeviceRecord,
  BluetoothDisconnectListener,
  BluetoothNotificationListener,
  BluetoothService,
  GATTCharacteristicRecord,
  GATTServerRecord,
  GATTServiceRecord,
} from './bluetooth-service'

export const TEST_UNIT_ID = 'bluetooth-control-test-unit'

export const testUnitDeviceRecord: BluetoothDeviceRecord = {
  id: TEST_UNIT_ID,
  name: 'Bluetooth Control Test Unit',
  technology: 'BLE',
  connectionState: 'disconnected',
  capabilities: [
    { name: 'GATT Services', state: 'supported' },
    { name: 'Read', state: 'supported' },
    { name: 'Write', state: 'supported' },
    { name: 'Notifications', state: 'supported' },
    { name: 'Telemetry', state: 'supported' },
  ],
}

export type TestUnitState = {
  playing: boolean
  volume: number
  battery: number
  status: string
  voltage: number
  current: number
  temperature: number
}

const uuid = (short: string) =>
  `0000${short}-0000-1000-8000-00805f9b34fb`

export const testUnitUUIDs = {
  genericAccess: uuid('1800'),
  deviceName: uuid('2a00'),
  appearance: uuid('2a01'),
  batteryService: uuid('180f'),
  batteryLevel: uuid('2a19'),
  controlService: 'f0c70000-7b1e-4f30-a9b1-550000000001',
  playPause: 'f0c70001-7b1e-4f30-a9b1-550000000001',
  volume: 'f0c70002-7b1e-4f30-a9b1-550000000001',
  status: 'f0c70003-7b1e-4f30-a9b1-550000000001',
  telemetry: 'f0c70004-7b1e-4f30-a9b1-550000000001',
}

type CharacteristicDefinition = {
  uuid: string
  name: string
  read: boolean
  write: boolean
  notify: boolean
}

const serviceDefinitions: Array<{
  uuid: string
  name: string
  standard: boolean
  characteristics: CharacteristicDefinition[]
}> = [
  {
    uuid: testUnitUUIDs.genericAccess,
    name: 'Generic Access',
    standard: true,
    characteristics: [
      {
        uuid: testUnitUUIDs.deviceName,
        name: 'Device Name',
        read: true,
        write: false,
        notify: false,
      },
      {
        uuid: testUnitUUIDs.appearance,
        name: 'Appearance',
        read: true,
        write: false,
        notify: false,
      },
    ],
  },
  {
    uuid: testUnitUUIDs.batteryService,
    name: 'Battery Service',
    standard: true,
    characteristics: [
      {
        uuid: testUnitUUIDs.batteryLevel,
        name: 'Battery Level',
        read: true,
        write: false,
        notify: true,
      },
    ],
  },
  {
    uuid: testUnitUUIDs.controlService,
    name: 'Fictional Control Service',
    standard: false,
    characteristics: [
      {
        uuid: testUnitUUIDs.playPause,
        name: 'Play/Pause',
        read: false,
        write: true,
        notify: false,
      },
      {
        uuid: testUnitUUIDs.volume,
        name: 'Volume',
        read: true,
        write: true,
        notify: false,
      },
      {
        uuid: testUnitUUIDs.status,
        name: 'Status',
        read: true,
        write: false,
        notify: true,
      },
      {
        uuid: testUnitUUIDs.telemetry,
        name: 'Telemetry',
        read: false,
        write: false,
        notify: true,
      },
    ],
  },
]

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

function characteristicBytes(
  characteristicUUID: string,
  state: TestUnitState,
): Uint8Array {
  switch (characteristicUUID) {
    case testUnitUUIDs.deviceName:
      return textEncoder.encode(testUnitDeviceRecord.name)
    case testUnitUUIDs.appearance:
      return Uint8Array.of(0, 0)
    case testUnitUUIDs.batteryLevel:
      return Uint8Array.of(state.battery)
    case testUnitUUIDs.volume:
      return Uint8Array.of(state.volume)
    case testUnitUUIDs.status:
      return textEncoder.encode(state.status)
    case testUnitUUIDs.telemetry:
      return textEncoder.encode(JSON.stringify({
        voltage: state.voltage,
        current: state.current,
        temperature: state.temperature,
        battery: state.battery,
      }))
    default:
      return Uint8Array.of(state.playing ? 1 : 0)
  }
}

export class SimulatedTestUnitService implements BluetoothService {
  private state: TestUnitState = {
    playing: false,
    volume: 68,
    battery: 87,
    status: 'Paused',
    voltage: 5.02,
    current: 0.14,
    temperature: 26.8,
  }

  private readonly notificationListeners = new Map<
    string,
    Set<BluetoothNotificationListener>
  >()
  private readonly disconnectListeners = new Set<BluetoothDisconnectListener>()
  private telemetryTimer: ReturnType<typeof setInterval> | undefined
  private telemetryStep = 0

  getState(): TestUnitState {
    return { ...this.state }
  }

  isSupported(): boolean {
    return false
  }

  async getAvailability(): Promise<boolean> {
    return false
  }

  async requestDevice(): Promise<BluetoothDeviceRecord> {
    throw new Error('The simulator does not request physical Bluetooth devices.')
  }

  async connect(device: BluetoothDeviceRecord): Promise<GATTServerRecord> {
    this.assertTestUnit(device)
    device.connectionState = 'connected'
    return { id: TEST_UNIT_ID, deviceId: TEST_UNIT_ID, connected: true }
  }

  disconnect(device: BluetoothDeviceRecord): void {
    this.assertTestUnit(device)
    device.connectionState = 'disconnected'
    this.stopTelemetryTimer()
    for (const listener of this.disconnectListeners) listener()
  }

  addDisconnectListener(
    device: BluetoothDeviceRecord,
    listener: BluetoothDisconnectListener,
  ): void {
    this.assertTestUnit(device)
    this.disconnectListeners.add(listener)
  }

  removeDisconnectListener(
    device: BluetoothDeviceRecord,
    listener: BluetoothDisconnectListener,
  ): void {
    this.assertTestUnit(device)
    this.disconnectListeners.delete(listener)
  }

  async getServices(device: BluetoothDeviceRecord): Promise<GATTServiceRecord[]> {
    this.assertTestUnit(device)
    return serviceDefinitions.map((service) => ({
      id: `${TEST_UNIT_ID}:${service.uuid}`,
      uuid: service.uuid,
      name: service.name,
      standard: service.standard,
    }))
  }

  async getCharacteristics(
    service: GATTServiceRecord,
  ): Promise<GATTCharacteristicRecord[]> {
    const definition = serviceDefinitions.find(
      (candidate) => candidate.uuid === service.uuid,
    )
    if (!definition || !service.id.startsWith(`${TEST_UNIT_ID}:`)) {
      throw new Error('The requested service is not part of the simulator.')
    }

    return definition.characteristics.map((characteristic) => ({
      id: `${service.id}:${characteristic.uuid}`,
      uuid: characteristic.uuid,
      name: characteristic.name,
      properties: {
        read: characteristic.read,
        write: characteristic.write,
        writeWithoutResponse: false,
        notify: characteristic.notify,
        indicate: false,
      },
    }))
  }

  async readCharacteristic(
    characteristic: GATTCharacteristicRecord,
  ): Promise<Uint8Array> {
    this.assertConnected()
    const definition = this.getCharacteristicDefinition(characteristic)
    if (!definition.read) {
      throw new Error(`${definition.name} does not support reads.`)
    }

    return characteristicBytes(definition.uuid, this.state)
  }

  async writeCharacteristic(
    characteristic: GATTCharacteristicRecord,
    value: Uint8Array,
  ): Promise<void> {
    this.assertConnected()
    const definition = this.getCharacteristicDefinition(characteristic)
    if (!definition.write) {
      throw new Error(`${definition.name} does not support writes.`)
    }

    const input = textDecoder.decode(value).trim()
    if (definition.uuid === testUnitUUIDs.playPause) {
      this.state.playing = input === 'toggle'
        ? !this.state.playing
        : input === '1' || input.toLowerCase() === 'true' || input.toLowerCase() === 'play'
      this.state.status = this.state.playing ? 'Playing' : 'Paused'
      this.notify(testUnitUUIDs.status)
      return
    }

    const volume = Number(input)
    if (!Number.isFinite(volume)) {
      throw new Error('Volume must be a number between 0 and 100.')
    }
    this.state.volume = Math.max(0, Math.min(100, Math.round(volume)))
  }

  async subscribeToNotifications(
    characteristic: GATTCharacteristicRecord,
    listener: BluetoothNotificationListener,
  ): Promise<void> {
    this.assertConnected()
    const definition = this.getCharacteristicDefinition(characteristic)
    if (!definition.notify) {
      throw new Error(`${definition.name} does not support notifications.`)
    }

    let listeners = this.notificationListeners.get(definition.uuid)
    if (!listeners) {
      listeners = new Set()
      this.notificationListeners.set(definition.uuid, listeners)
    }
    listeners.add(listener)
    listener(characteristicBytes(definition.uuid, this.state))
    if (definition.uuid === testUnitUUIDs.telemetry) {
      this.startTelemetryTimer()
    }
  }

  async unsubscribeFromNotifications(
    characteristic: GATTCharacteristicRecord,
    listener?: BluetoothNotificationListener,
  ): Promise<void> {
    const definition = this.getCharacteristicDefinition(characteristic)
    const listeners = this.notificationListeners.get(definition.uuid)
    if (listener) listeners?.delete(listener)
    else listeners?.clear()
    if (listeners?.size === 0) {
      this.notificationListeners.delete(definition.uuid)
    }
    if (!this.notificationListeners.has(testUnitUUIDs.telemetry)) {
      this.stopTelemetryTimer()
    }
  }

  private assertTestUnit(device: BluetoothDeviceRecord): void {
    if (device.id !== TEST_UNIT_ID) {
      throw new Error('This simulated service only owns the test unit.')
    }
  }

  private assertConnected(): void {
    if (testUnitDeviceRecord.connectionState !== 'connected') {
      throw new Error('Connect the simulated test unit before using GATT.')
    }
  }

  private getCharacteristicDefinition(
    characteristic: GATTCharacteristicRecord,
  ): CharacteristicDefinition {
    if (!characteristic.id.startsWith(`${TEST_UNIT_ID}:`)) {
      throw new Error('The requested characteristic is not part of the simulator.')
    }
    const definition = serviceDefinitions
      .flatMap((service) => service.characteristics)
      .find((candidate) => candidate.uuid === characteristic.uuid)
    if (!definition) {
      throw new Error('The requested characteristic is not available.')
    }
    return definition
  }

  private notify(characteristicUUID: string): void {
    const value = characteristicBytes(characteristicUUID, this.state)
    for (const listener of this.notificationListeners.get(characteristicUUID) || []) {
      listener(value)
    }
  }

  private startTelemetryTimer(): void {
    if (this.telemetryTimer) return
    this.telemetryTimer = setInterval(() => {
      this.telemetryStep += 1
      this.state.voltage = Number((5.02 + Math.sin(this.telemetryStep / 3) * 0.04).toFixed(2))
      this.state.current = Number((0.14 + Math.cos(this.telemetryStep / 4) * 0.03).toFixed(2))
      this.state.temperature = Number((26.8 + Math.sin(this.telemetryStep / 5) * 0.2).toFixed(1))
      if (this.telemetryStep % 30 === 0) {
        this.state.battery = Math.max(1, this.state.battery - 1)
        this.notify(testUnitUUIDs.batteryLevel)
      }
      this.notify(testUnitUUIDs.telemetry)
    }, 2000)
  }

  private stopTelemetryTimer(): void {
    if (this.telemetryTimer) clearInterval(this.telemetryTimer)
    this.telemetryTimer = undefined
  }
}

export const simulatedTestUnitService = new SimulatedTestUnitService()