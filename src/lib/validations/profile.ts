import { z } from "zod"

export const profileSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }).max(100),
    location: z.string().min(2, { message: "Location is required" }).max(100),
    target_roles: z.string().min(2, { message: "Please specify target roles (comma separated)" }),
    certifications: z.string().optional(),
    education: z.string().min(2, { message: "Education history is required" }).max(500),
    contact_email: z.string().email({ message: "Invalid email" }).optional(),
    contact_phone: z.string().optional(),
    portfolio_links: z.string().optional(),
    skills: z.string().optional(),
    work_experience: z.string().optional(),
    master_resume: z.string().optional(), // Kept for backward compatibility
    master_cover_letter: z.string().optional(),
    remote_only: z.boolean().default(false),
    distance_miles: z.number().min(1).max(500).default(25),
})

export type ProfileFormValues = z.infer<typeof profileSchema>
