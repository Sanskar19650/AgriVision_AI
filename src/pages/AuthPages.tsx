import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
} from '../firebase';
import { useAgri } from '../context/AgriContext';

export function LoginPage() {
  const { enterDemoMode } = useAgri();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setBusy(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Google sign-in popup was closed or blocked.');
    } finally {
      setBusy(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setStatusMsg('');
    if (!email.includes('@') || password.length < 6) {
      setErrorMsg('Enter a valid email address and password (min 6 characters).');
      return;
    }
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate('/dashboard');
    } catch (err: any) {
      if (err?.code === 'auth/operation-not-allowed') {
        setErrorMsg(
          'Email/Password sign-in is not yet enabled in Firebase Console (Authentication → Sign-in method → Email/Password). Use Google Sign-In or Demo Workspace below.'
        );
      } else {
        setErrorMsg(err?.message || 'Invalid login credentials.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setStatusMsg('');
    if (!email.includes('@')) {
      setErrorMsg('Enter your registered email address to send a reset link.');
      return;
    }
    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setStatusMsg('Password reset link sent to your email.');
      setResetMode(false);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not send password reset email.');
    } finally {
      setBusy(false);
    }
  };

  const handleDemoEnter = () => {
    enterDemoMode();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F5F7F5] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#E0E0E0] rounded-xl p-6 sm:p-8 space-y-5">
        <div>
          <Link to="/" className="font-display font-bold text-lg text-[#2E7D32]">
            AgriVision AI
          </Link>
          <h1 className="font-display font-bold text-2xl text-[#263238] mt-2">
            {resetMode ? 'Reset Farmer Password' : 'Farmer Sign In'}
          </h1>
          <p className="text-xs text-[#546E7A] mt-1">
            Access your private farm boundaries, soil sensors, and verified agricultural reports.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-[#FFEBEE] border border-[#EF9A9A] text-xs text-[#B71C1C]">
            {errorMsg}
          </div>
        )}
        {statusMsg && (
          <div className="p-3 rounded-lg bg-[#E8F5E9] border border-[#66BB6A] text-xs text-[#2E7D32]">
            {statusMsg}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={busy}
          className="w-full py-2.5 px-4 border border-[#E0E0E0] rounded-lg text-sm font-semibold text-[#263238] bg-white hover:bg-[#F5F7F5] transition-colors"
        >
          Continue with Google
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#E0E0E0] w-full" />
          <span className="bg-white px-3 text-xs text-[#546E7A] whitespace-nowrap">or email login</span>
          <div className="border-t border-[#E0E0E0] w-full" />
        </div>

        {resetMode ? (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="block text-xs font-medium text-[#263238] mb-1">
                Registered Email
              </label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
                placeholder="farmer@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 px-4 bg-[#2E7D32] text-white text-sm font-semibold rounded-lg hover:bg-[#246628]"
            >
              Send Reset Email
            </button>
            <button
              type="button"
              onClick={() => setResetMode(false)}
              className="w-full text-xs text-[#546E7A] hover:underline"
            >
              Back to Sign In
            </button>
          </form>
        ) : (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-medium text-[#263238] mb-1">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
                placeholder="farmer@example.com"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-xs font-medium text-[#263238] mb-1">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
                placeholder="••••••••"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setResetMode(true)}
                className="text-xs text-[#2E7D32] hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 px-4 bg-[#2E7D32] text-white text-sm font-semibold rounded-lg hover:bg-[#246628]"
            >
              Sign In
            </button>
          </form>
        )}

        <div className="pt-3 border-t border-[#E0E0E0] space-y-2.5">
          <button
            type="button"
            onClick={handleDemoEnter}
            className="w-full py-2.5 px-4 bg-[#E8F5E9] text-[#2E7D32] text-sm font-semibold rounded-lg hover:bg-[#C8E6C9] transition-colors"
          >
            Enter Demo Farmer Workspace
          </button>
          <p className="text-center text-xs text-[#546E7A]">
            New farmer?{' '}
            <Link to="/register" className="text-[#2E7D32] font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { enterDemoMode } = useAgri();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    state: 'Maharashtra',
    district: 'Pune',
    taluka: 'Baramati',
    village: '',
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!form.fullName.trim() || !form.email.includes('@')) {
      setErrorMsg('Please enter your full name and valid email address.');
      return;
    }
    if (form.password.length < 6 || form.password !== form.confirmPassword) {
      setErrorMsg('Passwords must match and be at least 6 characters.');
      return;
    }

    setBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);
      await sendEmailVerification(cred.user);
      // Note: Firestore rules enforce email_verified == true on profile creation;
      // profile creation completes automatically on verified sign-in via AgriContext.
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        role: 'farmer',
        state: form.state.trim(),
        district: form.district.trim(),
        taluka: form.taluka.trim(),
        village: form.village.trim(),
        address: `${form.village}, Tal. ${form.taluka}, Dist. ${form.district}, ${form.state}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).catch(() => {
        // Pending email verification before Firestore write is permitted
      });
      navigate('/dashboard');
    } catch (err: any) {
      if (err?.code === 'auth/operation-not-allowed') {
        setErrorMsg(
          'Email/Password registration must be enabled in Firebase Console (Authentication → Sign-in method → Email/Password). Use Google Sign-In on the Login page or enter Demo Workspace.'
        );
      } else {
        setErrorMsg(err?.message || 'Registration failed.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7F5] flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-lg bg-white border border-[#E0E0E0] rounded-xl p-6 sm:p-8 space-y-5">
        <div>
          <Link to="/" className="font-display font-bold text-lg text-[#2E7D32]">
            AgriVision AI
          </Link>
          <h1 className="font-display font-bold text-2xl text-[#263238] mt-2">
            Farmer Registration
          </h1>
          <p className="text-xs text-[#546E7A] mt-1">
            Register your farmer profile with Maharashtra village, taluka, and district details.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-[#FFEBEE] border border-[#EF9A9A] text-xs text-[#B71C1C]">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="reg-name" className="block text-xs font-medium text-[#263238] mb-1">
              Full Name
            </label>
            <input
              id="reg-name"
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
              placeholder="e.g. Rajesh Kulkarni"
            />
          </div>
          <div>
            <label htmlFor="reg-email" className="block text-xs font-medium text-[#263238] mb-1">
              Email Address
            </label>
            <input
              id="reg-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
            />
          </div>
          <div>
            <label htmlFor="reg-mobile" className="block text-xs font-medium text-[#263238] mb-1">
              Mobile Number
            </label>
            <input
              id="reg-mobile"
              type="tel"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
              placeholder="+91 98230 00000"
            />
          </div>
          <div>
            <label htmlFor="reg-state" className="block text-xs font-medium text-[#263238] mb-1">
              State
            </label>
            <input
              id="reg-state"
              type="text"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
            />
          </div>
          <div>
            <label htmlFor="reg-district" className="block text-xs font-medium text-[#263238] mb-1">
              District
            </label>
            <input
              id="reg-district"
              type="text"
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
            />
          </div>
          <div>
            <label htmlFor="reg-taluka" className="block text-xs font-medium text-[#263238] mb-1">
              Taluka
            </label>
            <input
              id="reg-taluka"
              type="text"
              value={form.taluka}
              onChange={(e) => setForm({ ...form, taluka: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
            />
          </div>
          <div>
            <label htmlFor="reg-village" className="block text-xs font-medium text-[#263238] mb-1">
              Village
            </label>
            <input
              id="reg-village"
              type="text"
              value={form.village}
              onChange={(e) => setForm({ ...form, village: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
            />
          </div>
          <div>
            <label htmlFor="reg-pass" className="block text-xs font-medium text-[#263238] mb-1">
              Password
            </label>
            <input
              id="reg-pass"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
            />
          </div>
          <div>
            <label htmlFor="reg-cpass" className="block text-xs font-medium text-[#263238] mb-1">
              Confirm Password
            </label>
            <input
              id="reg-cpass"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
            />
          </div>

          <div className="sm:col-span-2 pt-2 space-y-2.5">
            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 px-4 bg-[#2E7D32] text-white text-sm font-semibold rounded-lg hover:bg-[#246628]"
            >
              Create Farmer Account
            </button>
            <button
              type="button"
              onClick={() => {
                enterDemoMode();
                navigate('/dashboard');
              }}
              className="w-full py-2.5 px-4 bg-[#E8F5E9] text-[#2E7D32] text-sm font-semibold rounded-lg hover:bg-[#C8E6C9]"
            >
              Try Demo Farmer Workspace
            </button>
            <p className="text-center text-xs text-[#546E7A]">
              Already registered?{' '}
              <Link to="/login" className="text-[#2E7D32] font-semibold hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
