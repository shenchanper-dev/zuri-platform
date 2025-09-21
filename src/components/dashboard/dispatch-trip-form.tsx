
"use client";

import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { dispatchTripAction } from '@/app/actions/trip-actions';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Terminal } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Buscando Conductor...' : 'Despachar Viaje'}
    </Button>
  );
}

export function DispatchTripForm() {
  const [state, formAction] = useActionState(dispatchTripAction, { success: false, errors: undefined, data: undefined });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (state.success) {
      // Don't close the dialog automatically, let user see the result
    } else if (state.errors) {
      // Potentially show toast for errors
    }
  }, [state]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form state on close
      formAction(new FormData());
    }
    setIsOpen(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Despachar Nuevo Viaje</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Despachar Nuevo Viaje</DialogTitle>
          <DialogDescription>
            Ingrese los detalles del viaje para encontrar el conductor más cercano.
          </DialogDescription>
        </DialogHeader>
        {state.success && state.data ? (
            <div className="py-4">
                 <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle className="font-headline">¡Viaje Despachado!</AlertTitle>
                    <AlertDescription>
                        <p className="mt-2">Conductor Asignado: <strong>{state.data.driverId}</strong></p>
                        <p className="mt-1 text-muted-foreground">Razón: {state.data.reason}</p>
                    </AlertDescription>
                </Alert>
                <DialogFooter className="mt-4">
                    <Button onClick={() => handleOpenChange(false)}>Cerrar</Button>
                </DialogFooter>
            </div>
        ) : (
            <form action={formAction} className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="clientLat">Latitud del Cliente</Label>
                    <Input id="clientLat" name="clientLat" defaultValue="-12.045" />
                    {state.errors?.clientLat && <p className="text-sm text-destructive">{state.errors.clientLat}</p>}
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="clientLng">Longitud del Cliente</Label>
                    <Input id="clientLng" name="clientLng" defaultValue="-77.03" />
                     {state.errors?.clientLng && <p className="text-sm text-destructive">{state.errors.clientLng}</p>}
                </div>
                </div>
                <div className="grid gap-2">
                <Label htmlFor="tripDetails">Detalles del Viaje</Label>
                <Textarea id="tripDetails" name="tripDetails" placeholder="Ej: Recoger paciente en Clínica ABC para llevar a su domicilio. Requiere silla de ruedas." />
                 {state.errors?.tripDetails && <p className="text-sm text-destructive">{state.errors.tripDetails}</p>}
                </div>
                 {state.errors?._form && <p className="text-sm text-destructive">{state.errors._form}</p>}
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Cancelar</Button>
                    </DialogClose>
                    <SubmitButton />
                </DialogFooter>
            </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
