// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { useEffect, useRef } from "react";
import { Outlet, useParams } from "react-router";
import AgentSidebar from "~/components/AgentSidebar";
import ComposeEmail from "~/components/ComposeEmail";
import Header from "~/components/Header";
import Sidebar from "~/components/Sidebar";
import { useMailbox } from "~/queries/mailboxes";
import { useUIStore } from "~/hooks/useUIStore";

export default function MailboxRoute() {
	const { mailboxId } = useParams<{ mailboxId: string }>();
	// Prefetch mailbox data for child components
	useMailbox(mailboxId);
	const prevMailboxIdRef = useRef<string | undefined>(undefined);
	const {
		isSidebarOpen,
		closeSidebar,
		isAgentPanelOpen,
		closePanel,
		closeComposeModal,
	} = useUIStore();

	useEffect(() => {
		if (
			prevMailboxIdRef.current &&
			mailboxId &&
			prevMailboxIdRef.current !== mailboxId
		) {
			closePanel();
			closeComposeModal();
			closeSidebar();
		}

		prevMailboxIdRef.current = mailboxId;
	}, [mailboxId, closeComposeModal, closePanel, closeSidebar]);

	return (
		<div className="flex h-screen overflow-hidden bg-sh-bg-dark font-sh-sans">
			{/* Mobile sidebar overlay backdrop */}
			{isSidebarOpen && (
				<div
					className="fixed inset-0 z-30 bg-black/30 md:hidden"
					onClick={closeSidebar}
					onKeyDown={(e) => e.key === "Escape" && closeSidebar()}
					role="button"
					tabIndex={-1}
					aria-label="Close sidebar"
				/>
			)}

			{/* Left icon rail (collapsed sidebar) */}
			<div className="w-sh-rail shrink-0 border-r border-sh-border flex flex-col items-center py-4 bg-sh-bg-panel z-10 hidden md:flex">
				{/* The icon rail can be extracted to a separate component, but we will place Compose button in Header and maybe just some icons here or leave it empty if nav moved to top */}
				{/* Assuming Sidebar is removed or refactored into just icons */}
				<Sidebar />
			</div>

			{/* Main content */}
			<div className="flex-1 flex flex-col min-w-0 bg-sh-bg-dark">
				<Header />
				<main className="flex-1 overflow-hidden relative">
					<Outlet />
				</main>
			</div>

			{/* Resize handle (visual only for now) */}
			{isAgentPanelOpen && (
				<div className="hidden lg:block w-[1px] bg-sh-border cursor-col-resize hover:bg-sh-accent transition-colors" />
			)}

			{/* Agent + MCP sidebar -- togglable on desktop */}
			{isAgentPanelOpen && (
				<div className="hidden lg:flex w-sh-panel shrink-0 flex-col bg-sh-bg-panel overflow-hidden transition-all duration-sh-panel">
					<AgentSidebar />
				</div>
			)}

			<ComposeEmail />
		</div>
	);
}
