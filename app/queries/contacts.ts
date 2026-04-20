// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "~/services/api";
import type { ContactData } from "~/types";

export const contactKeys = {
	all: ["contacts"] as const,
	list: (mailboxId: string) => [...contactKeys.all, mailboxId] as const,
};

export function useContacts(mailboxId: string | undefined) {
	return useQuery<ContactData[]>({
		queryKey: mailboxId ? contactKeys.list(mailboxId) : ["contacts", "_disabled"],
		queryFn: () => api.getContacts(mailboxId!),
		enabled: !!mailboxId,
	});
}

export function useUpdateContact() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ mailboxId, id, data }: { mailboxId: string; id: string; data: Partial<ContactData> }) =>
			api.updateContact(mailboxId, id, data),
		onSuccess: (updatedContact, { mailboxId }) => {
			qc.invalidateQueries({ queryKey: contactKeys.list(mailboxId) });
		},
		onError: (error) => {
			console.error('Failed to update contact:', error);
		}
	});
}
