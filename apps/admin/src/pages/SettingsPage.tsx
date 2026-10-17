import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/api/settings';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatDateTime } from '@/utils/format';
import {
  Settings,
  Flag,
  AlertOctagon,
  Edit,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import type { SystemSettingModel } from '@shashka/shared-types';

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, canPerformAction } = useAuthStore();

  const [editingSetting, setEditingSetting] = useState<SystemSettingModel | null>(null);
  const [settingValue, setSettingValue] = useState('');
  const [settingDesc, setSettingDesc] = useState('');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: settingsApi.getSettings,
  });

  const toggleFlagMutation = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      settingsApi.toggleFeatureFlag({ key, enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] }),
  });

  const updateSettingMutation = useMutation({
    mutationFn: () => {
      if (!editingSetting) throw new Error('Sozlama tanlanmagan');
      return settingsApi.updateSetting({
        key: editingSetting.key,
        value: settingValue,
        description: settingDesc,
      });
    },
    onSuccess: () => {
      setEditingSetting(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
    },
  });

  const maintenanceMutation = useMutation({
    mutationFn: (enabled: boolean) => settingsApi.toggleMaintenanceMode(enabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] }),
  });

  if (isLoading) {
    return <LoadingSpinner text="Tizim sozlamalari yuklanmoqda..." />;
  }

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">Tizim va Server Sozlamalari</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Oʻyin parametrlari, iqtisodiy chegaralar va feature flaglarni boshqarish
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          isLoading={isFetching}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />}
        >
          Yangilash
        </Button>
      </div>

      {/* Maintenance Mode Emergency Alert */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          data?.isMaintenanceMode
            ? 'bg-rose-950/40 border-rose-800'
            : 'bg-zinc-900/90 border-zinc-800'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`p-3 rounded-xl border ${
                data?.isMaintenanceMode
                  ? 'bg-rose-900/50 border-rose-700 text-rose-300'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400'
              }`}
            >
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-100">
                  Profilaktika rejimi (Maintenance Mode)
                </h3>
                <Badge variant={data?.isMaintenanceMode ? 'danger' : 'success'} dot>
                  {data?.isMaintenanceMode ? 'Faollashtirilgan' : 'Oʻchirilgan'}
                </Badge>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
                Ushbu rejim yoqilganda oddiy oʻyinchilar tizimga kira olmaydi va partiyalar
                toʻxtatiladi. Faqat adminlar kirishi mumkin boʻladi.
              </p>
            </div>
          </div>

          {isSuperAdmin && (
            <Button
              variant={data?.isMaintenanceMode ? 'success' : 'danger'}
              size="sm"
              onClick={() => maintenanceMutation.mutate(!data?.isMaintenanceMode)}
              isLoading={maintenanceMutation.isPending}
            >
              {data?.isMaintenanceMode ? 'Rejimni oʻchirish' : 'Profilaktikani yoqish'}
            </Button>
          )}
        </div>
      </div>

      {/* Feature Flags Section */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-4">
          <Flag className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-base text-zinc-100">
            Funksional bayroqlar (Feature Flags)
          </h3>
        </div>

        <div className="divide-y divide-zinc-800">
          {data?.featureFlags.map((flag) => (
            <div
              key={flag.id}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-2 last:pb-2"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-zinc-200">{flag.key}</span>
                  <Badge variant={flag.enabled ? 'success' : 'default'} size="sm">
                    {flag.enabled ? 'Yoqilgan' : 'Oʻchirilgan'}
                  </Badge>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">{flag.description}</p>
                <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
                  Soʻnggi oʻzgarish: {formatDateTime(flag.updatedAt)} ({flag.updatedBy})
                </span>
              </div>

              {canPerformAction('manage_settings') && (
                <Button
                  variant={flag.enabled ? 'outline' : 'primary'}
                  size="xs"
                  onClick={() =>
                    toggleFlagMutation.mutate({ key: flag.key, enabled: !flag.enabled })
                  }
                  isLoading={toggleFlagMutation.isPending}
                >
                  {flag.enabled ? 'Oʻchirish' : 'Yoqish'}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* System Settings Key-Value Editor */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-4">
          <Settings className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-base text-zinc-100">Tizim konfiguratsiyasi (Key-Value)</h3>
        </div>

        <div className="divide-y divide-zinc-800">
          {data?.settings.map((setting) => (
            <div
              key={setting.id}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-2 last:pb-2"
            >
              <div>
                <span className="font-mono text-xs font-bold text-amber-400">{setting.key}</span>
                <p className="text-xs text-zinc-400 mt-0.5">{setting.description}</p>
                <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
                  Oxirgi tahrir: {formatDateTime(setting.updatedAt)} ({setting.updatedBy})
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-sm text-zinc-100 font-bold">
                  {setting.value}
                </span>

                {isSuperAdmin && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      setEditingSetting(setting);
                      setSettingValue(setting.value);
                      setSettingDesc(setting.description);
                    }}
                  >
                    <Edit className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-100" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Setting Modal */}
      <Modal
        isOpen={!!editingSetting}
        onClose={() => setEditingSetting(null)}
        title={`Parametrni tahrirlash: ${editingSetting?.key}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditingSetting(null)}>
              Bekor qilish
            </Button>
            <Button
              variant="primary"
              onClick={() => updateSettingMutation.mutate()}
              isLoading={updateSettingMutation.isPending}
            >
              Saqlash
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Qiymat (Value)"
            value={settingValue}
            onChange={(e) => setSettingValue(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300">Tavsif</label>
            <textarea
              value={settingDesc}
              onChange={(e) => setSettingDesc(e.target.value)}
              rows={3}
              className="w-full bg-zinc-950 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-800 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
