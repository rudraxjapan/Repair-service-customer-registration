import { useEffect, useState } from 'react';
import { onIdTokenChanged, type User } from 'firebase/auth';
import {
  LayoutDashboard,
  MailCheck,
  PlusCircle,
  ShieldCheck,
  UserCircle2,
} from 'lucide-react';
import {
  auth,
  isFirebaseConfigured,
  reloadVerifiedUser,
  resendVerificationEmail,
  signOutUser,
} from './firebase';
import {
  checkIsAdmin,
  subscribeToCustomerProfile,
  subscribeToCustomerRequests,
} from './services/repairService';
import { AppSection, CustomerProfile, RepairRequest } from './types/repair';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OverviewSection } from './components/OverviewSection';
import { CustomerRegistrationForm } from './components/CustomerRegistrationForm';
import { RepairRequestForm } from './components/RepairRequestForm';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';

function RepairAppShell() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  const [activeSection, setActiveSection] = useState<AppSection>('overview');
  const [pendingSection, setPendingSection] = useState<AppSection | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);

  const isVerifiedUser = Boolean(user && isEmailVerified);

  useEffect(() => {
    if (!auth || !isFirebaseConfigured) {
      setAuthReady(true);
      return;
    }

    const unsubscribe = onIdTokenChanged(auth, async (nextUser) => {
      const verified = Boolean(nextUser?.emailVerified);
      setUser(nextUser);
      setIsEmailVerified(verified);
      setAuthReady(true);
      setIsAdmin(false);

      if (nextUser && verified) {
        const adminStatus = await checkIsAdmin(
          nextUser.uid,
          nextUser.email,
          verified
        );
        setIsAdmin(adminStatus);
        if (!adminStatus) {
          setActiveSection((prev) => (prev === 'admin' ? 'overview' : prev));
        }
      } else {
        setCustomerProfile(null);
        setRequests([]);
        if (!nextUser) {
          setActiveSection('overview');
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady || !user || !isEmailVerified) return;

    setIsProfileLoading(true);
    setIsLoadingRequests(true);

    const unsubProfile = subscribeToCustomerProfile(
      user.uid,
      (profile) => {
        setCustomerProfile(profile);
        setIsProfileLoading(false);
      },
      (err) => {
        console.error(err);
        setIsProfileLoading(false);
      }
    );

    const unsubRequests = subscribeToCustomerRequests(
      user.uid,
      (items) => {
        setRequests(items);
        setIsLoadingRequests(false);
      },
      (err) => {
        console.error(err);
        setIsLoadingRequests(false);
      }
    );

    return () => {
      unsubProfile();
      unsubRequests();
    };
  }, [authReady, user, user?.emailVerified]);

  const openSignInModal = (targetSection: AppSection | null = null) => {
    setPendingSection(targetSection);
    setIsAuthModalOpen(true);
  };

  const handleAuthenticated = () => {
    if (pendingSection) {
      setActiveSection(pendingSection);
      setPendingSection(null);
    }
  };

  const handleResendVerification = async () => {
    setVerificationStatus(null);
    try {
      await resendVerificationEmail();
      setVerificationStatus('Verification email sent. Check your inbox and spam folder.');
    } catch (error) {
      setVerificationStatus(
        error instanceof Error ? error.message : 'Unable to send verification email.'
      );
    }
  };

  const handleCheckVerification = async () => {
    setIsCheckingVerification(true);
    setVerificationStatus(null);
    try {
      const updated = await reloadVerifiedUser();
      if (updated) {
        const verified = Boolean(updated.emailVerified);
        setUser(updated);
        setIsEmailVerified(verified);
        if (verified) {
          const adminStatus = await checkIsAdmin(
            updated.uid,
            updated.email,
            verified
          );
          setIsAdmin(adminStatus);
        } else {
          setVerificationStatus('Email is still unverified. Click the link in your inbox first.');
        }
      }
    } catch (error) {
      setVerificationStatus(
        error instanceof Error ? error.message : 'Unable to verify status right now.'
      );
    } finally {
      setIsCheckingVerification(false);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    setVerificationStatus(null);
    setActiveSection('overview');
  };

  const navLinks: { id: AppSection; label: string; requiresAuth?: boolean }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'registration', label: 'Customer Profile', requiresAuth: true },
    { id: 'request-repair', label: 'Submit Request', requiresAuth: true },
    ...(isAdmin ? [{ id: 'admin' as const, label: 'Admin Desk', requiresAuth: true }] : []),
  ];

  const handleNavClick = (section: AppSection, requiresAuth?: boolean) => {
    if (requiresAuth && !user) {
      openSignInModal(section);
      return;
    }
    setActiveSection(section);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-20 md:pb-0">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => setActiveSection('overview')}
            className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Calibre Repair
          </button>

          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            {navLinks.map((item) => {
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id, item.requiresAuth)}
                  className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'text-slate-900 border-blue-700'
                      : 'border-transparent hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="shrink-0">
            {!authReady ? (
              <span className="text-xs text-slate-400 whitespace-nowrap">Connecting...</span>
            ) : user ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="px-4 py-2 min-h-[40px] text-xs font-medium text-slate-800 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Sign Out
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openSignInModal(null)}
                className="px-4 py-2 min-h-[40px] text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {user && !isEmailVerified ? (
          <section className="max-w-lg mx-auto bg-white border border-slate-200 rounded-2xl p-8 space-y-5">
            <div className="flex items-center gap-3 text-blue-700">
              <MailCheck className="w-6 h-6 shrink-0" />
              <h2 className="text-xl font-semibold text-slate-900">Verify Your Email Address</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              We sent a verification link to{' '}
              <span className="font-medium text-slate-900">{user.email}</span>. Click the link in
              your inbox to activate secure Firestore access, then confirm below.
            </p>
            {verificationStatus && (
              <p className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                {verificationStatus}
              </p>
            )}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                disabled={isCheckingVerification}
                onClick={handleCheckVerification}
                className="px-4 py-2.5 min-h-[44px] text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60 cursor-pointer"
              >
                {isCheckingVerification ? 'Checking...' : 'I Verified My Email'}
              </button>
              <button
                type="button"
                onClick={handleResendVerification}
                className="px-4 py-2.5 min-h-[44px] text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                Resend Verification Email
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="px-4 py-2.5 min-h-[44px] text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </section>
        ) : (
          <>
            {activeSection === 'overview' && (
              <OverviewSection
                user={isVerifiedUser ? user : null}
                customerProfile={customerProfile}
                requests={requests}
                isLoadingRequests={isLoadingRequests || isProfileLoading}
                onSignIn={() => openSignInModal(null)}
                onNavigate={(sec) => setActiveSection(sec)}
              />
            )}

            {activeSection === 'registration' && isVerifiedUser && user && (
              <CustomerRegistrationForm
                uid={user.uid}
                defaultName={user.displayName ?? ''}
                defaultEmail={user.email ?? ''}
                existingProfile={customerProfile}
              />
            )}

            {activeSection === 'request-repair' && isVerifiedUser && user && (
              <RepairRequestForm
                customerProfile={customerProfile}
                onGoToRegistration={() => setActiveSection('registration')}
                onSubmitted={() => {
                  // Stay on form to display tracking ID banner cleanly
                }}
              />
            )}

            {activeSection === 'admin' && isVerifiedUser && isAdmin && <AdminDashboard />}
          </>
        )}
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthenticated={handleAuthenticated}
      />

      <footer className="hidden md:block border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between text-xs text-slate-500">
          <span>Calibre Repair Service Management System</span>
          <span>Cloud Firestore &amp; Firebase Authentication</span>
        </div>
      </footer>

      {/* Mobile Bottom Thumb-Zone Navigation (<= 15% viewport cap) */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 h-16 px-2 flex items-center justify-around"
      >
        <button
          type="button"
          onClick={() => setActiveSection('overview')}
          className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] text-[11px] font-medium ${
            activeSection === 'overview' ? 'text-blue-700' : 'text-slate-500'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Overview</span>
        </button>

        <button
          type="button"
          onClick={() => handleNavClick('request-repair', true)}
          className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] text-[11px] font-medium ${
            activeSection === 'request-repair' ? 'text-blue-700' : 'text-slate-500'
          }`}
        >
          <PlusCircle className="w-5 h-5 mb-0.5" />
          <span>Request</span>
        </button>

        <button
          type="button"
          onClick={() => handleNavClick('registration', true)}
          className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] text-[11px] font-medium ${
            activeSection === 'registration' ? 'text-blue-700' : 'text-slate-500'
          }`}
        >
          <UserCircle2 className="w-5 h-5 mb-0.5" />
          <span>Profile</span>
        </button>

        {isAdmin && (
          <button
            type="button"
            onClick={() => handleNavClick('admin', true)}
            className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] text-[11px] font-medium ${
              activeSection === 'admin' ? 'text-blue-700' : 'text-slate-500'
            }`}
          >
            <ShieldCheck className="w-5 h-5 mb-0.5" />
            <span>Admin</span>
          </button>
        )}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <RepairAppShell />
    </ErrorBoundary>
  );
}
