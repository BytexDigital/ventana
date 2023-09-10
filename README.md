https://github.com/BytexDigital/ventana/assets/12883356/3b6387ff-cc47-46f7-a1c8-dc324f71cf4a

<h1 align="center">Ventana</h1>

<p align="center">
A fun unstyled spring motion driven popover component for React
</p>

<p align="center">
  <a href="#installation"><strong>Installation</strong></a> ·
  <a href="#usage"><strong>Usage</strong></a> ·
  <a href="#components"><strong>Components</strong></a> ·
  <a href="#acknowledgements"><strong>Acknowledgements</strong></a> ·
  <a href="#license"><strong>License</strong></a>
</p>
<br/>

## Introduction

Ventana is a fun unstyled spring motion driven popover component for React. Built using [Radix's Popover Primitive](https://www.radix-ui.com/primitives/docs/components/popover) and inspired by the following [video](https://www.youtube.com/watch?v=1VgrdLfDozo).

## Installation

Installing Ventana with npm:

```bash
npm install @ventana/react
```

Installing Ventana with yarn:

```bash
yarn add @ventana/react
```

Installing Ventana with pnpm:

```bash
pnpm add @ventana/react
```

## Usage

To use Ventana in your application, use the following:

```tsx
import { Ventana } from '@ventana/react';

function Component() {
  return (
    <Ventana.Root>
      <Ventana.Trigger>Open</Ventana.Trigger>
      <Ventana.Portal>
        <Ventana.Content>
          <Ventana.Tab />
          <Ventana.Item>
            <h1>Item 1</h1>
          </Ventana.Item>
          <Ventana.Item>
            <h1>Item 2</h1>
          </Ventana.Item>
          <Ventana.Item>
            <h1>Item 3</h1>
          </Ventana.Item>
        </Ventana.Content>
        <Ventana.Overlay />
      </Ventana.Portal>
    </Ventana.Root>
  );
}
```
