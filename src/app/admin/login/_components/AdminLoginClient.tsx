'use client';

import { useState } from 'react';
import { useGeolocation, useAdminLogin } from '../_hooks';
import { LocationStatusPanel, LoginForm, HelpModal } from '../_components';

export default function AdminLoginClient() {
  const [showHelpModal, setShowHelpModal] = useState(false);

  const {
    location,
    status: locationStatus,
    error: locationError,
    isEnabled,
    requestLocation,
    formatAccuracy,
    refreshPage,
  } = useGeolocation();

  const { password, setPassword, showPassword, setShowPassword, loading, error, handleSubmit } =
    useAdminLogin(location);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Admin Login</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your admin password to access the dashboard
          </p>
        </div>

        {/* Location Status Indicator */}
        <LocationStatusPanel
          status={locationStatus}
          location={location}
          error={locationError}
          formatAccuracy={formatAccuracy}
          onRetry={() => {
            // Clear error and retry
            requestLocation();
          }}
          onRefresh={refreshPage}
          onShowHelp={() => setShowHelpModal(true)}
        />

        {/* Login Form */}
        <LoginForm
          password={password}
          showPassword={showPassword}
          loading={loading}
          error={error}
          isEnabled={isEnabled}
          onPasswordChange={setPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          onSubmit={handleSubmit}
        />
      </div>

      {/* Help Modal */}
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
    </div>
  );
}
