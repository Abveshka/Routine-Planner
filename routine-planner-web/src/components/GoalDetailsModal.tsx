import { useState } from "react";
import { X } from "lucide-react";
import "./GoalDetailsModal.css";

interface Goal {
    id: number;
    title: string;
    description: string | null;
    year: number;
    season: number;
    subPeriod: number;
    totalCost: number;
    isCompleted: boolean;
}

interface GoalDetailsModalProps {
    goal: Goal;
    seasonLabel: string;
    subPeriodLabel: string;
    onClose: () => void;
}

const SEASON_OPTIONS = ["Зима", "Весна", "Лето", "Осень"];
const SUB_PERIOD_OPTIONS = ["Начало", "Середина", "Конец"];

function GoalDetailsModal({ goal, seasonLabel, subPeriodLabel, onClose }: GoalDetailsModalProps) {
    const [isEditing, setIsEditing] = useState(false);

    const [title, setTitle] = useState(goal.title);
    const [description, setDescription] = useState(goal.description ?? "");
    const [season, setSeason] = useState(goal.season);
    const [subPeriod, setSubPeriod] = useState(goal.subPeriod);
    const [cost, setCost] = useState(goal.totalCost);

    function handleCancel() {
        setTitle(goal.title);
        setDescription(goal.description ?? "");
        setSeason(goal.season);
        setSubPeriod(goal.subPeriod);
        setCost(goal.totalCost);
        setIsEditing(false);
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose} aria-label="Закрыть">
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
                            {seasonLabel}, {subPeriodLabel}, {goal.year}
                        </p>
                    )}
                </div>

                <div className="modal-field">
                    <span className="modal-field-label">Стоимость</span>
                    {isEditing ? (
                        <input
                            className="modal-input"
                            type="number"
                            value={cost}
                            onChange={(e) => setCost(Number(e.target.value))}
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
                            <button className="modal-button modal-button-secondary" onClick={handleCancel}>
                                Отмена
                            </button>
                            <button className="modal-button modal-button-primary" onClick={() => {}}>
                                Сохранить
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