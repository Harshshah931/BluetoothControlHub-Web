'use client'

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { LucideIcon } from 'lucide-react'

import {
  Activity,
  Battery,
  Bluetooth,
  ChevronRight,
  CircleHelp,
  Cpu,
  Gauge,
  Headphones,
  Heart,
  Home,
  Info,
  LayoutGrid,
  Menu,
  MoreHorizontal,
  Pause,
  Play,
  Radio,
  RefreshCw,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Thermometer,
  Volume2,
  Wifi,
  X,
  Zap,
  ShieldCheck,
  Terminal,
  Cable,
  Check,
  Lock,
} from 'lucide-react'

import {
  simulatorDevices,
  type Device,
} from '../data/simulator-devices'
import type {
  BluetoothDeviceRecord,
  GATTCharacteristicRecord,
  GATTServiceRecord,
} from '../lib/bluetooth-service'
import {
  BluetoothServiceError,
  webBluetoothService,
  type WebBluetoothStatus,
} from '../lib/web-bluetooth-service'
import {
  simulatedTestUnitService,
  testUnitDeviceRecord,
  testUnitUUIDs,
  TEST_UNIT_ID,
} from '../lib/simulated-test-unit-service'
import '../app/globals.css'

const nav = [
  {
    label: 'Overview',
    href: '/',
    icon: Home,
  },
  {
    label: 'Devices',
    href: '/devices',
    icon: Bluetooth,
  },
  {
    label: 'Activity',
    href: '/activity',
    icon: Activity,
  },
  {
    label: 'Favorites',
    href: '/favorites',
    icon: Heart,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

function go(path: string) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function signalBars(value: number) {
  return value > -55 ? 4 : value > -65 ? 3 : value > -75 ? 2 : 1
}

function realDeviceName(device: BluetoothDeviceRecord): string {
  return device.name && device.name !== 'Unnamed BLE Device'
    ? device.name
    : 'Name not available'
}

function Logo() {
  return (
    <div className="brand">
      <div className="brand-mark">
        <Bluetooth size={22} strokeWidth={2.4} />
      </div>

      <div>
        <strong>Bluetooth</strong>
        <span>CONTROL HUB</span>
      </div>
    </div>
  )
}

function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: string
}) {
  return <span className={`badge ${tone}`}>{children}</span>
}

function SignalIndicator({ value }: { value: number }) {
  return (
    <span
      className="signal"
      aria-label={`${value} dBm signal`}
    >
      {[1, 2, 3, 4].map((n) => (
        <i
          key={n}
          className={n <= signalBars(value) ? 'active' : ''}
        />
      ))}
    </span>
  )
}

function DeviceIcon({
  device,
  size = 'md',
}: {
  device: Device
  size?: 'sm' | 'md' | 'lg'
}) {
  const Icon = device.icon

  return (
    <div
      className={`device-icon ${size} ${device.accent}`}
    >
      <Icon
        size={
          size === 'lg'
            ? 26
            : size === 'md'
              ? 21
              : 17
        }
      />
    </div>
  )
}

function Sidebar({
  path,
  bluetoothStatus,
  deviceCount,
}: {
  path: string
  bluetoothStatus: WebBluetoothStatus
  deviceCount: number
}) {
  return (
    <aside className="sidebar">
      <Logo />

      <div className="side-label">WORKSPACE</div>

      <nav>
        {nav.map(({ label, href, icon: Icon }) => (
          <a
            key={href}
            href={href}
            onClick={(e) => {
              e.preventDefault()
              go(href)
            }}
            className={
              path === href ||
              (href !== '/' && path.startsWith(href))
                ? 'active'
                : ''
            }
          >
            <Icon size={18} />
            <span>{label}</span>

            {label === 'Devices' && <em>{deviceCount}</em>}
          </a>
        ))}
      </nav>

      <div className="sidebar-spacer" />

      <div
        className={`sidebar-card ${
          bluetoothStatus === 'UNSUPPORTED'
            ? 'unavailable'
            : ''
        }`}
      >
        <div className="pulse-dot" />

        <div>
          <b>
            {bluetoothStatus === 'SUPPORTED'
              ? 'Web Bluetooth supported'
              : 'Web Bluetooth unavailable'}
          </b>
          <small>
            {bluetoothStatus === 'SUPPORTED'
              ? 'BLE device chooser available'
              : 'Use a supported secure browser'}
          </small>
        </div>
      </div>

      <button className="help-link">
        <CircleHelp size={16} />
        Help & docs
      </button>

      <div className="profile">
        <div className="avatar">OP</div>

        <div>
          <b>Operator</b>
          <small>Local workspace</small>
        </div>

        <MoreHorizontal size={16} />
      </div>
    </aside>
  )
}

function MobileNav({ path }: { path: string }) {
  return (
    <nav className="mobile-nav">
      {nav.map(({ label, href, icon: Icon }) => (
        <a
          key={href}
          href={href}
          onClick={(e) => {
            e.preventDefault()
            go(href)
          }}
          className={
            path === href ||
            (href !== '/' && path.startsWith(href))
              ? 'active'
              : ''
          }
        >
          <Icon size={19} />
          <span>{label}</span>
        </a>
      ))}
    </nav>
  )
}

function Header({
  title,
  onMenu,
  bluetoothStatus,
}: {
  title: string
  onMenu: () => void
  bluetoothStatus: WebBluetoothStatus
}) {
  return (
    <header className="topbar">
      <button
        className="icon-button mobile-only"
        aria-label="Open navigation"
        onClick={onMenu}
      >
        <Menu size={20} />
      </button>

      <div>
        <div className="crumb">
          CONTROL CENTER
          <ChevronRight size={13} />
          {title.toUpperCase()}
        </div>

        <h1>{title}</h1>
      </div>

      <div className="top-actions">
        <div className="bluetooth-status">
          <span
            className={`pulse-dot ${
              bluetoothStatus === 'UNSUPPORTED'
                ? 'unavailable'
                : ''
            }`}
          />
          Browser Bluetooth
          <b
            className={
              bluetoothStatus === 'UNSUPPORTED'
                ? 'unavailable'
                : ''
            }
          >
            {bluetoothStatus === 'SUPPORTED'
              ? 'Supported'
              : 'Unavailable'}
          </b>
        </div>

        <button className="icon-button">
          <Search size={18} />
        </button>

        <button className="icon-button">
          <Settings size={18} />
        </button>
      </div>
    </header>
  )
}

function Card({
  children,
  className = '',
  onClick,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <section
      className={`card ${className}`}
      onClick={onClick}
    >
      {children}
    </section>
  )
}

function Stat({
  label,
  value,
  note,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  note: string
  icon: LucideIcon
  tone: string
}) {
  return (
    <Card className="stat">
      <div className={`stat-icon ${tone}`}>
        <Icon size={18} />
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </Card>
  )
}

function DeviceRow({
  device,
  compact = false,
  onOpen,
}: {
  device: Device
  compact?: boolean
  onOpen?: () => void
}) {
  return (
    <div
      className={`device-row ${compact ? 'compact' : ''}`}
      onClick={onOpen}
    >
      <DeviceIcon
        device={device}
        size={compact ? 'sm' : 'md'}
      />

      <div className="device-main">
        <b>{device.name}</b>
        <span>
          {device.type} <i>·</i> {device.tech}
        </span>
      </div>

      <SignalIndicator value={device.signal} />

      <span className="signal-value mono">
        {device.signal} dBm
      </span>

      {device.battery && (
        <span className="battery">
          <Battery size={14} />
          {device.battery}%
        </span>
      )}

      <Badge
        tone={
          device.status === 'Connected'
            ? 'success'
            : device.status === 'Available'
              ? 'cyan'
              : 'neutral'
        }
      >
        {device.status}
      </Badge>

      <button
        className="row-arrow"
        aria-label={`Open ${device.name}`}
        onClick={(e) => {
          e.stopPropagation()
          onOpen?.()
        }}
      >
        <ChevronRight size={17} />
      </button>
    </div>
  )
}

function Dashboard({
  onScan,
  bluetoothStatus,
  selectedDevice,
  connectionState,
}: {
  onScan: () => void
  bluetoothStatus: WebBluetoothStatus
  selectedDevice: BluetoothDeviceRecord | null
  connectionState: RealDeviceConnectionState
}) {
  return (
    <>
      <div className="hero-row">
        <div>
          <Badge tone="cyan">
            <span className="pulse-dot" />
            SYSTEM ONLINE
          </Badge>

          <h2>
            Your Bluetooth
            <br />
            <span>control center.</span>
          </h2>

          <p>
            Discover, inspect and manage supported
            Bluetooth devices from one precise workspace.
          </p>

          <div className="hero-actions">
            <button
              className="button primary"
              onClick={onScan}
            >
              <Radio size={17} />
              Scan for devices
            </button>

            <button
              className="button ghost"
              onClick={() => go('/compatibility')}
            >
              <ShieldCheck size={17} />
              Check compatibility
            </button>
          </div>
        </div>

        <div className="signal-orb">
          <div className="orb-ring ring-1" />
          <div className="orb-ring ring-2" />

          <div className="orb-core">
            <Bluetooth size={34} />
          </div>

          <span>
            BLE / CLASSIC
            <br />
            <b>LISTENING</b>
          </span>
        </div>
      </div>

      <div className="stats-grid">
        <Stat
          label="Nearby devices"
          value={selectedDevice ? '1' : '0'}
          note={selectedDevice ? 'User-selected BLE device' : 'No devices'}
          icon={Radio}
          tone="cyan"
        />

        <Stat
          label="Connected sessions"
          value={connectionState === 'connected' ? '1' : '0'}
          note={connectionState === 'connected' ? 'This page session' : 'No active sessions'}
          icon={Wifi}
          tone="emerald"
        />

        <Stat
          label="Saved devices"
          value="0"
          note="No saved devices"
          icon={Heart}
          tone="violet"
        />

        <Stat
          label="Signal health"
          value="—"
          note="Signal data unavailable"
          icon={Gauge}
          tone="blue"
        />
      </div>

      <div className="section-heading">
        <div>
          <span className="eyebrow">REAL DEVICE INVENTORY</span>
          <h3>Recent devices</h3>
        </div>

        <button
          className="text-button"
          onClick={() => go('/devices')}
        >
          View all
          <ChevronRight size={15} />
        </button>
      </div>

      <Card className="device-list">
        {selectedDevice ? (
          <div className="real-inventory-row">
            <div className="device-icon md cyan">
              <Bluetooth size={21} />
            </div>
            <div className="device-main">
              <b>{realDeviceName(selectedDevice)}</b>
              <span>BLE · {connectionStateLabel(connectionState)}</span>
            </div>
            <Badge
              tone={connectionState === 'connected' ? 'success' : 'cyan'}
            >
              {connectionStateLabel(connectionState)}
            </Badge>
            <button
              className="row-arrow"
              aria-label="Open selected real device"
              onClick={() => go('/devices/selected-real-device')}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        ) : (
          <div className="inventory-empty">
            <div>
              <b>No recent devices</b>
              <span>No Bluetooth devices have been selected yet.</span>
            </div>
            <button className="button ghost" onClick={onScan}>
              <Radio size={16} />
              Discover devices
            </button>
          </div>
        )}
      </Card>

      <div className="lower-grid">
        <Card className="quick-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">SEPARATE WORKSPACE</span>
              <h3>Device simulator</h3>
            </div>

            <Sparkles
              size={18}
              className="cyan-text"
            />
          </div>

          <p className="simulator-description">
            Fictional devices are available for demonstration only.
          </p>
          <button
            className="button ghost"
            onClick={() => go('/simulator')}
          >
            <Cpu size={16} />
            Open simulator
          </button>
        </Card>

        <Card className="compat-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">ENVIRONMENT</span>
              <h3>Browser compatibility</h3>
            </div>

            <ShieldCheck
              size={18}
              className="emerald-text"
            />
          </div>

          <div className="compat-line">
            <span>
              <Check size={14} />
              Secure context
            </span>

            <Badge tone="success">
              HTTPS active
            </Badge>
          </div>

          <div className="compat-line">
            <span>
              <Check size={14} />
              Web Bluetooth API
            </span>

            <Badge
              tone={
                bluetoothStatus === 'SUPPORTED'
                  ? 'success'
                  : 'neutral'
              }
            >
              {bluetoothStatus}
            </Badge>
          </div>

          <button
            className="text-button"
            onClick={() => go('/permissions')}
          >
            View permissions
            <ChevronRight size={15} />
          </button>
        </Card>
      </div>
    </>
  )
}

type DeviceSelectionState =
  | 'IDLE'
  | 'REQUESTING'
  | 'DEVICE_SELECTED'
  | 'ERROR'

type RealDeviceConnectionState =
  | 'idle'
  | 'selected'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error'

type GATTDiscoveryState =
  | 'NOT_CONNECTED'
  | 'DISCOVERING'
  | 'READY'
  | 'ERROR'

function deviceSelectionErrorMessage(error: unknown): string {
  if (error instanceof BluetoothServiceError) {
    switch (error.code) {
      case 'device-cancelled':
        return 'Bluetooth device selection was cancelled.'
      case 'unsupported':
        return 'Web Bluetooth is not available in this browser.'
      case 'unavailable':
        return 'Bluetooth is unavailable on this device.'
      case 'permission-denied':
        return 'Bluetooth access was denied.'
      case 'request-failed':
        return 'Bluetooth device selection could not be completed.'
      default:
        return 'An unexpected error occurred while selecting a Bluetooth device.'
    }
  }

  return 'An unexpected error occurred while selecting a Bluetooth device.'
}

function deviceConnectionErrorMessage(error: unknown): string {
  if (error instanceof BluetoothServiceError) {
    switch (error.code) {
      case 'unsupported':
        return 'Web Bluetooth is not available in this browser.'
      case 'unavailable':
        return 'Bluetooth is unavailable on this device.'
      case 'permission-denied':
        return 'Bluetooth access was denied.'
      case 'gatt-unavailable':
        return 'This device does not expose a GATT server.'
      case 'connection-failed':
        return 'Unable to connect to this BLE device.'
      default:
        return 'An unexpected error occurred while connecting to this BLE device.'
    }
  }

  return 'An unexpected error occurred while connecting to this BLE device.'
}

function connectionStateLabel(state: RealDeviceConnectionState): string {
  switch (state) {
    case 'idle':
      return 'IDLE'
    case 'selected':
      return 'SELECTED'
    case 'connecting':
      return 'CONNECTING…'
    case 'connected':
      return 'CONNECTED'
    case 'disconnected':
      return 'DISCONNECTED'
    case 'error':
      return 'ERROR'
  }
}

function gattDiscoveryErrorMessage(error: unknown): string {
  if (error instanceof BluetoothServiceError) {
    switch (error.code) {
      case 'unsupported':
        return 'Web Bluetooth is not available in this browser.'
      case 'permission-denied':
        return 'The browser denied access to this GATT data.'
      case 'gatt-unavailable':
        return 'This BLE device does not expose a GATT server.'
      case 'not-connected':
        return 'Connect to the BLE device before discovering its services.'
      case 'service-discovery-failed':
        return 'Unable to discover accessible GATT services.'
      case 'characteristic-unavailable':
        return 'Unable to discover characteristics for an accessible service.'
      case 'unavailable':
        return 'The Bluetooth device is unavailable.'
      default:
        return 'An unexpected error occurred during GATT discovery.'
    }
  }

  return 'An unexpected error occurred during GATT discovery.'
}

function ScanView({
    selectedDevice,
    selectionState,
    selectionError,
    connectionState,
    connectionError,
    gattDiscoveryState,
    onRequestDevice,
    onConnect,
    onDisconnect,
  }: {
    selectedDevice: BluetoothDeviceRecord | null
    selectionState: DeviceSelectionState
    selectionError: string | null
    connectionState: RealDeviceConnectionState
    connectionError: string | null
    gattDiscoveryState: GATTDiscoveryState
    onRequestDevice: () => void
    onConnect: () => void
    onDisconnect: () => void
  }) {
    return (
      <>
        <div className="page-intro">
          <div>
            <Badge tone="cyan">DISCOVERY MODE</Badge>
            <h2>Scan devices</h2>
            <p>
              Choose a BLE peripheral through the browser prompt. Only selected real devices appear here.
            </p>
          </div>

          <button
            className="button primary"
            onClick={onRequestDevice}
            disabled={
              selectionState === 'REQUESTING' ||
              connectionState === 'connecting'
            }
          >
            {selectionState === 'REQUESTING' ? (
              <>
                <Bluetooth size={17} />
                Selecting...
              </>
            ) : (
              <>
                <Radio size={17} />
                Start scan
              </>
            )}
          </button>
        </div>

        <Card className="scan-banner">
          <div className="scan-art">
            <Radio size={24} />
          </div>
          <div>
            <b>
              {selectionState === 'REQUESTING'
                ? 'Waiting for Bluetooth device selection...'
                : selectionState === 'DEVICE_SELECTED'
                  ? 'Bluetooth device selected.'
                  : 'Ready to open the Bluetooth chooser'}
            </b>
            <span>Selection uses the browser's explicit BLE permission flow.</span>
          </div>
          <div className="scan-count">
            <strong>{selectedDevice ? '1' : '0'}</strong>
            <span>{selectedDevice ? 'device found' : 'devices found'}</span>
          </div>
        </Card>

        {selectionState === 'ERROR' && selectionError && (
          <div className="selection-error" role="alert">
            {selectionError}
          </div>
        )}

        {selectedDevice ? (
          <Card className="real-device-card">
            <div className="real-device-heading">
              <span className="eyebrow">REAL DEVICE</span>
              <Badge
                tone={
                  connectionState === 'connected'
                    ? 'success'
                    : connectionState === 'error'
                      ? 'neutral'
                      : 'cyan'
                }
              >
                {connectionStateLabel(connectionState)}
              </Badge>
            </div>

            <div className="real-device-content">
              <div className="device-icon md cyan">
                <Bluetooth size={21} />
              </div>
              <div>
                <h3>{realDeviceName(selectedDevice)}</h3>
                <p>
                  BLE · {connectionStateLabel(connectionState)}
                </p>
              </div>
              <button
                className="text-button"
                onClick={() => go('/devices/selected-real-device')}
              >
                View details
                <ChevronRight size={15} />
              </button>
            </div>

            <div className="real-device-id">
              <span>Device ID</span>
              <code>{selectedDevice.id}</code>
            </div>

            {connectionState === 'connected' ? (
              <div className="real-device-actions">
                <button className="button ghost" onClick={onDisconnect}>
                  <X size={16} />
                  Disconnect session
                </button>
                <span>This disconnects this page's GATT session only.</span>
              </div>
            ) : (
              <div className="real-device-actions">
                <button
                  className="button primary"
                  onClick={onConnect}
                  disabled={connectionState === 'connecting'}
                >
                  <Bluetooth size={16} />
                  {connectionState === 'connecting'
                    ? 'CONNECTING…'
                    : 'Connect'}
                </button>
              </div>
            )}

            {gattDiscoveryState === 'DISCOVERING' && (
              <div className="gatt-discovery-progress" role="status">
                Discovering GATT services…
              </div>
            )}

            {connectionError && (
              <div className="selection-error" role="alert">
                {connectionError}
              </div>
            )}
          </Card>
        ) : (
          <Card className="device-list inventory-empty-card">
            <div className="inventory-empty">
              <div>
                <b>NO DEVICES DISCOVERED</b>
                <span>No Bluetooth devices have been selected yet.</span>
              </div>
              <button className="button primary" onClick={onRequestDevice}>
                <Radio size={16} />
                Start scan
              </button>
            </div>
          </Card>
        )}
      </>
    )
  }
function DeviceDetails({
  device,
}: {
  device: Device
}) {
  const [connected, setConnected] = useState(
    device.status === 'Connected',
  )

  return (
    <>
      <div className="detail-head">
        <button
          className="back-button"
          onClick={() => go('/simulator')}
        >
          <ChevronRight
            size={16}
            className="rotate-180"
          />
          Devices
        </button>

        <div className="detail-title">
          <DeviceIcon
            device={device}
            size="lg"
          />

          <div>
            <Badge tone="neutral">SIMULATED DEVICE</Badge>
            <Badge
              tone={
                connected
                  ? 'success'
                  : 'cyan'
              }
            >
              {connected
                ? 'SESSION CONNECTED'
                : 'AVAILABLE TO CONNECT'}
            </Badge>

            <h2>{device.name}</h2>

            <p>
              {device.type} · {device.tech} · last
              seen 2m ago
            </p>
          </div>
        </div>

        <div className="detail-actions">
          <button
            className="button ghost"
            onClick={() =>
              setConnected(!connected)
            }
          >
            {connected ? (
              <>
                <X size={16} />
                Disconnect session
              </>
            ) : (
              <>
                <Bluetooth size={16} />
                Connect
              </>
            )}
          </button>

          <button className="icon-button">
            <Heart size={18} />
          </button>

          <button className="icon-button">
            <RefreshCw size={17} />
          </button>
        </div>
      </div>

      <div className="detail-grid">
        <Card>
          <div className="card-heading">
            <div>
              <span className="eyebrow">
                IDENTITY
              </span>
              <h3>Device profile</h3>
            </div>

            <Info size={17} />
          </div>

          <div className="metadata">
            <div>
              <span>Identifier</span>
              <b className="mono">
                C4:7A:3D:9F:12:88
              </b>
            </div>

            <div>
              <span>Manufacturer</span>
              <b>Nova Labs / Class 1</b>
            </div>

            <div>
              <span>Firmware</span>
              <b className="mono">
                v2.4.18 · BLE 5.3
              </b>
            </div>

            <div>
              <span>Signal strength</span>
              <b className="mono">
                {device.signal} dBm{' '}
                <SignalIndicator
                  value={device.signal}
                />
              </b>
            </div>

            <div>
              <span>Battery</span>
              <b>
                {device.battery
                  ? `${device.battery}%`
                  : 'Not detected'}
              </b>
            </div>

            <div>
              <span>Last seen</span>
              <b>2 minutes ago</b>
            </div>
          </div>
        </Card>

        <Card className="capability-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">
                DETECTED SURFACE
              </span>
              <h3>Capability matrix</h3>
            </div>

            <Cable size={17} />
          </div>

          <div className="cap-grid">
            {[
              'Media Control',
              'Volume',
              'Battery Telemetry',
              'Device Information',
              'GATT Services',
              'Read',
              'Write',
              'Notifications',
              'Indications',
              'Device-Specific Controls',
            ].map((name) => (
              <div
                className="cap-row"
                key={name}
              >
                <span>{name}</span>

                <Badge
                  tone={
                    device.capabilities.includes(
                      name,
                    )
                      ? 'success'
                      : 'muted'
                  }
                >
                  {device.capabilities.includes(
                    name,
                  )
                    ? 'SUPPORTED'
                    : 'NOT DETECTED'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="action-grid">
        <Card
          className="action-card"
          onClick={() =>
            device.capabilities.includes(
              'Media Control',
            ) &&
            go(
              `/simulator/${device.id}/control`,
            )
          }
        >
          <div className="quick-icon cyan">
            <SlidersHorizontal size={19} />
          </div>

          <div>
            <b>Device controls</b>
            <span>
              {device.capabilities.includes(
                'Media Control',
              )
                ? 'Manage supported controls'
                : 'No controls detected'}
            </span>
          </div>

          <ChevronRight size={18} />
        </Card>

        <Card
          className="action-card"
          onClick={() =>
            device.capabilities.includes(
              'GATT Services',
            ) &&
            go(
              `/simulator/${device.id}/gatt`,
            )
          }
        >
          <div className="quick-icon violet">
            <Cable size={19} />
          </div>

          <div>
            <b>GATT explorer</b>

            <span>
              {device.capabilities.includes(
                'GATT Services',
              )
                ? '2 services · 6 characteristics'
                : 'Unavailable for this device'}
            </span>
          </div>

          <ChevronRight size={18} />
        </Card>

        <Card
          className="action-card"
          onClick={() =>
            device.battery &&
            go(
              `/simulator/${device.id}/telemetry`,
            )
          }
        >
          <div className="quick-icon emerald">
            <Activity size={19} />
          </div>

          <div>
            <b>Telemetry</b>

            <span>
              {device.battery
                ? 'Live device metrics'
                : 'No telemetry detected'}
            </span>
          </div>

          <ChevronRight size={18} />
        </Card>
      </div>
    </>
  )
}

function RealDeviceDetails({
  device,
  connectionState,
  connectionError,
  gattDiscoveryState,
  gattServiceCount,
}: {
  device: BluetoothDeviceRecord
  connectionState: RealDeviceConnectionState
  connectionError: string | null
  gattDiscoveryState: GATTDiscoveryState
  gattServiceCount: number
}) {
  return (
    <>
      <div className="detail-head">
        <button
          className="back-button"
          onClick={() => go('/devices')}
        >
          <ChevronRight
            size={16}
            className="rotate-180"
          />
          Devices
        </button>

        <div className="detail-title">
          <div className="device-icon lg cyan">
            <Bluetooth size={26} />
          </div>

          <div>
            <Badge
              tone={
                connectionState === 'connected'
                  ? 'success'
                  : connectionState === 'error'
                    ? 'neutral'
                    : 'cyan'
              }
            >
              REAL DEVICE · {connectionStateLabel(connectionState)}
            </Badge>
            <h2>{device.name}</h2>
            <p>{device.technology} · {connectionStateLabel(connectionState)}</p>
          </div>
        </div>
      </div>

      {connectionError && (
        <div className="selection-error" role="alert">
          {connectionError}
        </div>
      )}

      <div className="detail-grid real-device-details">
        <Card>
          <div className="card-heading">
            <div>
              <span className="eyebrow">IDENTITY</span>
              <h3>Device profile</h3>
            </div>

            <Info size={17} />
          </div>

          <div className="metadata">
            <div>
              <span>Name</span>
              <b>{device.name}</b>
            </div>

            <div>
              <span>Device ID</span>
              <b className="mono">{device.id}</b>
            </div>

            <div>
              <span>Technology</span>
              <b>{device.technology}</b>
            </div>

            <div>
              <span>Connection state</span>
              <b>{connectionStateLabel(connectionState)}</b>
            </div>

            <div>
              <span>Manufacturer</span>
              <b>Not detected</b>
            </div>

            <div>
              <span>Firmware</span>
              <b>Not detected</b>
            </div>

            <div>
              <span>Signal strength</span>
              <b>Not detected</b>
            </div>

            <div>
              <span>Capabilities</span>
              <b>Not detected</b>
            </div>

            <div>
              <span>GATT services</span>
              <b>
                {gattDiscoveryState === 'READY'
                  ? `${gattServiceCount} discovered`
                  : gattDiscoveryState === 'DISCOVERING'
                    ? 'Discovering…'
                    : gattDiscoveryState === 'ERROR'
                      ? 'Discovery failed'
                      : 'Not discovered'}
              </b>
            </div>

            <div>
              <span>Battery</span>
              <b>Not detected</b>
            </div>
          </div>
        </Card>

        <Card
          className="action-card"
          onClick={() => {
            if (connectionState === 'connected') {
              go('/devices/selected-real-device/gatt')
            }
          }}
        >
          <div className="quick-icon violet">
            <Cable size={19} />
          </div>

          <div>
            <b>GATT Explorer</b>
            <span>
              {gattDiscoveryState === 'DISCOVERING'
                ? 'Discovering GATT services…'
                : gattDiscoveryState === 'READY'
                  ? `${gattServiceCount} services discovered`
                  : connectionState === 'connected'
                    ? 'Discover accessible primary services'
                    : 'Connect before discovering services'}
            </span>
          </div>

          <Badge
            tone={
              connectionState === 'connected'
                ? 'success'
                : 'muted'
            }
          >
            {connectionState === 'connected'
              ? 'CONNECTED'
              : 'NOT CONNECTED'}
          </Badge>
          <ChevronRight size={18} />
        </Card>
      </div>
    </>
  )
}

function ControlView({
  device,
}: {
  device: Device
}) {
  const [playing, setPlaying] = useState(true)

  return (
    <>
      <div className="page-intro">
        <div>
          <button
            className="back-button"
            onClick={() =>
              go(`/simulator/${device.id}`)
            }
          >
            <ChevronRight
              size={16}
              className="rotate-180"
            />
            {device.name}
          </button>

          <h2>Device controls</h2>

          <p>
            Only controls exposed by this device
            protocol are shown.
          </p>
        </div>

        <Badge tone="neutral">
          SIMULATED DEVICE
        </Badge>
      </div>

      <div className="control-layout">
        <Card className="now-playing">
          <div className="eyebrow">
            MEDIA CONTROL · SUPPORTED
          </div>

          <div className="album">
            <div className="album-art">
              <Headphones size={32} />
            </div>

            <div>
              <span>NOW PLAYING</span>
              <b>Signal / Noise</b>
              <small>Nova Labs Radio</small>
            </div>
          </div>

          <div className="progress">
            <span />
            <i />
          </div>

          <div className="time-row">
            <span>01:42</span>
            <span>03:48</span>
          </div>

          <div className="media-actions">
            <button>
              <Volume2 size={18} />
            </button>

            <button>
              <ChevronRight
                size={20}
                className="rotate-180"
              />
            </button>

            <button
              className="play-button"
              onClick={() =>
                setPlaying(!playing)
              }
            >
              {playing ? (
                <Pause size={20} />
              ) : (
                <Play size={20} />
              )}
            </button>

            <button>
              <ChevronRight size={20} />
            </button>

            <button>
              <MoreHorizontal size={19} />
            </button>
          </div>
        </Card>

        <Card className="volume-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">
                AUDIO OUTPUT
              </span>
              <h3>Volume</h3>
            </div>

            <Volume2 size={18} />
          </div>

          <div className="volume-value">
            68<span>%</span>
          </div>

          <input
            type="range"
            defaultValue="68"
            aria-label="Volume"
          />

          <div className="range-labels">
            <span>Mute</span>
            <span>Maximum</span>
          </div>

          <div className="control-note">
            <Check size={14} />
            Volume characteristic detected ·
            writable
          </div>
        </Card>
      </div>

      <Card className="unsupported">
        <div className="quick-icon muted">
          <Zap size={18} />
        </div>

        <div>
          <b>Device-specific controls</b>
          <span>
            This device does not expose an
            authorized device-specific control
            surface.
          </span>
        </div>

        <Badge tone="muted">
          NOT DETECTED
        </Badge>
      </Card>
    </>
  )
}

function GattView({
  device,
}: {
  device: Device
}) {
  const [open, setOpen] = useState<string | null>(
    'generic',
  )

  return (
    <>
      <div className="page-intro">
        <div>
          <button
            className="back-button"
            onClick={() =>
              go(`/simulator/${device.id}`)
            }
          >
            <ChevronRight
              size={16}
              className="rotate-180"
            />
            {device.name}
          </button>

          <h2>GATT explorer</h2>

          <p>
            Inspect detected services and
            characteristic properties.
          </p>
        </div>

        <Badge tone="cyan">
          <Cable size={13} /> SIMULATED DEVICE
        </Badge>
      </div>

      <div className="gatt-layout">
        <Card className="service-tree">
          <div className="card-heading">
            <div>
              <span className="eyebrow">
                SERVICE TREE
              </span>
              <h3>Detected services</h3>
            </div>

            <RefreshCw size={16} />
          </div>

          {[
            [
              'generic',
              'Generic Access',
              '00001800-0000-1000-8000-00805f9b34fb',
              '2',
            ],
            [
              'battery',
              'Battery Service',
              '0000180f-0000-1000-8000-00805f9b34fb',
              '1',
            ],
            [
              'custom',
              'Apex telemetry',
              '8f3c2000-7f1a-4a9c-b0d0-22e5a0cd4401',
              '3',
            ],
          ].map(([id, name, uuid, count]) => (
            <div
              key={id}
              className={`service-item ${
                open === id ? 'selected' : ''
              }`}
              onClick={() =>
                setOpen(
                  open === id ? null : id,
                )
              }
            >
              <div className="service-icon">
                <Cable size={16} />
              </div>

              <div>
                <b>{name}</b>

                <span className="mono">
                  {uuid}
                </span>

                <small>
                  {count} characteristics ·{' '}
                  {id === 'custom'
                    ? 'CUSTOM'
                    : 'STANDARD'}
                </small>
              </div>

              <ChevronRight
                size={16}
                className={
                  open === id
                    ? 'rotate-90'
                    : ''
                }
              />
            </div>
          ))}
        </Card>

        <Card className="characteristics">
          <div className="card-heading">
            <div>
              <span className="eyebrow">
                CHARACTERISTICS
              </span>

              <h3>
                {open === 'custom'
                  ? 'Apex telemetry'
                  : 'Generic Access'}
              </h3>
            </div>

            <Badge tone="neutral">
              DEMO DATA
            </Badge>
          </div>

          {[
            [
              'Device Name',
              '2a00',
              'READ · WRITE',
            ],
            [
              'Appearance',
              '2a01',
              'READ',
            ],
            [
              'Battery Level',
              '2a19',
              'READ · NOTIFY',
            ],
            [
              'Pack Voltage',
              '2a20',
              'READ · NOTIFY',
            ],
          ]
            .slice(
              0,
              open === 'custom' ? 4 : 2,
            )
            .map(([name, uuid, props]) => (
              <div
                className="characteristic"
                key={uuid}
                onClick={() =>
                  go(
                    `/simulator/${device.id}/gatt/${uuid}`,
                  )
                }
              >
                <div className="char-icon">
                  <Terminal size={16} />
                </div>

                <div>
                  <b>{name}</b>
                  <span className="mono">
                    {uuid}
                  </span>
                </div>

                <div className="prop-list">
                  {props
                    .split(' · ')
                    .map((p) => (
                      <Badge
                        key={p}
                        tone={
                          p === 'WRITE'
                            ? 'cyan'
                            : 'neutral'
                        }
                      >
                        {p}
                      </Badge>
                    ))}
                </div>

                <ChevronRight size={16} />
              </div>
            ))}
        </Card>
      </div>
    </>
  )
}

function characteristicPropertyNames(
  characteristic: GATTCharacteristicRecord,
): string[] {
  const names: string[] = []
  const { properties } = characteristic

  if (properties.read) names.push('READ')
  if (properties.write) names.push('WRITE')
  if (properties.writeWithoutResponse) {
    names.push('WRITE_WITHOUT_RESPONSE')
  }
  if (properties.notify) names.push('NOTIFY')
  if (properties.indicate) names.push('INDICATE')

  return names
}

function RealGattView({
  device,
  connectionState,
  discoveryState,
  discoveryError,
  services,
  characteristicsByServiceId,
  onRetry,
}: {
  device: BluetoothDeviceRecord
  connectionState: RealDeviceConnectionState
  discoveryState: GATTDiscoveryState
  discoveryError: string | null
  services: GATTServiceRecord[]
  characteristicsByServiceId: Record<
    string,
    GATTCharacteristicRecord[]
  >
  onRetry: () => void
}) {
  const [openServiceId, setOpenServiceId] = useState<string | null>(null)
  const openService = services.find(
    (service) => service.id === openServiceId,
  )
  const openCharacteristics = openService
    ? characteristicsByServiceId[openService.id] || []
    : []

  return (
    <>
      <div className="page-intro">
        <div>
          <button
            className="back-button"
            onClick={() => go('/devices/selected-real-device')}
          >
            <ChevronRight size={16} className="rotate-180" />
            {device.name}
          </button>

          <h2>GATT explorer</h2>
          <p>
            Only services available through the browser's Bluetooth permission are shown.
          </p>
        </div>

        <Badge
          tone={
            discoveryState === 'READY'
              ? 'success'
              : discoveryState === 'ERROR'
                ? 'neutral'
                : 'cyan'
          }
        >
          {discoveryState === 'DISCOVERING'
            ? 'DISCOVERING…'
            : discoveryState === 'READY'
              ? `${services.length} SERVICES`
              : discoveryState === 'ERROR'
                ? 'ERROR'
                : 'NOT CONNECTED'}
        </Badge>
      </div>

      {discoveryState === 'NOT_CONNECTED' && (
        <div className="selection-error" role="status">
          {discoveryError || 'Connect to this real BLE device before discovering services.'}
        </div>
      )}

      {discoveryState === 'DISCOVERING' && (
        <Card className="scan-banner">
          <div className="scan-art">
            <Cable size={22} />
          </div>
          <div>
            <b>Discovering GATT services…</b>
            <span>Inspecting accessible primary services and their characteristics.</span>
          </div>
        </Card>
      )}

      {discoveryState === 'ERROR' && (
        <div className="selection-error" role="alert">
          <span>{discoveryError || 'GATT discovery failed.'}</span>
          {connectionState === 'connected' && (
            <button
              className="text-button"
              onClick={onRetry}
            >
              Retry discovery
            </button>
          )}
        </div>
      )}

      {discoveryState === 'READY' && services.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <Cable size={21} />
          </div>
          <h3>No accessible GATT services were discovered.</h3>
        </div>
      )}

      {discoveryState === 'READY' && services.length > 0 && (
        <div className="gatt-layout">
          <Card className="service-tree">
            <div className="card-heading">
              <div>
                <span className="eyebrow">SERVICE TREE · REAL DEVICE</span>
                <h3>Detected services</h3>
              </div>
              <Cable size={16} />
            </div>

            {services.map((service) => {
              const characteristicCount =
                characteristicsByServiceId[service.id]?.length || 0

              return (
                <div
                  key={service.id}
                  className={`service-item ${
                    openServiceId === service.id ? 'selected' : ''
                  }`}
                  onClick={() =>
                    setOpenServiceId(
                      openServiceId === service.id
                        ? null
                        : service.id,
                    )
                  }
                >
                  <div className="service-icon">
                    <Cable size={16} />
                  </div>
                  <div>
                    <b>{service.name}</b>
                    <span className="mono">{service.uuid}</span>
                    <small>
                      {characteristicCount} characteristics ·{' '}
                      {service.standard ? 'STANDARD' : 'CUSTOM'}
                    </small>
                  </div>
                  <ChevronRight
                    size={16}
                    className={
                      openServiceId === service.id ? 'rotate-90' : ''
                    }
                  />
                </div>
              )
            })}
          </Card>

          <Card className="characteristics">
            <div className="card-heading">
              <div>
                <span className="eyebrow">CHARACTERISTICS</span>
                <h3>{openService?.name || 'Select a service'}</h3>
              </div>
              {openService && (
                <Badge tone={openService.standard ? 'cyan' : 'neutral'}>
                  {openService.standard ? 'STANDARD' : 'CUSTOM'}
                </Badge>
              )}
            </div>

            {openService && openCharacteristics.length === 0 && (
              <div className="empty-state compact-empty-state">
                <p>No accessible characteristics were discovered.</p>
              </div>
            )}

            {openService && openCharacteristics.map((characteristic) => {
              const properties = characteristicPropertyNames(characteristic)

              return (
                <div
                  className="characteristic"
                  key={characteristic.id}
                  onClick={() =>
                    go(
                      `/devices/selected-real-device/gatt/${encodeURIComponent(openService.uuid)}/${encodeURIComponent(characteristic.uuid)}`,
                    )
                  }
                >
                  <div className="char-icon">
                    <Terminal size={16} />
                  </div>
                  <div>
                    <b>{characteristic.name}</b>
                    <span className="mono">{characteristic.uuid}</span>
                  </div>
                  <div className="prop-list">
                    {properties.length > 0 ? (
                      properties.map((property) => (
                        <Badge
                          key={property}
                          tone={
                            property.startsWith('WRITE')
                              ? 'cyan'
                              : 'neutral'
                          }
                        >
                          {property}
                        </Badge>
                      ))
                    ) : (
                      <span>Not detected</span>
                    )}
                  </div>
                  <ChevronRight size={16} />
                </div>
              )
            })}
          </Card>
        </div>
      )}
    </>
  )
}

function RealGattCharacteristicDetails({
  device,
  service,
  characteristic,
}: {
  device: BluetoothDeviceRecord
  service: GATTServiceRecord
  characteristic: GATTCharacteristicRecord
}) {
  const properties = characteristicPropertyNames(characteristic)

  return (
    <>
      <div className="page-intro">
        <div>
          <button
            className="back-button"
            onClick={() => go('/devices/selected-real-device/gatt')}
          >
            <ChevronRight size={16} className="rotate-180" />
            GATT Explorer
          </button>
          <h2>{characteristic.name}</h2>
          <p>{device.name} · {service.name}</p>
        </div>
        <Badge tone="cyan">REAL BLE DATA</Badge>
      </div>

      <Card className="detail-grid real-device-details">
        <div className="metadata">
          <div>
            <span>Service UUID</span>
            <b className="mono">{service.uuid}</b>
          </div>
          <div>
            <span>Characteristic UUID</span>
            <b className="mono">{characteristic.uuid}</b>
          </div>
          <div>
            <span>Properties</span>
            <b>
              {properties.length > 0
                ? properties.map((property) => (
                    <Badge
                      key={property}
                      tone={
                        property.startsWith('WRITE')
                          ? 'cyan'
                          : 'neutral'
                      }
                    >
                      {property}
                    </Badge>
                  ))
                : 'Not detected'}
            </b>
          </div>
          <div>
            <span>Current value</span>
            <b>Not read yet</b>
          </div>
        </div>
      </Card>
    </>
  )
}

function TelemetryView({
  device,
}: {
  device: Device
}) {
  return (
    <>
      <div className="page-intro">
        <div>
          <button
            className="back-button"
            onClick={() =>
              go(`/simulator/${device.id}`)
            }
          >
            <ChevronRight
              size={16}
              className="rotate-180"
            />
            {device.name}
          </button>

          <h2>Telemetry</h2>

          <p>
            Example values from the mock Bluetooth
            service. Live data is not connected.
          </p>
        </div>

        <Badge tone="neutral">
          SIMULATED DEVICE
        </Badge>
      </div>

      <div className="metric-grid">
        <Metric
          label="Battery"
          value="92"
          unit="%"
          icon={Battery}
          tone="emerald"
        />

        <Metric
          label="Pack voltage"
          value="51.84"
          unit="V"
          icon={Zap}
          tone="cyan"
        />

        <Metric
          label="Current"
          value="-3.42"
          unit="A"
          icon={Activity}
          tone="violet"
        />

        <Metric
          label="Temperature"
          value="31.4"
          unit="°C"
          icon={Thermometer}
          tone="amber"
        />
      </div>

      <div className="telemetry-grid">
        <Card className="chart-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">
                PACK VOLTAGE · LAST 30 MIN
              </span>

              <h3>
                51.84 <small>V</small>
              </h3>
            </div>

            <Badge tone="success">
              NORMAL
            </Badge>
          </div>

          <div className="chart">
            <div className="chart-lines">
              <i />
              <i />
              <i />
              <i />
            </div>

            <svg
              viewBox="0 0 600 190"
              preserveAspectRatio="none"
              aria-label="Pack voltage chart"
            >
              <path
                d="M0 130 C40 120 45 145 80 125 S120 100 150 115 S190 88 230 100 S270 86 305 92 S350 65 390 82 S420 50 455 68 S500 40 535 58 S570 42 600 33"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
            </svg>

            <div className="chart-labels">
              <span>10:12</span>
              <span>10:22</span>
              <span>10:32</span>
              <span>10:42</span>
            </div>
          </div>
        </Card>

        <Card className="cells-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">
                CELL VOLTAGE
              </span>

              <h3>Individual cells</h3>
            </div>

            <Battery size={17} />
          </div>

          <div className="cell-grid">
            {[
              3.71,
              3.72,
              3.7,
              3.71,
              3.73,
              3.71,
              3.72,
              3.7,
              3.71,
              3.72,
              3.71,
              3.7,
            ].map((v, i) => (
              <div key={i}>
                <span>
                  Cell{' '}
                  {String(i + 1).padStart(
                    2,
                    '0',
                  )}
                </span>

                <b>
                  {v.toFixed(2)}{' '}
                  <small>V</small>
                </b>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}

function Metric({
  label,
  value,
  unit,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  unit: string
  icon: LucideIcon
  tone: string
}) {
  return (
    <Card className="metric">
      <div className={`stat-icon ${tone}`}>
        <Icon size={17} />
      </div>

      <span>{label}</span>

      <strong>
        {value}
        <small>{unit}</small>
      </strong>

      <div className="metric-bar">
        <i className={tone} />
      </div>
    </Card>
  )
}

function SimplePage({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string
  description: string
  icon: LucideIcon
  children?: ReactNode
}) {
  return (
    <>
      <div className="page-intro">
        <div>
          <Badge tone="cyan">
            WORKSPACE
          </Badge>

          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <Icon
          size={28}
          className="page-watermark"
        />
      </div>

      {children || (
        <Card className="empty-state">
          <div className="empty-icon">
            <Icon size={24} />
          </div>

          <h3>Nothing to show yet</h3>

          <p>
            Connect a supported device to populate
            this workspace.
          </p>

          <button
            className="button primary"
            onClick={() => go('/devices')}
          >
            <Bluetooth size={16} />
            Discover devices
          </button>
        </Card>
      )}
    </>
  )
}

function SettingsView() {
  return (
    <SimplePage
      title="Settings"
      description="Tune your workspace, browser access and diagnostics."
      icon={Settings}
    >
      <div className="settings-grid">
        <Card>
          <div className="card-heading">
            <div>
              <span className="eyebrow">
                CONNECTION
              </span>
              <h3>Session behavior</h3>
            </div>

            <Wifi size={17} />
          </div>

          {[
            'Auto reconnect',
            'Scan timeout',
            'Remember favorite devices',
          ].map((x, i) => (
            <div
              className="setting-row"
              key={x}
            >
              <div>
                <b>{x}</b>

                <span>
                  {i === 0
                    ? 'Reconnect known devices automatically'
                    : i === 1
                      ? '30 seconds'
                      : 'Keep device metadata locally'}
                </span>
              </div>

              <button
                className={`switch ${
                  i !== 1 ? 'on' : ''
                }`}
                aria-label={x}
              >
                <i />
              </button>
            </div>
          ))}
        </Card>

        <Card>
          <div className="card-heading">
            <div>
              <span className="eyebrow">
                APPEARANCE
              </span>
              <h3>Interface theme</h3>
            </div>

            <Sparkles size={17} />
          </div>

          <div className="theme-options">
            <button className="theme selected">
              Dark
              <span />
            </button>

            <button className="theme">
              Light
              <span />
            </button>

            <button className="theme">
              System
              <span />
            </button>
          </div>

          <div className="setting-row">
            <div>
              <b>Developer mode</b>
              <span>
                Show raw protocol metadata
              </span>
            </div>

            <button className="switch">
              <i />
            </button>
          </div>
        </Card>

        <Card>
          <div className="card-heading">
            <div>
              <span className="eyebrow">
                PRIVACY & ACCESS
              </span>
              <h3>Browser permissions</h3>
            </div>

            <Lock size={17} />
          </div>

          <div className="permission-line">
            <Check size={15} />

            <div>
              <b>Bluetooth permission</b>
              <span>
                Requested per device selection
              </span>
            </div>

            <Badge tone="neutral">
              BROWSER MANAGED
            </Badge>
          </div>

          <div className="permission-line">
            <Info size={15} />

            <div>
              <b>Saved device data</b>
              <span>
                0 devices · no saved real devices
              </span>
            </div>

            <button className="text-button">
              Clear
            </button>
          </div>
        </Card>
      </div>
    </SimplePage>
  )
}

function ActivityPage() {
  return (
    <SimplePage
      title="Activity"
      description="A local timeline of real Bluetooth actions."
      icon={Activity}
    >
      <Card className="activity-card">
        <div className="empty-state compact-empty-state">
          <h3>No activity yet</h3>
          <p>Real Bluetooth actions will appear here.</p>
        </div>
      </Card>
    </SimplePage>
  )
}

function FavoritesPage() {
  return (
    <SimplePage
      title="Favorites"
      description="Real devices saved for quick access."
      icon={Heart}
    >
      <Card className="device-list">
        <div className="inventory-empty">
          <div>
            <b>No saved devices</b>
            <span>Selected devices are not saved automatically.</span>
          </div>
        </div>
      </Card>
    </SimplePage>
  )
}

function SimulatorPage() {
  return (
    <SimplePage
      title="Device simulator"
      description="Fictional fixture data for demonstration only. It is separate from real Bluetooth inventory."
      icon={Cpu}
    >
      <Card className="device-list simulator-list">
        {simulatorDevices.map((device) => (
          <div className="simulator-entry" key={device.id}>
            <DeviceRow
              device={device}
              onOpen={() => go(`/simulator/${device.id}`)}
            />
            <Badge tone="neutral">SIMULATED DEVICE</Badge>
          </div>
        ))}
      </Card>
    </SimplePage>
  )
}

function BluetoothControlTestUnitView({
  device,
  path,
}: {
  device: Device
  path: string
}) {
  const [connected, setConnected] = useState(
    testUnitDeviceRecord.connectionState === 'connected',
  )
  const [snapshot, setSnapshot] = useState(() =>
    simulatedTestUnitService.getState(),
  )
  const [serviceTree, setServiceTree] = useState<
    Array<{
      service: GATTServiceRecord
      characteristics: GATTCharacteristicRecord[]
    }>
  >([])
  const [openServiceId, setOpenServiceId] = useState<string | null>(null)
  const [readValue, setReadValue] = useState('Not read yet')
  const [notificationValue, setNotificationValue] = useState('')
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [operationError, setOperationError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void simulatedTestUnitService
      .getServices(testUnitDeviceRecord)
      .then(async (services) => {
        const groups = await Promise.all(
          services.map(async (service) => ({
            service,
            characteristics:
              await simulatedTestUnitService.getCharacteristics(service),
          })),
        )
        if (active) setServiceTree(groups)
      })
    return () => {
      active = false
    }
  }, [])

  const isCharacteristicPage = path.includes('/gatt/')
  const isGattPage = path.endsWith('/gatt')
  const isControlPage = path.endsWith('/control')
  const isTelemetryPage = path.endsWith('/telemetry')
  const characteristicUUID = isCharacteristicPage
    ? decodeURIComponent(path.slice(path.lastIndexOf('/') + 1))
    : ''
  const selectedCharacteristic = serviceTree
    .flatMap((group) => group.characteristics)
    .find((characteristic) => characteristic.uuid === characteristicUUID)

  useEffect(() => {
    if (!isTelemetryPage || !connected) return
    let active = true
    const subscriptions: Array<{
      characteristic: GATTCharacteristicRecord
      listener: (value: Uint8Array) => void
    }> = []
    const notifyUUIDs = [
      testUnitUUIDs.batteryLevel,
      testUnitUUIDs.status,
      testUnitUUIDs.telemetry,
    ]

    void Promise.all(
      notifyUUIDs.map(async (uuid) => {
        const characteristic = serviceTree
          .flatMap((group) => group.characteristics)
          .find((candidate) => candidate.uuid === uuid)
        if (!characteristic) return
        const listener = () => {
          if (active) setSnapshot(simulatedTestUnitService.getState())
        }
        await simulatedTestUnitService.subscribeToNotifications(
          characteristic,
          listener,
        )
        if (active) subscriptions.push({ characteristic, listener })
        else {
          await simulatedTestUnitService.unsubscribeFromNotifications(
            characteristic,
            listener,
          )
        }
      }),
    ).catch((error: unknown) => {
      if (active) {
        setOperationError(
          error instanceof Error ? error.message : 'Could not start telemetry.',
        )
      }
    })

    return () => {
      active = false
      for (const { characteristic, listener } of subscriptions) {
        void simulatedTestUnitService.unsubscribeFromNotifications(
          characteristic,
          listener,
        )
      }
    }
  }, [connected, isTelemetryPage, serviceTree])

  useEffect(() => {
    if (
      !isCharacteristicPage ||
      !notificationsEnabled ||
      !connected ||
      !selectedCharacteristic?.properties.notify
    ) {
      return
    }
    let active = true
    const listener = (value: Uint8Array) => {
      if (!active) return
      setNotificationValue(formatTestUnitValue(selectedCharacteristic, value))
      setSnapshot(simulatedTestUnitService.getState())
    }

    void simulatedTestUnitService
      .subscribeToNotifications(selectedCharacteristic, listener)
      .catch((error: unknown) => {
        setOperationError(
          error instanceof Error ? error.message : 'Could not subscribe.',
        )
        setNotificationsEnabled(false)
      })

    return () => {
      active = false
      void simulatedTestUnitService.unsubscribeFromNotifications(
        selectedCharacteristic,
        listener,
      )
    }
  }, [
    connected,
    isCharacteristicPage,
    notificationsEnabled,
    selectedCharacteristic,
  ])

  const toggleConnection = async () => {
    setOperationError(null)
    if (connected) {
      simulatedTestUnitService.disconnect(testUnitDeviceRecord)
      setConnected(false)
      setNotificationsEnabled(false)
      return
    }
    try {
      await simulatedTestUnitService.connect(testUnitDeviceRecord)
      setConnected(true)
      setSnapshot(simulatedTestUnitService.getState())
    } catch (error) {
      setOperationError(
        error instanceof Error ? error.message : 'Could not connect.',
      )
    }
  }

  const readCharacteristic = async () => {
    if (!selectedCharacteristic) return
    setOperationError(null)
    try {
      const value = await simulatedTestUnitService.readCharacteristic(
        selectedCharacteristic,
      )
      setReadValue(formatTestUnitValue(selectedCharacteristic, value))
    } catch (error) {
      setOperationError(
        error instanceof Error ? error.message : 'Read failed.',
      )
    }
  }

  const writeCharacteristic = async (value: string) => {
    if (!selectedCharacteristic) return
    setOperationError(null)
    try {
      await simulatedTestUnitService.writeCharacteristic(
        selectedCharacteristic,
        new TextEncoder().encode(value),
      )
      setSnapshot(simulatedTestUnitService.getState())
      setReadValue('Write successful')
    } catch (error) {
      setOperationError(
        error instanceof Error ? error.message : 'Write failed.',
      )
    }
  }

  const pageBack = isCharacteristicPage || isGattPage || isControlPage || isTelemetryPage
    ? `/simulator/${device.id}`
    : '/simulator'

  if (isGattPage) {
    const openService = serviceTree.find(
      (group) => group.service.id === openServiceId,
    )?.service || serviceTree[0]?.service
    const openGroup = serviceTree.find(
      (group) => group.service.id === openService?.id,
    )

    return (
      <>
        <div className="page-intro">
          <div>
            <button className="back-button" onClick={() => go(pageBack)}>
              <ChevronRight size={16} className="rotate-180" />
              {device.name}
            </button>
            <h2>GATT explorer</h2>
            <p>Three services · Seven characteristics · Simulated BLE</p>
          </div>
          <Badge tone="neutral">SIMULATED DEVICE</Badge>
        </div>
        <div className="gatt-layout">
          <Card className="service-tree">
            <div className="card-heading">
              <div>
                <span className="eyebrow">SERVICE TREE</span>
                <h3>Detected services</h3>
              </div>
              <Cable size={16} />
            </div>
            {serviceTree.map(({ service, characteristics }) => (
              <div
                className={`service-item ${service.id === openService?.id ? 'selected' : ''}`}
                key={service.id}
                onClick={() => setOpenServiceId(service.id)}
              >
                <div className="service-icon"><Cable size={16} /></div>
                <div>
                  <b>{service.name}</b>
                  <span className="mono">{service.uuid}</span>
                  <small>
                    {characteristics.length} characteristics ·{' '}
                    {service.standard ? 'STANDARD' : 'CUSTOM'}
                  </small>
                </div>
                <ChevronRight size={16} />
              </div>
            ))}
          </Card>
          <Card className="characteristics">
            <div className="card-heading">
              <div>
                <span className="eyebrow">CHARACTERISTICS</span>
                <h3>{openService?.name || 'Loading services'}</h3>
              </div>
              <Badge tone="neutral">SIMULATED DATA</Badge>
            </div>
            {openGroup?.characteristics.map((characteristic) => (
              <button
                className="characteristic"
                key={characteristic.id}
                onClick={() =>
                  go(`/simulator/${device.id}/gatt/${characteristic.uuid}`)
                }
              >
                <div className="char-icon"><Terminal size={16} /></div>
                <div>
                  <b>{characteristic.name}</b>
                  <span className="mono">{characteristic.uuid}</span>
                </div>
                <div className="prop-list">
                  {characteristicPropertyNames(characteristic).map((property) => (
                    <Badge key={property} tone={property === 'WRITE' ? 'cyan' : 'neutral'}>
                      {property}
                    </Badge>
                  ))}
                </div>
                <ChevronRight size={16} />
              </button>
            ))}
          </Card>
        </div>
      </>
    )
  }

  if (isCharacteristicPage) {
    if (!selectedCharacteristic) {
      return (
        <SimplePage
          title="Characteristic unavailable"
          description="This characteristic is not part of the simulated test unit."
          icon={Terminal}
        />
      )
    }

    const properties = characteristicPropertyNames(selectedCharacteristic)
    const isVolume = selectedCharacteristic.uuid === testUnitUUIDs.volume
    const isPlayPause = selectedCharacteristic.uuid === testUnitUUIDs.playPause

    return (
      <>
        <div className="page-intro">
          <div>
            <button className="back-button" onClick={() => go(`/simulator/${device.id}/gatt`)}>
              <ChevronRight size={16} className="rotate-180" />
              GATT explorer
            </button>
            <h2>{selectedCharacteristic.name}</h2>
            <p>Bluetooth Control Test Unit · Simulated GATT value</p>
          </div>
          <Badge tone="neutral">SIMULATED DEVICE</Badge>
        </div>
        <Card className="detail-grid real-device-details">
          <div className="metadata">
            <div><span>Characteristic UUID</span><b className="mono">{selectedCharacteristic.uuid}</b></div>
            <div><span>Properties</span><b>{properties.map((property) => <Badge key={property} tone={property === 'WRITE' ? 'cyan' : 'neutral'}>{property}</Badge>)}</b></div>
            <div><span>Connection</span><b>{connected ? 'Connected' : 'Disconnected'}</b></div>
            <div><span>Current value</span><b className="mono">{readValue}</b></div>
            {notificationsEnabled && <div><span>Last notification</span><b className="mono">{notificationValue || 'Waiting for update'}</b></div>}
          </div>
          <div className="write-panel">
            <span className="eyebrow">OPERATIONS</span>
            {selectedCharacteristic.properties.read && (
              <button className="button primary" onClick={() => void readCharacteristic()} disabled={!connected}>
                <Radio size={16} /> Read characteristic
              </button>
            )}
            {selectedCharacteristic.properties.write && (
              <div className="test-unit-write-controls">
                {isPlayPause ? (
                  <button className="button ghost" onClick={() => void writeCharacteristic(snapshot.playing ? 'false' : 'true')} disabled={!connected}>
                    {snapshot.playing ? <Pause size={16} /> : <Play size={16} />}
                    {snapshot.playing ? 'Pause' : 'Play'}
                  </button>
                ) : isVolume ? (
                  <>
                    <label htmlFor="test-unit-volume">Volume · {snapshot.volume}%</label>
                    <input
                      id="test-unit-volume"
                      type="range"
                      min="0"
                      max="100"
                      value={snapshot.volume}
                      disabled={!connected}
                      onChange={(event) => void writeCharacteristic(event.target.value)}
                    />
                  </>
                ) : null}
              </div>
            )}
            {selectedCharacteristic.properties.notify && (
              <button
                className="button ghost"
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                disabled={!connected}
              >
                <Radio size={16} />
                {notificationsEnabled ? 'Stop notifications' : 'Subscribe to notifications'}
              </button>
            )}
            {!connected && <span className="control-note">Connect the test unit before reading or writing.</span>}
          </div>
        </Card>
        {operationError && <div className="selection-error" role="alert">{operationError}</div>}
      </>
    )
  }

  if (isControlPage) {
    return (
      <>
        <div className="page-intro">
          <div>
            <button className="back-button" onClick={() => go(`/simulator/${device.id}`)}>
              <ChevronRight size={16} className="rotate-180" />
              {device.name}
            </button>
            <h2>Device controls</h2>
            <p>Writes are applied to the simulated Control Service.</p>
          </div>
          <Badge tone="neutral">SIMULATED DEVICE</Badge>
        </div>
        <div className="control-layout">
          <Card className="now-playing">
            <div className="eyebrow">FICTIONAL CONTROL SERVICE</div>
            <div className="album">
              <div className="album-art"><Radio size={30} /></div>
              <div><span>STATUS</span><b>{snapshot.status}</b><small>Bluetooth Control Test Unit</small></div>
            </div>
            <div className="media-actions">
              <button
                className="play-button"
                disabled={!connected}
                onClick={() => {
                  const characteristic = serviceTree.flatMap((group) => group.characteristics).find((item) => item.uuid === testUnitUUIDs.playPause)
                  if (characteristic) void writeCharacteristicFor(characteristic, snapshot.playing ? 'false' : 'true')
                }}
              >
                {snapshot.playing ? <Pause size={20} /> : <Play size={20} />}
              </button>
            </div>
          </Card>
          <Card className="volume-card">
            <div className="card-heading"><div><span className="eyebrow">WRITE CHARACTERISTIC</span><h3>Volume</h3></div><Volume2 size={18} /></div>
            <div className="volume-value">{snapshot.volume}<span>%</span></div>
            <input
              type="range"
              min="0"
              max="100"
              value={snapshot.volume}
              aria-label="Test unit volume"
              disabled={!connected}
              onChange={(event) => {
                const characteristic = serviceTree.flatMap((group) => group.characteristics).find((item) => item.uuid === testUnitUUIDs.volume)
                if (characteristic) void writeCharacteristicFor(characteristic, event.target.value)
              }}
            />
            <div className="range-labels"><span>Mute</span><span>Maximum</span></div>
          </Card>
        </div>
        {!connected && <div className="selection-error" role="status">Connect the test unit to use its controls.</div>}
        {operationError && <div className="selection-error" role="alert">{operationError}</div>}
      </>
    )
  }

  if (isTelemetryPage) {
    return (
      <>
        <div className="page-intro">
          <div>
            <button className="back-button" onClick={() => go(`/simulator/${device.id}`)}>
              <ChevronRight size={16} className="rotate-180" />
              {device.name}
            </button>
            <h2>Telemetry</h2>
            <p>Simulated notifications from Battery Level and Control Service.</p>
          </div>
          <Badge tone="neutral">SIMULATED DEVICE</Badge>
        </div>
        <div className="metric-grid">
          <Metric label="Battery" value={String(snapshot.battery)} unit="%" icon={Battery} tone="emerald" />
          <Metric label="Voltage" value={snapshot.voltage.toFixed(2)} unit="V" icon={Zap} tone="cyan" />
          <Metric label="Current" value={snapshot.current.toFixed(2)} unit="A" icon={Activity} tone="violet" />
          <Metric label="Temperature" value={snapshot.temperature.toFixed(1)} unit="°C" icon={Thermometer} tone="amber" />
        </div>
        <Card className="unsupported">
          <div><b>Status</b><span>{snapshot.status} · Notifications {connected ? 'active' : 'inactive'}</span></div>
          {!connected && <button className="button primary" onClick={() => void toggleConnection()}><Bluetooth size={16} /> Connect</button>}
        </Card>
        {operationError && <div className="selection-error" role="alert">{operationError}</div>}
      </>
    )
  }

  return (
    <>
      <div className="detail-head">
        <button className="back-button" onClick={() => go('/simulator')}>
          <ChevronRight size={16} className="rotate-180" /> Devices
        </button>
        <div className="detail-title">
          <DeviceIcon device={device} size="lg" />
          <div>
            <Badge tone="neutral">SIMULATED DEVICE</Badge>
            <Badge tone={connected ? 'success' : 'cyan'}>{connected ? 'SESSION CONNECTED' : 'AVAILABLE'}</Badge>
            <h2>{device.name}</h2>
            <p>{device.tech} · Fictional BLE test fixture</p>
          </div>
        </div>
        <div className="detail-actions">
          <button className="button ghost" onClick={() => void toggleConnection()}>
            {connected ? <><X size={16} /> Disconnect</> : <><Bluetooth size={16} /> Connect</>}
          </button>
        </div>
      </div>
      <div className="detail-grid">
        <Card>
          <div className="card-heading"><div><span className="eyebrow">IDENTITY</span><h3>Device profile</h3></div><Info size={17} /></div>
          <div className="metadata">
            <div><span>Technology</span><b>BLE</b></div>
            <div><span>Availability</span><b>{connected ? 'Connected' : 'Available'}</b></div>
            <div><span>Battery</span><b>{snapshot.battery}%</b></div>
            <div><span>Device label</span><b>SIMULATED DEVICE</b></div>
          </div>
        </Card>
        <Card className="capability-card">
          <div className="card-heading"><div><span className="eyebrow">SIMULATED SURFACE</span><h3>Capabilities</h3></div><Cable size={17} /></div>
          <div className="cap-grid">
            {device.capabilities.map((capability) => (
              <div className="cap-row" key={capability}><span>{capability}</span><Badge tone="success">SUPPORTED</Badge></div>
            ))}
          </div>
        </Card>
      </div>
      <div className="action-grid">
        <Card className="action-card" onClick={() => go(`/simulator/${device.id}/control`)}>
          <div className="quick-icon cyan"><SlidersHorizontal size={19} /></div><div><b>Device controls</b><span>Play/Pause and volume writes</span></div><ChevronRight size={18} />
        </Card>
        <Card className="action-card" onClick={() => go(`/simulator/${device.id}/gatt`)}>
          <div className="quick-icon violet"><Cable size={19} /></div><div><b>GATT explorer</b><span>3 services · 7 characteristics</span></div><ChevronRight size={18} />
        </Card>
        <Card className="action-card" onClick={() => go(`/simulator/${device.id}/telemetry`)}>
          <div className="quick-icon emerald"><Activity size={19} /></div><div><b>Telemetry</b><span>Battery, voltage, current, temperature</span></div><ChevronRight size={18} />
        </Card>
      </div>
      {operationError && <div className="selection-error" role="alert">{operationError}</div>}
    </>
  )

  async function writeCharacteristicFor(
    characteristic: GATTCharacteristicRecord,
    value: string,
  ) {
    setOperationError(null)
    try {
      await simulatedTestUnitService.writeCharacteristic(
        characteristic,
        new TextEncoder().encode(value),
      )
      setSnapshot(simulatedTestUnitService.getState())
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : 'Write failed.')
    }
  }
}

function formatTestUnitValue(
  characteristic: GATTCharacteristicRecord,
  value: Uint8Array,
): string {
  if (
    characteristic.uuid === testUnitUUIDs.batteryLevel ||
    characteristic.uuid === testUnitUUIDs.volume
  ) {
    return `${value[0] ?? 0}${characteristic.uuid === testUnitUUIDs.batteryLevel ? '%' : '%'}`
  }
  if (characteristic.uuid === testUnitUUIDs.appearance) return '0'
  return new TextDecoder().decode(value)
}

export default function BluetoothControlHub() {
  const [path, setPath] = useState('/')

  const [menu, setMenu] = useState(false)
  const [selectedRealDevice, setSelectedRealDevice] =
    useState<BluetoothDeviceRecord | null>(null)
  const [selectionState, setSelectionState] =
    useState<DeviceSelectionState>('IDLE')
  const [selectionError, setSelectionError] =
    useState<string | null>(null)
  const [connectionState, setConnectionState] =
    useState<RealDeviceConnectionState>('idle')
  const [connectionError, setConnectionError] =
    useState<string | null>(null)
  const [gattDiscoveryState, setGattDiscoveryState] =
    useState<GATTDiscoveryState>('NOT_CONNECTED')
  const [gattDiscoveryError, setGattDiscoveryError] =
    useState<string | null>(null)
  const [gattServices, setGattServices] =
    useState<GATTServiceRecord[]>([])
  const [gattCharacteristicsByServiceId, setGattCharacteristicsByServiceId] =
    useState<Record<string, GATTCharacteristicRecord[]>>({})
  const [bluetoothStatus, setBluetoothStatus] =
    useState<WebBluetoothStatus>('UNSUPPORTED')

  useEffect(() => {
    setPath(window.location.pathname)
    setBluetoothStatus(
      webBluetoothService.isSupported()
        ? 'SUPPORTED'
        : 'UNSUPPORTED',
    )

    const handler = () => {
      setPath(window.location.pathname)
    }

    window.addEventListener(
      'popstate',
      handler,
    )

    return () => {
      window.removeEventListener(
        'popstate',
        handler,
      )
    }
  }, [])

  useEffect(() => {
    if (!selectedRealDevice) {
      return
    }

    const handleDisconnect = () => {
      setConnectionState('disconnected')
      setConnectionError('Bluetooth connection was lost.')
      setGattDiscoveryState('NOT_CONNECTED')
      setGattDiscoveryError('Bluetooth connection was lost.')
      setGattServices([])
      setGattCharacteristicsByServiceId({})
    }

    webBluetoothService.addDisconnectListener(
      selectedRealDevice,
      handleDisconnect,
    )

    return () => {
      webBluetoothService.removeDisconnectListener(
        selectedRealDevice,
        handleDisconnect,
      )
    }
  }, [selectedRealDevice])

  const requestBluetoothDevice = () => {
    if (
      selectionState === 'REQUESTING' ||
      connectionState === 'connecting'
    ) {
      return
    }

    if (window.location.pathname !== '/devices') {
      go('/devices')
    }

    setSelectionState('REQUESTING')
    setSelectionError(null)

    void webBluetoothService
      .requestDevice()
      .then((device) => {
        setSelectedRealDevice(device)
        setSelectionState('DEVICE_SELECTED')
        setConnectionState('selected')
        setConnectionError(null)
        setGattDiscoveryState('NOT_CONNECTED')
        setGattDiscoveryError(null)
        setGattServices([])
        setGattCharacteristicsByServiceId({})
      })
      .catch((error: unknown) => {
        setSelectionError(deviceSelectionErrorMessage(error))
        setSelectionState('ERROR')
      })
  }

  const discoverRealGATT = async (
    device: BluetoothDeviceRecord,
  ): Promise<void> => {
    setGattDiscoveryState('DISCOVERING')
    setGattDiscoveryError(null)
    setGattServices([])
    setGattCharacteristicsByServiceId({})

    try {
      const services = await webBluetoothService.getServices(device)
      const characteristicsByServiceId: Record<
        string,
        GATTCharacteristicRecord[]
      > = {}

      for (const service of services) {
        characteristicsByServiceId[service.id] =
          await webBluetoothService.getCharacteristics(service)
      }

      if (device.connectionState !== 'connected') {
        throw new BluetoothServiceError(
          'not-connected',
          'The Bluetooth device disconnected during GATT discovery.',
        )
      }

      setGattServices(services)
      setGattCharacteristicsByServiceId(characteristicsByServiceId)
      setGattDiscoveryState('READY')
    } catch (error) {
      setGattDiscoveryError(gattDiscoveryErrorMessage(error))
      setGattDiscoveryState(
        device.connectionState === 'connected'
          ? 'ERROR'
          : 'NOT_CONNECTED',
      )
    }
  }

  const connectRealDevice = async () => {
    if (!selectedRealDevice || connectionState === 'connecting') {
      return
    }

    setConnectionState('connecting')
    setConnectionError(null)
    setGattDiscoveryState('NOT_CONNECTED')
    setGattDiscoveryError(null)
    setGattServices([])
    setGattCharacteristicsByServiceId({})

    try {
      await webBluetoothService.connect(selectedRealDevice)
      setConnectionState('connected')
      await discoverRealGATT(selectedRealDevice)
    } catch (error) {
      setConnectionState('error')
      setConnectionError(deviceConnectionErrorMessage(error))
    }
  }

  const disconnectRealDevice = () => {
    if (!selectedRealDevice) {
      return
    }

    try {
      webBluetoothService.disconnect(selectedRealDevice)
      setConnectionState('disconnected')
      setConnectionError(null)
      setGattDiscoveryState('NOT_CONNECTED')
      setGattDiscoveryError(null)
      setGattServices([])
      setGattCharacteristicsByServiceId({})
    } catch (error) {
      setConnectionState('error')
      setConnectionError(deviceConnectionErrorMessage(error))
    }
  }

  const simulatorDevice = useMemo(
    () =>
      simulatorDevices.find((device) =>
        path.split('/').includes(device.id),
      ) || null,
    [path],
  )

  const isHome = path === '/'

  let title = isHome
    ? 'Overview'
    : path.includes('simulator')
      ? 'Simulator'
      : path.includes('settings')
      ? 'Settings'
      : path.includes('activity')
        ? 'Activity'
        : path.includes('favorites')
          ? 'Favorites'
          : path.includes('devices')
            ? 'Devices'
            : 'Workspace'

  let content: ReactNode

  if (path === '/') {
    content = (
      <Dashboard
        onScan={requestBluetoothDevice}
        bluetoothStatus={bluetoothStatus}
        selectedDevice={selectedRealDevice}
        connectionState={connectionState}
      />
    )
  } else if (path === '/simulator') {
    content = <SimulatorPage />
  } else if (path === '/devices') {
    content = (
      <ScanView
        selectedDevice={selectedRealDevice}
        selectionState={selectionState}
        selectionError={selectionError}
        connectionState={connectionState}
        connectionError={connectionError}
        gattDiscoveryState={gattDiscoveryState}
        onRequestDevice={requestBluetoothDevice}
        onConnect={connectRealDevice}
        onDisconnect={disconnectRealDevice}
      />
    )
  } else if (path === '/devices/selected-real-device') {
    content = selectedRealDevice ? (
      <RealDeviceDetails
        device={selectedRealDevice}
        connectionState={connectionState}
        connectionError={connectionError}
        gattDiscoveryState={gattDiscoveryState}
        gattServiceCount={gattServices.length}
      />
    ) : (
      <SimplePage
        title="Real device unavailable"
        description="Select a BLE device from the browser chooser. Real device details are kept in memory for this session."
        icon={Bluetooth}
      />
    )
  } else if (path === '/devices/selected-real-device/gatt') {
    content = selectedRealDevice ? (
      <RealGattView
        device={selectedRealDevice}
        connectionState={connectionState}
        discoveryState={gattDiscoveryState}
        discoveryError={gattDiscoveryError}
        services={gattServices}
        characteristicsByServiceId={gattCharacteristicsByServiceId}
        onRetry={() => {
          if (connectionState === 'connected') {
            void discoverRealGATT(selectedRealDevice)
          }
        }}
      />
    ) : (
      <SimplePage
        title="Real BLE device unavailable"
        description="Select and connect a BLE device before viewing its GATT services."
        icon={Cable}
      />
    )
  } else if (path.startsWith('/devices/selected-real-device/gatt/')) {
    const [serviceUUID, characteristicUUID] = path
      .slice('/devices/selected-real-device/gatt/'.length)
      .split('/')
    const service = gattServices.find(
      (candidate) =>
        candidate.uuid.toLowerCase() === serviceUUID?.toLowerCase(),
    )
    const characteristic = service
      ? (gattCharacteristicsByServiceId[service.id] || []).find(
          (candidate) =>
            candidate.uuid.toLowerCase() ===
            characteristicUUID?.toLowerCase(),
        )
      : undefined

    content = selectedRealDevice && service && characteristic ? (
      <RealGattCharacteristicDetails
        device={selectedRealDevice}
        service={service}
        characteristic={characteristic}
      />
    ) : (
      <SimplePage
        title="Characteristic unavailable"
        description="Return to the real-device GATT Explorer and select an accessible characteristic."
        icon={Terminal}
      />
    )
  } else if (
    path.startsWith(`/simulator/${TEST_UNIT_ID}`) &&
    simulatorDevice?.id === TEST_UNIT_ID
  ) {
    content = (
      <BluetoothControlTestUnitView
        device={simulatorDevice}
        path={path}
      />
    )
  } else if (
    path.startsWith('/simulator/') &&
    path.includes('/gatt/')
  ) {
    content = (
      <SimplePage
        title="Characteristic details"
        description="SIMULATED DEVICE · Example characteristic data from simulator fixtures."
        icon={Terminal}
      >
        <Card className="detail-grid">
          <div className="metadata">
            <div>
              <span>Characteristic</span>
              <b>Battery Level</b>
            </div>

            <div>
              <span>UUID</span>
              <b className="mono">2a19</b>
            </div>

            <div>
              <span>Properties</span>
              <b>
                <Badge tone="success">
                  READ
                </Badge>{' '}
                <Badge tone="cyan">
                  NOTIFY
                </Badge>
              </b>
            </div>

            <div>
              <span>Current value</span>
              <b className="mono">
                0x5C · 92%
              </b>
            </div>
          </div>

          <div className="write-panel">
            <span className="eyebrow">
              OPERATIONS
            </span>

            <h3>Read value</h3>

            <button className="button primary">
              <Radio size={16} />
              Read characteristic
            </button>
          </div>
        </Card>
      </SimplePage>
    )
  } else if (
    path.startsWith('/simulator/') &&
    path.endsWith('/gatt') &&
    simulatorDevice
  ) {
    content = <GattView device={simulatorDevice} />
  } else if (
    path.startsWith('/simulator/') &&
    path.includes('/control') &&
    simulatorDevice
  ) {
    content = <ControlView device={simulatorDevice} />
  } else if (
    path.startsWith('/simulator/') &&
    path.includes('/telemetry') &&
    simulatorDevice
  ) {
    content = <TelemetryView device={simulatorDevice} />
  } else if (path.startsWith('/simulator/') && simulatorDevice) {
    content = <DeviceDetails device={simulatorDevice} />
  } else if (path.startsWith('/devices/')) {
    content = (
      <SimplePage
        title="Device not in real inventory"
        description="Only BLE devices selected through the browser chooser appear in the real Bluetooth inventory."
        icon={Bluetooth}
      >
        <button
          className="button primary"
          onClick={() => go('/devices')}
        >
          <Radio size={16} />
          Discover devices
        </button>
      </SimplePage>
    )
  } else if (path.includes('settings')) {
    content = <SettingsView />
  } else if (path.includes('activity')) {
    content = <ActivityPage />
  } else if (path.includes('favorites')) {
    content = <FavoritesPage />
  } else {
    content = (
      <SimplePage
        title={title}
        description="Bluetooth Control Hub workspace."
        icon={LayoutGrid}
      />
    )
  }

  return (
    <div className="app-shell">
      <Sidebar
        path={path}
        bluetoothStatus={bluetoothStatus}
        deviceCount={selectedRealDevice ? 1 : 0}
      />

      <main className="main">
        <Header
          title={title}
          bluetoothStatus={bluetoothStatus}
          onMenu={() =>
            setMenu(!menu)
          }
        />

        <div className="content">
          {content}
        </div>
      </main>

      <MobileNav path={path} />

      {menu && (
        <div className="mobile-drawer">
          <div className="drawer-top">
            <Logo />

            <button
              className="icon-button"
              onClick={() =>
                setMenu(false)
              }
            >
              <X size={20} />
            </button>
          </div>

          {nav.map(
            ({
              label,
              href,
              icon: Icon,
            }) => (
              <a
                key={href}
                href={href}
                onClick={(e) => {
                  e.preventDefault()
                  go(href)
                  setMenu(false)
                }}
              >
                <Icon size={18} />
                {label}
              </a>
            ),
          )}
        </div>
      )}
    </div>
  )
}