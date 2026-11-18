import { ButtonStyle, type EmbedBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import {
	ALL_CATEGORIES,
	type Category,
	categoryEmoji,
	categoryLabel,
	HIDDEN_CATEGORIES,
	isCategory,
} from "@config/categories";
import { theme } from "@config/theme";
import { botName } from "@core/brand";
import { customId } from "@core/button";
import { type TestifyClient } from "@core/client";
import { type Command, subcommandsOf } from "@core/command";
import { arabicDescription } from "@core/commandLocales";
import { dashboardUrl } from "@lib/bot/dashboard.util";
import { button, linkButton, row, select, selectRow } from "@lib/discord/components.util";
import { embed } from "@lib/discord/embeds.util";
import { truncate } from "@lib/format/format.util";
import { arabicHelp } from "@lib/info/arabicHelp.util";
import { HELP_HOME } from "@lib/info/info.constants";

export type Surface = "slash" | "prefix";

const HELP_PAGE_SIZE = 6;
function visibleCommands(client: TestifyClient): Command[] {
	return [...client.commands.values()].filter((command) => !HIDDEN_CATEGORIES.includes(command.category));
}

function commandsInCategory(client: TestifyClient, category: Category): Command[] {
	return visibleCommands(client)
		.filter((command) => command.category === category)
		.sort((a, b) => a.name.localeCompare(b.name));
}

function populatedCategories(client: TestifyClient): Category[] {
	const used = new Set(visibleCommands(client).map((command) => command.category));
	return ALL_CATEGORIES.filter((category) => used.has(category));
}

export function pagesOf(client: TestifyClient, category: Category): Command[][] {
	const commands = commandsInCategory(client, category);
	const pages: Command[][] = [];

	for (let start = 0; start < commands.length; start += HELP_PAGE_SIZE) {
		pages.push(commands.slice(start, start + HELP_PAGE_SIZE));
	}

	return pages.length > 0 ? pages : [[]];
}

function label(category: Category, ar: boolean): string {
	return ar ? arabicHelp.categories[category] : categoryLabel(category);
}

function description(ar: boolean, text: string, command: string, subcommand?: string, option?: string): string {
	return ar ? arabicDescription(text, command, subcommand, option) : text;
}

function usage(command: Command, surface: Surface, prefix: string): string {
	return surface === "slash" ? `/${command.name}` : `${prefix}${command.name}`;
}

/** The front page: what the bot is, how many commands, and where to get help. */
export function helpHome(client: TestifyClient, surface: Surface, prefix: string, ar = false): EmbedBuilder {
	const categories = populatedCategories(client);
	const total = visibleCommands(client).length;
	const subcommands = visibleCommands(client).reduce((count, command) => count + subcommandsOf(command).length, 0);

	return embed({
		category: "info",
		title: ar ? arabicHelp.title(botName()) : `${botName()} help centre`,
		description: [
			ar ? arabicHelp.intro(prefix) : `Everything here works as a slash command **and** with the \`${prefix}\` prefix.`,
			"",
			ar ? arabicHelp.browse : "Pick a category from the menu below to browse.",
		].join("\n"),
		thumbnail: client.user?.displayAvatarURL(),
		fields: [
			{
				name: ar ? arabicHelp.commands : "📊 Commands",
				value: ar
					? arabicHelp.commandTotals(total, subcommands, categories.length)
					: `> **${total}** commands and **${subcommands}** subcommands across **${categories.length}** categories.`,
			},
			{
				name: ar ? arabicHelp.prefix : "🔤 Prefix here",
				value: ar
					? arabicHelp.prefixTip(prefix)
					: `> \`${prefix}\` — change it with \`/prefix set\`. Mentioning me works too.`,
			},
			{
				name: ar ? arabicHelp.categoryList : "📂 Categories",
				value: `> ${categories.map((category) => `${categoryEmoji(category)} **${label(category, ar)}**`).join(" • ")}`,
			},
			...dashboardField(client, ar),
			{
				name: ar ? arabicHelp.feedback : "💬 Feedback",
				value: ar ? arabicHelp.feedbackTip : "> Use `/suggest` or `/bug-report` to tell me what to fix next.",
			},
		],
		footer: ar
			? surface === "slash"
				? arabicHelp.slash
				: arabicHelp.prefixed
			: `Showing ${surface === "slash" ? "slash" : "prefix"} commands`,
	});
}

/** Only when the dashboard is actually running: a link to nothing is worse than no link. */
function dashboardField(client: TestifyClient, ar: boolean): { name: string; value: string }[] {
	const url = dashboardUrl(client.env);
	if (url === null) return [];

	return [
		{
			name: ar ? arabicHelp.webTitle : "🖥️ Set it up in a browser",
			value: ar
				? arabicHelp.webTip(url)
				: `> Everything below can be configured at ${url} — sign in with Discord and pick your server.`,
		},
	];
}

export function categoryPage(
	client: TestifyClient,
	category: Category,
	page: number,
	surface: Surface,
	prefix: string,
	ar = false,
): EmbedBuilder {
	const pages = pagesOf(client, category);
	const current = Math.min(Math.max(0, page), pages.length - 1);

	return embed({
		category,
		title: `${categoryEmoji(category)} ${label(category, ar)}`,
		description: ar
			? arabicHelp.categoryIntro(label(category, ar))
			: `Here is everything under ${categoryLabel(category).toLowerCase()}.`,
		fields: (pages[current] ?? []).map((command) => {
			const subs = subcommandsOf(command);
			const aliases = [...(command.aliases ?? []), ...subs.flatMap((sub) => sub.aliases ?? [])];

			const lines = [`> ${description(ar, command.description, command.name)}`];

			if (subs.length > 0) {
				lines.push("", ar ? `**${arabicHelp.subcommands}**` : "**Subcommands**");
				for (const sub of subs.slice(0, 10)) {
					lines.push(
						`> \`${usage(command, surface, prefix)} ${sub.name}\` — ${description(ar, sub.description, command.name, sub.name)}`,
					);
				}
				if (subs.length > 10) lines.push(ar ? arabicHelp.more(subs.length - 10) : `> …and ${subs.length - 10} more.`);
			}

			if (surface === "prefix" && aliases.length > 0) {
				lines.push(
					"",
					`**${ar ? arabicHelp.also : "Also"}** ${aliases.map((alias) => `\`${prefix}${alias}\``).join(", ")}`,
				);
			}

			return { name: usage(command, surface, prefix), value: truncate(lines.join("\n"), 1_000), inline: false };
		}),
		footer: ar
			? arabicHelp.page(label(category, ar), current + 1, pages.length)
			: `${label(category, ar)} • Page ${current + 1} of ${pages.length}`,
	});
}

export function commandPage(command: Command, surface: Surface, prefix: string, ar = false): EmbedBuilder {
	const subs = subcommandsOf(command);

	return embed({
		category: command.category,
		title: usage(command, surface, prefix),
		description: description(ar, command.description, command.name),
		fields: [
			{ name: ar ? arabicHelp.category : "Category", value: label(command.category, ar), inline: true },
			{
				name: ar ? arabicHelp.usage : "Usage",
				value: `\`/${command.name}\` ${ar ? arabicHelp.or : "or"} \`${prefix}${command.name}\``,
				inline: true,
			},
			...(command.cooldown !== undefined
				? [
						{
							name: ar ? arabicHelp.cooldown : "Cooldown",
							value: `${Math.round(command.cooldown / 1_000)}${ar ? " ث" : "s"}`,
							inline: true,
						},
					]
				: []),
			...(command.aliases?.length
				? [
						{
							name: ar ? arabicHelp.aliases : "Aliases",
							value: command.aliases.map((alias) => `\`${prefix}${alias}\``).join(", "),
						},
					]
				: []),
			...(command.options?.length
				? [
						{
							name: ar ? arabicHelp.options : "Options",
							value: command.options
								.map(
									(o) =>
										`\`${o.name}\`${o.required === true ? ` (${ar ? arabicHelp.required : "required"})` : ""} — ${description(ar, o.description, command.name, undefined, o.name)}`,
								)
								.join("\n"),
						},
					]
				: []),
			...(subs.length > 0
				? [
						{
							name: ar ? arabicHelp.subcommands : "Subcommands",
							value: truncate(
								subs
									.map((sub) => `\`${sub.name}\` — ${description(ar, sub.description, command.name, sub.name)}`)
									.join("\n"),
								1_000,
							),
						},
					]
				: []),
		],
	});
}

export function categoryMenu(
	client: TestifyClient,
	surface: Surface,
	chosen: Category | null,
	ownerId: string,
	ar = false,
) {
	const options = [
		new StringSelectMenuOptionBuilder()
			.setLabel(ar ? arabicHelp.home : "Help centre")
			.setDescription(ar ? arabicHelp.back : "Back to the front page.")
			.setValue(HELP_HOME)
			.setEmoji("📚")
			.setDefault(chosen === null),
		...populatedCategories(client).map((category) =>
			new StringSelectMenuOptionBuilder()
				.setLabel(label(category, ar))
				.setDescription(
					ar
						? arabicHelp.commandCount(commandsInCategory(client, category).length)
						: `${commandsInCategory(client, category).length} commands`,
				)
				.setValue(category)
				.setEmoji(categoryEmoji(category))
				.setDefault(category === chosen),
		),
	];

	return selectRow(
		select({
			id: customId("help", "pick", surface, ownerId),
			placeholder: ar ? arabicHelp.choose : "📚 Choose a category",
			options,
		}),
	);
}

export function categoryControls(
	category: Category,
	page: number,
	totalPages: number,
	surface: Surface,
	ownerId: string,
	ar = false,
) {
	const other: Surface = surface === "slash" ? "prefix" : "slash";

	return row(
		button({
			// The slot keeps Previous and Next apart when both clamp to the same page, as on a one-page category.
			id: customId("help", "page", surface, category, Math.max(0, page - 1), "prev", ownerId),
			emoji: theme.emoji.previous,
			disabled: page <= 0,
		}),
		button({
			id: customId("help", "noop", surface, category, page, ownerId),
			label: `${page + 1} / ${totalPages}`,
			disabled: true,
		}),
		button({
			id: customId("help", "page", surface, category, Math.min(totalPages - 1, page + 1), "next", ownerId),
			emoji: theme.emoji.next,
			disabled: page >= totalPages - 1,
		}),
		button({
			id: customId("help", "swap", other, category, page, ownerId),
			label:
				other === "slash" ? (ar ? arabicHelp.showSlash : "Show slash") : ar ? arabicHelp.showPrefix : "Show prefix",
			style: ButtonStyle.Primary,
		}),
	);
}

export function helpLinks(ar = false) {
	return row(
		linkButton(ar ? arabicHelp.support : "Support server", theme.supportServer),
		linkButton(ar ? arabicHelp.source : "Source code", theme.repository),
	);
}

export function resolveCategory(value: string): Category | null {
	return isCategory(value) ? value : null;
}

export function resolveSurface(value: string | undefined): Surface {
	return value === "prefix" ? "prefix" : "slash";
}
