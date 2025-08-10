// src/services/dataSource.ts
import * as real from "./kanbanApi";
import * as fake from "./kanbanApi.fake";

const MODE = process.env.NEXT_PUBLIC_DATA_SOURCE;

const api = MODE === "fake" ? fake : real;
export default api;

// Re-export types if needed
export type { DateValueType } from "react-tailwindcss-datepicker/dist/types";
