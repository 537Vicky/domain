import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Shield, Loader2, RefreshCw, CheckCircle2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

/* ─── Countdown hook ──────────────────────────────────────────────── */
const useCountdown = (initialSeconds: number) => {
    const [seconds, setSeconds] = useState(initialSeconds);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const reset = useCallback(() => setSeconds(initialSeconds), [initialSeconds]);

    useEffect(() => {
        if (seconds <= 0) return;
        intervalRef.current = setInterval(() => setSeconds((s) => s - 1), 1000);
        return () => clearInterval(intervalRef.current!);
    }, [seconds]);

    const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
    const ss = String(seconds % 60).padStart(2, "0");
    return { seconds, display: `${mm}:${ss}`, reset };
};

/* ─── Component ───────────────────────────────────────────────────── */
const VerifyOtp = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();

    const email: string = (location.state as { email?: string })?.email || "";

    const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [verified, setVerified] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const { seconds, display, reset } = useCountdown(180);

    // Redirect back to register if no email in router state
    useEffect(() => {
        if (!email) navigate("/register", { replace: true });
    }, [email, navigate]);

    /* ── OTP input helpers ─────────────────────────────────────────── */
    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const next = [...otp];
        next[index] = value.slice(-1);
        setOtp(next);
        if (value && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (!pasted) return;
        const next = [...otp];
        pasted.split("").forEach((ch, i) => { if (i < 6) next[i] = ch; });
        setOtp(next);
        inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    };

    const otpValue = otp.join("");

    /* ── Verify ────────────────────────────────────────────────────── */
    const handleVerify = async () => {
        if (otpValue.length < 6) {
            toast({ title: "Incomplete OTP", description: "Please enter all 6 digits.", variant: "destructive" });
            return;
        }
        setLoading(true);
        try {
            const res = await api.post("/auth/verify-otp", { email, otp: otpValue });
            localStorage.setItem("renewx_token", res.token);
            localStorage.setItem("renewx_user", JSON.stringify(res.user));
            setVerified(true);
            toast({ title: "Email Verified! 🎉", description: "Welcome to RenewX!" });
            setTimeout(() => navigate("/dashboard"), 1500);
        } catch (err: any) {
            toast({
                title: "Verification Failed",
                description: err.message || "Invalid or expired OTP.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    /* ── Resend ────────────────────────────────────────────────────── */
    const handleResend = async () => {
        if (seconds > 0) return;
        setResending(true);
        try {
            await api.post("/auth/resend-otp", { email });
            reset();
            setOtp(Array(6).fill(""));
            inputRefs.current[0]?.focus();
            toast({ title: "OTP Resent", description: "A fresh code has been sent to your email." });
        } catch (err: any) {
            toast({ title: "Resend Failed", description: err.message, variant: "destructive" });
        } finally {
            setResending(false);
        }
    };

    /* ── Success screen ─────────────────────────────────────────────── */
    if (verified) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background px-4">
                <div className="w-full max-w-md animate-scale-in opacity-0">
                    <div className="glass-card-elevated p-8 text-center space-y-4">
                        <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
                        <h1 className="text-2xl font-bold text-foreground">Email Verified!</h1>
                        <p className="text-sm text-muted-foreground">Redirecting you to your dashboard…</p>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Main screen ────────────────────────────────────────────────── */
    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-md animate-scale-in opacity-0">

                {/* ── Logo + heading ── */}
                <div className="mb-8 text-center">
                    <Link to="/" className="mb-6 inline-flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                            <Shield className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-semibold text-foreground">RenewX</span>
                    </Link>
                    <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                        <MailCheck className="h-3 w-3" />
                        Email Verification
                    </div>
                    <h1 className="mt-3 text-2xl font-bold text-foreground">Check your inbox</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        We sent a 6-digit code to{" "}
                        <span className="font-medium text-foreground">{email}</span>
                    </p>
                </div>

                {/* ── Card ── */}
                <div className="glass-card-elevated p-8 space-y-6">

                    {/* Countdown timer */}
                    <div className="flex flex-col items-center gap-1.5">
                        {/* SVG ring */}
                        <div className="relative flex h-20 w-20 items-center justify-center">
                            <svg
                                viewBox="0 0 64 64"
                                className="absolute inset-0 h-full w-full -rotate-90"
                            >
                                <circle
                                    cx="32" cy="32" r="28"
                                    fill="none"
                                    className="stroke-muted"
                                    strokeWidth="5"
                                />
                                <circle
                                    cx="32" cy="32" r="28"
                                    fill="none"
                                    className={seconds <= 30 ? "stroke-destructive" : "stroke-primary"}
                                    strokeWidth="5"
                                    strokeLinecap="round"
                                    strokeDasharray={175.93}
                                    strokeDashoffset={175.93 * (1 - seconds / 180)}
                                    style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.4s ease" }}
                                />
                            </svg>
                            <span
                                className={`relative z-10 text-lg font-bold tabular-nums ${seconds <= 30 ? "text-destructive" : "text-foreground"
                                    }`}
                            >
                                {display}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {seconds > 0 ? "Time remaining" : "Code expired — resend below"}
                        </p>
                    </div>

                    {/* OTP digit boxes */}
                    <div className="flex justify-center gap-2" onPaste={handlePaste}>
                        {otp.map((digit, i) => (
                            <input
                                key={i}
                                id={`otp-digit-${i}`}
                                ref={(el) => (inputRefs.current[i] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(i, e)}
                                autoComplete="one-time-code"
                                autoFocus={i === 0}
                                disabled={loading || seconds === 0}
                                className={[
                                    // base — matches shadcn Input appearance
                                    "h-14 w-12 rounded-md border bg-background text-center",
                                    "text-2xl font-bold text-foreground font-mono",
                                    "outline-none transition-all duration-200",
                                    "focus:ring-2 focus:ring-primary focus:border-primary",
                                    "disabled:cursor-not-allowed disabled:opacity-50",
                                    // filled state
                                    digit ? "border-primary" : "border-input",
                                    // expired state
                                    seconds === 0 ? "opacity-40" : "",
                                ].join(" ")}
                            />
                        ))}
                    </div>

                    {/* Verify button */}
                    <Button
                        id="otp-verify-btn"
                        className="w-full"
                        onClick={handleVerify}
                        disabled={loading || otpValue.length < 6 || seconds === 0}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Verifying…
                            </>
                        ) : (
                            "Verify Email"
                        )}
                    </Button>
                </div>

                {/* Resend link */}
                <p className="mt-6 text-center text-sm text-muted-foreground">
                    Didn't receive a code?{" "}
                    <button
                        id="otp-resend-btn"
                        onClick={handleResend}
                        disabled={seconds > 0 || resending}
                        className={[
                            "font-medium transition-colors",
                            seconds > 0 || resending
                                ? "cursor-not-allowed text-muted-foreground"
                                : "text-primary hover:underline",
                        ].join(" ")}
                    >
                        {resending ? (
                            <span className="inline-flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Sending…
                            </span>
                        ) : seconds > 0 ? (
                            `Resend in ${display}`
                        ) : (
                            <span className="inline-flex items-center gap-1">
                                <RefreshCw className="h-3 w-3" />
                                Resend code
                            </span>
                        )}
                    </button>
                </p>

            </div>
        </div>
    );
};

export default VerifyOtp;
