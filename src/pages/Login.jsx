import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import FormField from '../components/FormField';
import { Shield, Key, Mail, UserCheck, AlertTriangle } from 'lucide-react';

/**
 * Login page using a premium split-screen design.
 * Features inline validation, credentials lock monitoring, and role definitions.
 */
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Fleet Manager');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Custom alerts and input errors
  const [formError, setFormError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validate = () => {
    let isValid = true;
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Invalid email format');
      isValid = false;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 5) {
      setPasswordError('Password must be at least 5 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setFormError('');

    try {
      await login(email, password, role);
      navigate('/dashboard');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-neutral-950 font-sans text-neutral-100 antialiased">
      
      {/* Left Panel: Information & Branding */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-gradient-to-br from-neutral-900 via-neutral-950 to-orange-950/30 p-12 border-r border-neutral-900 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-orange/5 via-transparent to-transparent pointer-events-none"></div>
        
        {/* Header Logo */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-orange text-white font-extrabold text-xl shadow-lg shadow-orange-500/20">T</div>
          <span className="text-xl font-bold tracking-widest text-neutral-100 uppercase">
            Transit<span className="text-brand-orange">Ops</span>
          </span>
        </div>

        {/* Brand Focus Text */}
        <div className="my-auto max-w-lg space-y-6">
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight text-neutral-500">
            Smart Transport <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-amber-500">Operations Platform</span>
          </h1>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Unifying logistics control, asset registry, driver behavior records, and operational finances under a single low-latency dashboard.
          </p>

          {/* List of Roles */}
          <div className="space-y-4 pt-4 border-t border-neutral-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-orange">Workspace Roles</h3>
            <ul className="grid grid-cols-2 gap-4">
              <li className="flex items-start space-x-2 text-xs text-neutral-300">
                <Shield size={14} className="text-brand-orange mt-0.5" />
                <div>
                  <span className="font-semibold text-neutral-200 block">Fleet Manager</span>
                  Full registry & profiles
                </div>
              </li>
              <li className="flex items-start space-x-2 text-xs text-neutral-300">
                <UserCheck size={14} className="text-brand-orange mt-0.5" />
                <div>
                  <span className="font-semibold text-neutral-200 block">Dispatcher</span>
                  Trips planning & board
                </div>
              </li>
              <li className="flex items-start space-x-2 text-xs text-neutral-300">
                <Key size={14} className="text-brand-orange mt-0.5" />
                <div>
                  <span className="font-semibold text-neutral-200 block">Safety Officer</span>
                  Driver logs & scoring
                </div>
              </li>
              <li className="flex items-start space-x-2 text-xs text-neutral-300">
                <AlertTriangle size={14} className="text-brand-orange mt-0.5" />
                <div>
                  <span className="font-semibold text-neutral-200 block">Financial Analyst</span>
                  Fuel & business margins
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-neutral-600 text-2xs">
          © {new Date().getFullYear()} TransitOps Inc. All rights reserved. Version 1.0.0
        </div>
      </div>

      {/* Right Panel: Form Area */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative bg-neutral-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-amber-950/10 via-transparent to-transparent pointer-events-none"></div>

        <div className="w-full max-w-md space-y-8 relative z-10">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-100">Sign In</h2>
            <p className="text-sm text-neutral-400">Access your operations terminal</p>
          </div>

          {/* Locked Out and Credentials Alert Banner */}
          {formError && (
            <div className="flex items-start space-x-3 rounded-lg bg-red-950/50 p-4 text-xs font-semibold text-red-400 border border-red-800/40 animate-fade-in">
              <AlertTriangle className="flex-shrink-0 mt-0.5" size={16} />
              <div className="space-y-1">
                <p className="font-bold">Access Denied</p>
                <p className="text-red-300/80 font-normal">{formError}</p>
                {formError.includes("locked") && (
                  <p className="text-2xs text-red-400/60 font-medium">Locked for safety. Contact sysadmin or try in 5m.</p>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <FormField label="Email Address" error={emailError} required>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@transitops.com"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 py-2.5 pl-10 pr-4 text-sm text-neutral-200 placeholder-neutral-600 focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange transition-colors"
                />
              </div>
            </FormField>

            <FormField label="Access Password" error={passwordError} required>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                  <Key size={16} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 py-2.5 pl-10 pr-4 text-sm text-neutral-200 placeholder-neutral-600 focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange transition-colors"
                />
              </div>
            </FormField>

            <FormField label="Assign Role (RBAC Scope)" required>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                  <UserCheck size={16} />
                </span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 py-2.5 pl-10 pr-4 text-sm text-neutral-200 focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange transition-colors appearance-none cursor-pointer"
                >
                  <option value="Fleet Manager">Fleet Manager</option>
                  <option value="Dispatcher">Dispatcher</option>
                  <option value="Safety Officer">Safety Officer</option>
                  <option value="Financial Analyst">Financial Analyst</option>
                </select>
                {/* Custom arrow down */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-neutral-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </FormField>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 text-xs text-neutral-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-800 bg-neutral-900 text-brand-orange focus:ring-brand-orange focus:ring-offset-neutral-950"
                />
                <span>Remember this workstation</span>
              </label>
              
              <span className="text-2xs text-neutral-500 font-medium">Auto-mock validation: pass &ge; 5 chars</span>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-orange py-2.5 text-sm font-bold text-white hover:bg-brand-orange-hover focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 focus:ring-offset-neutral-950 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/10 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Access Terminal</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
