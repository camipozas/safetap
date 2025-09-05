'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

import ProfileTemplateManager from '@/components/ProfileTemplateManager';
import StickerSelector from '@/components/StickerSelector';
import {
  bloodTypeEnum,
  profileFormSchema,
  type ProfileFormInput,
  type ProfileInput,
} from '@/lib/validators';

export default function ProfileForm({
  stickerId,
  profile,
  showTemplates = false,
}: {
  stickerId?: string;
  showTemplates?: boolean;
  profile?: {
    id?: string;
    bloodType?: string;
    allergies?: string | string[];
    conditions?: string | string[];
    medications?: string | string[];
    notes?: string;
    language?: string;
    organDonor?: boolean;
    insurance?: Record<string, unknown>;
    consentPublic?: boolean;
    contacts?: Array<{
      name: string;
      relation: string;
      phone: string;
      country?: string;
      preferred: boolean;
    }>;
    user?: { name?: string };
  };
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [userName, setUserName] = useState(profile?.user?.name || '');
  const [userNameError, setUserNameError] = useState<string | null>(null);
  const [selectedStickerIds, setSelectedStickerIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProfileFormInput>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      bloodType: undefined,
      allergies: '',
      conditions: '',
      medications: '',
      notes: '',
      language: 'es',
      organDonor: false,
      insurance: {
        hasComplementary: false,
      },
      consentPublic: true,
      contacts: [{ name: '', relation: '', phone: '', preferred: true }],
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

  // Reset form with profile data when profile changes
  useEffect(() => {
    if (profile) {
      const formValues = {
        bloodType: profile.bloodType as
          | 'A+'
          | 'A-'
          | 'B+'
          | 'B-'
          | 'AB+'
          | 'AB-'
          | 'O+'
          | 'O-'
          | undefined,
        allergies: Array.isArray(profile.allergies)
          ? profile.allergies.join(', ')
          : profile.allergies || '',
        conditions: Array.isArray(profile.conditions)
          ? profile.conditions.join(', ')
          : profile.conditions || '',
        medications: Array.isArray(profile.medications)
          ? profile.medications.join(', ')
          : profile.medications || '',
        notes: profile.notes || '',
        language: profile.language || 'es',
        organDonor: profile.organDonor || false,
        insurance: profile.insurance || {},
        consentPublic: profile.consentPublic !== false,
        contacts:
          profile.contacts && profile.contacts.length > 0
            ? profile.contacts
            : [{ name: '', relation: '', phone: '', preferred: true }],
      };
      reset(formValues);
    }
  }, [profile, reset]);

  const contacts = useFieldArray({ control, name: 'contacts' });

  const handleApplyTemplate = (templateData: {
    id: string;
    bloodType?: string;
    allergies?: string[];
    conditions?: string[];
    medications?: string[];
    notes?: string;
    language?: string;
    organDonor?: boolean;
    insurance?: Record<string, unknown>;
    consentPublic?: boolean;
    contacts?: Array<{
      id: string;
      name: string;
      relation: string;
      phone: string;
      country?: string;
      preferred: boolean;
    }>;
  }) => {
    const formValues = {
      bloodType: templateData.bloodType as
        | 'A+'
        | 'A-'
        | 'B+'
        | 'B-'
        | 'AB+'
        | 'AB-'
        | 'O+'
        | 'O-'
        | undefined,
      allergies: Array.isArray(templateData.allergies)
        ? templateData.allergies.join(', ')
        : '',
      conditions: Array.isArray(templateData.conditions)
        ? templateData.conditions.join(', ')
        : '',
      medications: Array.isArray(templateData.medications)
        ? templateData.medications.join(', ')
        : '',
      notes: templateData.notes || '',
      language: templateData.language || 'es',
      organDonor: Boolean(templateData.organDonor),
      insurance: templateData.insurance || {},
      consentPublic: templateData.consentPublic !== false,
      contacts:
        Array.isArray(templateData.contacts) && templateData.contacts.length > 0
          ? templateData.contacts.map((contact) => ({
              name: contact.name,
              relation: contact.relation,
              phone: contact.phone,
              country: contact.country,
              preferred: contact.preferred,
            }))
          : [{ name: '', relation: '', phone: '', preferred: true }],
    };
    reset(formValues);
  };

  async function onSubmit(formValues: ProfileFormInput) {
    setServerError(null);
    setUserNameError(null);

    // Transform form data to API format
    const values: ProfileInput = {
      ...formValues,
      allergies: formValues.allergies
        ? formValues.allergies
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      conditions: formValues.conditions
        ? formValues.conditions
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      medications: formValues.medications
        ? formValues.medications
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      organDonor: formValues.organDonor ?? false,
      consentPublic: formValues.consentPublic ?? true,
    };

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
      body: JSON.stringify({
        stickerId,
        profileId: profile?.id,
        values,
        selectedStickerIds:
          selectedStickerIds.length > 0 ? selectedStickerIds : undefined,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setServerError(j.error ?? 'Error al guardar');
      return;
    }
    window.location.href = '/account';
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
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

      {/* Profile Template Manager - Solo mostrar cuando es apropiado */}
      {showTemplates && (
        <div>
          <ProfileTemplateManager
            onTemplateApply={handleApplyTemplate}
            showTitle={true}
          />
        </div>
      )}

      {/* Sticker Selection Section */}
      <div className="space-y-3">
        <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
          <div className="flex items-start">
            <svg
              className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-blue-900">
                Selecciona los stickers a actualizar
              </h4>
              <p className="text-sm text-blue-800 mt-1">
                Elige a qué stickers aplicar esta información médica. Solo se
                actualizarán los stickers que selecciones.
              </p>
            </div>
          </div>
        </div>

        <StickerSelector
          selectedStickers={selectedStickerIds}
          onSelectionChange={setSelectedStickerIds}
          showTitle={false}
        />
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
          {...register('allergies')}
        />
      </div>
      <div>
        <label className="label" htmlFor="conditions">
          Condiciones (coma)
        </label>
        <input id="conditions" className="input" {...register('conditions')} />
      </div>
      <div>
        <label className="label" htmlFor="medications">
          Medicaciones (coma)
        </label>
        <input
          id="medications"
          className="input"
          {...register('medications')}
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
          <p className="error">{String(errors.contacts.message)}</p>
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
            <label className="label" htmlFor="hasComplementary">
              ¿Tiene seguro complementario?
            </label>
            <div className="flex gap-4">
              <label
                className="flex items-center gap-2"
                htmlFor="hasComplementary-yes"
              >
                <input
                  id="hasComplementary-yes"
                  type="radio"
                  value="true"
                  {...register('insurance.hasComplementary', {
                    setValueAs: (value) => value === 'true',
                  })}
                />
                Sí
              </label>
              <label
                className="flex items-center gap-2"
                htmlFor="hasComplementary-no"
              >
                <input
                  id="hasComplementary-no"
                  type="radio"
                  value="false"
                  {...register('insurance.hasComplementary')}
                />
                No
              </label>
            </div>
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
