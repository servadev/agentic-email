// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { FloppyDiskIcon, PaperPlaneTiltIcon, XIcon, WarningCircleIcon, RobotIcon, MagicWandIcon } from "@phosphor-icons/react";
import { useParams } from "react-router";
import { useUIStore } from "~/hooks/useUIStore";
import { formatComposeDate, htmlToPlainText } from "~/lib/utils";
import { useComposeForm } from "~/hooks/useComposeForm";

import RichTextEditor from "./RichTextEditor";
import { useState } from "react";
import { Dialog, Button } from "@cloudflare/kumo";
import api from "~/services/api";
import DOMPurify from "dompurify";

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
		closePanel,
	} = useComposeForm(mailboxId, folder);

	const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
	const [aiPrompt, setAIPrompt] = useState("");
	const [isAIGenerating, setIsAIGenerating] = useState(false);
	const [aiDraftPreview, setAIDraftPreview] = useState("");

	const [aiDraftError, setAIDraftError] = useState("");

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
			const sanitizedPreview = DOMPurify.sanitize(aiDraftPreview.replace(/\n/g, "<br>"));
			setBody((prev) => prev ? prev + "<br><br>" + sanitizedPreview : sanitizedPreview);
			setIsAIDialogOpen(false);
			setAIPrompt("");
			setAIDraftPreview("");
		}
	};

	const inputClass = "w-full bg-sh-search-bg border border-sh-border-thin rounded-[2px] px-2.5 py-1.5 text-sh-base text-sh-text-white placeholder-sh-search-placeholder outline-none focus:border-sh-text-muted focus:ring-2 focus:ring-sh-accent transition-colors";

	return (
		<div className="flex flex-col h-full bg-transparent text-sh-text-white">
			<div className="flex items-center justify-between px-4 py-3 border-b border-sh-border shrink-0 md:px-6">
				<h2 className="text-[13px] font-semibold text-sh-text-white">
					{formTitle}
				</h2>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => setIsAIDialogOpen(true)}
						className="flex items-center gap-1.5 px-2 py-1 text-[12px] font-medium text-sh-text-white bg-sh-accent hover:bg-opacity-90 transition-colors rounded-[2px] focus:outline-none focus:ring-2 focus:ring-sh-accent"
					>
						<MagicWandIcon size={14} />
						AI Assist
					</button>
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
						<span className="text-[11px]">{originalEmail?.date ? formatComposeDate(originalEmail.date) : ""}</span>
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
								<input
									type="text"
									placeholder="recipient@example.com"
									className={inputClass}
									value={to}
									onChange={(e) => setTo(e.target.value)}
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
									<input
										type="text"
										className={inputClass}
										value={cc}
										onChange={(e) => setCc(e.target.value)}
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
									<input
										type="text"
										className={inputClass}
										value={bcc}
										onChange={(e) => setBcc(e.target.value)}
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

				{/* Footer actions */}
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
								disabled={isSending}
								onClick={handleSaveDraft}
								className="flex items-center gap-1.5 px-3 py-1.5 bg-sh-bg-hover hover:bg-opacity-80 text-sh-text-white rounded-[2px] text-[12px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-sh-accent disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<FloppyDiskIcon size={14} className={isSavingDraft ? "animate-pulse" : ""} />
								{isSavingDraft ? "Saving..." : "Save Draft"}
							</button>
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

			<Dialog.Root open={isAIDialogOpen} onOpenChange={(open) => { if (!open) setIsAIDialogOpen(false); }}>
				<Dialog size="lg">
					<Dialog.Title>
						<div className="flex items-center gap-2">
							<MagicWandIcon size={20} className="text-sh-accent" />
							<span>Draft with AI</span>
						</div>
					</Dialog.Title>
					<div className="mt-4 space-y-4">
						<p className="text-[13px] text-sh-text-muted">
							Describe what you want to say in the email. The AI will generate a draft that you can review and edit before sending.
						</p>
						{aiDraftError && (
							<div className="flex items-center gap-2 px-3 py-2 rounded-[2px] bg-red-500/10 border border-red-500/20 text-red-400 text-[12px]">
								<WarningCircleIcon size={16} />
								<span>{aiDraftError}</span>
							</div>
						)}
						<textarea
							value={aiPrompt}
							onChange={(e) => setAIPrompt(e.target.value)}
							placeholder="e.g., Thank them for the meeting and ask for the Q3 report by Friday."
							className="w-full resize-y rounded-[2px] border border-sh-border-thin bg-sh-search-bg px-3 py-2 text-[13px] text-sh-text-white placeholder:text-sh-search-placeholder focus:outline-none focus:border-sh-text-muted transition-colors min-h-[80px]"
						/>
						
						{isAIGenerating && (
							<div className="flex items-center gap-2 text-sh-accent text-[13px]">
								<RobotIcon size={16} className="animate-pulse" />
								<span>Generating draft...</span>
							</div>
						)}

						{aiDraftPreview && (
							<div className="space-y-2">
								<h3 className="text-[12px] font-medium text-sh-text-muted uppercase tracking-wider">Preview</h3>
								<div className="rounded-[2px] border border-sh-border-thin bg-sh-bg-dark p-3 text-[13px] text-sh-text-white whitespace-pre-wrap max-h-[300px] overflow-y-auto">
									{aiDraftPreview}
								</div>
							</div>
						)}

						<div className="flex justify-end gap-2 pt-2">
							<Dialog.Close>
								<Button variant="secondary" size="sm">
									Cancel
								</Button>
							</Dialog.Close>
							<Button 
								variant="primary" 
								size="sm" 
								onClick={aiDraftPreview ? handleAISubmit : handleAIGenerate}
								disabled={isAIGenerating || !aiPrompt.trim()}
							>
								{aiDraftPreview ? "Insert into Compose" : "Generate Draft"}
							</Button>
						</div>
					</div>
				</Dialog>
			</Dialog.Root>
		</div>
	);
}
