'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

import {
  bloodTypeEnum,
  profileSchema,
  type ProfileInput,
} from '@/lib/validators';

export default function ProfileForm({
  stickerId,
  profile,
}: {
  stickerId?: string;
  profile?: any;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: profile
      ? {
          bloodType: profile.bloodType ?? undefined,
          allergies: profile.allergies ?? [],
          conditions: profile.conditions ?? [],
          medications: profile.medications ?? [],
          notes: profile.notes ?? undefined,
          language: profile.language ?? undefined,
          organDonor: profile.organDonor ?? false,
          insurance: profile.insurance ?? undefined,
          consentPublic: profile.consentPublic ?? true,
          contacts: profile.contacts ?? [],
        }
      : { contacts: [{ name: '', relation: '', phone: '', preferred: true }] },
  });

  const contacts = useFieldArray({ control, name: 'contacts' });

  async function onSubmit(values: ProfileInput) {
    setServerError(null);
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ stickerId, profileId: profile?.id, values }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setServerError(j.error ?? 'Error al guardar');
      return;
    }
    window.location.href = '/account';
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      <div>
        <label className="label" htmlFor="blood">
          Grupo sanguíneo
        </label>
        <select
          id="blood"
          className="input"
          aria-invalid={!!errors.bloodType}
          {...register('bloodType')}
        >
          <option value="">Selecciona</option>
          {bloodTypeEnum.options.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="allergies">
          Alergias (separadas por coma)
        </label>
        <input
          id="allergies"
          className="input"
          placeholder="Ej. Penicilina, Mariscos"
          {...register('allergies', {
            setValueAs: (v) =>
              typeof v === 'string'
                ? v
                    .split(',')
                    .map((s: string) => s.trim())
                    .filter(Boolean)
                : v,
          })}
        />
      </div>
      <div>
        <label className="label" htmlFor="conditions">
          Condiciones (coma)
        </label>
        <input
          id="conditions"
          className="input"
          {...register('conditions', {
            setValueAs: (v) =>
              typeof v === 'string'
                ? v
                    .split(',')
                    .map((s: string) => s.trim())
                    .filter(Boolean)
                : v,
          })}
        />
      </div>
      <div>
        <label className="label" htmlFor="medications">
          Medicaciones (coma)
        </label>
        <input
          id="medications"
          className="input"
          {...register('medications', {
            setValueAs: (v) =>
              typeof v === 'string'
                ? v
                    .split(',')
                    .map((s: string) => s.trim())
                    .filter(Boolean)
                : v,
          })}
        />
      </div>
      <div>
        <label className="label" htmlFor="notes">
          Notas
        </label>
        <textarea
          id="notes"
          className="input"
          rows={3}
          {...register('notes')}
        />
      </div>
      <fieldset className="border rounded-md p-3">
        <legend className="font-medium">Contactos de emergencia</legend>
        {contacts.fields.map((f, i) => (
          <div key={f.id} className="grid md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="label" htmlFor={`cname-${i}`}>
                Nombre
              </label>
              <input
                id={`cname-${i}`}
                className="input"
                {...register(`contacts.${i}.name` as const)}
              />
            </div>
            <div>
              <label className="label" htmlFor={`crel-${i}`}>
                Relación
              </label>
              <input
                id={`crel-${i}`}
                className="input"
                {...register(`contacts.${i}.relation` as const)}
              />
            </div>
            <div>
              <label className="label" htmlFor={`cphone-${i}`}>
                Teléfono
              </label>
              <input
                id={`cphone-${i}`}
                className="input"
                {...register(`contacts.${i}.phone` as const)}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id={`cpref-${i}`}
                type="checkbox"
                {...register(`contacts.${i}.preferred` as const)}
              />
              <label htmlFor={`cpref-${i}`}>Preferido</label>
            </div>
          </div>
        ))}
        <div className="flex gap-2">
          <button
            type="button"
            className="btn"
            onClick={() =>
              contacts.append({
                name: '',
                relation: '',
                phone: '',
                preferred: false,
              })
            }
          >
            Añadir contacto
          </button>
          {contacts.fields.length > 1 && (
            <button
              type="button"
              className="underline"
              onClick={() => contacts.remove(contacts.fields.length - 1)}
            >
              Quitar último
            </button>
          )}
        </div>
        {errors.contacts && (
          <p className="error">{errors.contacts.message as any}</p>
        )}
      </fieldset>
      <div className="flex items-center gap-2">
        <input
          id="consent"
          type="checkbox"
          defaultChecked
          {...register('consentPublic')}
        />
        <label htmlFor="consent">Mostrar perfil públicamente</label>
      </div>
      {serverError && (
        <p className="error" role="alert">
          {serverError}
        </p>
      )}
      <button className="btn" type="submit">
        Guardar
      </button>
    </form>
  );
}
