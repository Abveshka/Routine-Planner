export enum Season {
    Winter = 0,
    Spring = 1,
    Summer = 2,
    Autumn = 3
}

export enum SubPeriod {
    Early = 0,
    Mid = 1,
    Late = 2
}

export interface GoalItemDto {
    id: number;
    title: string;
    cost: number;
    isCompleted: boolean;
    createdAt: string;
}

export interface GoalDto {
    id: number;
    title: string;
    description?: string;
    year: number;
    season: Season;
    subPeriod: SubPeriod;
    totalCost: number;
    isCompleted: boolean;
    createdAt: string;
    items: GoalItemDto[];
}