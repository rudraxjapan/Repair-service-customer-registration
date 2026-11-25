import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, UserCheck } from 'lucide-react';
import { CustomerFormInput, CustomerProfile } from '../types/repair';
import { CustomerFieldErrors, validateCustomerForm } from '../utils/validation';
import { saveCustomerProfile } from '../services/repairService';

interface CustomerRegistrationFormProps {
  uid: string;
  defaultName: string;
  defaultEmail: string;
  existingProfile: CustomerProfile | null;
  onSaved?: () => void;
}

export function CustomerRegistrationForm({
  uid,
  defaultName,
  defaultEmail,
  existingProfile,
  onSaved,
}: CustomerRegistrationFormProps) {
  const [form, setForm] = useState<CustomerFormInput>({
    fullName: existingProfile?.fullName ?? defaultName,
    mobileNumber: existingProfile?.mobileNumber
      ? existingProfile.mobileNumber.replace(/\D/g, '').slice(-10)
      : '',
    email: existingProfile?.email ?? defaultEmail,
    address: existingProfile?.address ?? '',
    city: existingProfile?.city ?? '',
    pinCode: existingProfile?.pinCode ? existingProfile.pinCode.replace(/\D/g, '').slice(0, 6) : '',
  });
  const [errors, setErrors] = useState<CustomerFieldErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  useEffect(() => {
    if (existingProfile) {
      setForm({
        fullName: existingProfile.fullName,
        mobileNumber: existingProfile.mobileNumber.replace(/\D/g, '').slice(-10),
        email: existingProfile.email,
        address: existingProfile.address,
        city: existingProfile.city,
        pinCode: existingProfile.pinCode.replace(/\D/g, '').slice(0, 6),
      });
    } else {
      setForm((prev) => ({
        ...prev,
        fullName: prev.fullName || defaultName,
        email: prev.email || defaultEmail,
      }));
    }
  }, [existingProfile, defaultName, defaultEmail]);

  const updateField = <K extends keyof CustomerFormInput>(
    field: K,
    value: CustomerFormInput[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (banner) setBanner(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateCustomerForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setBanner({
        type: 'error',
        text: 'Please review and correct the highlighted registration fields.',
      });
      return;
    }

    setIsSaving(true);
    setBanner(null);
    try {
      await saveCustomerProfile(uid, form, Boolean(existingProfile));
      setBanner({
        type: 'success',
        text: existingProfile
          ? 'Customer profile updated and synchronized with Cloud Firestore.'
          : 'Customer registration completed and saved securely in Cloud Firestore.',
      });
      onSaved?.();
    } catch (error) {
      setBanner({
        type: 'error',
        text:
          error instanceof Error
            ? 'Unable to save registration details. Please check your connection and inputs.'
            : 'Unexpected error saving customer profile.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          {existingProfile ? 'Customer Profile Details' : 'Customer Registration'}
        </h2>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          Provide your contact and service address details. Your personal information is stored
          privately under your verified account in Firebase Firestore.
        </p>
      </div>

      {banner && (
        <div
          role="status"
          className={`mb-6 flex items-start gap-3 p-4 rounded-xl border text-sm ${
            banner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {banner.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-700 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-700 mt-0.5" />
          )}
          <span>{banner.text}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-slate-800 mb-1.5">
              Customer Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={form.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              placeholder="e.g., Aarav Patel"
              maxLength={100}
              className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-colors ${
                errors.fullName ? 'border-rose-400' : 'border-slate-300'
              }`}
            />
            {errors.fullName && (
              <p className="mt-1.5 text-xs text-rose-700">{errors.fullName}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="mobileNumber"
              className="block text-sm font-medium text-slate-800 mb-1.5"
            >
              Mobile Number
            </label>
            <input
              id="mobileNumber"
              type="tel"
              inputMode="numeric"
              value={form.mobileNumber}
              onChange={(e) =>
                updateField('mobileNumber', e.target.value.replace(/\D/g, '').slice(0, 10))
              }
              placeholder="e.g., 9876543210"
              maxLength={10}
              className={`w-full px-3.5 py-2.5 text-sm font-mono rounded-lg border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-colors ${
                errors.mobileNumber ? 'border-rose-400' : 'border-slate-300'
              }`}
            />
            {errors.mobileNumber && (
              <p className="mt-1.5 text-xs text-rose-700">{errors.mobileNumber}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-800 mb-1.5">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="customer@example.com"
            maxLength={150}
            className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-colors ${
              errors.email ? 'border-rose-400' : 'border-slate-300'
            }`}
          />
          {errors.email && <p className="mt-1.5 text-xs text-rose-700">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-slate-800 mb-1.5">
            Complete Address
          </label>
          <textarea
            id="address"
            rows={3}
            value={form.address}
            onChange={(e) => updateField('address', e.target.value)}
            placeholder="House/Flat No., Street, Landmark, Area"
            maxLength={300}
            className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-colors ${
              errors.address ? 'border-rose-400' : 'border-slate-300'
            }`}
          />
          {errors.address && <p className="mt-1.5 text-xs text-rose-700">{errors.address}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-slate-800 mb-1.5">
              City
            </label>
            <input
              id="city"
              type="text"
              value={form.city}
              onChange={(e) =>
                updateField('city', e.target.value.replace(/[0-9]/g, ''))
              }
              placeholder="e.g., Ahmedabad"
              maxLength={80}
              className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-colors ${
                errors.city ? 'border-rose-400' : 'border-slate-300'
              }`}
            />
            {errors.city && <p className="mt-1.5 text-xs text-rose-700">{errors.city}</p>}
          </div>

          <div>
            <label htmlFor="pinCode" className="block text-sm font-medium text-slate-800 mb-1.5">
              PIN Code
            </label>
            <input
              id="pinCode"
              type="text"
              inputMode="numeric"
              value={form.pinCode}
              onChange={(e) =>
                updateField('pinCode', e.target.value.replace(/\D/g, '').slice(0, 6))
              }
              placeholder="e.g., 380015"
              maxLength={6}
              className={`w-full px-3.5 py-2.5 text-sm font-mono rounded-lg border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-colors ${
                errors.pinCode ? 'border-rose-400' : 'border-slate-300'
              }`}
            />
            {errors.pinCode && <p className="mt-1.5 text-xs text-rose-700">{errors.pinCode}</p>}
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between gap-4 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            Protected by Firebase Authentication and strict owner-only Firestore rules.
          </span>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                <span>{existingProfile ? 'Update Registration' : 'Save Registration'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
