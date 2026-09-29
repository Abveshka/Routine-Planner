import { useState, useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Snowflake, Flower2, Sun, Leaf } from "lucide-react";
import "./GoalsPage.css";
import Sidebar from "../components/Sidebar";

// ===== Типы =====

interface Goal {
    id: number;
    title: string;
    description: string | null;
    year: number;
    season: number;
    subPeriod: number;
    totalCost: number;          // итоговая стоимость (считает сервер)
    manualCost: number | null;  // стоимость, введённая вручную (или null)
    isCompleted: boolean;
}

// Какие поля можно менять из модалки
interface GoalChanges {
    title: string;
    description: string | null;
    season: number;
    subPeriod: number;
    manualCost: number | null;
}

// ===== Константы и вспомогательные функции =====

const SUB_PERIOD_LABELS = ["Начало", "Середина", "Конец"];

const SEASON_CONFIG = [
    { label: "Зима", Icon: Snowflake, accent: "#2f6fed", bg: "#e8f0fe" },
    { label: "Весна", Icon: Flower2, accent: "#3b8c3b", bg: "#eaf5e9" },
    { label: "Лето", Icon: Sun, accent: "#d98324", bg: "#fcf0dd" },
    { label: "Осень", Icon: Leaf, accent: "#c1502e", bg: "#fbe9e3" },
];

type GroupedGoals = Record<number, Record<number, Record<number, Goal[]>>>;

function groupGoals(goals: Goal[]): GroupedGoals {
    const grouped: GroupedGoals = {};
    for (const goal of goals) {
        grouped[goal.year] ??= {};
        grouped[goal.year][goal.season] ??= {};
        grouped[goal.year][goal.season][goal.subPeriod] ??= [];
        grouped[goal.year][goal.season][goal.subPeriod].push(goal);
    }
    return grouped;
}

function formatCost(cost: number) {
    return new Intl.NumberFormat("ru-RU").format(cost) + " ₽";
}

// ===== Компонент страницы =====

function GoalsPage() {
    const { token, logout } = useAuth();
    const navigate = useNavigate();
    const [goals, setGoals] = useState<Goal[]>([]);

    // Загружаем список целей при открытии страницы
    useEffect(() => {
        fetch("http://localhost:5112/api/goals", {
            headers: { Authorization: `Bearer ${token}` },
        }).then((response) => {
            if (response.status === 401) {
                logout();
                return;
            }
            if (!response.ok) {
                console.error("Ошибка загрузки целей, статус:", response.status);
                return;
            }
            response.json().then((data) => setGoals(data));
        });
    }, [token, logout]);

    // ===== handleToggle: только переключение галочки =====
    async function handleToggle(goalId: number) {
        // Сначала меняем на экране сразу, чтобы интерфейс не тормозил
        setGoals((prevGoals) =>
            prevGoals.map((goal) =>
                goal.id === goalId ? { ...goal, isCompleted: !goal.isCompleted } : goal
            )
        );

        const response = await fetch(`http://localhost:5112/api/goals/${goalId}/toggle`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401) {
            logout();
            return;
        }
        if (!response.ok) {
            console.error("Не удалось изменить статус цели");
            // Сервер не принял, возвращаем галочку обратно
            setGoals((prevGoals) =>
                prevGoals.map((goal) =>
                    goal.id === goalId ? { ...goal, isCompleted: !goal.isCompleted } : goal
                )
            );
        }
    } // <-- handleToggle заканчивается здесь

    // ===== handleUpdate: сохранение изменений цели =====
    // Стоит на том же уровне, что и handleToggle (НЕ внутри неё).
    // Возвращает true, если сохранилось, и false, если нет.
    async function handleUpdate(goalId: number, changes: GoalChanges): Promise<boolean> {
        // Находим текущую цель: нужен год. Его в модалке не меняем,
        // но сервер ждёт его в запросе
        const goal = goals.find((g) => g.id === goalId);
        if (!goal) return false;

        const response = await fetch(`http://localhost:5112/api/goals/${goalId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            // JSON.stringify превращает объект в текст, который можно отправить
            body: JSON.stringify({
                title: changes.title,
                description: changes.description,
                year: goal.year,
                season: changes.season,
                subPeriod: changes.subPeriod,
                manualCost: changes.manualCost,
            }),
        });

        if (response.status === 401) {
            logout();
            return false;
        }
        if (!response.ok) {
            console.error("Не удалось сохранить цель, статус:", response.status);
            return false;
        }

        // PUT вернул NoContent (пустой ответ), поэтому просим у сервера
        // свежую версию этой цели. Так TotalCost будет посчитан сервером.
        const freshResponse = await fetch(`http://localhost:5112/api/goals/${goalId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!freshResponse.ok) {
            // Сохранилось, но свежие данные не получили.
            // Обновляем список вручную, чтобы хоть что-то показать
            setGoals((prev) =>
                prev.map((g) =>
                    g.id === goalId
                        ? { ...g, ...changes, totalCost: changes.manualCost ?? g.totalCost }
                        : g
                )
            );
            return true;
        }

        const freshGoal: Goal = await freshResponse.json();

        // Заменяем старую версию цели на свежую с сервера
        setGoals((prev) => prev.map((g) => (g.id === goalId ? freshGoal : g)));
        return true;
    }

    const grouped = groupGoals(goals);

    return (
        <div className="page-layout">
            <Sidebar />
            <div className="goals-page">
                <h1>Мои цели</h1>

                {Object.entries(grouped).map(([year, seasons]) => (
                    <section key={year}>
                        <h2 className="year-header">{year}</h2>

                        {Object.entries(seasons).map(([seasonIndex, subPeriods]) => {
                            const config = SEASON_CONFIG[Number(seasonIndex)];
                            return (
                                <div className="season-block" key={seasonIndex}>
                                    <div className="season-header">
                                        <span className="season-badge" style={{ background: config.bg }}>
                                            <config.Icon size={16} color={config.accent} />
                                        </span>
                                        <span className="season-name">{config.label}</span>
                                    </div>

                                    {Object.entries(subPeriods).map(([subIndex, items]) => (
                                        <div key={subIndex}>
                                            <p className="subperiod-label">{SUB_PERIOD_LABELS[Number(subIndex)]}</p>
                                            {items.map((goal) => (
                                                <div className="goal-row" key={goal.id}>
                                                    <input
                                                        type="checkbox"
                                                        checked={goal.isCompleted}
                                                        onChange={() => handleToggle(goal.id)}
                                                    />
                                                    <span
                                                        className={goal.isCompleted ? "goal-done" : "goal-title"}
                                                        onClick={() => navigate(`/goals/${goal.id}`)}
                                                        style={{ cursor: "pointer" }}
                                                    >
                                                        {goal.title}
                                                    </span>
                                                    <span className="goal-cost">
                                                        {goal.totalCost ? formatCost(goal.totalCost) : "—"}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </section>
                ))}
            </div>

            {/* Передаём в модалку и список целей, и функцию сохранения */}
            <Outlet context={{ goals, onGoalUpdate: handleUpdate }} />
        </div>
    );
}

export default GoalsPage;