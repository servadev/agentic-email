// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Banner, Button, Dialog, Input, Text } from "@cloudflare/kumo";
import { FloppyDiskIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { useParams } from "react-router";
import { useComposeForm } from "~/hooks/useComposeForm";
import RichTextEditor from "./RichTextEditor";
import EmailInput from "./EmailInput";
import { useUIStore } from "~/hooks/useUIStore";

export default function ComposeEmail() {
	const { mailboxId, folder } = useParams<{
		mailboxId: string;
		folder: string;
	}>();
	
	const { isComposeModalOpen, closeComposeModal } = useUIStore();

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
	} = useComposeForm(mailboxId, folder);

	return (
		<Dialog.Root
			open={isComposeModalOpen}
			onOpenChange={(open) => !open && !isSending && closeComposeModal()}
		>
			<Dialog size="lg" className="p-6 max-h-[85vh] overflow-y-auto">
				<Dialog.Title className="text-lg font-semibold mb-5">
					{formTitle}
				</Dialog.Title>
				<form onSubmit={(e) => { e.preventDefault(); handleSend(e).then(() => closeComposeModal()).catch((err) => { console.error("ComposeEmail handleSend failed:", err); }); }} className="space-y-4">
					{error && <Banner variant="error" text={error} />}
					<div className="flex items-center gap-2">
						<div className="flex-1">
							<Text size="sm" DANGEROUS_className="font-medium mb-1.5 block">
								To
							</Text>
							<EmailInput
								placeholder="recipient@example.com, another@example.com"
								value={to}
								onChange={(val) => setTo(val)}
								className="w-full bg-transparent border border-sh-border-thin rounded-[4px] px-2.5 py-1.5 text-[13px] text-sh-text-white focus-within:border-sh-text-muted focus-within:ring-2 focus-within:ring-sh-accent transition-colors"
								required
							/>
						</div>
						{!showCcBcc && (
							<button
								type="button"
								onClick={() => setShowCcBcc(true)}
								className="shrink-0 text-[12px] text-sh-text-muted hover:text-sh-text-white font-medium mt-5 transition-colors"
							>
								CC / BCC
							</button>
						)}
					</div>
					{showCcBcc && (
						<div>
							<Text size="sm" DANGEROUS_className="font-medium mb-1.5 block">
								CC
							</Text>
							<EmailInput
								value={cc}
								onChange={(val) => setCc(val)}
								placeholder="Separate multiple addresses with commas"
								className="w-full bg-transparent border border-sh-border-thin rounded-[4px] px-2.5 py-1.5 text-[13px] text-sh-text-white focus-within:border-sh-text-muted focus-within:ring-2 focus-within:ring-sh-accent transition-colors"
							/>
						</div>
					)}
					{showCcBcc && (
						<div>
							<Text size="sm" DANGEROUS_className="font-medium mb-1.5 block">
								BCC
							</Text>
							<EmailInput
								value={bcc}
								onChange={(val) => setBcc(val)}
								placeholder="Separate multiple addresses with commas"
								className="w-full bg-transparent border border-sh-border-thin rounded-[4px] px-2.5 py-1.5 text-[13px] text-sh-text-white focus-within:border-sh-text-muted focus-within:ring-2 focus-within:ring-sh-accent transition-colors"
							/>
						</div>
					)}
					<Input
						label="Subject"
						type="text"
						placeholder="Email subject"
						size="sm"
						value={subject}
						onChange={(e) => setSubject(e.target.value)}
						required
					/>
					<div>
						<Text size="sm" DANGEROUS_className="font-medium mb-1.5 block">
							Message
						</Text>
						<RichTextEditor value={body} onChange={setBody} />
					</div>
					<div className="flex justify-between items-center pt-2">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={closeComposeModal}
							disabled={isSending}
						>
							Discard
						</Button>
						<div className="flex items-center gap-2">
							<Button
								type="button"
								variant="secondary"
								size="sm"
								loading={isSavingDraft}
								disabled={isSending}
								icon={<FloppyDiskIcon size={14} />}
								onClick={handleSaveDraft}
							>
								{isSavingDraft ? "Saving..." : "Save as Draft"}
							</Button>
							<Button
								type="submit"
								variant="primary"
								size="sm"
								loading={isSending}
								disabled={isSavingDraft || isSending}
								icon={<PaperPlaneTiltIcon size={14} />}
							>
								{isSending ? "Sending..." : "Send"}
							</Button>
						</div>
					</div>
				</form>
			</Dialog>
		</Dialog.Root>
	);
}
