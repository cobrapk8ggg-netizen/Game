import { ButtonStyle } from "discord.js";
import { botCopy } from "@config/strings";
import { theme } from "@config/theme";
import { customId } from "@core/button";
import { button, row } from "@lib/discord/components.util";
import { container, containerMessage, divider, sectionWithThumbnail, text } from "@lib/discord/containers.util";
import { type ContainerMessage, type ContainerPart } from "@lib/discord/discord.types";
import { BALANCE_PANEL_ID } from "@lib/economy/economy.constants";
import { formatNumber } from "@lib/format/format.util";

/** The wallet, and the things you would do next. */

interface BalanceView {
	wallet: number;
	bank: number;
	username: string;
	avatarUrl: string;
	/** False when looking someone else up, which hides the action buttons. */
	own: boolean;
	/** Shown as a banner after an action, rather than as a second message. */
	note?: string;
	/** Greys out Daily when it has already been claimed today. */
	dailyReady?: boolean;
}

export function balancePanel(view: BalanceView, ownerId: string): ContainerMessage {
	const total = view.wallet + view.bank;

	const body =
		botCopy(`## ${view.username}'s balance\n`, `## رصيد ${view.username}\n`) +
		botCopy(
			`${theme.emoji.wallet} **Wallet** ${formatNumber(view.wallet)}\n`,
			`${theme.emoji.wallet} **المحفظة** ${formatNumber(view.wallet)}\n`,
		) +
		botCopy(
			`${theme.emoji.bank} **Bank** ${formatNumber(view.bank)}\n`,
			`${theme.emoji.bank} **الحساب المصرفي** ${formatNumber(view.bank)}\n`,
		) +
		botCopy(
			`${theme.emoji.coin} **Total** ${formatNumber(total)}`,
			`${theme.emoji.coin} **الإجمالي** ${formatNumber(total)}`,
		);

	const parts: ContainerPart[] = [
		view.note !== undefined ? text(`✅ ${view.note}`) : undefined,
		view.note !== undefined ? divider() : undefined,
		sectionWithThumbnail(
			body,
			view.avatarUrl,
			botCopy(`${view.username}'s avatar`, `صورة الملف الشخصي للمستخدم ${view.username}`),
		),
	].filter((part) => part !== undefined);

	if (!view.own) return containerMessage(container({ category: "economy", parts }));

	return containerMessage(
		container({
			category: "economy",
			parts: [
				...parts,
				divider(),
				row(
					button({
						id: customId(BALANCE_PANEL_ID, "dep", ownerId),
						label: botCopy("Deposit", "إيداع"),
						emoji: theme.emoji.bank,
						disabled: view.wallet <= 0,
					}),
					button({
						id: customId(BALANCE_PANEL_ID, "wit", ownerId),
						label: botCopy("Withdraw", "سحب"),
						emoji: theme.emoji.wallet,
						disabled: view.bank <= 0,
					}),
					button({
						id: customId(BALANCE_PANEL_ID, "daily", ownerId),
						label: botCopy("Daily", "المكافأة اليومية"),
						style: ButtonStyle.Success,
						disabled: view.dailyReady === false,
					}),
				),
				row(
					button({ id: customId(BALANCE_PANEL_ID, "shop", ownerId), label: botCopy("Shop", "المتجر"), emoji: "🛒" }),
					button({
						id: customId(BALANCE_PANEL_ID, "inv", ownerId),
						label: botCopy("Inventory", "المقتنيات"),
						emoji: "🎒",
					}),
					button({
						id: customId(BALANCE_PANEL_ID, "refresh", ownerId),
						label: botCopy("Refresh", "تحديث"),
						emoji: "🔄",
					}),
				),
			],
		}),
	);
}
