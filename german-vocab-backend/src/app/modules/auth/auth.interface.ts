export type TAccount = {
    name: string;
    email: string;
    password: string;
    lastPasswordChange?: Date;
    isDeleted?: boolean;
    accountStatus?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
    role?: "USER" | "ADMIN",
    isVerified?: boolean,
    learned?: TPersonalVocabulary[];
    pending?: TPersonalVocabulary[];
    lastVocabularyActivityAt?: Date;
    lastVocabularyActivityType?: "LEARNED" | "PENDING";
}

export type TPersonalVocabulary = {
    bangla: string;
    english: string[];
    sentence?: string;
};


export interface TRegisterPayload extends TAccount {}

export type TLoginPayload = {
    email: string;
    password: string
}

export type TJwtUser = {
    email: string,
    role?: "USER" | "ADMIN",
}
