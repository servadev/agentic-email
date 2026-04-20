// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { FloppyDiskIcon, PaperPlaneTiltIcon, XIcon, WarningCircleIcon, RobotIcon, MagicWandIcon } from "@phosphor-icons/react";
import { useParams } from "react-router";
import { useUIStore } from "~/hooks/useUIStore";
import { htmlToPlainText } from "~/lib/utils";
import { formatQuotedDate } from "shared/dates";
import { Tooltip } from "@cloudflare/kumo";
import { useComposeForm } from "~/hooks/useComposeForm";
import RichTextEditor from "./RichTextEditor";
import { useState, useEffect, useRef } from "react";
import api from "~/services/api";
import DOMPurify from "dompurify";
import EmailInput from "./EmailInput";

export default function ComposePanel() {
	const { mailboxId, folder } = useParams<{
		mailboxId: string;
		folder: string;
	}>();

	const { composeOptions } = useUIStore();
	const originalEmail = composeOptions.originalEmail;

	const {
		to,
		setTo,
		cc,
		setCc,
		bcc,
		setBcc,
		showCcBcc,
		setShowCcBcc,
		subject,
		setSubject,
		body,
		setBody,
		error,
		isSavingDraft,
		isSending,
		formTitle,
		handleSaveDraft,
		handleSend,
		closeCompose,
	} = useComposeForm(mailboxId, folder);

	const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
	const [aiPrompt, setAIPrompt] = useState("");
	const [isAIGenerating, setIsAIGenerating] = useState(false);
	const [aiDraftPreview, setAIDraftPreview] = useState("");

	const [aiDraftError, setAIDraftError] = useState("");
	const [aiWizardStep, setAiWizardStep] = useState(1);
	const [aiTo, setAiTo] = useState("");
	const [aiSubject, setAiSubject] = useState("");
	const aiPromptInputRef = useRef<HTMLTextAreaElement>(null);
	const aiToInputRef = useRef<HTMLInputElement>(null);
	const aiSubjectInputRef = useRef<HTMLInputElement>(null);
	const modalRef = useRef<HTMLDivElement>(null);

	const closeAIWizard = () => {
		setIsAIDialogOpen(false);
		setAiTo("");
		setAiSubject("");
		setAIPrompt("");
		setAIDraftPreview("");
		setAIDraftError("");
	};

	const openAIWizard = () => {
		setAiTo(to);
		setAiSubject(subject);
		setAIPrompt("");
		setAIDraftPreview("");
		setAIDraftError("");
		setAiWizardStep(to ? (subject ? 3 : 2) : 1);
		setIsAIDialogOpen(true);
	};

	// Auto-focus input when modal opens and trap focus
	useEffect(() => {
		if (isAIDialogOpen) {
			setTimeout(() => {
				if (aiWizardStep === 1) aiToInputRef.current?.focus();
				else if (aiWizardStep === 2) aiSubjectInputRef.current?.focus();
				else if (aiWizardStep === 3) aiPromptInputRef.current?.focus();
			}, 50);
		}
	}, [isAIDialogOpen, aiWizardStep]);

	// Trap focus inside modal
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!isAIDialogOpen || e.key !== "Tab" || !modalRef.current) return;

			const focusableElements = modalRef.current.querySelectorAll(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			);
			
			const firstElement = focusableElements[0] as HTMLElement;
			const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

			if (e.shiftKey) {
				if (document.activeElement === firstElement) {
					lastElement.focus();
					e.preventDefault();
				}
			} else {
				if (document.activeElement === lastElement) {
					firstElement.focus();
					e.preventDefault();
				}
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isAIDialogOpen, aiWizardStep]);

	const handleAIGenerate = async () => {
		if (!mailboxId || !aiPrompt.trim()) return;
		if (aiPrompt.trim().length < 5) {
			setAIDraftError("Prompt is too short. Please provide more details.");
			return;
		}
		if (aiPrompt.length > 2000) {
			setAIDraftError("Prompt is too long. Please keep it under 2000 characters.");
			return;
		}

		setIsAIGenerating(true);
		setAIDraftPreview("");
		setAIDraftError("");
		try {
			const originalEmailText = originalEmail ? htmlToPlainText(originalEmail.body || "") : undefined;
			const res = await api.draftAI(mailboxId, aiPrompt, originalEmailText);
			if (res.draft) {
				setAIDraftPreview(res.draft);
			} else if ((res as any).error) {
				setAIDraftError((res as any).error);
			}
		} catch (e: any) {
			console.error(e);
			setAIDraftError(e.message || "Failed to generate draft. Please try again.");
		} finally {
			setIsAIGenerating(false);
		}
	};

	const handleAISubmit = () => {
		if (aiDraftPreview) {
			const emails = aiTo.split(",").map((e) => e.trim()).filter(Boolean);
			const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
			const allValid = emails.length > 0 && emails.every(isValidEmail);

			if (!allValid) {
				setAiWizardStep(1);
				setAIDraftError("Please enter a valid email address.");
				return;
			}

			const sanitizedPreview = DOMPurify.sanitize(aiDraftPreview.replace(/\n/g, "<br>"));
			setBody((prev) => prev ? prev + "<br><br>" + sanitizedPreview : sanitizedPreview);
			setTo(aiTo);
			setSubject(aiSubject);
			closeAIWizard();
		}
	};

	const hasContent = to.trim() !== "" || subject.trim() !== "" || htmlToPlainText(body || "").trim() !== "";

	const inputClass = "w-full bg-sh-search-bg border border-sh-border-thin rounded-[2px] px-2.5 py-1.5 text-[13px] text-sh-text-white placeholder-sh-search-placeholder outline-none focus:border-sh-text-muted focus:ring-2 focus:ring-sh-accent transition-colors";
	const emailInputClass = "w-full bg-sh-search-bg border border-sh-border-thin rounded-[2px] px-2.5 py-1.5 text-[13px] text-sh-text-white placeholder-sh-search-placeholder outline-none focus-within:border-sh-text-muted focus-within:ring-2 focus-within:ring-sh-accent transition-colors";

	return (
		<div className="flex flex-col h-full bg-transparent text-sh-text-white">
			<div className="flex items-center justify-between px-4 py-3 border-b border-sh-border shrink-0 md:px-6">
				<h2 className="text-[13px] font-semibold text-sh-text-white">
					{formTitle}
				</h2>
				<div className="flex items-center gap-1">
					<button
						type="button"
						onClick={closeCompose}
						disabled={isSending}
						className="p-1.5 text-sh-text-muted hover:text-sh-text-white hover:bg-sh-bg-hover transition-colors rounded-[2px] focus:outline-none focus:ring-2 focus:ring-sh-accent disabled:opacity-50 disabled:cursor-not-allowed"
						aria-label="Close compose"
					>
						<XIcon size={16} />
					</button>
				</div>
			</div>

			{originalEmail && (
				<div className="px-4 md:px-6 py-3 border-b border-sh-border shrink-0 bg-sh-bg-panel text-[12px] overflow-y-auto max-h-[150px]">
					<div className="font-medium text-sh-text-muted mb-1 flex items-center justify-between">
						<span>Replying to {originalEmail?.sender || "Unknown Sender"}</span>
						<span className="text-[11px]">{originalEmail?.date ? formatQuotedDate(originalEmail.date) : ""}</span>
					</div>
					<div className="text-sh-text-read line-clamp-3 overflow-hidden text-ellipsis italic opacity-80 border-l-2 border-sh-border-thin pl-3">
						"{originalEmail?.snippet || htmlToPlainText(originalEmail?.body || "") || "No preview available"}"
					</div>
				</div>
			)}

			<form
				onSubmit={(e) => {
					e.preventDefault();
					handleSend(e).then(() => closeCompose()).catch((err) => { 
						console.error("ComposePanel handleSend failed:", err);
					});
				}}
				className="flex flex-col flex-1 min-h-0"
			>
				<div className="p-4 md:p-6 space-y-4 flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar">
					{error && (
						<div className="flex items-center gap-2 px-3 py-2 rounded-[2px] bg-red-500/10 border border-red-500/20 text-red-400 text-[12px]">
							<WarningCircleIcon size={16} />
							<span>{error}</span>
						</div>
					)}

					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<label className="text-[12px] font-medium text-sh-text-muted w-14 shrink-0 uppercase tracking-wider">
								To
							</label>
							<div className="flex-1 flex items-center gap-2 min-w-0">
								<EmailInput
									placeholder="recipient@example.com"
									className={emailInputClass}
									value={to}
									onChange={(val) => setTo(val)}
									required
								/>
								{!showCcBcc && (
									<button
										type="button"
										onClick={() => setShowCcBcc(true)}
										className="shrink-0 text-[12px] text-sh-text-muted hover:text-sh-text-white font-medium transition-colors"
									>
										CC / BCC
									</button>
								)}
							</div>
						</div>

						{showCcBcc && (
							<div className="flex items-center gap-2">
								<label className="text-[12px] font-medium text-sh-text-muted w-14 shrink-0 uppercase tracking-wider">
									CC
								</label>
								<div className="flex-1">
									<EmailInput
										className={emailInputClass}
										value={cc}
										onChange={(val) => setCc(val)}
										placeholder="Separate multiple addresses with commas"
									/>
								</div>
							</div>
						)}

						{showCcBcc && (
							<div className="flex items-center gap-2">
								<label className="text-[12px] font-medium text-sh-text-muted w-14 shrink-0 uppercase tracking-wider">
									BCC
								</label>
								<div className="flex-1">
									<EmailInput
										className={emailInputClass}
										value={bcc}
										onChange={(val) => setBcc(val)}
										placeholder="Separate multiple addresses with commas"
									/>
								</div>
							</div>
						)}

						<div className="flex items-center gap-2">
							<label className="text-[12px] font-medium text-sh-text-muted w-14 shrink-0 uppercase tracking-wider">
								Subject
							</label>
							<div className="flex-1">
								<input
									type="text"
									placeholder="Email subject"
									className={inputClass}
									value={subject}
									onChange={(e) => setSubject(e.target.value)}
									required
								/>
							</div>
						</div>
					</div>

					<div className="border border-sh-border-thin rounded-[2px] overflow-hidden bg-sh-bg-panel flex-1 flex flex-col min-h-[200px]">
						<RichTextEditor
							value={body}
							onChange={setBody}
						/>
					</div>
				</div>

				<div className="mt-auto px-4 py-3 border-t border-sh-border shrink-0 md:px-6 bg-transparent">
					<div className="flex items-center justify-between">
						<button 
							type="button" 
							onClick={closeCompose} 
							disabled={isSending}
							className="px-3 py-1.5 text-[12px] font-medium text-sh-text-muted hover:text-sh-text-white transition-colors focus:outline-none focus:ring-2 focus:ring-sh-accent rounded-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Discard
						</button>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={openAIWizard}
								className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-sh-text-muted hover:text-sh-text-white bg-transparent border border-sh-border hover:bg-sh-bg-hover transition-colors rounded-[2px] focus:outline-none focus:ring-2 focus:ring-sh-accent"
								aria-label="AI Assist"
							>
								<MagicWandIcon size={14} />
								AI Assist
							</button>

							{hasContent && (
								<Tooltip content="Save Draft" side="top" asChild>
									<button
										type="button"
										disabled={isSavingDraft}
										onClick={handleSaveDraft}
										className="p-1.5 text-sh-text-muted hover:text-sh-text-white rounded-[2px] transition-colors focus:outline-none focus:ring-2 focus:ring-sh-accent disabled:opacity-50 disabled:cursor-not-allowed"
										aria-label="Save draft"
									>
										<FloppyDiskIcon size={18} className={isSavingDraft ? "animate-pulse" : ""} />
									</button>
								</Tooltip>
							)}

							<button
								type="submit"
								disabled={isSavingDraft || isSending}
								className="flex items-center gap-1.5 bg-sh-accent hover:bg-opacity-90 text-sh-text-white px-3 py-1.5 rounded-[2px] text-[12px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-sh-accent disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<PaperPlaneTiltIcon size={14} className={isSending ? "animate-pulse" : ""} />
								{isSending ? "Sending..." : "Send"}
							</button>
						</div>
					</div>
				</div>
			</form>

			{isAIDialogOpen && (
				<div
					className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/50 backdrop-blur-sm"
					role="presentation"
					onClick={(e) => {
						if (e.target === e.currentTarget) closeAIWizard();
					}}
				>
					<div
						ref={modalRef}
						className="w-full max-w-2xl bg-gradient-to-br from-[#1a1b33] via-[#1a1226] to-[#2d152a] border border-sh-border rounded-lg shadow-2xl flex flex-col overflow-hidden"
						role="dialog"
						aria-modal="true"
						aria-labelledby="ai-draft-title"
						aria-describedby="ai-draft-description"
						tabIndex={-1}
						onKeyDown={(e) => {
							if (e.key === "Escape") {
								closeAIWizard();
							}
						}}
					>
						<div className="flex items-center justify-between px-4 py-3 border-b border-sh-border bg-transparent">
							<div className="flex items-center gap-2">
								<MagicWandIcon size={20} className="text-sh-accent" />
								<h2 id="ai-draft-title" className="text-[15px] font-semibold text-sh-text-white">Draft with AI</h2>
							</div>
							<button
								type="button"
								onClick={closeAIWizard}
								className="p-1 text-sh-text-muted hover:text-sh-text-white rounded-[2px] transition-colors focus:outline-none focus:ring-2 focus:ring-sh-accent"
								aria-label="Close dialog"
							>
								<XIcon size={16} />
							</button>
						</div>

						<div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto no-scrollbar">
							<div className="space-y-2">
								<label htmlFor="ai-to-input" className="block text-[13px] text-sh-text-muted">
									Who are you emailing?
								</label>
								<input
									id="ai-to-input"
									ref={aiToInputRef}
									type="text"
									value={aiTo}
									onChange={(e) => setAiTo(e.target.value)}
									placeholder="recipient@example.com"
									className="w-full bg-sh-search-bg border border-sh-border-thin rounded-[2px] px-3 py-2 text-[13px] text-sh-text-white placeholder:text-sh-search-placeholder focus:outline-none focus:border-sh-text-muted transition-colors"
									onKeyDown={(e) => {
										if (e.key === "Enter" && aiTo.trim()) {
											e.preventDefault();
											if (aiWizardStep === 1) setAiWizardStep(2);
											else if (aiWizardStep >= 2) aiSubjectInputRef.current?.focus();
										}
									}}
								/>
							</div>

							{aiWizardStep >= 2 && (
								<div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
									<label htmlFor="ai-subject-input" className="block text-[13px] text-sh-text-muted">
										What is the subject of this email?
									</label>
									<input
										id="ai-subject-input"
										ref={aiSubjectInputRef}
										type="text"
										value={aiSubject}
										onChange={(e) => setAiSubject(e.target.value)}
										placeholder="Email subject"
										className="w-full bg-sh-search-bg border border-sh-border-thin rounded-[2px] px-3 py-2 text-[13px] text-sh-text-white placeholder:text-sh-search-placeholder focus:outline-none focus:border-sh-text-muted transition-colors"
										onKeyDown={(e) => {
											if (e.key === "Enter" && aiSubject.trim()) {
												e.preventDefault();
												if (aiWizardStep === 2) setAiWizardStep(3);
												else if (aiWizardStep >= 3) aiPromptInputRef.current?.focus();
											}
										}}
									/>
								</div>
							)}

							{aiWizardStep >= 3 && (
								<div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
									<label htmlFor="ai-prompt-input" className="block text-[13px] text-sh-text-muted">
										Describe what you want to say in the email.
									</label>
									<textarea
										id="ai-prompt-input"
										ref={aiPromptInputRef}
										value={aiPrompt}
										onChange={(e) => setAIPrompt(e.target.value)}
										placeholder="e.g., Thank them for the meeting and ask for the Q3 report by Friday."
										className="w-full resize-y rounded-[2px] border border-sh-border-thin bg-sh-search-bg px-3 py-2 text-[13px] text-sh-text-white placeholder:text-sh-search-placeholder focus:outline-none focus:border-sh-text-muted transition-colors min-h-[80px]"
									/>
									
									{aiDraftError && (
										<div className="flex items-center gap-2 px-3 py-2 mt-2 rounded-[2px] bg-red-500/10 border border-red-500/20 text-red-400 text-[12px] animate-in fade-in duration-200">
											<WarningCircleIcon size={16} />
											<span>{aiDraftError}</span>
										</div>
									)}

									{isAIGenerating && (
										<div className="flex items-center gap-2 mt-2 text-sh-accent text-[13px] animate-in fade-in duration-200">
											<RobotIcon size={16} className="animate-pulse" />
											<span>Generating draft...</span>
										</div>
									)}

									{aiDraftPreview && (
										<div className="space-y-2 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
											<h3 className="text-[12px] font-medium text-sh-text-muted uppercase tracking-wider">Preview</h3>
											<div className="rounded-[2px] border border-sh-border-thin bg-sh-bg-dark p-3 text-[13px] text-sh-text-white whitespace-pre-wrap max-h-[300px] overflow-y-auto shadow-inner">
												{aiDraftPreview}
											</div>
										</div>
									)}
								</div>
							)}

							<div className="flex justify-end gap-3 pt-4 border-t border-sh-border mt-6">
								<button
									type="button"
									onClick={closeAIWizard}
									className="px-4 py-1.5 text-[13px] font-medium text-sh-text-muted hover:text-sh-text-white bg-transparent border border-sh-border hover:bg-sh-bg-hover transition-colors rounded-[2px] focus:outline-none focus:ring-2 focus:ring-sh-accent"
								>
									Cancel
								</button>
								
								{aiWizardStep < 3 ? (
									<button
										type="button"
										onClick={() => setAiWizardStep((prev) => prev + 1)}
										disabled={(aiWizardStep === 1 && !aiTo.trim()) || (aiWizardStep === 2 && !aiSubject.trim())}
										className="px-4 py-1.5 text-[13px] font-medium text-sh-text-white bg-sh-accent hover:bg-opacity-90 transition-colors rounded-[2px] focus:outline-none focus:ring-2 focus:ring-sh-accent disabled:opacity-50 disabled:cursor-not-allowed"
									>
										Continue
									</button>
								) : (
									<button
										type="button"
										onClick={aiDraftPreview ? handleAISubmit : handleAIGenerate}
										disabled={isAIGenerating || !aiPrompt.trim()}
										className="px-4 py-1.5 text-[13px] font-medium text-sh-text-white bg-sh-accent hover:bg-opacity-90 transition-colors rounded-[2px] focus:outline-none focus:ring-2 focus:ring-sh-accent disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
									>
										{aiDraftPreview ? "Insert into Compose" : (
											<>
												<MagicWandIcon size={14} />
												Generate Draft
											</>
										)}
									</button>
								)}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
