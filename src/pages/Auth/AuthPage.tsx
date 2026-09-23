import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { LogoMark } from '@/components/ui/LogoMark';
import { useAuth } from '@/state/AuthContext';
import {
  digitsOnly,
  validateFullName,
  validateNationalId,
  validateOtp,
  validatePhoneLocal,
} from './validation';

type Tab = 'login' | 'signup';
type LoginStep = 'phone' | 'otp';

/** The demo one-time code — there is no SMS provider wired up yet. */
const DEMO_OTP = '1234';

interface Toast {
  text: string;
  isError: boolean;
}

/**
 * The app's front door: sign in or register, then (and only then) the map.
 * Ports the standalone login/register prototype's flow and copy into a
 * controlled React form wired to AuthContext, using the app's shared Button
 * and logo mark so it reads as the same product rather than a bolted-on
 * screen.
 *
 * There is no backend yet — see AuthContext for exactly what's mocked
 * (registration storage, OTP verification) and what a real integration
 * would replace.
 */
export function AuthPage() {
  const auth = useAuth();
  const [tab, setTab] = useState<Tab>('login');
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = useCallback((text: string, isError = false) => {
    setToast({ text, isError });
  }, []);

  return (
    <div dir="rtl" lang="fa" className="flex h-full flex-col bg-brand">
      <header
        className="flex flex-col items-center gap-3.5 px-6 pb-10 text-center text-paper"
        style={{ paddingTop: 'calc(28px + var(--peyk-safe-top))' }}
      >
        <span className="grid h-16 w-16 place-items-center rounded-card bg-paper shadow-float">
          <LogoMark size={38} />
        </span>
        <div>
          <h1 className="text-title">{tab === 'login' ? 'خوش آمدید 👋' : 'ساخت حساب کاربری'}</h1>
          <p className="mt-1.5 text-meta text-paper/90">
            {tab === 'login' ? 'برای ادامه، وارد حساب کاربری خود شوید' : 'اطلاعات خود را برای ثبت‌نام وارد کنید'}
          </p>
        </div>
      </header>

      <div
        className="-mt-6 flex-1 overflow-y-auto rounded-sheet bg-paper px-5 pb-8 pt-5 shadow-sheet"
        style={{ paddingBottom: 'calc(32px + var(--peyk-safe-bottom))' }}
      >
        <div className="flex gap-1 rounded-pill bg-brand/10 p-1">
          <button
            type="button"
            onClick={() => setTab('login')}
            className={[
              'flex-1 rounded-pill py-2.5 text-body font-semibold transition-colors',
              tab === 'login' ? 'bg-brand text-paper shadow-float' : 'text-brand',
            ].join(' ')}
          >
            ورود
          </button>
          <button
            type="button"
            onClick={() => setTab('signup')}
            className={[
              'flex-1 rounded-pill py-2.5 text-body font-semibold transition-colors',
              tab === 'signup' ? 'bg-brand text-paper shadow-float' : 'text-brand',
            ].join(' ')}
          >
            ثبت‌نام
          </button>
        </div>

        <div className="mt-6">
          {tab === 'login' ? (
            <LoginForm onSwitchToSignup={() => setTab('signup')} showToast={showToast} onLoggedIn={auth.login} />
          ) : (
            <SignupForm
              onSwitchToLogin={() => setTab('login')}
              showToast={showToast}
              onRegister={auth.register}
            />
          )}
        </div>

        <p className="mt-6 text-center text-meta text-ash">ورود شما به معنای پذیرش قوانین و حریم خصوصی است</p>
      </div>

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className={[
            'pointer-events-none fixed inset-x-6 z-[999] rounded-card px-4 py-3 text-center text-meta font-semibold text-paper shadow-float',
            toast.isError ? 'bg-brand' : 'bg-ink',
          ].join(' ')}
          style={{ bottom: 'calc(24px + var(--peyk-safe-bottom))' }}
        >
          {toast.text}
        </div>
      ) : null}
    </div>
  );
}

/* --------------------------------------------------------------- shared bits */

/** The +98-prefixed phone field, shared by the login and signup forms. */
function PhoneField({
  value,
  error,
  onChange,
  onBlur,
  autoFocus,
}: {
  value: string;
  error: string | null;
  onChange: (value: string) => void;
  onBlur: () => void;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-meta font-semibold text-ink">شماره تماس</label>
      <div
        dir="ltr"
        className={[
          'flex items-center gap-2 rounded-card border bg-mist px-3 transition-colors focus-within:bg-paper',
          error ? 'border-brand' : 'border-line focus-within:border-brand',
        ].join(' ')}
      >
        <span className="shrink-0 select-none text-body font-bold text-brand">+98</span>
        <span className="h-6 w-px shrink-0 bg-line" aria-hidden="true" />
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          autoFocus={autoFocus}
          placeholder="9123456789"
          maxLength={10}
          value={value}
          onChange={(event) => onChange(digitsOnly(event.target.value, 10))}
          onBlur={onBlur}
          className="min-h-touch flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ash"
          aria-label="شماره تماس، بدون صفر ابتدایی"
        />
      </div>
      {error ? <p className="mt-1 text-meta text-brand">{error}</p> : null}
    </div>
  );
}

function TextField({
  label,
  value,
  error,
  onChange,
  onBlur,
  placeholder,
  dir = 'rtl',
  autoComplete,
  inputMode,
  maxLength,
  autoFocus,
}: {
  label: string;
  value: string;
  error: string | null;
  onChange: (value: string) => void;
  onBlur: () => void;
  placeholder?: string;
  dir?: 'rtl' | 'ltr';
  autoComplete?: string;
  inputMode?: 'text' | 'numeric';
  maxLength?: number;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-meta font-semibold text-ink">{label}</label>
      <input
        type="text"
        dir={dir}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        autoFocus={autoFocus}
        className={[
          'min-h-touch w-full rounded-card border bg-mist px-4 text-body text-ink outline-none transition-colors placeholder:text-ash focus:bg-paper',
          error ? 'border-brand' : 'border-line focus:border-brand',
        ].join(' ')}
      />
      {error ? <p className="mt-1 text-meta text-brand">{error}</p> : null}
    </div>
  );
}

/* ----------------------------------------------------------------- login tab */

interface FieldState {
  value: string;
  touched: boolean;
}
const EMPTY_FIELD: FieldState = { value: '', touched: false };

function LoginForm({
  onSwitchToSignup,
  showToast,
  onLoggedIn,
}: {
  onSwitchToSignup: () => void;
  showToast: (text: string, isError?: boolean) => void;
  onLoggedIn: (phone: string) => void;
}) {
  const [step, setStep] = useState<LoginStep>('phone');
  const [phone, setPhone] = useState<FieldState>(EMPTY_FIELD);
  const [otp, setOtp] = useState<FieldState>(EMPTY_FIELD);

  const phoneError = validatePhoneLocal(phone.value);
  const otpError = validateOtp(otp.value);

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();

      if (step === 'phone') {
        if (phoneError) {
          setPhone((f) => ({ ...f, touched: true }));
          return;
        }
        // No SMS provider is wired up yet — this simulates the round trip.
        setStep('otp');
        showToast(`کد یکبارمصرف ارسال شد (کد آزمایشی: ${DEMO_OTP.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])})`);
        return;
      }

      if (otpError) {
        setOtp((f) => ({ ...f, touched: true }));
        return;
      }
      if (otp.value !== DEMO_OTP) {
        showToast('کد وارد شده اشتباه است', true);
        return;
      }
      onLoggedIn(phone.value);
    },
    [step, phone.value, phoneError, otp.value, otpError, onLoggedIn, showToast],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <PhoneField
        value={phone.value}
        error={phone.touched ? phoneError : null}
        onChange={(value) => setPhone({ value, touched: phone.touched })}
        onBlur={() => setPhone((f) => ({ ...f, touched: true }))}
        autoFocus
      />

      {step === 'otp' ? (
        <div>
          <label className="mb-1.5 block text-meta font-semibold text-ink">کد یکبار مصرف</label>
          <input
            type="text"
            dir="ltr"
            inputMode="numeric"
            maxLength={4}
            autoFocus
            value={otp.value}
            onChange={(event) => setOtp({ value: digitsOnly(event.target.value, 4), touched: otp.touched })}
            onBlur={() => setOtp((f) => ({ ...f, touched: true }))}
            placeholder="----"
            className={[
              'min-h-touch w-full rounded-card border bg-mist text-center text-title font-bold tracking-[0.5em] text-ink outline-none transition-colors focus:bg-paper',
              otp.touched && otpError ? 'border-brand' : 'border-line focus:border-brand',
            ].join(' ')}
          />
          <p className="mt-1.5 text-meta text-ash">کد ۴ رقمی ارسال‌شده به شماره خود را وارد کنید</p>
        </div>
      ) : null}

      <Button type="submit" block>
        {step === 'phone' ? 'دریافت کد ورود' : 'ورود'}
      </Button>

      <p className="text-center text-meta text-slate">
        حساب کاربری ندارید؟{' '}
        <button type="button" onClick={onSwitchToSignup} className="font-semibold text-brand">
          ثبت‌نام کنید
        </button>
      </p>
    </form>
  );
}

/* ---------------------------------------------------------------- signup tab */

function SignupForm({
  onSwitchToLogin,
  showToast,
  onRegister,
}: {
  onSwitchToLogin: () => void;
  showToast: (text: string, isError?: boolean) => void;
  onRegister: (user: { name: string; nationalId: string; phone: string }) => { ok: true } | { ok: false; error: string };
}) {
  const [fullName, setFullName] = useState<FieldState>(EMPTY_FIELD);
  const [nationalId, setNationalId] = useState<FieldState>(EMPTY_FIELD);
  const [phone, setPhone] = useState<FieldState>(EMPTY_FIELD);

  const fullNameError = validateFullName(fullName.value);
  const nationalIdError = validateNationalId(nationalId.value);
  const phoneError = validatePhoneLocal(phone.value);

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();

      if (fullNameError || nationalIdError || phoneError) {
        setFullName((f) => ({ ...f, touched: true }));
        setNationalId((f) => ({ ...f, touched: true }));
        setPhone((f) => ({ ...f, touched: true }));
        return;
      }

      const result = onRegister({
        name: fullName.value.trim(),
        nationalId: nationalId.value,
        phone: phone.value,
      });

      if (!result.ok) {
        showToast(result.error, true);
        return;
      }

      showToast('✅ ثبت‌نام با موفقیت انجام شد');
      window.setTimeout(onSwitchToLogin, 1200);
    },
    [fullName.value, fullNameError, nationalId.value, nationalIdError, phone.value, phoneError, onRegister, onSwitchToLogin, showToast],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <TextField
        label="نام و نام خانوادگی"
        value={fullName.value}
        error={fullName.touched ? fullNameError : null}
        onChange={(value) => setFullName({ value, touched: fullName.touched })}
        onBlur={() => setFullName((f) => ({ ...f, touched: true }))}
        placeholder="مثلاً: علی رضایی"
        autoComplete="name"
        autoFocus
      />

      <TextField
        label="کد ملی"
        value={nationalId.value}
        error={nationalId.touched ? nationalIdError : null}
        onChange={(value) => setNationalId({ value: digitsOnly(value, 10), touched: nationalId.touched })}
        onBlur={() => setNationalId((f) => ({ ...f, touched: true }))}
        placeholder="کد ملی ۱۰ رقمی"
        dir="ltr"
        inputMode="numeric"
        maxLength={10}
      />

      <PhoneField
        value={phone.value}
        error={phone.touched ? phoneError : null}
        onChange={(value) => setPhone({ value, touched: phone.touched })}
        onBlur={() => setPhone((f) => ({ ...f, touched: true }))}
      />

      <Button type="submit" block>
        ثبت‌نام
      </Button>

      <p className="text-center text-meta text-slate">
        قبلاً ثبت‌نام کرده‌اید؟{' '}
        <button type="button" onClick={onSwitchToLogin} className="font-semibold text-brand">
          وارد شوید
        </button>
      </p>
    </form>
  );
}
