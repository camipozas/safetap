'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

import ProfileTemplateManager from '@/components/ProfileTemplateManager';
import StickerSelectorGrouped from '@/components/StickerSelectorGrouped';
import {
  bloodTypeEnum,
  profileFormSchema,
  type ProfileFormInput,
} from '@/lib/validators';

export default function ProfileForm({
  stickerId,
  profile,
  showTemplates = false,
  stickerInfo,
}: {
  stickerId?: string;
  showTemplates?: boolean;
  stickerInfo?: {
    id: string;
    nameOnSticker: string;
    flagCode: string;
  };
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
  // En modo individual, manejar el nombre del sticker
  const [stickerName, setStickerName] = useState(
    stickerInfo?.nameOnSticker || ''
  );
  const [userNameError, setUserNameError] = useState<string | null>(null);
  const [selectedStickerIds, setSelectedStickerIds] = useState<string[]>(
    stickerId ? [stickerId] : []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
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
        insurance: {
          type: profile.insurance?.type as 'fonasa' | 'isapre' | undefined,
          isapre: profile.insurance?.isapre as string | undefined,
          isapreCustom: profile.insurance?.isapreCustom as string | undefined,
          hasComplementary: profile.insurance?.hasComplementary as
            | boolean
            | undefined,
          complementaryInsurance: profile.insurance?.complementaryInsurance as
            | string
            | undefined,
        },
        consentPublic: profile.consentPublic !== false,
        contacts:
          profile.contacts && profile.contacts.length > 0
            ? profile.contacts.map((contact) => ({
                name: contact.name,
                relation: contact.relation,
                phone: contact.phone,
                country: contact.country || undefined,
                preferred: contact.preferred,
              }))
            : [{ name: '', relation: '', phone: '', preferred: true }],
      };
      reset(formValues);

      // Set hasComplementary as string for radio buttons
      if (profile.insurance?.hasComplementary === true) {
        // @ts-expect-error - Setting string value for radio button
        setValue('insurance.hasComplementary', 'true');
      } else if (profile.insurance?.hasComplementary === false) {
        // @ts-expect-error - Setting string value for radio button
        setValue('insurance.hasComplementary', 'false');
      }
    }
  }, [profile, reset, setValue]);

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
      insurance: {
        type: templateData.insurance?.type as 'fonasa' | 'isapre' | undefined,
        isapre: templateData.insurance?.isapre as string | undefined,
        isapreCustom: templateData.insurance?.isapreCustom as
          | string
          | undefined,
        hasComplementary: templateData.insurance?.hasComplementary as
          | boolean
          | undefined,
        complementaryInsurance: templateData.insurance
          ?.complementaryInsurance as string | undefined,
      },
      consentPublic: templateData.consentPublic !== false,
      contacts:
        Array.isArray(templateData.contacts) && templateData.contacts.length > 0
          ? templateData.contacts.map((contact) => ({
              name: contact.name,
              relation: contact.relation,
              phone: contact.phone,
              country: contact.country || undefined,
              preferred: contact.preferred,
            }))
          : [{ name: '', relation: '', phone: '', preferred: true }],
    };
    reset(formValues);
  };

  async function onSubmit(formValues: ProfileFormInput) {
    setServerError(null);
    setUserNameError(null);
    setIsSubmitting(true);

    try {
      // Validate that we have at least one valid contact
      if (!formValues.contacts || formValues.contacts.length === 0) {
        setServerError('Debe agregar al menos un contacto de emergencia');
        return;
      }

      // Validate each contact has required fields
      const invalidContacts = formValues.contacts.some(
        (contact) =>
          !contact.name?.trim() ||
          !contact.relation?.trim() ||
          !contact.phone?.trim()
      );

      if (invalidContacts) {
        setServerError(
          'Todos los contactos deben tener nombre, relación y teléfono'
        );
        return;
      }

      if (!stickerId && selectedStickerIds.length === 0) {
        setServerError('Debe seleccionar al menos un sticker para actualizar');
        return;
      }

      // Send form data directly - let the backend schema handle transformations
      const values: ProfileFormInput = {
        ...formValues,
        organDonor: formValues.organDonor ?? false,
        consentPublic: formValues.consentPublic ?? true,
      };

      console.log('Submitting profile data:', JSON.stringify(values, null, 2));
      console.log('Insurance data specifically:', values.insurance);

      // Update sticker name if in individual mode and it has changed
      if (
        stickerId &&
        stickerName !== (stickerInfo?.nameOnSticker || '') &&
        stickerName.trim()
      ) {
        const stickerRes = await fetch(`/api/stickers/${stickerId}`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ nameOnSticker: stickerName.trim() }),
        });

        if (!stickerRes.ok) {
          const stickerError = await stickerRes.json().catch(() => ({}));
          setUserNameError(
            stickerError.error ?? 'Error al actualizar el nombre del sticker'
          );
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
            !stickerId && selectedStickerIds.length > 0
              ? selectedStickerIds
              : undefined,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setServerError(j.error ?? 'Error al guardar');
        return;
      }

      // Success: redirect to account page
      router.push('/account');
    } catch (error) {
      setServerError('Error inesperado al guardar');
      console.error('Error saving profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {stickerId && (
        <div>
          <label className="label" htmlFor="stickerName">
            Nombre en el sticker
          </label>
          <input
            id="stickerName"
            className="input"
            placeholder="Nombre que aparecerá en el sticker"
            value={stickerName}
            onChange={(e) => setStickerName(e.target.value)}
            required
          />
          <p className="text-xs text-gray-600 mt-1">
            Este nombre aparecerá específicamente en este sticker
          </p>
          {userNameError && (
            <p className="error" role="alert">
              {userNameError}
            </p>
          )}
        </div>
      )}

      {/* Profile Template Manager - Only show when appropriate */}
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
                {stickerId
                  ? 'Editando perfil individual'
                  : 'Selecciona los stickers a actualizar'}
              </h4>
              <p className="text-sm text-blue-800 mt-1">
                {stickerId
                  ? 'Estás editando el perfil médico de este sticker específico. Los cambios solo se aplicarán a este sticker.'
                  : 'Selecciona conscientemente qué stickers quieres actualizar con esta información médica. Cada sticker mantiene su propio perfil individual.'}
              </p>
            </div>
          </div>
        </div>

        <StickerSelectorGrouped
          selectedStickers={selectedStickerIds}
          onSelectionChange={setSelectedStickerIds}
          showTitle={false}
          specificStickerId={stickerId}
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
                Nombre *
              </label>
              <input
                id={`cname-${i}`}
                className="input"
                {...register(`contacts.${i}.name` as const)}
                aria-invalid={!!errors.contacts?.[i]?.name}
              />
              {errors.contacts?.[i]?.name && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.contacts[i]?.name?.message || 'Nombre requerido'}
                </p>
              )}
            </div>
            <div>
              <label className="label" htmlFor={`crel-${i}`}>
                Relación *
              </label>
              <select
                id={`crel-${i}`}
                className="input"
                {...register(`contacts.${i}.relation` as const)}
                aria-invalid={!!errors.contacts?.[i]?.relation}
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
              {errors.contacts?.[i]?.relation && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.contacts[i]?.relation?.message ||
                    'Relación requerida'}
                </p>
              )}
            </div>
            <div>
              <label className="label" htmlFor={`cphone-${i}`}>
                Teléfono *
              </label>
              <input
                id={`cphone-${i}`}
                className="input"
                {...register(`contacts.${i}.phone` as const)}
                aria-invalid={!!errors.contacts?.[i]?.phone}
              />
              {errors.contacts?.[i]?.phone && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.contacts[i]?.phone?.message || 'Teléfono requerido'}
                </p>
              )}
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
        {errors.contacts && typeof errors.contacts.message === 'string' && (
          <p className="error" role="alert">
            {errors.contacts.message}
          </p>
        )}
      </fieldset>

      {/* Health Previsional */}
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

          {/* Show custom Isapre field when "Other" is selected */}
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
                  {...register('insurance.hasComplementary')}
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
      <button className="btn" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  );
}
