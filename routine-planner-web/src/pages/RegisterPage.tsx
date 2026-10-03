import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./LoginPage.css";

// Identity возвращает ошибки на английском: переводим самые частые по коду
const ERROR_TEXT: Record<string, string> = {
    PasswordTooShort: "Пароль слишком короткий",
    PasswordRequiresDigit: "В пароле нужна хотя бы одна цифра",
    PasswordRequiresLower: "В пароле нужна строчная буква",
    PasswordRequiresUpper: "В пароле нужна заглавная буква",
    PasswordRequiresNonAlphanumeric: "В пароле нужен специальный символ (например, !)",
    DuplicateUserName: "Этот email уже зарегистрирован",
    DuplicateEmail: "Этот email уже зарегистрирован",
    InvalidEmail: "Некорректный email",
    InvalidUserName: "Некорректный email",
};

function RegisterPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [errors, setErrors] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();

        if (password !== confirm) {
            setErrors(["Пароли не совпадают"]);
            return;
        }

        setIsLoading(true);
        setErrors([]);

        try {
            const response = await fetch("http://localhost:5112/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const data = await response.json();
                login(data.token);
                navigate("/goals");
                return;
            }

            const data = await response.json().catch(() => null);
            if (data?.errors) {
                setErrors(
                    Object.entries(data.errors).map(
                        ([code, messages]) => ERROR_TEXT[code] ?? (messages as string[])[0]
                    )
                );
            } else {
                setErrors(["Не удалось зарегистрироваться"]);
            }
        } catch {
            setErrors(["Нет связи с сервером"]);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="login-page">
            <form className="login-card" onSubmit={handleSubmit}>
                <h1 className="login-title">Routine Planner</h1>
                <p className="login-subtitle">Зарегистрируйтесь, чтобы ставить себе цели</p>

                <label className="login-field">
                    <span className="login-field-label">Email</span>
                    <input
                        className="login-input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                    />
                </label>

                <label className="login-field">
                    <span className="login-field-label">Пароль</span>
                    <input
                        className="login-input"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                    />
                </label>

                <label className="login-field">
                    <span className="login-field-label">Повторите пароль</span>
                    <input
                        className="login-input"
                        type="password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        autoComplete="new-password"
                        required
                    />
                </label>

                {errors.length > 0 && (
                    <div className="login-errors">
                        {errors.map((err) => (
                            <p className="login-error" key={err}>{err}</p>
                        ))}
                    </div>
                )}

                <button className="login-button" type="submit" disabled={isLoading}>
                    {isLoading ? "Создаём…" : "Создать аккаунт"}
                </button>

                <p className="login-switch">
                    Уже есть аккаунт? <Link to="/login">Войти</Link>
                </p>
            </form>
        </div>
    );
}

export default RegisterPage;