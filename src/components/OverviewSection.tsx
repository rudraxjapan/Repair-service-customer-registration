import { useState } from 'react';
import type { User } from 'firebase/auth';
import {
  ArrowRight,
  Calendar,
  MapPin,
  Wrench,
  X,
} from 'lucide-react';
import { AppSection, CustomerProfile, RepairRequest } from '../types/repair';
import { cancelPendingRequest } from '../services/repairService';
import { StatusIndicator } from './StatusIndicator';

interface OverviewSectionProps {
  user: User | null;
  customerProfile: CustomerProfile | null;
  requests: RepairRequest[];
  isLoadingRequests: boolean;
  onSignIn: () => void;
  onNavigate: (section: AppSection) => void;
}

export function OverviewSection({
  user,
  customerProfile,
  requests,
  isLoadingRequests,
  onSignIn,
  onNavigate,
}: OverviewSectionProps) {
  const [selectedRequest, setSelectedRequest] = useState<RepairRequest | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [centerImgFailed, setCenterImgFailed] = useState(false);

  const activeCount = requests.filter(
    (r) => r.status !== 'Completed' && r.status !== 'Cancelled'
  ).length;
  const completedCount = requests.filter((r) => r.status === 'Completed').length;

  const handleCancel = async (requestId: string) => {
    setCancellingId(requestId);
    setActionError(null);
    try {
      await cancelPendingRequest(requestId);
      setSelectedRequest((prev) =>
        prev && prev.requestId === requestId ? { ...prev, status: 'Cancelled' } : prev
      );
    } catch {
      setActionError('Unable to cancel this request. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-12">
      {/* Hero Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 tracking-wide mb-3">
              Repair Service Management System · Firebase Synchronized
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 leading-[1.15] [text-wrap:balance] max-w-2xl">
              Precision device diagnostics, home visits, and real-time repair tracking.
            </h1>
            <p className="mt-4 text-base text-slate-600 leading-relaxed max-w-xl">
              {user
                ? customerProfile
                  ? `Signed in as ${customerProfile.fullName} in ${customerProfile.city}. Submit a new repair ticket or monitor live technician status updates.`
                  : 'Your account is verified. Complete your 6-field customer registration to start booking Home Service or Service Center repairs.'
                : 'Register your customer profile, schedule Mobile, Laptop, TV, or Appliance repairs, and follow every stage from intake to completion.'}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            {!user ? (
              <button
                type="button"
                onClick={onSignIn}
                className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Sign In to Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : !customerProfile ? (
              <button
                type="button"
                onClick={() => onNavigate('registration')}
                className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Complete Customer Registration</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate('request-repair')}
                className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Submit Repair Request</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 bg-slate-100 border border-slate-200 rounded-2xl overflow-hidden min-h-[260px]">
          {!heroImgFailed ? (
            <img
              src="/src/assets/images/hero_repair_workbench_1795161931254.jpg"
              alt="Precision electronics repair workbench with diagnostic tools"
              referrerPolicy="no-referrer"
              onError={() => setHeroImgFailed(true)}
              className="w-full h-full lg:h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600">
              <Wrench className="w-10 h-10 mb-3 text-slate-500" />
              <span className="text-sm font-medium">Calibre Hardware Diagnostics</span>
            </div>
          )}
        </div>
      </section>

      {/* Full-Width 4-Column Metric Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">
            {user ? 'Active Repairs' : 'Service Categories'}
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
            {user ? activeCount : 7}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">
            {user ? 'Completed Repairs' : 'Fulfillment Modes'}
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
            {user ? completedCount : 2}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">
            {user ? 'Total Requests' : 'Status Stages'}
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
            {user ? requests.length : 5}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Customer Profile</p>
          <p className="mt-2 text-lg font-semibold text-slate-900 truncate">
            {!user ? 'Sign In Required' : customerProfile ? 'Verified' : 'Incomplete'}
          </p>
        </div>
      </section>

      {/* Customer Requests Live Table */}
      {user && (
        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Your Repair Requests</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Live status updates synchronized with Firebase Firestore
              </p>
            </div>
            {customerProfile && (
              <button
                type="button"
                onClick={() => onNavigate('request-repair')}
                className="px-4 py-2 min-h-[40px] text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                New Repair Request
              </button>
            )}
          </div>

          {actionError && (
            <div className="px-6 py-3 bg-rose-50 border-b border-rose-200 text-xs text-rose-800">
              {actionError}
            </div>
          )}

          {isLoadingRequests ? (
            <div className="divide-y divide-slate-100">
              {[1, 2, 3].map((row) => (
                <div key={row} className="px-6 py-4 flex items-center justify-between animate-pulse">
                  <div className="space-y-2">
                    <div className="h-4 w-36 bg-slate-200 rounded" />
                    <div className="h-3 w-56 bg-slate-100 rounded" />
                  </div>
                  <div className="h-6 w-20 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-slate-900">No repair requests submitted yet</p>
              <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                Submit your first device or appliance repair request to receive a unique tracking ID
                and real-time status updates.
              </p>
              <button
                type="button"
                onClick={() =>
                  onNavigate(customerProfile ? 'request-repair' : 'registration')
                }
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors cursor-pointer"
              >
                <span>
                  {customerProfile ? 'Submit First Repair Request' : 'Register Customer Profile'}
                </span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {requests.map((req) => (
                <div
                  key={req.requestId}
                  className="px-6 py-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono font-medium text-slate-700">{req.requestId}</span>
                      <span aria-hidden="true">·</span>
                      <span>{req.serviceCategory}</span>
                      <span aria-hidden="true">·</span>
                      <span>{req.serviceType}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{req.preferredDate}</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-900 truncate">
                      {req.deviceBrand} {req.deviceModel}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600 line-clamp-1">
                      {req.problemDescription}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <StatusIndicator status={req.status} />
                    <button
                      type="button"
                      onClick={() => setSelectedRequest(req)}
                      className="px-3 py-1.5 min-h-[36px] text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Service Studio Information Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-5 bg-slate-100 border border-slate-200 rounded-2xl overflow-hidden min-h-[240px]">
          {!centerImgFailed ? (
            <img
              src="/src/assets/images/service_center_diagnostics_1795161931908.jpg"
              alt="Calibre Repair service studio and diagnostic center"
              referrerPolicy="no-referrer"
              onError={() => setCenterImgFailed(true)}
              className="w-full h-full lg:h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-slate-100 text-slate-600">
              <MapPin className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">Home Service & Service Center</span>
            </div>
          )}
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-8 flex flex-col justify-center">
          <h2 className="text-xl font-semibold text-slate-900">
            Two Fulfillment Options, One Unified Queue
          </h2>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            Choose <span className="font-medium text-slate-900">Home Service</span> for heavy
            appliances such as refrigerators, washing machines, and televisions, or select{' '}
            <span className="font-medium text-slate-900">Service Center</span> drop-off for
            precision mobile, laptop, and desktop board-level diagnostics.
          </p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-100">
            <div>
              <p className="text-xs font-medium text-slate-500">Supported Devices</p>
              <p className="mt-1 text-sm text-slate-800">
                Mobile, Laptop, Computer, TV, Refrigerator, Washing Machine
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Workflow States</p>
              <p className="mt-1 text-sm text-slate-800">
                Pending · Accepted · In Progress · Completed · Cancelled
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs text-slate-500">{selectedRequest.requestId}</p>
                <h3 className="text-lg font-semibold text-slate-900 mt-1">
                  {selectedRequest.deviceBrand} {selectedRequest.deviceModel}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                aria-label="Close modal"
                className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between py-3 border-y border-slate-100">
              <StatusIndicator status={selectedRequest.status} />
              <span className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-600">
                <Calendar className="w-3.5 h-3.5" />
                <span>{selectedRequest.preferredDate}</span>
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Category</span>
                <span className="font-medium text-slate-900">
                  {selectedRequest.serviceCategory}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service Type</span>
                <span className="font-medium text-slate-900">{selectedRequest.serviceType}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Problem Description</span>
                <p className="text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-3 leading-relaxed">
                  {selectedRequest.problemDescription}
                </p>
              </div>
              {selectedRequest.adminNotes && (
                <div>
                  <span className="text-slate-500 block mb-1">Technician Notes</span>
                  <p className="text-slate-800 bg-blue-50/60 border border-blue-200 rounded-lg p-3 leading-relaxed">
                    {selectedRequest.adminNotes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {selectedRequest.status === 'Pending' && (
                <button
                  type="button"
                  disabled={cancellingId === selectedRequest.requestId}
                  onClick={() => handleCancel(selectedRequest.requestId)}
                  className="px-4 py-2 min-h-[40px] text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 disabled:opacity-60 cursor-pointer"
                >
                  {cancellingId === selectedRequest.requestId
                    ? 'Cancelling...'
                    : 'Cancel Pending Request'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 min-h-[40px] text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
