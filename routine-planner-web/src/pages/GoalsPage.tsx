import { useState, useEffect } from "react";
import { Snowflake, Flower2, Sun, Leaf, Plus } from "lucide-react";
import "./GoalsPage.css";

interface Goal {
    id: number;
    title: string;
    year: number;
    season: number;
    subPeriod: number;
    totalCost: number;
    isCompleted: boolean;
}

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

function GoalsPage() {
    const [goals, setGoals] = useState<Goal[]>([]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        fetch("http://localhost:5112/api/goals", {
            headers: { Authorization: `Bearer ${token}` },
        }).then((response) => {
            if (!response.ok) {
                console.error("Ошибка загрузки целей, статус:", response.status);
                return;
            }
            response.json().then((data) => setGoals(data));
        });
    }, []);

    const grouped = groupGoals(goals);

    return (
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
                                                <input type="checkbox" checked={goal.isCompleted} readOnly />
                                                <span className={goal.isCompleted ? "goal-done" : "goal-title"}>
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

            <button className="add-goal-button">
                <Plus size={16} />
                Добавить цель
            </button>
        </div>
    );
}

export default GoalsPage;