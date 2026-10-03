import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { Snowflake, Flower2, Sun, Leaf, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import "./CalendarPage.css";

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

type ItemsChanges = {
    added: { title: string; cost: number | null }[];
    updated: { id: number; title: string; cost: number | null }[];
    deletedIds: number[];
};
interface JarSlot {
    year: number;
    season: number;
    groups: Goal[][];
}

const SUB_PERIOD_LABELS = ["Начало", "Середина", "Конец"];

const SEASONS = [
    { label: "Зима", Icon: Snowflake, accent: "#2f6fed", bg: "#e8f0fe", mid: "#a9c4ff" },
    { label: "Весна", Icon: Flower2, accent: "#3b8c3b", bg: "#eaf5e9", mid: "#9bd199" },
    { label: "Лето", Icon: Sun, accent: "#d98324", bg: "#fcf0dd", mid: "#f6c07b" },
    { label: "Осень", Icon: Leaf, accent: "#c1502e", bg: "#fbe9e3", mid: "#f0a98f" },
];

function currentSeason() {
    const m = new Date().getMonth();
    return m === 11 ? 0 : Math.floor((m + 1) / 3);
}

const THIS_YEAR = new Date().getFullYear();
const THIS_SEASON = currentSeason();

function formatCost(cost: number) {
    return new Intl.NumberFormat("ru-RU").format(cost) + " ₽";
}

function pluralGoals(n: number) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return `${n} цель`;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return `${n} цели`;
    return `${n} целей`;
}

function seeded(id: number, n: number) {
    const x = Math.sin(id * 12.9898 + n * 78.233) * 43758.5453;
    return x - Math.floor(x);
}

function CalendarPage() {
    const { token, logout } = useAuth();
    const navigate = useNavigate();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [active, setActive] = useState(THIS_SEASON);
    const trackRef = useRef<HTMLDivElement>(null);

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
                setLoaded(true);
                return;
            }
            response.json().then((data) => {
                setGoals(data);
                setLoaded(true);
            });
        });
    }, [token, logout]);

    // Только те банки, для которых есть цели: пара «год + сезон» без целей не рисуется
    const slots = useMemo(() => {
        const map = new Map<string, JarSlot>();
        goals.forEach((g) => {
            const key = `${g.year}-${g.season}`;
            let slot = map.get(key);
            if (!slot) {
                slot = { year: g.year, season: g.season, groups: [[], [], []] };
                map.set(key, slot);
            }
            slot.groups[g.subPeriod]?.push(g);
        });
        return [...map.values()].sort((a, b) => a.year - b.year || a.season - b.season);
    }, [goals]);

    // Какую банку ставим в центр: текущий сезон, а если для него целей нет,
    // то ближайший следующий, а если и таких нет, то последний из прошедших.
    const targetIndex = useMemo(() => {
        const exact = slots.findIndex((s) => s.year === THIS_YEAR && s.season === THIS_SEASON);
        if (exact !== -1) return exact;
        const next = slots.findIndex(
            (s) => s.year > THIS_YEAR || (s.year === THIS_YEAR && s.season > THIS_SEASON)
        );
        return next !== -1 ? next : slots.length - 1;
    }, [slots]);

    useEffect(() => {
        if (loaded) scrollToSlot(targetIndex, false);
    }, [loaded]);

    function scrollToSlot(index: number, smooth = true) {
        const track = trackRef.current;
        if (!track) return;
        const i = Math.max(0, Math.min(track.children.length - 1, index));
        (track.children[i] as HTMLElement | undefined)?.scrollIntoView({
            behavior: smooth ? "smooth" : "auto",
            inline: "center",
            block: "nearest",
        });
    }

    function handleScroll() {
        const track = trackRef.current;
        if (!track) return;
        const center = track.getBoundingClientRect().left + track.clientWidth / 2;
        let best = 0, bestDist = Infinity;
        Array.from(track.children).forEach((child, i) => {
            const r = child.getBoundingClientRect();
            const d = Math.abs(r.left + r.width / 2 - center);
            if (d < bestDist) { bestDist = d; best = i; }
        });
        setActive(best);
    }

    async function handleToggle(goalId: number) {
        const flip = () =>
            setGoals((prev) =>
                prev.map((g) => (g.id === goalId ? { ...g, isCompleted: !g.isCompleted } : g))
            );
        flip();
        const response = await fetch(`http://localhost:5112/api/goals/${goalId}/toggle`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 401) { logout(); return; }
        if (!response.ok) {
            console.error("Не удалось изменить статус цели");
            flip();
        }
    }

    async function handleItemToggle(goalId: number, itemId: number) {
        const flipItem = () =>
            setGoals((prev) =>
                prev.map((goal) =>
                    goal.id === goalId
                        ? {
                            ...goal,
                            items: goal.items.map((item) =>
                                item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
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

        if (response.status === 401) { logout(); return; }
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

        for (const itemId of changes.deletedIds) {
            const res = await fetch(`${base}/${itemId}`, { method: "DELETE", headers });
            if (res.status === 401) { logout(); return false; }
            if (!res.ok) allOk = false;
        }

        for (const item of changes.updated) {
            const res = await fetch(`${base}/${item.id}`, {
                method: "PUT",
                headers,
                body: JSON.stringify({ title: item.title, cost: item.cost }),
            });
            if (res.status === 401) { logout(); return false; }
            if (!res.ok) allOk = false;
        }

        for (const item of changes.added) {
            const res = await fetch(base, {
                method: "POST",
                headers,
                body: JSON.stringify({ title: item.title, cost: item.cost }),
            });
            if (res.status === 401) { logout(); return false; }
            if (!res.ok) allOk = false;
        }

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

        if (response.status === 401) { logout(); return false; }
        if (!response.ok) {
            console.error("Не удалось сохранить цель, статус:", response.status);
            return false;
        }

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

    return (
        <div className="page-layout">
            <Sidebar />
            <div className="calendar-page">
                {loaded && slots.length === 0 && (
                    <div className="calendar-empty">Пока нет целей, банки появятся, когда вы их добавите</div>
                )}
                <div className="carousel">
                    <button
                        className="carousel-arrow left"
                        onClick={() => scrollToSlot(active - 1)}
                        disabled={active === 0}
                        aria-label="Предыдущая банка"
                    >
                        <ChevronLeft size={24} strokeWidth={2.5} />
                    </button>

                    <div className="carousel-track" ref={trackRef} onScroll={handleScroll}>
                        {slots.map((slot, si) => {
                            const season = SEASONS[slot.season];
                            const all = slot.groups.flat();
                            const total = all.reduce((sum, g) => sum + (g.totalCost || 0), 0);
                            const isNow = slot.year === THIS_YEAR && slot.season === THIS_SEASON;
                            const isYearStart = si > 0 && slots[si - 1].year !== slot.year;

                            return (
                                <div
                                    key={`${slot.year}-${slot.season}`}
                                    className={
                                        "jar-slot" +
                                        (active === si ? " is-active" : "") +
                                        (isYearStart ? " year-start" : "")
                                    }
                                    style={{
                                        ["--accent" as string]: season.accent,
                                        ["--tint" as string]: season.bg,
                                        ["--mid" as string]: season.mid,
                                    }}
                                    onClick={() => active !== si && scrollToSlot(si)}
                                >
                                    <div className="jar-head">
                                        <span className="season-badge" style={{ background: season.bg }}>
                                            <season.Icon size={16} color={season.accent} />
                                        </span>
                                        <span className="season-name">{season.label}</span>
                                        {isNow && (
                                            <span
                                                className="now-badge"
                                                style={{ background: season.bg, color: season.accent }}
                                            >
                                                сейчас
                                            </span>
                                        )}
                                    </div>
                                    <div className="jar-lid" />
                                    <div className="jar-neck" />

                                    <div className="jar-wrap">
                                        <div className="jar-label">{slot.year}</div>
                                        <div className="jar">
                                            {slot.groups.map((items, pi) =>
                                                items.length === 0 ? null : (
                                                    <div className="jar-group" key={pi}>
                                                        <div className="jar-zone-label">{SUB_PERIOD_LABELS[pi]}</div>
                                                        {items.map((goal) => (
                                                            <div
                                                                key={goal.id}
                                                                className={`pebble ${goal.isCompleted ? "done" : ""}`}
                                                                style={{
                                                                    marginLeft: `${seeded(goal.id, 1) * 38}%`,
                                                                    transform: `rotate(${(seeded(goal.id, 2) - 0.5) * 12}deg)`,
                                                                    borderColor: season.accent + "55",
                                                                }}
                                                            >
                                                                <button
                                                                    className="pebble-check"
                                                                    style={
                                                                        goal.isCompleted
                                                                            ? { background: season.accent, borderColor: season.accent }
                                                                            : undefined
                                                                    }
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleToggle(goal.id);
                                                                    }}
                                                                    aria-label="Отметить выполненной"
                                                                >
                                                                    {goal.isCompleted && <Check size={11} color="#fff" strokeWidth={3} />}
                                                                </button>
                                                                <span
                                                                    className="pebble-title"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        navigate(`/calendar/${goal.id}`);
                                                                    }}
                                                                >
                                                                    {goal.title}
                                                                    {goal.totalCost > 0 && <small>{formatCost(goal.totalCost)}</small>}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>

                                    <div className="jar-footer">
                                        {pluralGoals(all.length)}
                                        {total > 0 && <> · {formatCost(total)}</>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <button
                        className="carousel-arrow right"
                        onClick={() => scrollToSlot(active + 1)}
                        disabled={active === slots.length - 1}
                        aria-label="Следующая банка"
                    >
                        <ChevronRight size={24} strokeWidth={2.5} />
                    </button>
                </div>
                
            </div>
            <Outlet
                context={{
                    goals,
                    onGoalUpdate: handleUpdate,
                    onItemToggle: handleItemToggle,
                    onItemsSave: handleItemsSave,
                }}
            />
        </div>
    );
}
export default CalendarPage;