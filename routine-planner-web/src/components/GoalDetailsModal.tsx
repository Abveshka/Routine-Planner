import { useState } from "react";
import { X } from "lucide-react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import "./GoalDetailsModal.css";

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
}

const SEASON_OPTIONS = ["Зима", "Весна", "Лето", "Осень"];
const SUB_PERIOD_OPTIONS = ["Начало", "Середина", "Конец"];

// Тип функции, которую мы получаем от GoalsPage
type GoalChanges = {
    title: string;
    description: string | null;
    season: number;
    subPeriod: number;
    manualCost: number | null
};
function GoalDetailsModal() {
    const { id } = useParams();
    const { goals, onGoalUpdate } = useOutletContext<{
        goals: Goal[];
        onGoalUpdate: (goalId: number, changes: GoalChanges) => Promise<boolean>;
    }>();

    const goal = goals.find((g) => g.id === Number(id));
    if (!goal) return null;

    return <GoalDetailsContent goal={goal} onGoalUpdate={onGoalUpdate} />;
}

// Внутренний компонент: сама модалка, здесь цель уже точно есть
function GoalDetailsContent({ goal, onGoalUpdate, }: 
    { goal: Goal; onGoalUpdate: (goalId: number, changes: GoalChanges) => Promise<boolean>; }) {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [title, setTitle] = useState(goal.title);
    const [description, setDescription] = useState(goal.description ?? "");
    const [season, setSeason] = useState(goal.season);
    const [subPeriod, setSubPeriod] = useState(goal.subPeriod);
    const [cost, setCost] = useState(goal.manualCost?.toString() ?? "");

    // вместо onClose
    function handleClose() {
        navigate("/goals");
    }

    async function handleSave() {
        // Простая проверка: пустое название сохранять нельзя
        if (!title.trim()) {
            alert("Название не может быть пустым");
            return;
        }

        setIsSaving(true); // блокируем кнопку, чтобы не нажали дважды

        const success = await onGoalUpdate(goal.id, {
            title: title.trim(),
            // пустое описание отправляем как null, потому что в Goal оно string | null
            description: description.trim() === "" ? null : description,
            season,
            subPeriod,
            manualCost: cost.trim() === "" ? null : Number(cost),
        });

        setIsSaving(false);

        if (success) {
            setIsEditing(false); // возвращаемся в режим просмотра
        } else {
            alert("Не удалось сохранить цель");
        }
    }
    function handleCancel() {
        setTitle(goal.title);
        setDescription(goal.description ?? "");
        setSeason(goal.season);
        setSubPeriod(goal.subPeriod);
        setCost(goal.manualCost?.toString() ?? "");
        setIsEditing(false);
    }

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={handleClose} aria-label="Закрыть">
                    <X size={18} />
                </button>

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
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    ) : (
                        <p className="modal-field-value">{goal.description || "Без описания"}</p>
                    )}
                </div>

                <div className="modal-field">
                    <span className="modal-field-label">Когда</span>
                    {isEditing ? (
                        <div className="modal-select-row">
                            <select value={season} onChange={(e) => setSeason(Number(e.target.value))}>
                                {SEASON_OPTIONS.map((label, index) => (
                                    <option key={index} value={index}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                            <select value={subPeriod} onChange={(e) => setSubPeriod(Number(e.target.value))}>
                                {SUB_PERIOD_OPTIONS.map((label, index) => (
                                    <option key={index} value={index}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <p className="modal-field-value">
                            {SEASON_OPTIONS[goal.season]}, {SUB_PERIOD_OPTIONS[goal.subPeriod]}, {goal.year}
                        </p>
                    )}
                </div>

                <div className="modal-field">
                    <span className="modal-field-label">Стоимость</span>
                    {isEditing ? (
                        <input
                            className="modal-input"
                            type="number"
                            min="0"
                            value={cost}
                            onChange={(e) => setCost(e.target.value)}
                            placeholder="Считается по подзадачам"
                        />
                    ) : (
                        <p className="modal-field-value">
                            {new Intl.NumberFormat("ru-RU").format(goal.totalCost)} ₽
                        </p>
                    )}
                </div>

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
                        <button className="modal-button modal-button-primary" onClick={() => setIsEditing(true)}>
                            Редактировать
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default GoalDetailsModal;