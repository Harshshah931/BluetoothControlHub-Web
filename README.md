# Bluetooth Control Hub

A responsive web-based Bluetooth device management and BLE/GATT diagnostics interface built with **Next.js, React, TypeScript, Tailwind CSS, and the Web Bluetooth API**.

## 🚀 Live Demo

**[Open Bluetooth Control Hub](https://bluetoothcontrolhubweb.vercel.app)**

## 📦 GitHub Repository

https://github.com/Harshshah931/BluetoothControlHub-Web

---

## 📌 Overview

Bluetooth Control Hub is a web application designed to provide a modern interface for discovering, connecting to, inspecting, and testing supported Bluetooth Low Energy (BLE) devices.

The project combines a polished desktop/mobile interface with a Bluetooth service architecture that separates the UI from the underlying Bluetooth implementation.

It also includes a software-only simulator so that Bluetooth and GATT workflows can be developed and tested without requiring additional physical hardware.

---

## ✨ Features

- Responsive desktop and mobile-first interface
- Bluetooth device workspace
- Real Web Bluetooth device-selection flow
- Browser Bluetooth permission handling
- BLE/GATT connection architecture
- GATT service discovery
- GATT characteristic discovery
- Characteristic property detection
- Real-device inventory
- Separate simulator workspace
- Simulated BLE devices
- Simulated GATT services and characteristics
- Simulated read/write/notification behavior
- Simulated telemetry
- Capability-based device architecture
- Next.js App Router routing
- Vercel deployment
- GitHub-based source management

---

## 🏗️ Architecture

The application is designed around a service abstraction so that the UI is separated from the Bluetooth implementation.

```text
                    Bluetooth Control Hub
                             │
                             ▼
                           UI
                             │
                             ▼
                 Bluetooth Service Layer
                       /             \
                      /               \
                     ▼                 ▼
          Web Bluetooth Service    Simulator Service
                  │                       │
                  ▼                       ▼
             Real BLE/GATT          Simulated BLE/GATT
