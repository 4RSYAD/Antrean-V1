import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { DashboardAdminView } from './components/DashboardAdminView.tsx';
import { AdminQueuesView } from './components/AdminQueuesView.tsx';
import { AdminPitView } from './components/AdminPitView.tsx';
import { AdminPitManageView } from './components/AdminPitManageView.tsx';
import { AdminServicesView } from './components/AdminServicesView.tsx';
import { AdminReportsView } from './components/AdminReportsView.tsx';
import { AdminSettingsView } from './components/AdminSettingsView.tsx';
import { CustomerCheckView } from './components/CustomerCheckView.tsx';
import { CustomerRegisterView } from './components/CustomerRegisterView.tsx';
import { TVDisplayView } from './components/TVDisplayView.tsx';
import { PaymentModal } from './components/PaymentModal.tsx';
import { ReceiptModal } from './components/ReceiptModal.tsx';
import { ConfirmModal } from './components/ConfirmModal.tsx';
import { CashierAddModal } from './components/CashierAddModal.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import { Toast } from './components/Toast.tsx';

import {
  QueueItem,
  ServiceItem,
  PitItem,
  StoreSettings,
  UserRole,
  AdminView,
  CustomerView,
  ToastNotification,
  ConfirmModalData,
  MotorType,
  QueueStatus,
  AuthUser
} from './types.ts';

import {
  INITIAL_QUEUES,
  INITIAL_SERVICES,
  INITIAL_PITS,
  INITIAL_SETTINGS,
  STORAGE_KEYS,
  loadStoredData,
  saveStoredData
} from './utils/storage.ts';

import { announceQueueVoice, playAirportChime, setAudioMuted } from './utils/audio.ts';
import {
  getSupabaseClient,
  testSupabaseConnection,
  syncQueuesFromSupabase,
  syncServicesFromSupabase,
  syncPitsFromSupabase,
  syncSettingsFromSupabase,
  upsertQueueToSupabase,
  deleteQueueFromSupabase,
  upsertServiceToSupabase,
  deleteServiceFromSupabase,
  upsertPitToSupabase,
  deletePitFromSupabase,
  upsertSettingsToSupabase
} from './utils/supabase.ts';

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return loadStoredData<boolean>(STORAGE_KEYS.THEME, true);
  });

  // Sound Mute State
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return loadStoredData<boolean>(STORAGE_KEYS.MUTED, false);
  });

  // Layout states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Authentication State
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    return loadStoredData<AuthUser | null>(STORAGE_KEYS.AUTH_USER, null);
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Role and Navigation (Default to Customer if not logged in, or Admin if session exists)
  const [role, setRole] = useState<UserRole>(() => {
    const savedUser = loadStoredData<AuthUser | null>(STORAGE_KEYS.AUTH_USER, null);
    return savedUser?.is_logged_in ? 'admin' : 'pelanggan';
  });

  const [currentView, setCurrentView] = useState<AdminView | CustomerView>(() => {
    const savedUser = loadStoredData<AuthUser | null>(STORAGE_KEYS.AUTH_USER, null);
    return savedUser?.is_logged_in ? 'dashboard' : 'check';
  });

  const [searchQuery, setSearchQuery] = useState('');

  // Primary Data State
  const [queues, setQueues] = useState<QueueItem[]>(() => {
    return loadStoredData<QueueItem[]>(STORAGE_KEYS.QUEUES, INITIAL_QUEUES);
  });

  const [services, setServices] = useState<ServiceItem[]>(() => {
    return loadStoredData<ServiceItem[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
  });

  const [pits, setPits] = useState<PitItem[]>(() => {
    return loadStoredData<PitItem[]>(STORAGE_KEYS.PITS, INITIAL_PITS);
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    return loadStoredData<StoreSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  });

  // Supabase Connection State
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);

  // UI Modals & Feedback
  const [receiptData, setReceiptData] = useState<QueueItem | null>(null);
  const [paymentQueueData, setPaymentQueueData] = useState<QueueItem | null>(null);
  const [isCashierAddOpen, setIsCashierAddOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalData>({
    isOpen: false,
    title: '',
    message: '',
    action: null
  });
  const [toast, setToast] = useState<ToastNotification | null>(null);

  // Toast Helper
  const showToast = useCallback((msg: string, type: 'success' | 'warning' | 'info' | 'error' = 'info') => {
    const id = Date.now().toString();
    setToast({ id, msg, type });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 4000);
  }, []);

  // Synchronize Dark mode class with documentElement
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    saveStoredData(STORAGE_KEYS.THEME, isDarkMode);
  }, [isDarkMode]);

  // Synchronize Sound Mute State
  useEffect(() => {
    setAudioMuted(isMuted);
    saveStoredData(STORAGE_KEYS.MUTED, isMuted);
  }, [isMuted]);

  // Synchronize Auth User State
  useEffect(() => {
    saveStoredData(STORAGE_KEYS.AUTH_USER, authUser);
  }, [authUser]);

  // Persist queues, services, pits, settings locally
  useEffect(() => {
    saveStoredData(STORAGE_KEYS.QUEUES, queues);
  }, [queues]);

  useEffect(() => {
    saveStoredData(STORAGE_KEYS.SERVICES, services);
  }, [services]);

  useEffect(() => {
    saveStoredData(STORAGE_KEYS.PITS, pits);
  }, [pits]);

  useEffect(() => {
    saveStoredData(STORAGE_KEYS.SETTINGS, settings);
  }, [settings]);

  // Supabase Initial Connect & Real-time Subscription Setup
  useEffect(() => {
    let activeChannel: any = null;

    const setupSupabase = async () => {
      const conn = await testSupabaseConnection();
      if (!conn.success) {
        setIsSupabaseConnected(false);
        return;
      }

      setIsSupabaseConnected(true);

      // 1. Initial Pull to refresh state
      try {
        const [remoteQueues, remoteServices, remotePits, remoteSettings] = await Promise.all([
          syncQueuesFromSupabase(),
          syncServicesFromSupabase(),
          syncPitsFromSupabase(),
          syncSettingsFromSupabase()
        ]);

        if (remoteQueues && remoteQueues.length > 0) setQueues(remoteQueues);
        if (remoteServices && remoteServices.length > 0) setServices(remoteServices);
        if (remotePits && remotePits.length > 0) setPits(remotePits);
        if (remoteSettings) setSettings(remoteSettings);
      } catch (err) {
        console.warn('Error fetching initial Supabase data', err);
      }

      // 2. Realtime Subscription Channel
      const supabase = getSupabaseClient();
      if (supabase) {
        activeChannel = supabase
          .channel('antrean_postgres_changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'queues' },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                setQueues((prev) => {
                  if (prev.some((q) => q.id === payload.new.id)) return prev;
                  return [payload.new as QueueItem, ...prev];
                });
              } else if (payload.eventType === 'UPDATE') {
                setQueues((prev) =>
                  prev.map((q) => (q.id === payload.new.id ? (payload.new as QueueItem) : q))
                );
              } else if (payload.eventType === 'DELETE') {
                setQueues((prev) => prev.filter((q) => q.id !== payload.old.id));
              }
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'services' },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                setServices((prev) => {
                  if (prev.some((s) => s.id === payload.new.id)) return prev;
                  return [...prev, payload.new as ServiceItem];
                });
              } else if (payload.eventType === 'UPDATE') {
                setServices((prev) =>
                  prev.map((s) => (s.id === payload.new.id ? (payload.new as ServiceItem) : s))
                );
              } else if (payload.eventType === 'DELETE') {
                setServices((prev) => prev.filter((s) => s.id !== payload.old.id));
              }
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'pits' },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                setPits((prev) => {
                  if (prev.some((p) => p.id === payload.new.id)) return prev;
                  return [...prev, payload.new as PitItem];
                });
              } else if (payload.eventType === 'UPDATE') {
                setPits((prev) =>
                  prev.map((p) => (p.id === payload.new.id ? (payload.new as PitItem) : p))
                );
              } else if (payload.eventType === 'DELETE') {
                setPits((prev) => prev.filter((p) => p.id !== payload.old.id));
              }
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'store_settings' },
            (payload) => {
              if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                setSettings((prev) => ({
                  ...prev,
                  nama_usaha: payload.new.nama_usaha || prev.nama_usaha,
                  tagline: payload.new.tagline ?? prev.tagline,
                  alamat: payload.new.alamat ?? prev.alamat,
                  telepon: payload.new.telepon ?? prev.telepon,
                  footer_struk: payload.new.footer_struk ?? prev.footer_struk,
                  auto_voice: payload.new.auto_voice ?? prev.auto_voice
                }));
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setIsSupabaseConnected(true);
            }
          });
      }
    };

    setupSupabase();

    return () => {
      if (activeChannel) {
        const client = getSupabaseClient();
        client?.removeChannel(activeChannel);
      }
    };
  }, []);

  // Handle Login & Logout
  const handleLoginSuccess = (user: AuthUser) => {
    setAuthUser(user);
    setRole('admin');
    setCurrentView('dashboard');
    showToast(`Selamat datang kembali, ${user.name}!`, 'success');
  };

  const handleLogout = () => {
    setAuthUser(null);
    setRole('pelanggan');
    setCurrentView('check');
    showToast('Anda telah keluar dari mode Admin/Kasir.', 'info');
  };

  // Add Queue
  const handleAddQueue = (data: {
    nama_pemohon: string;
    tipe_motor?: MotorType;
    layanan_id: string;
    pit_id?: string | null;
  }) => {
    const nextNumber = queues.length + 1;
    const nomor_antrian = `A${nextNumber.toString().padStart(3, '0')}`;
    const tipe_motor: MotorType = data.tipe_motor || 'kecil';
    const srv = services.find((s) => s.id === data.layanan_id);
    const total_biaya = srv
      ? tipe_motor === 'mobil'
        ? srv.harga_mobil || srv.harga_besar || srv.harga || 0
        : tipe_motor === 'besar'
        ? srv.harga_besar || srv.harga || 0
        : srv.harga_kecil || srv.harga || 0
      : 0;

    const newEntry: QueueItem = {
      id: `q-${Date.now()}`,
      nomor_antrian,
      nama_pemohon: data.nama_pemohon,
      tipe_motor,
      total_biaya,
      layanan_id: data.layanan_id,
      status: data.pit_id ? 'washing' : 'waiting',
      pit_id: data.pit_id || null,
      is_paid: false,
      created_at: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    setQueues((prev) => [newEntry, ...prev]);

    // Push to Supabase Real-time
    upsertQueueToSupabase(newEntry);

    showToast(`Antrean ${nomor_antrian} (${data.nama_pemohon}) berhasil didaftarkan!`, 'success');

    // Announce new ticket registration voice
    if (settings.auto_voice) {
      announceQueueVoice(
        `Nomor antrean baru ${nomor_antrian}, atas nama ${data.nama_pemohon}. Silakan menunggu panggilan di ruang tunggu.`,
        'new_ticket'
      );
    }

    // Auto open receipt preview
    setReceiptData(newEntry);

    if (role === 'pelanggan') {
      setCurrentView('check');
    }
  };

  // Delete Queue
  const handleDeleteQueue = (id: string) => {
    const item = queues.find((q) => q.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Nomor Antrean?',
      message: `Apakah Anda yakin ingin menghapus tiket ${item?.nomor_antrian} (${item?.nama_pemohon}) dari sistem? Tindakan ini tidak dapat dibatalkan.`,
      action: () => {
        setQueues((prev) => prev.filter((q) => q.id !== id));
        deleteQueueFromSupabase(id);
        setConfirmModal({ isOpen: false, title: '', message: '', action: null });
        showToast(`Antrean ${item?.nomor_antrian} telah dihapus.`, 'warning');
      }
    });
  };

  // Update Status & Voice Announcement
  const handleUpdateStatus = (id: string, newStatus: QueueStatus, pitId?: string | null) => {
    let updatedQueue: QueueItem | null = null;

    setQueues((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          const completed_at =
            newStatus === 'done'
              ? new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
              : q.completed_at;
          const updated: QueueItem = {
            ...q,
            status: newStatus,
            pit_id: pitId !== undefined ? pitId : q.pit_id,
            completed_at
          };
          updatedQueue = updated;
          return updated;
        }
        return q;
      })
    );

    if (updatedQueue) {
      upsertQueueToSupabase(updatedQueue);
    }

    const target = queues.find((q) => q.id === id);
    if (target) {
      const vehicleWord = target.tipe_motor === 'mobil' ? 'mobil' : target.tipe_motor === 'besar' ? 'motor besar' : 'motor';
      if (newStatus === 'washing') {
        const assignedPitId = pitId !== undefined ? pitId : target.pit_id;
        const pitObj = pits.find((p) => p.id === assignedPitId);
        const pitName = pitObj ? pitObj.nama_pit : 'Area Pit Cuci';
        const speech = `Perhatian. Panggilan untuk nomor antrean ${target.nomor_antrian}, atas nama ${target.nama_pemohon}, silakan membawa ${vehicleWord} Anda menuju ke ${pitName}.`;
        if (settings.auto_voice) announceQueueVoice(speech, 'call_pit');
        showToast(`Memanggil ${target.nomor_antrian} ke ${pitName}`, 'info');
      } else if (newStatus === 'waiting_payment') {
        const speech = `Pengumuman selesai cuci: Nomor antrean ${target.nomor_antrian}, atas nama ${target.nama_pemohon}, ${vehicleWord} Anda telah selesai dicuci. Silakan menuju kasir untuk proses pembayaran.`;
        if (settings.auto_voice) announceQueueVoice(speech, 'wash_done');
        showToast(`Status ${target.nomor_antrian}: Selesai Cuci (Menunggu Pembayaran)`, 'info');
      } else if (newStatus === 'done') {
        showToast(`Antrean ${target.nomor_antrian} (${target.nama_pemohon}) status: Selesai!`, 'success');
      }
    }
  };

  // Payment Confirmation Handler (Direct to Receipt)
  const handleConfirmPayment = (queueId: string) => {
    const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    let updatedItem: QueueItem | null = null;

    setQueues((prev) =>
      prev.map((q) => {
        if (q.id === queueId) {
          const updated: QueueItem = {
            ...q,
            is_paid: true,
            status: 'done',
            paid_at: timeNow,
            completed_at: q.completed_at || timeNow,
            cashier_name: authUser?.name || 'Kasir Utama'
          };
          updatedItem = updated;
          return updated;
        }
        return q;
      })
    );

    if (updatedItem) {
      upsertQueueToSupabase(updatedItem);
    }

    setPaymentQueueData(null);

    // Prompt receipt print directly
    if (updatedItem) {
      setReceiptData(updatedItem);
    } else {
      const fallback = queues.find((q) => q.id === queueId);
      if (fallback) {
        const fbUpdated: QueueItem = {
          ...fallback,
          is_paid: true,
          status: 'done',
          paid_at: timeNow,
          cashier_name: authUser?.name || 'Kasir Utama'
        };
        upsertQueueToSupabase(fbUpdated);
        setReceiptData(fbUpdated);
      }
    }

    const target = queues.find((q) => q.id === queueId);
    if (target && settings.auto_voice) {
      const vehicleWord = target.tipe_motor === 'mobil' ? 'mobil' : target.tipe_motor === 'besar' ? 'motor besar' : 'motor';
      announceQueueVoice(
        `Terima kasih. Nomor antrean ${target.nomor_antrian}, atas nama ${target.nama_pemohon}, pembayaran lunas dan ${vehicleWord} Anda siap diambil. Selamat jalan.`,
        'paid_pickup'
      );
    } else {
      playAirportChime();
    }

    showToast(`Pembayaran antrean kasir berhasil diselesaikan! Struk siap dicetak.`, 'success');
  };

  // Operator Pit calls next waiting queue
  const handleCallNext = (pitId: string) => {
    const nextInQueue = queues.find((q) => q.status === 'waiting');
    if (!nextInQueue) {
      showToast('Tidak ada antrean yang sedang menunggu saat ini.', 'warning');
      return;
    }
    handleUpdateStatus(nextInQueue.id, 'washing', pitId);
  };

  // Pit CRUD Handlers
  const handleAddPit = (newPit: Omit<PitItem, 'id'>) => {
    const newId = `pit-${Date.now()}`;
    const entry: PitItem = {
      id: newId,
      ...newPit
    };
    setPits((prev) => [...prev, entry]);
    upsertPitToSupabase(entry);
  };

  const handleUpdatePit = (id: string, updated: Partial<PitItem>) => {
    setPits((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updatedPit = { ...p, ...updated };
          upsertPitToSupabase(updatedPit);
          return updatedPit;
        }
        return p;
      })
    );
  };

  const handleDeletePit = (id: string) => {
    setPits((prev) => prev.filter((p) => p.id !== id));
    deletePitFromSupabase(id);
  };

  const waitingCount = queues.filter((q) => q.status === 'waiting').length;
  const waitingPaymentCount = queues.filter((q) => q.status === 'waiting_payment').length;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-[#08090E] text-slate-800 dark:text-slate-100">
      {/* Navigation Sidebar */}
      <Sidebar
        role={role}
        setRole={setRole}
        currentView={currentView}
        setCurrentView={setCurrentView}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        mobileDrawerOpen={mobileDrawerOpen}
        setMobileDrawerOpen={setMobileDrawerOpen}
        waitingCount={waitingCount}
        waitingPaymentCount={waitingPaymentCount}
        authUser={authUser}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        isSupabaseConnected={isSupabaseConnected}
      />

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Header Bar */}
        <Header
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
          isMuted={isMuted}
          onToggleMute={() => {
            const nextMuted = !isMuted;
            setIsMuted(nextMuted);
            setAudioMuted(nextMuted);
            showToast(
              nextMuted ? 'Suara speaker dibisukan (Muted).' : 'Suara speaker diaktifkan.',
              nextMuted ? 'warning' : 'info'
            );
          }}
          role={role}
          authUser={authUser}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
          isSupabaseConnected={isSupabaseConnected}
          onOpenSettings={() => {
            if (role !== 'admin' || !authUser?.is_logged_in) {
              setIsLoginModalOpen(true);
            } else {
              setCurrentView('settings');
            }
          }}
        />

        {/* View Routing */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
          {/* Admin: Dashboard Overview */}
          {role === 'admin' && currentView === 'dashboard' && (
            <DashboardAdminView
              queues={queues}
              services={services}
              pits={pits}
              onDeleteQueue={handleDeleteQueue}
              onUpdateStatus={handleUpdateStatus}
              onOpenPaymentModal={(item) => setPaymentQueueData(item)}
              onPrintReceipt={(item) => setReceiptData(item)}
              searchQuery={searchQuery}
              setCurrentView={setCurrentView as (view: AdminView) => void}
              onOpenQuickAddModal={() => setIsCashierAddOpen(true)}
            />
          )}

          {/* Admin: Dedicated Queue & Cashier Menu */}
          {role === 'admin' && currentView === 'queues' && (
            <AdminQueuesView
              queues={queues}
              services={services}
              pits={pits}
              onUpdateStatus={handleUpdateStatus}
              onDeleteQueue={handleDeleteQueue}
              onOpenPaymentModal={(item) => setPaymentQueueData(item)}
              onPrintReceipt={(item) => setReceiptData(item)}
              onOpenQuickAddModal={() => setIsCashierAddOpen(true)}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          )}

          {/* Admin: Operational Pit Bay Console */}
          {role === 'admin' && currentView === 'pit' && (
            <AdminPitView
              queues={queues}
              services={services}
              pits={pits}
              onCallNext={handleCallNext}
              onUpdateStatus={handleUpdateStatus}
              onDeleteQueue={handleDeleteQueue}
              onPrintReceipt={(item) => setReceiptData(item)}
            />
          )}

          {/* Admin: Master Pit CRUD Management */}
          {role === 'admin' && currentView === 'pit_manage' && (
            <AdminPitManageView
              pits={pits}
              queues={queues}
              services={services}
              onAddPit={handleAddPit}
              onUpdatePit={handleUpdatePit}
              onDeletePit={handleDeletePit}
              showToast={showToast}
            />
          )}

          {/* Admin: Services and Pricing CRUD */}
          {role === 'admin' && currentView === 'services' && (
            <AdminServicesView
              services={services}
              setServices={(newServices) => {
                setServices(newServices);
                if (typeof newServices === 'function') {
                  const resolved = newServices(services);
                  resolved.forEach((s) => upsertServiceToSupabase(s));
                } else {
                  newServices.forEach((s) => upsertServiceToSupabase(s));
                }
              }}
              showToast={showToast}
            />
          )}

          {/* Admin: Financial Reports & Transactions */}
          {role === 'admin' && currentView === 'reports' && (
            <AdminReportsView
              queues={queues}
              services={services}
              pits={pits}
            />
          )}

          {/* Admin: Business Profile, Receipt Settings & Supabase Configuration */}
          {role === 'admin' && currentView === 'settings' && (
            <AdminSettingsView
              settings={settings}
              setSettings={setSettings}
              queues={queues}
              setQueues={setQueues}
              services={services}
              setServices={setServices}
              pits={pits}
              setPits={setPits}
              showToast={showToast}
              isSupabaseConnected={isSupabaseConnected}
              setIsSupabaseConnected={setIsSupabaseConnected}
            />
          )}

          {/* Customer: Check Status */}
          {role === 'pelanggan' && currentView === 'check' && (
            <CustomerCheckView
              queues={queues}
              services={services}
              pits={pits}
              setCurrentView={setCurrentView as (view: CustomerView) => void}
              onPrintReceipt={(item) => setReceiptData(item)}
            />
          )}

          {/* Customer: Self Register */}
          {role === 'pelanggan' && currentView === 'register' && (
            <CustomerRegisterView
              services={services}
              onAddQueue={handleAddQueue}
            />
          )}

          {/* TV Display Board for Waiting Room */}
          {currentView === 'tv' && (
            <TVDisplayView
              queues={queues}
              pits={pits}
              services={services}
            />
          )}
        </div>
      </main>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Cashier Quick Add Modal */}
      <CashierAddModal
        isOpen={isCashierAddOpen}
        onClose={() => setIsCashierAddOpen(false)}
        services={services}
        pits={pits}
        onAddQueue={handleAddQueue}
      />

      {/* Payment Processing Modal */}
      <PaymentModal
        queue={paymentQueueData}
        services={services}
        isOpen={!!paymentQueueData}
        onClose={() => setPaymentQueueData(null)}
        onConfirmPayment={handleConfirmPayment}
      />

      {/* Thermal Receipt Print Modal */}
      <ReceiptModal
        data={receiptData}
        services={services}
        pits={pits}
        settings={settings}
        onClose={() => setReceiptData(null)}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        data={confirmModal}
        onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', action: null })}
      />

      {/* Toast Alert */}
      <Toast toast={toast} />
    </div>
  );
}
