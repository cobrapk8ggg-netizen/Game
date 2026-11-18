import { useMutation, type UseMutationResult, useQuery, type UseQueryResult } from "@tanstack/react-query";
import { type SupportCatalogueEntry, type SupportIndex, type SupportReply, SupportSearch } from "@testify/shared";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { keys } from "@/lib/queries";

function useSupportLocale(): "" | "?locale=ar" {
	const { i18n } = useTranslation();
	return i18n.resolvedLanguage === "ar" ? "?locale=ar" : "";
}

function useSupportIndex(): UseQueryResult<SupportIndex> {
	const locale = useSupportLocale();
	return useQuery({
		queryKey: keys.support(locale),
		queryFn: () => api.get<SupportIndex>(`/support${locale}`),
		staleTime: Infinity,
	});
}

export function useSupportSearch(): {
	entries: SupportCatalogueEntry[];
	search: SupportSearch<SupportCatalogueEntry> | null;
} {
	const index = useSupportIndex();

	return useMemo(() => {
		const entries = index.data?.articles ?? [];
		return { entries, search: entries.length === 0 ? null : new SupportSearch(entries) };
	}, [index.data]);
}

export function useSupportArticle(id: string | null): UseQueryResult<SupportReply> {
	const locale = useSupportLocale();
	return useQuery({
		queryKey: keys.supportArticle(id ?? "", locale),
		queryFn: () => api.get<SupportReply>(`/support/articles/${encodeURIComponent(id ?? "")}${locale}`),
		enabled: id !== null,
		staleTime: Infinity,
	});
}

export function useAskSupport(): UseMutationResult<SupportReply, Error, string> {
	const locale = useSupportLocale();
	return useMutation({
		mutationFn: (question: string) => api.post<SupportReply>(`/support/ask${locale}`, { question }),
	});
}
