"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ClipboardEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { FullScreenModal } from "@/components/modals";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { hideSiteLoader, showSiteLoader } from "@/store/slices/ui-slice";
import {
  clearAuthError,
  logoutThunk,
  resetAuthFlow,
  setAuthStep,
} from "./auth-slice";
import {
  sendOtpThunk,
  updateProfileThunk,
  verifyOtpThunk,
} from "./auth-thunks";
import {
  otpSchema,
  phoneSchema,
  profileSchema,
  type OtpFormValues,
  type PhoneFormValues,
  type ProfileFormValues,
} from "./validation";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  redirectTo?: string;
};

export function AuthModal({
  open,
  onClose,
  redirectTo = "/profile",
}: AuthModalProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const auth = useAppSelector((state) => state.auth);
  const isRedirectingAfterLogin =
    Boolean(auth.user?.full_name) && auth.step === "phone" && open;

  const closeModal = () => {
    if (auth.step === "profile" && !auth.user?.full_name) {
      void dispatch(logoutThunk());
      onClose();
      router.push("/stores");
      return;
    }

    dispatch(resetAuthFlow());
    onClose();
  };

  useEffect(() => {
    if (isRedirectingAfterLogin) {
      dispatch(showSiteLoader("Please wait..."));
      closeModal();
      router.push(redirectTo);
      window.setTimeout(() => {
        dispatch(hideSiteLoader());
      }, 1500);
    }
    // closeModal intentionally stays inline with current modal props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRedirectingAfterLogin, redirectTo, router]);

  return (
    <FullScreenModal
      open={open}
      onClose={closeModal}
      title="Login"
      description="Login with phone and OTP"
    >
      <div className="mx-auto flex min-h-dvh w-full flex-col justify-start px-6 pb-10 pt-20">
        <button
          type="button"
          onClick={closeModal}
          aria-label="Close"
          className="absolute right-5 top-5 inline-flex size-10 items-center justify-center rounded-full border border-border text-main transition hover:bg-background"
        >
          <i className="fa-solid fa-xmark text-base" aria-hidden="true" />
        </button>

        {auth.step === "phone" && <PhoneStep />}
        {auth.step === "verify" && <VerifyStep />}
        {auth.step === "profile" && (
          <ProfileStep redirectTo={redirectTo} />
        )}
      </div>
    </FullScreenModal>
  );
}

function PhoneStep() {
  const dispatch = useAppDispatch();
  const { error, identifier, status } = useAppSelector((state) => state.auth);
  const {
    clearErrors,
    control,
    formState: { errors },
    handleSubmit,
    register,
    setFocus,
    setValue,
  } = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      identifier: identifier.replace(/^\+91/, ""),
    },
  });

  const onSubmit = (values: PhoneFormValues) => {
    dispatch(sendOtpThunk(values));
  };
  const phoneValue = useWatch({ control, name: "identifier" });
  const identifierField = register("identifier", {
    onChange: (event) => {
      event.target.value = event.target.value.replace(/\D/g, "").slice(0, 10);
      clearErrors("identifier");
      dispatch(clearAuthError());
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Login</p>
        <h2 className="mt-2 text-3xl font-bold text-main">
          Enter your phone number
        </h2>
        <p className="mt-3 text-sm leading-6 text-secondary">
          We will send a 4 digit OTP to verify your account.
        </p>
      </div>

      <div>
        <div className="flex h-13 overflow-hidden rounded-xl border border-border bg-surface transition focus-within:border-primary">
          <span className="flex items-center border-r border-border px-4 text-base font-semibold text-main">
            +91
          </span>
          <input
            id="identifier"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="Enter Mobile Number"
            className="min-w-0 flex-1 px-4 text-base text-main outline-none"
            {...identifierField}
            onKeyDown={(event) => {
              const allowedKeys = [
                "Backspace",
                "Delete",
                "ArrowLeft",
                "ArrowRight",
                "Tab",
                "Home",
                "End",
              ];

              if (!allowedKeys.includes(event.key) && !/^\d$/.test(event.key)) {
                event.preventDefault();
              }
            }}
          />
          {phoneValue && (
            <button
              type="button"
              aria-label="Clear phone number"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setValue("identifier", "");
                clearErrors("identifier");
                dispatch(clearAuthError());
                setFocus("identifier");
              }}
              className="mr-2 flex size-7 items-center justify-center self-center rounded-full bg-background text-secondary transition hover:bg-border hover:text-main"
            >
              <i className="fa-solid fa-xmark text-sm" aria-hidden="true" />
            </button>
          )}
        </div>
        {errors.identifier && (
          <p className="mt-2 text-sm text-red-600">
            {errors.identifier.message}
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="flex h-12 w-full items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === "loading" ? "Sending..." : "Continue"}
      </button>

      <p className="-mt-2 text-center text-xs font-medium leading-5 text-secondary">
        By continuing, you agree to our{" "}
        <Link href="/privacy" className="font-bold text-primary">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link href="/terms" className="font-bold text-primary">
          Terms of Use
        </Link>
        .
      </p>
    </form>
  );
}

function VerifyStep() {
  const dispatch = useAppDispatch();
  const { devOtp, error, identifier, reqId, status } = useAppSelector(
    (state) => state.auth,
  );
  const [digits, setDigits] = useState(["", "", "", ""]);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const {
    formState: { errors },
    handleSubmit,
    setValue,
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const submitOtp = (otp: string) => {
    if (!reqId || status === "loading") return;
    setValue("otp", otp, { shouldValidate: true });
    void handleSubmit(() => {
      void dispatch(verifyOtpThunk({ req_id: reqId, otp }))
        .unwrap()
        .finally(() => {
          dispatch(hideSiteLoader());
        });
    })();
  };

  const updateDigits = (nextDigits: string[]) => {
    setDigits(nextDigits);
    const otp = nextDigits.join("");
    setValue("otp", otp, { shouldValidate: otp.length === 4 });

    if (otp.length === 4) {
      submitOtp(otp);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    const numericValue = value.replace(/\D/g, "");
    if (!numericValue) {
      const nextDigits = [...digits];
      nextDigits[index] = "";
      updateDigits(nextDigits);
      return;
    }

    const nextDigits = [...digits];
    numericValue
      .slice(0, 4 - index)
      .split("")
      .forEach((digit, offset) => {
        nextDigits[index + offset] = digit;
      });
    updateDigits(nextDigits);

    const nextIndex = Math.min(index + numericValue.length, 3);
    inputRefs.current[nextIndex]?.focus();
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pastedOtp = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    const nextDigits = pastedOtp.padEnd(4, " ").split("").map((digit) =>
      digit.trim(),
    );
    updateDigits(nextDigits);
    inputRefs.current[Math.min(pastedOtp.length, 3)]?.focus();
  };

  return (
    <form className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Verify OTP</p>
        <h2 className="mt-2 text-3xl font-bold text-main">
          Enter the 4 digit code
        </h2>
        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-6 text-secondary">
          <span>Sent to {identifier}</span>
          <button
            type="button"
            onClick={() => dispatch(setAuthStep("phone"))}
            className="inline-flex items-center gap-1 font-semibold text-primary transition hover:text-primary/80"
          >
            <i className="fa-solid fa-pencil text-xs" aria-hidden="true" />
            Change
          </button>
        </p>
      </div>

      <div className="flex justify-center gap-3">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              inputRefs.current[index] = element;
            }}
            value={digit}
            type="text"
            autoFocus={index === 0}
            inputMode="numeric"
            maxLength={1}
            onPaste={handlePaste}
            onChange={(event) => handleDigitChange(index, event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Backspace" && !digits[index] && index > 0) {
                inputRefs.current[index - 1]?.focus();
              }
            }}
            className="h-14 w-14 rounded-xl border border-border bg-surface text-center text-xl font-bold text-main outline-none transition focus:border-primary"
          />
        ))}
      </div>

      {errors.otp && <p className="text-sm text-red-600">{errors.otp.message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        disabled={digits.join("").length !== 4 || status === "loading"}
        onClick={() => submitOtp(digits.join(""))}
        className="flex h-12 w-full items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === "loading" ? "Verifying..." : "Verify"}
      </button>

      {devOtp && (
        <p className="rounded-md border border-accent bg-accent/10 px-4 py-3 text-sm font-semibold text-main">
          Dev OTP: {devOtp}
        </p>
      )}
    </form>
  );
}

function ProfileStep({
  redirectTo,
}: {
  redirectTo: string;
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { error, status, user } = useAppSelector((state) => state.auth);
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name ?? "",
      email: user?.email ?? "",
    },
  });

  const onSubmit = (values: ProfileFormValues) => {
    void dispatch(
      updateProfileThunk({
        full_name: values.full_name,
        email: values.email?.trim() || undefined,
      }),
    )
      .unwrap()
      .then(() => {
        dispatch(showSiteLoader("Please wait..."));
        router.push(redirectTo);
        window.setTimeout(() => {
          dispatch(hideSiteLoader());
        }, 1500);
      })
      .catch(() => {
        dispatch(hideSiteLoader());
      });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Create profile</p>
        <h2 className="mt-2 text-3xl font-bold text-main">
          Tell us about you
        </h2>
        <p className="mt-3 text-sm leading-6 text-secondary">
          Add your name to complete setup. Email is optional.
        </p>
      </div>

      <div>
        <label htmlFor="full_name" className="text-sm font-semibold text-main">
          Full name
        </label>
        <div className="mt-2 flex h-13 items-center rounded-xl border border-border bg-surface px-4 transition focus-within:border-primary">
          <i className="fa-solid fa-user text-sm text-secondary" aria-hidden="true" />
          <input
            id="full_name"
            placeholder="Enter your full name"
            className="min-w-0 flex-1 px-3 text-base text-main outline-none"
            {...register("full_name")}
          />
        </div>
        {errors.full_name && (
          <p className="mt-2 text-sm text-red-600">
            {errors.full_name.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="text-sm font-semibold text-main">
          Email <span className="font-normal text-secondary">(optional)</span>
        </label>
        <div className="mt-2 flex h-13 items-center rounded-xl border border-border bg-surface px-4 transition focus-within:border-primary">
          <i className="fa-solid fa-envelope text-sm text-secondary" aria-hidden="true" />
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            className="min-w-0 flex-1 px-3 text-base text-main outline-none"
            {...register("email")}
          />
        </div>
        {errors.email && (
          <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="flex h-12 w-full items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === "loading" ? "Saving..." : "Continue to home"}
      </button>
    </form>
  );
}
