import { useState } from "react";
import "./LoginPage.css";

interface LoginPageProps {
    onLoginSuccess: (token: string) => void;
}

function LoginPage({ onLoginSuccess }: LoginPageProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const response = await fetch("http://localhost:5112/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                setError("Неверный email или пароль");
                return;
            }

            const data = await response.json();
            localStorage.setItem("token", data.token);
            onLoginSuccess(data.token);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <h1 className="login-title">Routine Planner</h1>
                <p className="login-subtitle">Войдите, чтобы увидеть свои цели</p>

                <form onSubmit={handleSubmit}>
                    <label className="login-field">
                        <span className="login-field-label">Email</span>
                        <input
                            type="email"
                            className="login-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                        />
                    </label>

                    <label className="login-field">
                        <span className="login-field-label">Пароль</span>
                        <input
                            type="password"
                            className="login-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </label>

                    {error && <p className="login-error">{error}</p>}

                    <button type="submit" className="login-button" disabled={isSubmitting}>
                        {isSubmitting ? "Подождите…" : "Войти"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;