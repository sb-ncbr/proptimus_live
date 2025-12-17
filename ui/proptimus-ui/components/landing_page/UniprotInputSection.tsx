"use client";
import React, { useEffect, useRef, useState } from "react";
import { Search, Upload, X } from "lucide-react";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { Badge } from "../common/Badge";
import { Skeleton } from "../common/Skeleton";
import { useSubmitJob } from "../../hooks/useProptimusApi";
import useInputHinting from "../../hooks/useInputQueryHinting";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/utils";
import { validateFile } from "../../lib/fileValidation";

const UniprotInputSection: React.FC = () => {
    const [code, setCode] = useState("");
    const [ph, setPh] = useState("7.0");
    const [file, setFile] = useState<File | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [isShaking, setIsShaking] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const submitJob = useSubmitJob();
    const { hints, isLoading } = useInputHinting(code);

    const router = useRouter();

    useEffect(() => {
        if (submitJob.isSuccess && submitJob.data) {
            toast.success("Job submitted! Redirecting to results...");
            // Backend now returns { ID, status }
            const jobId = submitJob.data.ID;
            setTimeout(() => {
                router.push(`/results?query=${encodeURIComponent(jobId)}`);
            }, 1500); // 1.5s delay for toast
        }
        if (submitJob.isError) {
            triggerShake();
            const errorMessage = submitJob.error instanceof Error ? submitJob.error.message : 'Unknown error occurred';
            toast.error(`Error: ${errorMessage}`);

            // If it's a 400-level error (validation error), show for longer
            // but don't redirect to error page - keep user on form
        }
    }, [submitJob.isSuccess, submitJob.data, submitJob.isError, submitJob.error, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!code && !file) || !ph) return;

        // Check if optimization already exists before submitting
        if (code && ph && !file) {
            const jobId = `${code}_${ph}`;
            setIsChecking(true);

            try {
                const res = await apiFetch(`/api/running_progress?ID=${encodeURIComponent(jobId)}`);

                // Handle 406 Not Acceptable - invalid UniProt code format
                if (res.status === 406) {
                    let errorMessage = "Invalid protein code or format";
                    try {
                        const errorData = await res.json();
                        errorMessage = errorData.message || errorData.error || errorMessage;
                    } catch (e) {
                        // If can't parse JSON, use default message
                    }
                    toast.error(errorMessage);
                    triggerShake();
                    setIsChecking(false);
                    return;
                }

                if (res.ok) {
                    const data = await res.json();

                    // If not applicable, show error and don't submit
                    if (data.status === 'not applicable') {
                        toast.error(data.message || "Invalid protein code or format");
                        triggerShake();
                        setIsChecking(false);
                        return;
                    }

                    // If already finished, redirect immediately
                    if (data.status === 'finished') {
                        toast.success("Optimization already complete! Redirecting...");
                        setTimeout(() => {
                            router.push(`/results?query=${encodeURIComponent(jobId)}`);
                        }, 1000);
                        setIsChecking(false);
                        return;
                    }

                    // If running or queued, redirect to progress page
                    if (data.status === 'running' || data.status === 'queued') {
                        toast.info("Optimization already in progress! Redirecting...");
                        setTimeout(() => {
                            router.push(`/results?query=${encodeURIComponent(jobId)}`);
                        }, 1000);
                        setIsChecking(false);
                        return;
                    }
                }
            } catch (error) {
                console.log("Job doesn't exist yet, submitting new job");
            }
            setIsChecking(false);
        }

        // Submit new job if not already finished
        submitJob.mutate({ file, code, ph });
    };

    const triggerShake = () => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 400);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];

            // Validate the file
            const validation = await validateFile(selectedFile);

            if (!validation.isValid) {
                toast.error(validation.error || "Invalid file");
                triggerShake();
                // Clear the file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
                return;
            }

            setFile(selectedFile);
            setCode(""); // Clear code input if file is selected
            toast.success("File validated successfully!");
        }
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];

            // Validate the file
            const validation = await validateFile(droppedFile);

            if (!validation.isValid) {
                toast.error(validation.error || "Invalid file");
                triggerShake();
                return;
            }

            setFile(droppedFile);
            setCode("");
            toast.success("File validated successfully!");
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleRemoveFile = () => {
        setFile(null);
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCode(e.target.value);
        setShowSuggestions(e.target.value.length > 0);
    };

    const handleSuggestionClick = (suggestion: string) => {
        setCode(suggestion);
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    const handleInputBlur = () => {
        // Delay hiding suggestions to allow clicking on them
        setTimeout(() => setShowSuggestions(false), 150);
    };

    const handleInputFocus = () => {
        if (code.length > 0) {
            setShowSuggestions(true);
        }
    };

    const handlePhChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numValue = parseFloat(value);

        // Allow empty string or valid numbers within range
        if (value === "" || (!isNaN(numValue) && numValue >= 0 && numValue <= 14)) {
            setPh(value);
        }
    };

    const handlePhBlur = () => {
        // Convert to number and ensure it has at least one decimal place
        const numValue = parseFloat(ph);
        if (!isNaN(numValue)) {
            if (numValue < 0) {
                setPh("0.0");
                toast.error("pH must be between 0.0 and 14.0");
            } else if (numValue > 14) {
                setPh("14.0");
                toast.error("pH must be between 0.0 and 14.0");
            } else {
                // Always format to at least one decimal place
                setPh(numValue.toFixed(1));
            }
        } else if (ph === "") {
            setPh("7.0");
        }
    };

    const handleExampleClick = (exampleCode: string, examplePh: string) => {
        setCode(exampleCode);
        setPh(examplePh);
        setFile(null);
        toast.info(`Example loaded: ${exampleCode} at pH ${examplePh}`);
    };

    return (
        <section className="flex flex-col items-center gap-6 pt-8 pb-0">


            <form className="w-full max-w-2xl" onSubmit={handleSubmit}>
                <div className="flex w-full gap-4">
                    <div
                        ref={containerRef}
                        className={`relative w-3/4 ${isShaking ? 'shake-animation' : ''}`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                    >
                        <Input
                            ref={inputRef}
                            type="text"
                            value={code}
                            onChange={handleCodeChange}
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                            placeholder={file ? "" : "Enter UniProt ID or drop PDB file"}
                            className={`text-xl py-6 pl-12 pr-12 ${file ? "bg-gray-100 cursor-not-allowed" : ""}`}
                            disabled={!!file}
                        />
                        <Search
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                            size={24}
                        />
                        <button
                            type="button"
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary"
                            onClick={() => fileInputRef.current?.click()}
                            tabIndex={-1}
                        >
                            <Upload size={24} />
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdb"
                            style={{ display: "none" }}
                            onChange={handleFileChange}
                        />
                        {file && (
                            <div className="absolute left-1/4 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-auto">
                                <Badge onRemove={handleRemoveFile}>
                                    {file.name}
                                </Badge>
                            </div>
                        )}

                        {/* Suggestions Dropdown */}
                        {showSuggestions && !file && (
                            <div className="absolute z-100 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto">
                                {isLoading ? (
                                    <div className="px-4 py-3 space-y-2">
                                        <Skeleton className="h-6 w-20" />
                                        <Skeleton className="h-6 w-16" />
                                        <Skeleton className="h-6 w-24" />
                                        <Skeleton className="h-6 w-18" />
                                    </div>
                                ) : hints.length > 0 ? (
                                    hints.map((hint, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            className="w-full text-blackpx-4 py-3 text-left text-xl hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                                            onClick={() => handleSuggestionClick(hint)}
                                        >
                                            <span className="dark-silver-text px-4">{hint}</span>
                                        </button>
                                    ))
                                ) : code.length > 0 ? (
                                    <div className="px-4 py-3 text-primary-foreground text-md">
                                        No suggestions found
                                    </div>
                                ) : null}
                            </div>
                        )}

                    </div>
                    <div className="w-1/4">
                        <Input
                            type="number"
                            step={0.1}
                            min={0}
                            max={14}
                            value={ph}
                            onChange={handlePhChange}
                            onBlur={handlePhBlur}
                            placeholder="pH value (e.g. 7.0)"
                            className="text-xl py-6 pl-6"
                        />
                    </div>
                </div>
                {/* Example Badges */}
                <div className="flex items-center justify-center gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => handleExampleClick("L8BU87", "8.0")}
                        className="px-4 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 rounded-full text-sm font-semibold border border-blue-200 transition-all duration-200 hover:shadow-md"
                    >
                        UniProt ID L8BU87 • pH 8.0
                    </button>
                    <button
                        type="button"
                        onClick={() => handleExampleClick("P0DL07", "7.0")}
                        className="px-4 py-1.5 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-700 rounded-full text-sm font-semibold border border-purple-200 transition-all duration-200 hover:shadow-md"
                    >
                        UniProt ID P0DL07 • pH 7.0
                    </button>
                </div>
                <div className="mt-8 flex justify-center">
                    <Button
                        size="xxl"
                        className="text-lg px-8 py-4"
                        type="submit"
                        disabled={submitJob.isPending || isChecking}
                    >
                        {isChecking ? "Checking..." : submitJob.isPending ? "Submitting..." : "Start Optimisation"}
                    </Button>
                </div>
            </form>

        </section>
    );
};

export default UniprotInputSection;
