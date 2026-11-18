import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { type CommandCatalogue } from "@testify/shared";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { keys } from "@/lib/queries";

export function useCommands(): UseQueryResult<CommandCatalogue> {
	const { i18n } = useTranslation();
	const ar = i18n.resolvedLanguage === "ar";
	return useQuery({
		queryKey: keys.commands(ar),
		queryFn: () => api.get<CommandCatalogue>(ar ? "/commands?locale=ar" : "/commands"),
		staleTime: 30 * 60 * 1000,
	});
}
