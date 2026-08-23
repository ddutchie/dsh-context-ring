import React from "react";
import type { ContextRingUsage } from "../types.js";
export interface ContextRingProps {
    usage?: ContextRingUsage;
    size?: number;
    strokeWidth?: number;
    className?: string;
    colors?: {
        system?: string;
        tools?: string;
        skills?: string;
        toolOutputs?: string;
        conversation?: string;
        track?: string;
    };
}
export declare const ContextRing: React.FC<ContextRingProps>;
//# sourceMappingURL=ContextRing.d.ts.map