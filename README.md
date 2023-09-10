https://github.com/BytexDigital/ventana/assets/12883356/3b6387ff-cc47-46f7-a1c8-dc324f71cf4a

<h1 align="center">Ventana</h1>

<p align="center">
A fun unstyled spring motion driven popover component for React
</p>

<p align="center">
  <a href="#installation"><strong>Installation</strong></a> ·
  <a href="#basic-usage"><strong>Usage</strong></a> ·
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

## Basic Usage

To implement Ventana in your application, use the following:

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

## Components

The majority of the components in Ventana are wrappers around the [Radix Popover Primitive](https://www.radix-ui.com/primitives/docs/components/popover) and inherit the same props. The API documentation for the Radix Popover Primitive can be found [here](https://www.radix-ui.com/primitives/docs/components/popover#api-reference).

Styling is extremely easy with Ventana as it is unstyled by default. Simply pass in your own styles to the components and you're good to go!

### Root

The `Root` component is the root component of the Ventana component and contains all parts of the Popover and also provides context to its children.

[Radix Popover Root Props](https://www.radix-ui.com/primitives/docs/components/popover#root)

### Trigger

The button that toggles the popover. By default, the Popover.Content will position itself against the trigger.

[Radix Popover Trigger Props](https://www.radix-ui.com/primitives/docs/components/popover#trigger)

### Portal

Portals the content of the popover to the body of the document.

[Radix Popover Portal Props](https://www.radix-ui.com/primitives/docs/components/popover#portal)

### Content

The content of the popover. By default, the Popover.Content will position itself against the trigger.

[Radix Popover Content Props](https://www.radix-ui.com/primitives/docs/components/popover#content)

### Tab

A visual indicator of the selected item in the Popover.

Props TBD

### Item

An item in the Popover.

Props TBD
