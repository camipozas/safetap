'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

import {
  bloodTypeEnum,
  profileSchema,
  type ProfileInput,
} from '@/lib/validators';
import { EmergencyProfileDisplayData } from '@/types/database';

export default function ProfileForm({
  stickerId,
  profile,
}: {
  stickerId?: string;
  profile?: EmergencyProfileDisplayData;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [userName, setUserName] = useState(profile?.user?.name || '');
  const [userNameError, setUserNameError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: profile
      ? {
          bloodType:
            (profile.bloodType as
              | 'A+'
              | 'A-'
              | 'B+'
              | 'B-'
              | 'AB+'
              | 'AB-'
              | 'O+'
              | 'O-'
              | undefined) ?? undefined,
          allergies: profile.allergies ?? [],
          conditions: profile.conditions ?? [],
          medications: profile.medications ?? [],
          notes: profile.notes ?? undefined,
          language: profile.language ?? undefined,
          organDonor: profile.organDonor ?? false,
          insurance: profile.insurance ?? undefined,
          consentPublic: profile.consentPublic ?? true,
          contacts:
            profile.contacts?.length > 0
              ? profile.contacts.map((contact) => ({
                  name: contact.name,
                  relation: contact.relation,
                  phone: contact.phone,
                  preferred: contact.preferred,
                  country: contact.country,
                }))
              : [{ name: '', relation: '', phone: '', preferred: true }],
        }
      : {
          contacts: [{ name: '', relation: '', phone: '', preferred: true }],
          insurance: { hasComplementary: false },
        },
  });

  // Watch form values for conditional rendering
  const watchedInsuranceType = watch('insurance.type');
  const watchedIsapre = watch('insurance.isapre');
  const rawHasComplementary = watch('insurance.hasComplementary');
  // Transform string/boolean to boolean for conditional rendering
  const watchedHasComplementary = (() => {
    if (typeof rawHasComplementary === 'string') {
      return rawHasComplementary === 'true';
    }
    return Boolean(rawHasComplementary);
  })();

  const contacts = useFieldArray({ control, name: 'contacts' });

  async function onSubmit(values: ProfileInput) {
    setServerError(null);
    setUserNameError(null);

    // First, update user name if it has changed
    if (userName !== (profile?.user?.name || '') && userName.trim()) {
      const userRes = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: userName.trim() }),
      });

      if (!userRes.ok) {
        const userError = await userRes.json().catch(() => ({}));
        setUserNameError(userError.error ?? 'Error al actualizar el nombre');
        return;
      }
    }

    // Then update the profile
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
        <label className="label" htmlFor="userName">
          Nombre completo
        </label>
        <input
          id="userName"
          className="input"
          placeholder="Tu nombre completo"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          required
        />
        <p className="text-xs text-gray-600 mt-1">
          Este nombre aparecerá en tu perfil de emergencia y en tus stickers
        </p>
        {userNameError && (
          <p className="error" role="alert">
            {userNameError}
          </p>
        )}
      </div>

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
          Información para el sticker
        </label>
        <textarea
          id="notes"
          className="input"
          rows={3}
          placeholder="Información que aparecerá en tu sticker físico (ej. condiciones médicas importantes, alergias críticas, etc.)"
          {...register('notes')}
        />
        <p className="text-xs text-gray-600 mt-1">
          Esta información aparecerá tanto en tu sticker físico como en tu
          perfil público
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input id="organDonor" type="checkbox" {...register('organDonor')} />
        <label htmlFor="organDonor" className="label cursor-pointer">
          Soy donante de órganos
        </label>
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
              <select
                id={`crel-${i}`}
                className="input"
                {...register(`contacts.${i}.relation` as const)}
              >
                <option value="">Seleccionar relación</option>
                <option value="Padre/Madre">Padre/Madre</option>
                <option value="Hermano/a">Hermano/a</option>
                <option value="Hijo/a">Hijo/a</option>
                <option value="Esposo/a">Esposo/a</option>
                <option value="Pareja">Pareja</option>
                <option value="Amigo/a">Amigo/a</option>
                <option value="Compañero/a de trabajo">
                  Compañero/a de trabajo
                </option>
                <option value="Médico">Médico</option>
                <option value="Contacto de emergencia">
                  Contacto de emergencia
                </option>
                <option value="Otro">Otro</option>
              </select>
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
          <p className="error">{errors.contacts.message as string}</p>
        )}
      </fieldset>

      {/* Salud Previsional */}
      <fieldset className="border rounded-md p-3">
        <legend className="font-medium">Salud Previsional</legend>
        <div className="space-y-3">
          <div>
            <label className="label" htmlFor="insuranceType">
              Tipo de previsión *
            </label>
            <select
              id="insuranceType"
              className="input"
              {...register('insurance.type')}
            >
              <option value="">Seleccionar</option>
              <option value="fonasa">Fonasa</option>
              <option value="isapre">Isapre</option>
            </select>
          </div>

          {/* Show Isapre field when Isapre is selected */}
          {watchedInsuranceType === 'isapre' && (
            <div>
              <label className="label" htmlFor="isapreProvider">
                ¿Cuál Isapre?
              </label>
              <select
                id="isapreProvider"
                className="input"
                {...register('insurance.isapre')}
              >
                <option value="">Seleccionar Isapre</option>
                <option value="Banmédica S.A.">Banmédica S.A.</option>
                <option value="Colmena Golden Cross S.A.">
                  Colmena Golden Cross S.A.
                </option>
                <option value="Consalud S.A.">Consalud S.A.</option>
                <option value="Cruz Blanca S.A.">Cruz Blanca S.A.</option>
                <option value="Cruz del Norte Ltda.">
                  Cruz del Norte Ltda.
                </option>
                <option value="Esencial S.A.">Esencial S.A.</option>
                <option value="Fundación Ltda. (Isapre Fundación)">
                  Fundación Ltda. (Isapre Fundación)
                </option>
                <option value="Isalud Ltda. (Isapre de Codelco)">
                  Isalud Ltda. (Isapre de Codelco)
                </option>
                <option value="Nueva Masvida S.A.">Nueva Masvida S.A.</option>
                <option value="Vida Tres S.A.">Vida Tres S.A.</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          )}

          {/* Show custom Isapre field when "Otro" is selected */}
          {watchedInsuranceType === 'isapre' && watchedIsapre === 'Otro' && (
            <div>
              <label className="label" htmlFor="isapreCustom">
                Especificar Isapre
              </label>
              <input
                id="isapreCustom"
                className="input"
                placeholder="Escribir nombre de la Isapre"
                {...register('insurance.isapreCustom')}
              />
            </div>
          )}

          <div>
            <fieldset>
              <legend className="label">¿Tiene seguro complementario?</legend>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="true"
                    {...register('insurance.hasComplementary')}
                  />
                  Sí
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="false"
                    {...register('insurance.hasComplementary')}
                  />
                  No
                </label>
              </div>
            </fieldset>
          </div>

          {watchedHasComplementary === true && (
            <div>
              <label className="label" htmlFor="complementaryInsurance">
                ¿Cuál seguro complementario?
              </label>
              <input
                id="complementaryInsurance"
                className="input"
                placeholder="Ej: Sura, Consorcio, etc."
                {...register('insurance.complementaryInsurance')}
              />
            </div>
          )}
        </div>
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
