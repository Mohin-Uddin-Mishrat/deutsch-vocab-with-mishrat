import { z } from "zod";

// Zod schema matching TAccount / authSchema
const register_validation = z.object({
    email: z.string({ message: "Email is required" }).email(),
    password: z.string({ message: "Password is required" }),
    name: z.string({ message: "Name is required" })
});

const login_validation = z.object({
    email: z.string({ message: "Email is required" }),
    password: z.string({ message: "Email is required" })
})

const changePassword = z.object({
    oldPassword: z.string({ message: "Old Password is required" }),
    newPassword: z.string({ message: "New Password is required" })
})

const forgotPassword = z.object({ email: z.string({ message: "Email is required" }) })
const resetPassword = z.object({
    token: z.string(),
    newPassword: z.string(),
    email: z.string()
})
const verified_account = z.object({
    token: z.string({ message: "Token is Required!!" })
})
const uploadPersonalVocabulary = z.object({
    input: z.string().trim().min(1, 'Vocabulary input is required'),
});
const deletePersonalVocabulary = z.object({
    bangla: z.string().trim().min(1, 'Bangla vocabulary is required'),
});
const deletePersonalVocabularies = z.object({
    bangla: z.array(z.string().trim().min(1)).min(1, 'Select at least one vocabulary item').max(500),
});
const submitExam = z.object({
    answers: z.array(z.object({ bangla: z.string().trim().min(1), answer: z.string().max(200) })).min(1).max(100),
});

export const auth_validation = {
    register_validation,
    login_validation,
    changePassword,
    forgotPassword,
    resetPassword,
    verified_account,
    uploadPersonalVocabulary,
    deletePersonalVocabulary,
    deletePersonalVocabularies,
    submitExam,
}
