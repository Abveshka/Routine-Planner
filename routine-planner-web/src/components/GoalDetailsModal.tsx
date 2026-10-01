import { useState } from "react";
import {Check, Trash2, X} from "lucide-react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import "./GoalDetailsModal.css";

interface GoalItem {
    id: number;
    title: string;
    cost: number | null;
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

const SEASON_OPTIONS = ["Зима", "Весна", "Лето", "Осень"];
const SUB_PERIOD_OPTIONS = ["Начало", "Середина", "Конец"];

type GoalChanges = {
    title: string;
    description: string | null;
    year: number;
    season: number;
    subPeriod: number;
    manualCost: number | null
};

type ItemsChanges = {
    added: { title: string; cost: number | null }[];
    updated: { id: number; title: string; cost: number | null }[];
    deletedIds: number[];
};

type SubtaskDraft = { id: number; title: string; cost: string; isNew: boolean };
function GoalDetailsModal() {
    const { id } = useParams();
    const { goals, onGoalUpdate, onItemToggle, onItemsSave} = useOutletContext<{
        goals: Goal[];
        onGoalUpdate: (goalId: number, changes: GoalChanges) => Promise<boolean>;
        onItemToggle: (goalId: number, itemId: number) => Promise<void>;
        onItemsSave: (goalId: number, changes: ItemsChanges) => Promise<boolean>;
    }>();

    const goal = goals.find((g) => g.id === Number(id));
    if (!goal) return null;

    return <GoalDetailsContent goal={goal} onGoalUpdate={onGoalUpdate} onItemToggle={onItemToggle} onItemsSave={onItemsSave}/>;
}

function getYearOptions(selectedYear: number): number[] {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 11 }, (_, i) => currentYear + i);
    if (!years.includes(selectedYear)) {
        years.push(selectedYear);
        years.sort((a, b) => a - b);
    }
    return years;
}

function GoalDetailsContent({ goal, onGoalUpdate, onItemToggle, onItemsSave }: {
    goal: Goal;
    onGoalUpdate: (goalId: number, changes: GoalChanges) => Promise<boolean>;
    onItemToggle: (goalId: number, itemId: number) => Promise<void>;
    onItemsSave: (goalId: number, changes: ItemsChanges) => Promise<boolean>;
}) {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [title, setTitle] = useState(goal.title);
    const [description, setDescription] = useState(goal.description ?? "");
    const [year, setYear] = useState(goal.year);
    const [season, setSeason] = useState(goal.season);
    const [subPeriod, setSubPeriod] = useState(goal.subPeriod);
    const [cost, setCost] = useState(goal.manualCost?.toString() ?? "");
    const [subtasks, setSubtasks] = useState<SubtaskDraft[]>([]);

    function startEditing() {
        setSubtasks(
            goal.items.map((item) => ({
                id: item.id,
                title: item.title,
                cost: item.cost?.toString() ?? "",
                isNew: false,
            }))
        );
        setIsEditing(true);
    }

    function addSubtask() {
        setSubtasks((prev) => [...prev, { id: Date.now(), title: "", cost: "", isNew: true }]);
    }

    function updateSubtask(id: number, field: "title" | "cost", value: string) {
        setSubtasks((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
    }

    function removeSubtask(id: number) {
        setSubtasks((prev) => prev.filter((s) => s.id !== id));
    }
    function handleClose() {
        navigate("/goals");
    }

    function buildItemsChanges(): ItemsChanges {
        const toCost = (s: string) => (s.trim() === "" ? null : Number(s));

        // id старых подзадач, которые остались в форме
        const keptIds = new Set(subtasks.filter((s) => !s.isNew).map((s) => s.id));

        // Удалённые: были в оригинале, но в форме их больше нет
        const deletedIds = goal.items
            .filter((item) => !keptIds.has(item.id))
            .map((item) => item.id);

        // Новые: помечены isNew
        const added = subtasks
            .filter((s) => s.isNew)
            .map((s) => ({ title: s.title.trim(), cost: toCost(s.cost) }));

        // Изменённые: старые, у которых что-то отличается от оригинала
        const updated = subtasks
            .filter((s) => !s.isNew)
            .flatMap((s) => {
                const original = goal.items.find((item) => item.id === s.id);
                if (!original) return [];
                const title = s.title.trim();
                const cost = toCost(s.cost);
                const changed = original.title !== title || (original.cost ?? null) !== cost;
                return changed ? [{ id: s.id, title, cost }] : [];
            });

        return { added, updated, deletedIds };
    }

    async function handleSave() {
        if (!title.trim()) {
            alert("Название не может быть пустым");
            return;
        }
        if (subtasks.some((s) => !s.title.trim())) {
            alert("У всех подцелей должно быть название");
            return;
        }

        setIsSaving(true);

        const goalOk = await onGoalUpdate(goal.id, {
            title: title.trim(),
            description: description.trim() === "" ? null : description,
            year,
            season,
            subPeriod,
            manualCost: cost.trim() === "" ? null : Number(cost),
        });

        if (!goalOk) {
            setIsSaving(false);
            alert("Не удалось сохранить цель");
            return;
        }

        const changes = buildItemsChanges();
        const hasChanges =
            changes.added.length > 0 || changes.updated.length > 0 || changes.deletedIds.length > 0;

        const itemsOk = hasChanges ? await onItemsSave(goal.id, changes) : true;

        setIsSaving(false);

        if (itemsOk) {
            setIsEditing(false);
        } else {
            alert("Цель сохранена, но часть подцелей сохранить не удалось");
        }
    }

    function handleCancel() {
        setTitle(goal.title);
        setDescription(goal.description ?? "");
        setYear(goal.year);
        setSeason(goal.season);
        setSubPeriod(goal.subPeriod);
        setCost(goal.manualCost?.toString() ?? "");
        setIsEditing(false);
    }

    const hasManualCost = goal.manualCost !== null;

    const doneCount = goal.items.filter((i) => i.isCompleted).length;
    const progress =
        goal.items.length === 0 ? 0 : Math.round((doneCount / goal.items.length) * 100);

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={handleClose} aria-label="Закрыть">
                    <X size={18}/>
                </button>

                <div className="modal-columns">
                    <div className="modal-left">
                        {!isEditing && (
                            <span className="modal-chip">
                                {SEASON_OPTIONS[goal.season]} · {SUB_PERIOD_OPTIONS[goal.subPeriod]} · {goal.year}
                            </span>
                        )}

                        {isEditing ? (
                            <input
                                className="modal-input modal-title-input"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        ) : (
                            <h2 className="modal-title">{goal.title}</h2>
                        )}

                        <div className="modal-field">
                            <span className="modal-field-label">Описание</span>
                            {isEditing ? (
                                <textarea
                                    className="modal-input"
                                    rows={5}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            ) : (
                                <p className="modal-field-value">{goal.description || "Без описания"}</p>
                            )}
                        </div>

                        {isEditing && (
                            <div className="modal-field">
                                <span className="modal-field-label">Когда</span>
                                <div className="modal-select-row">
                                    <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                                        {getYearOptions(goal.year).map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                    <select value={season} onChange={(e) => setSeason(Number(e.target.value))}>
                                        {SEASON_OPTIONS.map((label, index) => (
                                            <option key={index} value={index}>{label}</option>
                                        ))}
                                    </select>
                                    <select value={subPeriod} onChange={(e) => setSubPeriod(Number(e.target.value))}>
                                        {SUB_PERIOD_OPTIONS.map((label, index) => (
                                            <option key={index} value={index}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {isEditing ? (
                            <div className="modal-field">
                                <span className="modal-field-label">Стоимость</span>
                                <input
                                    className="modal-input"
                                    type="number"
                                    min="0"
                                    value={cost}
                                    onChange={(e) => setCost(e.target.value)}
                                    placeholder="Считается по подцелям"
                                />
                            </div>
                        ) : (
                            <div className="modal-price">
                                <span className="modal-price-label">Стоимость</span>
                                <span className="modal-price-value">
                                    {new Intl.NumberFormat("ru-RU").format(goal.totalCost)} ₽
                                </span>
                                <span className="modal-price-hint">
                                    {hasManualCost
                                        ? "задана вручную"
                                        : goal.items.length > 0
                                            ? "сумма подцелей"
                                            : "пока не указана"}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="modal-right">
                        <div className="modal-right-header">
                            <span className="modal-field-label">Подцели</span>
                            {goal.items.length > 0 && (
                                <span className="modal-counter">
                                {doneCount} из {goal.items.length}
                            </span>
                            )}
                        </div>

                        {goal.items.length > 0 && (
                            <div className="modal-progress">
                                <div className="modal-progress-fill" style={{ width: `${progress}%` }} />
                            </div>
                        )}

                        {isEditing ? (
                            <div className="modal-items">
                                {subtasks.map((s) => (
                                    <div key={s.id} className="modal-subtask-row">
                                        <div className="modal-subtask-top">
                                            <input
                                                className="modal-input"
                                                value={s.title}
                                                onChange={(e) => updateSubtask(s.id, "title", e.target.value)}
                                                placeholder="Название подцели"
                                            />
                                            <button
                                                type="button"
                                                className="modal-subtask-remove"
                                                onClick={() => removeSubtask(s.id)}
                                                aria-label="Удалить подцель"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <input
                                            className="modal-input modal-subtask-cost"
                                            type="number"
                                            min="0"
                                            value={s.cost}
                                            onChange={(e) => updateSubtask(s.id, "cost", e.target.value)}
                                            placeholder="₽"
                                        />
                                    </div>
                                ))}
                                <button type="button" className="modal-add-subtask" onClick={addSubtask}>
                                    + Добавить подцель
                                </button>
                            </div>
                        ) : goal.items.length === 0 ? (
                            <p className="modal-empty">Подцелей пока нет</p>
                        ) : (
                            <div className="modal-items">
                                {goal.items.map((item) => (
                                    <label
                                        className={`modal-item-row ${item.isCompleted ? "is-done" : ""}`}
                                        key={item.id}
                                    >
                                        <input
                                            className="modal-check-input"
                                            type="checkbox"
                                            checked={item.isCompleted}
                                            onChange={() => onItemToggle(goal.id, item.id)}
                                        />
                                        <span className="modal-check">
                        <Check size={14} strokeWidth={3} />
                    </span>
                                        <span className="modal-item-title">{item.title}</span>
                                        <span className="modal-item-cost">
                        {item.cost
                            ? new Intl.NumberFormat("ru-RU").format(item.cost) + " ₽"
                            : "—"}
                    </span>
                                    </label>
                                ))}
                            </div>
                        )}

                        <div className="modal-actions">
                            {isEditing ? (
                                <>
                                    <button
                                        className="modal-button modal-button-secondary"
                                        onClick={handleCancel}
                                        disabled={isSaving}
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        className="modal-button modal-button-primary"
                                        onClick={handleSave}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? "Сохранение..." : "Сохранить"}
                                    </button>
                                </>
                            ) : (
                                <button
                                    className="modal-button modal-button-primary"
                                    onClick={startEditing}
                                >
                                    Редактировать
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default GoalDetailsModal;