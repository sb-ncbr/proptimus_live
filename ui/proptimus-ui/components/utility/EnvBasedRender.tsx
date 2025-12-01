"use client";

import { ReactNode } from "react";

interface EnvBasedRenderProps {
    children: ReactNode;
    allowedEnvs: string[];
}

export default function EnvBasedRender({ children, allowedEnvs }: EnvBasedRenderProps) {
    const currentEnv = process.env.NODE_ENV || "production";

    // Check if current environment is in the allowed list
    const shouldRender = allowedEnvs.includes(currentEnv) || allowedEnvs.includes("dev") && currentEnv === "development";

    if (!shouldRender) {
        return null;
    }

    return <>{children}</>;
}
