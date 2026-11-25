import React, { useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Send } from 'lucide-react';
import {
  CustomerProfile,
  RepairRequestFormInput,
  SERVICE_CATEGORIES,
  SERVICE_TYPES,
} from '../types/repair';
import { RepairFieldErrors, validateRepairForm } from '../utils/validation';
import { submitRepairRequest } from '../services/repairService';

interface RepairRequestFormProps {
  customerProfile: CustomerProfile | null;
  onGoToRegistration: () => void;
  onSubmitted: (requestId: string) => void;
}

export function RepairRequestForm({
  customerProfile,
  onGoToRegistration,
  onSubmitted,
}: RepairRequestFormProps) {
  const todayIso = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState<RepairRequestFormInput>({
    serviceCategory: 'Mobile',
    deviceBrand: '',
    deviceModel: '',
    problemDescription: '',
    preferredDate: todayIso,
    serviceType: 'Service Center',
  });
  const [errors, setErrors] = useState<RepairFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banner, setBanner] = useState<{
    type: 'success' | 'error';
    text: string;
    requestId?: string;
  } | null>(null);

  const updateField = <K extends keyof RepairRequestFormInput>(
    field: K,
    value: RepairRequestFormInput[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (banner) setBanner(null);
  };

  if (!customerProfile) {
    return (
      <section className="max-w-2xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-slate-900">
            Customer Registration Required First
          </h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Before submitting a repair request, please save your contact number and service address
            in your Customer Registration profile so technicians can coordinate pickup or home
            visits.
          </p>
          <button
            type="button"
            onClick={onGoToRegistration}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors cursor-pointer"
          >
            <span>Complete Customer Registration</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateRepairForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setBanner({
        type: 'error',
        text: 'Please correct the highlighted fields before submitting.',
      });
      return;
    }

    setIsSubmitting(true);
    setBanner(null);
    try {
      const requestId = await submitRepairRequest(customerProfile, form);
      setBanner({
        type: 'success',
        text: `Repair request ${requestId} has been logged in Cloud Firestore with status Pending.`,
        requestId,
      });
      setForm({
        serviceCategory: 'Mobile',
        deviceBrand: '',
        deviceModel: '',
        problemDescription: '',
        preferredDate: todayIso,
        serviceType: 'Service Center',
      });
      onSubmitted(requestId);
    } catch (error) {
      setBanner({
        type: 'error',
        text:
          error instanceof Error
            ? 'Failed to submit repair request. Please verify your inputs and connection.'
            : 'Unexpected error submitting repair request.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          Submit a Repair Request
        </h2>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          Submitting as <span className="font-medium text-slate-900">{customerProfile.fullName}</span>{' '}
          <span aria-hidden="true">·</span>{' '}
          <span className="font-mono text-slate-700">{customerProfile.mobileNumber}</span>{' '}
          <span aria-hidden="true">·</span>{' '}
          <span>{customerProfile.city}</span>
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
          <div>
            <p>{banner.text}</p>
            {banner.requestId && (
              <p className="mt-1 font-mono text-xs text-emerald-800">
                Tracking ID: {banner.requestId}
              </p>
            )}
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6"
      >
        <div>
          <span className="block text-sm font-medium text-slate-800 mb-2">Service Category</span>
          <div className="flex flex-wrap gap-2">
            {SERVICE_CATEGORIES.map((category) => {
              const active = form.serviceCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => updateField('serviceCategory', category)}
                  className={`px-3.5 py-2 min-h-[40px] text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
          {errors.serviceCategory && (
            <p className="mt-1.5 text-xs text-rose-700">{errors.serviceCategory}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="deviceBrand"
              className="block text-sm font-medium text-slate-800 mb-1.5"
            >
              Device Brand
            </label>
            <input
              id="deviceBrand"
              type="text"
              value={form.deviceBrand}
              onChange={(e) => updateField('deviceBrand', e.target.value)}
              placeholder="e.g., Apple, Dell, LG, Whirlpool"
              maxLength={60}
              className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-colors ${
                errors.deviceBrand ? 'border-rose-400' : 'border-slate-300'
              }`}
            />
            {errors.deviceBrand && (
              <p className="mt-1.5 text-xs text-rose-700">{errors.deviceBrand}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="deviceModel"
              className="block text-sm font-medium text-slate-800 mb-1.5"
            >
              Device Model
            </label>
            <input
              id="deviceModel"
              type="text"
              value={form.deviceModel}
              onChange={(e) => updateField('deviceModel', e.target.value)}
              placeholder="e.g., MacBook Pro M3, OLED C3"
              maxLength={80}
              className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-colors ${
                errors.deviceModel ? 'border-rose-400' : 'border-slate-300'
              }`}
            />
            {errors.deviceModel && (
              <p className="mt-1.5 text-xs text-rose-700">{errors.deviceModel}</p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="problemDescription"
              className="block text-sm font-medium text-slate-800"
            >
              Problem Description
            </label>
            <span className="text-xs font-mono text-slate-500">
              {form.problemDescription.length}/1000
            </span>
          </div>
          <textarea
            id="problemDescription"
            rows={4}
            value={form.problemDescription}
            onChange={(e) => updateField('problemDescription', e.target.value)}
            placeholder="Describe symptoms, error codes, power issues, or physical damage..."
            maxLength={1000}
            className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-colors ${
              errors.problemDescription ? 'border-rose-400' : 'border-slate-300'
            }`}
          />
          {errors.problemDescription && (
            <p className="mt-1.5 text-xs text-rose-700">{errors.problemDescription}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="preferredDate"
              className="block text-sm font-medium text-slate-800 mb-1.5"
            >
              Preferred Repair Date
            </label>
            <input
              id="preferredDate"
              type="date"
              min={todayIso}
              value={form.preferredDate}
              onChange={(e) => updateField('preferredDate', e.target.value)}
              className={`w-full px-3.5 py-2.5 text-sm font-mono rounded-lg border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-colors ${
                errors.preferredDate ? 'border-rose-400' : 'border-slate-300'
              }`}
            />
            {errors.preferredDate && (
              <p className="mt-1.5 text-xs text-rose-700">{errors.preferredDate}</p>
            )}
          </div>

          <div>
            <span className="block text-sm font-medium text-slate-800 mb-1.5">Service Type</span>
            <div className="grid grid-cols-2 gap-2">
              {SERVICE_TYPES.map((type) => {
                const active = form.serviceType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => updateField('serviceType', type)}
                    className={`px-3 py-2.5 min-h-[42px] text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-blue-700 text-white border-blue-700'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
            {errors.serviceType && (
              <p className="mt-1.5 text-xs text-rose-700">{errors.serviceType}</p>
            )}
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between gap-4 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            A unique request tracking ID is generated automatically upon submission.
          </span>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Repair Request</span>
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
