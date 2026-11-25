import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Search, X } from 'lucide-react';
import {
  CustomerProfile,
  REPAIR_STATUSES,
  RepairRequest,
  RepairStatus,
} from '../types/repair';
import {
  subscribeToAllCustomers,
  subscribeToAllRepairRequests,
  updateRepairStatus,
} from '../services/repairService';
import { StatusIndicator } from './StatusIndicator';
import { AndroidProjectViewer } from './AndroidProjectViewer';

export function AdminDashboard() {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'requests' | 'customers' | 'android'>('requests');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<RepairStatus | 'All'>('All');

  const [selectedRequest, setSelectedRequest] = useState<RepairRequest | null>(null);
  const [nextStatus, setNextStatus] = useState<RepairStatus>('Pending');
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  useEffect(() => {
    setIsLoading(true);
    let customersReady = false;
    let requestsReady = false;

    const unsubCustomers = subscribeToAllCustomers(
      (data) => {
        setCustomers(data);
        customersReady = true;
        if (requestsReady) setIsLoading(false);
      },
      (err) => {
        setErrorText(err.message);
        setIsLoading(false);
      }
    );

    const unsubRequests = subscribeToAllRepairRequests(
      (data) => {
        setRequests(data);
        requestsReady = true;
        if (customersReady) setIsLoading(false);
      },
      (err) => {
        setErrorText(err.message);
        setIsLoading(false);
      }
    );

    return () => {
      unsubCustomers();
      unsubRequests();
    };
  }, []);

  const customerMap = useMemo(() => {
    const map = new Map<string, CustomerProfile>();
    customers.forEach((c) => map.set(c.uid, c));
    return map;
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.mobileNumber.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return requests.filter((req) => {
      const matchesStatus = statusFilter === 'All' || req.status === statusFilter;
      const matchesSearch =
        !q ||
        req.customerName.toLowerCase().includes(q) ||
        req.customerMobile.toLowerCase().includes(q) ||
        req.requestId.toLowerCase().includes(q) ||
        req.deviceBrand.toLowerCase().includes(q) ||
        req.deviceModel.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [requests, searchQuery, statusFilter]);

  const pendingCount = requests.filter((r) => r.status === 'Pending').length;
  const activeCount = requests.filter(
    (r) => r.status === 'Accepted' || r.status === 'In Progress'
  ).length;
  const completedCount = requests.filter((r) => r.status === 'Completed').length;

  const openRequestModal = (req: RepairRequest) => {
    setSelectedRequest(req);
    setNextStatus(req.status);
    setAdminNotes(req.adminNotes ?? '');
    setFeedback(null);
  };

  const handleStatusSave = async () => {
    if (!selectedRequest) return;
    setIsUpdating(true);
    setFeedback(null);
    try {
      await updateRepairStatus(selectedRequest.requestId, nextStatus, adminNotes);
      setFeedback({
        type: 'success',
        text: `Request ${selectedRequest.requestId} updated to ${nextStatus}.`,
      });
      setSelectedRequest(null);
    } catch {
      setFeedback({
        type: 'error',
        text: 'Failed to update repair status in Firestore.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <section className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Administrator Operations Desk
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Manage registered customers, inspect repair tickets, and update live service statuses.
          </p>
        </div>

        <div className="inline-flex items-center p-1 bg-slate-100 border border-slate-200 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Repair Requests ({requests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('customers')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'customers'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Customers ({customers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'android'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Android Project
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Registered Customers</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
            {customers.length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Pending Intake</p>
          <p className="mt-2 text-2xl font-semibold text-amber-700 tabular-nums">
            {pendingCount}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Accepted & In Progress</p>
          <p className="mt-2 text-2xl font-semibold text-blue-700 tabular-nums">{activeCount}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Completed</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-700 tabular-nums">
            {completedCount}
          </p>
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          className={`flex items-center gap-3 p-4 rounded-xl border text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-700 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {errorText && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-900">
          {errorText}
        </div>
      )}

      {activeTab === 'android' ? (
        <AndroidProjectViewer />
      ) : (
        <>
          {/* Search and Status Filter Toolbar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customers by full name, mobile number, or request ID..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700"
              />
            </div>

            {activeTab === 'requests' && (
              <div className="flex flex-wrap items-center gap-2">
                {(['All', ...REPAIR_STATUSES] as const).map((status) => {
                  const active = statusFilter === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {status}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Data Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            {isLoading ? (
              <div className="p-8 flex items-center justify-center gap-3 text-sm text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading live Firebase records...</span>
              </div>
            ) : activeTab === 'requests' ? (
          filteredRequests.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No repair requests match your current search or filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium text-slate-500">
                    <th className="py-3 px-4">Request ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Device & Category</th>
                    <th className="py-3 px-4">Service Type</th>
                    <th className="py-3 px-4">Preferred Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredRequests.map((req) => (
                    <tr key={req.requestId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs font-medium text-slate-700 whitespace-nowrap">
                        {req.requestId}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-900">{req.customerName}</p>
                        <p className="text-xs font-mono text-slate-500">{req.customerMobile}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-slate-900">
                          {req.deviceBrand} {req.deviceModel}
                        </p>
                        <p className="text-xs text-slate-500">{req.serviceCategory}</p>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700 whitespace-nowrap">
                        {req.serviceType}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                        {req.preferredDate}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusIndicator status={req.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openRequestModal(req)}
                          className="px-3 py-1.5 min-h-[36px] text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : filteredCustomers.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No registered customers match "{searchQuery}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium text-slate-500">
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Mobile Number</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4">City / PIN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredCustomers.map((c) => (
                  <tr key={c.uid} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-900">{c.fullName}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                      {c.mobileNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{c.email}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs">{c.address}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-700 whitespace-nowrap">
                      {c.city} <span aria-hidden="true">·</span>{' '}
                      <span className="font-mono">{c.pinCode}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
          </div>
        </>
      )}

      {/* Admin Manage Repair Modal */}
      {selectedRequest && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs text-slate-500">{selectedRequest.requestId}</p>
                <h3 className="text-lg font-semibold text-slate-900 mt-0.5">
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

            {(() => {
              const customerInfo = customerMap.get(selectedRequest.customerId);
              return (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm space-y-1.5">
                  <p className="font-semibold text-slate-900">
                    {selectedRequest.customerName}{' '}
                    <span className="font-mono font-normal text-slate-600">
                      ({selectedRequest.customerMobile})
                    </span>
                  </p>
                  {customerInfo && (
                    <>
                      <p className="text-xs text-slate-600">{customerInfo.email}</p>
                      <p className="text-xs text-slate-700">
                        {customerInfo.address}, {customerInfo.city} -{' '}
                        <span className="font-mono">{customerInfo.pinCode}</span>
                      </p>
                    </>
                  )}
                </div>
              );
            })()}

            <div className="space-y-2 text-sm">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                <span>Category: {selectedRequest.serviceCategory}</span>
                <span>·</span>
                <span>Type: {selectedRequest.serviceType}</span>
                <span>·</span>
                <span className="font-mono">Date: {selectedRequest.preferredDate}</span>
              </div>
              <p className="text-slate-800 bg-white border border-slate-200 rounded-lg p-3 leading-relaxed">
                {selectedRequest.problemDescription}
              </p>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-100">
              <span className="block text-sm font-medium text-slate-800">Update Repair Status</span>
              <div className="flex flex-wrap gap-2">
                {REPAIR_STATUSES.map((st) => {
                  const active = nextStatus === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNextStatus(st)}
                      className={`px-3 py-1.5 min-h-[36px] text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                        active
                          ? 'bg-blue-700 text-white border-blue-700'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>

              <div>
                <label
                  htmlFor="adminNotes"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Technician / Admin Notes (Optional)
                </label>
                <textarea
                  id="adminNotes"
                  rows={3}
                  maxLength={500}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Diagnostic findings, assigned technician, or pickup schedule..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 min-h-[40px] text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleStatusSave}
                className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60 cursor-pointer"
              >
                {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Status Update</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
