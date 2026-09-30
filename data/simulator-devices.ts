import type { LucideIcon } from 'lucide-react'
import {
  Battery,
  Cpu,
  Headphones,
  Thermometer,
  Radio,
} from 'lucide-react'

export type DeviceStatus = 'Connected' | 'Available' | 'Saved'
export type BluetoothTechnology = 'BLE' | 'Classic'

export type Device = {
  id: string
  name: string
  type: string
  tech: BluetoothTechnology
  signal: number
  status: DeviceStatus
  battery?: number
  icon: LucideIcon
  capabilities: string[]
  accent: string
}

export const simulatorDevices: Device[] = [
  {
    id: 'nova-sound-x1',
    name: 'Nova Sound X1',
    type: 'Audio / Headphones',
    tech: 'Classic',
    signal: -42,
    status: 'Connected',
    battery: 82,
    icon: Headphones,
    capabilities: [
      'Media Control',
      'Volume',
      'Battery Telemetry',
      'Device Information',
    ],
    accent: 'cyan',
  },
  {
    id: 'apex-bms-pro',
    name: 'Apex BMS Pro 48V',
    type: 'Battery Management',
    tech: 'BLE',
    signal: -58,
    status: 'Available',
    battery: 92,
    icon: Battery,
    capabilities: [
      'Battery Telemetry',
      'GATT Services',
      'Read',
      'Write',
      'Notifications',
      'Device-Specific Controls',
    ],
    accent: 'emerald',
  },
  {
    id: 'aurasense-air',
    name: 'AuraSense Air Quality',
    type: 'Environmental Sensor',
    tech: 'BLE',
    signal: -67,
    status: 'Saved',
    icon: Thermometer,
    capabilities: [
      'Telemetry',
      'Read',
      'Notifications',
      'Device Information',
    ],
    accent: 'violet',
  },
  {
    id: 'dualsense-elite',
    name: 'DualSense Elite X',
    type: 'Game Controller',
    tech: 'BLE',
    signal: -74,
    status: 'Available',
    battery: 64,
    icon: Cpu,
    capabilities: [
      'Device Information',
      'GATT Services',
      'Read',
    ],
    accent: 'blue',
  },
  {
    id: 'bluetooth-control-test-unit',
    name: 'Bluetooth Control Test Unit',
    type: 'BLE Test Fixture',
    tech: 'BLE',
    signal: -52,
    status: 'Available',
    battery: 87,
    icon: Radio,
    capabilities: [
      'GATT Services',
      'Read',
      'Write',
      'Notifications',
      'Telemetry',
      'Media Control',
      'Volume',
    ],
    accent: 'cyan',
  },
]