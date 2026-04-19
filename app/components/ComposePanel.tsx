// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { FloppyDiskIcon, PaperPlaneTiltIcon, XIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useParams } from "react-router";
import { useUIStore } from "~/hooks/useUIStore";
import { formatComposeDate } from "~/lib/utils";
import { useComposeForm } from "~/hooks/useComposeForm";
import RichTextEditor from "./RichTextEditor";

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

	const inputClass = "w-full bg-sh-search-bg border border-sh-border-thin rounded-[2px] px-2.5 py-1.5 text-sh-base text-sh-text-white placeholder-sh-search-placeholder outline-none focus:border-sh-text-muted focus:ring-2 focus:ring-sh-accent transition-colors";

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
						<span className="text-[11px]">{originalEmail?.date ? formatComposeDate(originalEmail.date) : ""}</span>
					</div>
					<div className="text-sh-text-read line-clamp-3 overflow-hidden text-ellipsis italic opacity-80 border-l-2 border-sh-border-thin pl-3">
						"{originalEmail?.snippet || "No preview available"}"
					</div>
				</div>
			)}

			<form
				onSubmit={(e) => handleSend(e, closePanel)}
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
		</div>
	);
}
