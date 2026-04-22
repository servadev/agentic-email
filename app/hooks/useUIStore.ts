// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Email } from "~/types";

export type ComposeMode = "new" | "reply" | "reply-all" | "forward";

export interface ComposeOptions {
	mode: ComposeMode;
	originalEmail?: Email | null;
	/** When editing a draft, this holds the draft email to pre-fill the composer */
	draftEmail?: Email | null;
	prefillTo?: string;
}

interface UIState {
	// Side panel state
	selectedEmailId: string | null;
	isComposing: boolean;
	_previousEmailId: string | null;
	selectEmail: (id: string | null) => void;
	startCompose: (options?: ComposeOptions) => void;
	closePanel: () => void;
	closeCompose: () => void;

	// Compose options
	composeOptions: ComposeOptions;

	// Mobile sidebar
	isSidebarOpen: boolean;
	openSidebar: () => void;
	closeSidebar: () => void;
	toggleSidebar: () => void;

	// Agent panel
	isAgentPanelOpen: boolean;
	toggleAgentPanel: () => void;

	// Legacy dialog support (kept for non-split views)
	isComposeModalOpen: boolean;
	openComposeModal: (options?: ComposeOptions) => void;
	closeComposeModal: () => void;

	// Sender Card (Mobile toggle)
	isSenderCardOpen: boolean;
	toggleSenderCard: () => void;

	// Alias for selectedEmailId
	selectedThreadId: string | null;
	setSelectedThreadId: (id: string | null) => void;

	// Contact list selection
	selectedContact: string | null;
	setSelectedContact: (contact: string | null) => void;

	// Close just the thread to return to contact list
	closeThread: () => void;
}

export const useUIStore = create<UIState>()(
	persist<UIState, [], [], Partial<UIState>>(
		(set, get) => ({
			selectedEmailId: null,
			selectedThreadId: null,
			selectedContact: null,
			isComposing: false,
			_previousEmailId: null,
			composeOptions: { mode: "new", originalEmail: null },
			isComposeModalOpen: false,
			isSidebarOpen: false,
			isAgentPanelOpen: false,
			isSenderCardOpen: false,

			selectEmail: (id) => set({ selectedEmailId: id, selectedThreadId: id, isComposing: false }),
			setSelectedThreadId: (id) => set({ selectedThreadId: id, selectedEmailId: id, isComposing: false }),
			setSelectedContact: (contact) => set({ selectedContact: contact, selectedThreadId: null, selectedEmailId: null, isComposing: false, isSidebarOpen: false }),

			startCompose: (options) =>
				set((state) => {
					const mode = options?.mode || "new";
					const isReplyOrForward = mode === "reply" || mode === "reply-all" || mode === "forward";
					return {
						isComposing: true,
						_previousEmailId: state.selectedEmailId,
						// Keep selectedEmailId when replying/forwarding so the thread stays visible
						selectedEmailId: isReplyOrForward ? state.selectedEmailId : null,
						composeOptions: options || { mode: "new", originalEmail: null },
						isSidebarOpen: false,
					};
				}),

			closePanel: () => set({ selectedContact: null, selectedThreadId: null, selectedEmailId: null, isComposing: false, _previousEmailId: null, composeOptions: { mode: "new" as const, originalEmail: null } }),

			closeThread: () => set({ selectedThreadId: null, selectedEmailId: null, isComposing: false, _previousEmailId: null, composeOptions: { mode: "new" as const, originalEmail: null } }),

			closeCompose: () =>
				set((state) => ({
					isComposing: false,
					selectedEmailId: state._previousEmailId,
					_previousEmailId: null,
					composeOptions: { mode: "new" as const, originalEmail: null },
				})),

			openSidebar: () => set({ isSidebarOpen: true }),
			closeSidebar: () => set({ isSidebarOpen: false }),
			toggleSidebar: () => set({ isSidebarOpen: !get().isSidebarOpen }),

			toggleAgentPanel: () => set({ isAgentPanelOpen: !get().isAgentPanelOpen }),

			openComposeModal: (options) =>
				set({
					composeOptions: options || { mode: "new", originalEmail: null },
					isComposeModalOpen: true,
				}),

			closeComposeModal: () =>
				set({
					isComposeModalOpen: false,
					composeOptions: { mode: "new", originalEmail: null },
				}),

			toggleSenderCard: () => set({ isSenderCardOpen: !get().isSenderCardOpen }),
		}),
		{
			name: "ui-store",
			partialize: (state) => ({}),
		}
	)
);
