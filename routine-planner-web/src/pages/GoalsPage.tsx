import { useState, useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";
import { Snowflake, Flower2, Sun, Leaf, ChevronRight, ChevronDown, Trash2 } from "lucide-react";
import "./GoalsPage.css";
import Sidebar from "../components/Sidebar";

interface GoalItem {
    id: number;
    title: string;
    cost: number;
    isCompleted: boolean;
    createdAt: string;
}

interface Goal {
    id: number;
    title: string;
    description: string | null;
    year: number;
    season: number;
    subPeriod: number;
    totalCost: number;
    manualCost: number | null;
    isCompleted: boolean;
    items: GoalItem[];
}

interface GoalChanges {
    title: string;
    description: string | null;
    year: number;
    season: number;
    subPeriod: number;
    manualCost: number | null;
}

const SUB_PERIOD_LABELS = ["Начало", "Середина", "Конец"];

const SEASON_CONFIG = [
    { label: "Зима", Icon: Snowflake, accent: "#2f6fed", bg: "#e8f0fe" },
    { label: "Весна", Icon: Flower2, accent: "#3b8c3b", bg: "#eaf5e9" },
    { label: "Лето", Icon: Sun, accent: "#d98324", bg: "#fcf0dd" },
    { label: "Осень", Icon: Leaf, accent: "#c1502e", bg: "#fbe9e3" },
];

type GroupedGoals = Record<number, Record<number, Record<number, Goal[]>>>;

type ItemsChanges = {
    added: { title: string; cost: number | null }[];
    updated: { id: number; title: string; cost: number | null }[];
    deletedIds: number[];
};

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
    const { token, logout } = useAuth();
    const navigate = useNavigate();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    function handleExpand(goalId: number) {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(goalId)) {
                next.delete(goalId);
            } else {
                next.add(goalId);
            }
            return next;
        });
    }
    
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
    
    async function handleToggle(goalId: number) {
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
    }

    async function handleItemToggle(goalId: number, itemId: number) {
        const flipItem = () =>
            setGoals((prevGoals) =>
                prevGoals.map((goal) =>
                    goal.id === goalId
                        ? {
                            ...goal,
                            items: goal.items.map((item) =>
                                item.id === itemId
                                    ? { ...item, isCompleted: !item.isCompleted }
                                    : item
                            ),
                        }
                        : goal
                )
            );

        flipItem();
        
        const response = await fetch(
            `http://localhost:5112/api/goals/${goalId}/items/${itemId}/toggle`,
            { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.status === 401) {
            logout();
            return;
        }
        if (!response.ok) {
            console.error("Не удалось изменить статус подцели");
            flipItem();
        }
    }

    async function handleItemsSave(goalId: number, changes: ItemsChanges): Promise<boolean> {
        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        };
        const base = `http://localhost:5112/api/goals/${goalId}/items`;
        let allOk = true;

        // 1. Удаляем
        for (const itemId of changes.deletedIds) {
            const res = await fetch(`${base}/${itemId}`, { method: "DELETE", headers });
            if (res.status === 401) { logout(); return false; }
            if (!res.ok) allOk = false;
        }

        // 2. Обновляем
        for (const item of changes.updated) {
            const res = await fetch(`${base}/${item.id}`, {
                method: "PUT",
                headers,
                body: JSON.stringify({ title: item.title, cost: item.cost }),
            });
            if (res.status === 401) { logout(); return false; }
            if (!res.ok) allOk = false;
        }

        // 3. Добавляем
        for (const item of changes.added) {
            const res = await fetch(base, {
                method: "POST",
                headers,
                body: JSON.stringify({ title: item.title, cost: item.cost }),
            });
            if (res.status === 401) { logout(); return false; }
            if (!res.ok) allOk = false;
        }

        // 4. Перезагружаем цель с сервера
        const goalRes = await fetch(`http://localhost:5112/api/goals/${goalId}`, { headers });
        if (goalRes.ok) {
            const fresh: Goal = await goalRes.json();
            setGoals((prev) => prev.map((g) => (g.id === goalId ? fresh : g)));
        }

        return allOk;
    }
    
    async function handleUpdate(goalId: number, changes: GoalChanges): Promise<boolean> {

        const response = await fetch(`http://localhost:5112/api/goals/${goalId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                title: changes.title,
                description: changes.description,
                year: changes.year,
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
        
        setGoals((prev) => prev.map((g) => (g.id === goalId ? freshGoal : g)));
        return true;
    }

    async function handleDelete(goalId: number) {
        setIsDeleting(true);

        const response = await fetch(`http://localhost:5112/api/goals/${goalId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        setIsDeleting(false);
        if (response.status === 401) {
            logout();
            return;
        }
        if (!response.ok) {
            alert("Не удалось удалить цель");
            return;
        }

        setGoals((prev) => prev.filter((goal) => goal.id !== goalId));
        setGoalToDelete(null);
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
                                            {items.map((goal) => {
                                                const isExpanded = expandedIds.has(goal.id);
                                                const hasItems = goal.items.length > 0;

                                                return (
                                                    <div key={goal.id}>
                                                        <div className="goal-row">
                                                            {}
                                                            {hasItems ? (
                                                                <button
                                                                    className="expand-btn"
                                                                    onClick={() => handleExpand(goal.id)}
                                                                    aria-label={isExpanded ? "Свернуть" : "Развернуть"}
                                                                >
                                                                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                                </button>
                                                            ) : (
                                                                <span className="expand-placeholder" />
                                                            )}

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
                                                                <span>
                                                                    {goal.totalCost ? formatCost(goal.totalCost) : "—"}
                                                                </span>
                                                            
                                                                <button
                                                                    className="expand-btn"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setGoalToDelete(goal);
                                                                    }}
                                                                    aria-label="Удалить цель"
                                                                    >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </span>
                                                        </div>
                                                        
                                                        {isExpanded && (
                                                            <div className="goal-items">
                                                                {goal.items.map((item) => (
                                                                    <div className="goal-item-row" key={item.id}>
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={item.isCompleted}
                                                                            onChange={() => handleItemToggle(goal.id, item.id)}
                                                                        />
                                                                        <span className={item.isCompleted ? "goal-done" : "goal-title"}>
                                                                        {item.title}
                                                                        </span>
                                                                                                                    <span className="goal-cost">
                                                                            {item.cost ? formatCost(item.cost) : "—"}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </section>
                ))}
            </div>
            {goalToDelete && (
                <ConfirmDialog
                    title="Удалить цель?"
                    message={`«${goalToDelete.title}» будет удалена вместе со всеми подцелями. Это действие нельзя отменить.`}
                    isLoading={isDeleting}
                    onConfirm={() => handleDelete(goalToDelete.id)}
                    onCancel={() => setGoalToDelete(null)}
                />
            )}
            <Outlet context={{ goals, onGoalUpdate: handleUpdate, onItemToggle: handleItemToggle, onItemsSave: handleItemsSave }} />
        </div>
    );
}

export default GoalsPage;