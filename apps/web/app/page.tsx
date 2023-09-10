import { Ventana } from '@ventana/react';
import Image from 'next/image';
import Actions from './actions';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="font-bold text-6xl tracking-wide">Ventana</h1>
      <p className="font-normal text-xl text-center mt-2">A Fun Unstyled React Popover Component</p>
      <Actions />
    </main>
  );
}
