import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import "./CreateGoalPage.css";

const SEASON_OPTIONS = ["Зима", "Весна", "Лето", "Осень"];
const SUB_PERIOD_OPTIONS = ["Начало", "Середина", "Конец"];

function CreateGoalPage() {
    const navigate = useNavigate();
    const { token, logout } = useAuth();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [year, setYear] = useState(new Date().getFullYear());
    const [season, setSeason] = useState(0);
    const [subPeriod, setSubPeriod] = useState(0);
    const [manualCost, setManualCost] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const response = await fetch("http://localhost:5112/api/goals", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title,
                    description: description || null,
                    year,
                    season,
                    subPeriod,
                    manualCost: manualCost ? Number(manualCost) : null,
                }),
            });

            if (response.status === 401) {
                logout(); // токен просрочен: ProtectedRoute перекинет на /login
                return;
            }

            if (!response.ok) {
                setError("Не удалось создать цель");
                return;
            }

            navigate("/goals");
        } catch {
            setError("Не удалось связаться с сервером");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="page-layout">
            <Sidebar />
            <div className="creategoal-page">
                <div className="creategoal-card">
                    <h1 className="creategoal-title">Новая цель</h1>
                    <p className="creategoal-subtitle">Что хотите успеть в этом сезоне?</p>

                    <form onSubmit={handleSubmit}>
                        <label className="creategoal-field">
                            <span className="creategoal-label">Название</span>
                            <input
                                className="creategoal-input"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Например, пробежать 10 км"
                                required
                            />
                        </label>

                        <label className="creategoal-field">
                            <span className="creategoal-label">Описание</span>
                            <textarea
                                className="creategoal-textarea"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </label>

                        <div className="creategoal-row">
                            <label className="creategoal-field">
                                <span className="creategoal-label">Год</span>
                                <input
                                    type="number"
                                    className="creategoal-input"
                                    value={year}
                                    onChange={(e) => setYear(Number(e.target.value))}
                                />
                            </label>

                            <label className="creategoal-field">
                                <span className="creategoal-label">Стоимость, ₽</span>
                                <input
                                    type="number"
                                    className="creategoal-input"
                                    value={manualCost}
                                    onChange={(e) => setManualCost(e.target.value)}
                                    placeholder="необязательно"
                                />
                            </label>
                        </div>

                        <div className="creategoal-row">
                            <label className="creategoal-field">
                                <span className="creategoal-label">Сезон</span>
                                <select
                                    className="creategoal-select"
                                    value={season}
                                    onChange={(e) => setSeason(Number(e.target.value))}
                                >
                                    {SEASON_OPTIONS.map((label, index) => (
                                        <option key={index} value={index}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="creategoal-field">
                                <span className="creategoal-label">Период</span>
                                <select
                                    className="creategoal-select"
                                    value={subPeriod}
                                    onChange={(e) => setSubPeriod(Number(e.target.value))}
                                >
                                    {SUB_PERIOD_OPTIONS.map((label, index) => (
                                        <option key={index} value={index}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        {error && <p className="creategoal-error">{error}</p>}

                        <div className="creategoal-actions">
                            <button
                                type="button"
                                className="creategoal-button creategoal-button-secondary"
                                onClick={() => navigate("/goals")}
                            >
                                Отмена
                            </button>
                            <button
                                type="submit"
                                className="creategoal-button"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Сохранение…" : "Сохранить"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default CreateGoalPage;