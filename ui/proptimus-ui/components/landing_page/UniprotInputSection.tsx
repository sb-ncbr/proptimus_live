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

const UniprotInputSection: React.FC = () => {
    const [code, setCode] = useState("");
    const [ph, setPh] = useState("7.0");
    const [file, setFile] = useState<File | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const submitJob = useSubmitJob();
    const { hints, isLoading } = useInputHinting(code);

    const router = useRouter();

    useEffect(() => {
        if (submitJob.isSuccess && submitJob.data) {
            toast.success("Job submitted! Redirecting to results...");
            let query = "";
            if (file) {
                // If you use file, you may need to get the job ID from submitJob.data
                // Adjust this logic based on your backend response
                try {
                    const responseText = submitJob.data as string;
                    const data = typeof responseText === "string" ? JSON.parse(responseText) : responseText;
                    query = (data as any)?.ID || "";
                } catch {
                    query = "";
                }
            } else {
                // If using code and ph, build query from state
                query = `${code}_${ph}`;
            }
            setTimeout(() => {
                router.push(`/results?query=${encodeURIComponent(query)}`);
            }, 1500); // 1.5s delay for toast
        }
    }, [submitJob.isSuccess, submitJob.data, file, code, ph, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!code && !file) || !ph) return;

        // Check if optimization already exists before submitting
        if (code && ph && !file) {
            const jobId = `${code}_${ph}`;
            setIsChecking(true);

            try {
                const res = await apiFetch(`/api/running_progress?ID=${encodeURIComponent(jobId)}`);
                if (res.ok) {
                    const data = await res.json();

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setCode(""); // Clear code input if file is selected
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setCode("");
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
        setPh(e.target.value);
    };

    const handlePhBlur = () => {
        // Convert whole numbers to have at least one decimal place
        const numValue = parseFloat(ph);
        if (!isNaN(numValue) && Number.isInteger(numValue)) {
            setPh(numValue.toFixed(1));
        }
    };

    return (
        <section className="flex flex-col items-center gap-6 pt-8 pb-0">
            <form className="w-full max-w-2xl" onSubmit={handleSubmit}>
                <div className="flex w-full gap-4">
                    <div
                        className="relative w-3/4"
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
                            accept=".pdb,.cif,.txt"
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
                            value={ph}
                            onChange={handlePhChange}
                            onBlur={handlePhBlur}
                            placeholder="pH value (e.g. 7.0)"
                            className="text-xl py-6 pl-6"
                        />
                    </div>
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