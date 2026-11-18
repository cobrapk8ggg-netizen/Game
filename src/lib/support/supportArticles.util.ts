import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PermissionsBitField, type PermissionResolvable } from "discord.js";
import { z } from "zod";
import { HIDDEN_CATEGORIES } from "@config/categories";
import { type Command, type CommandOption } from "@core/command";
import { arabicDescription } from "@core/commandLocales";
import { durationIn, permissionName } from "@core/language";
import { assetPath } from "@core/paths";
import { formatDurationLong, humanisePermission } from "@lib/format/format.util";
import { type SupportContext, type SupportEntry } from "@lib/support/support.types";
import { fillFacts, unknownFacts } from "@lib/support/supportFacts.util";
import { isSupportTopic, plainLine, SUPPORT_ARTICLE_ID, SUPPORT_LIMITS } from "@testify/shared";

/** The written help articles in `assets/support`, and a page for every command anybody may run. */

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;

const listOf = (separator: string) =>
	z
		.string()
		.max(1_000)
		.default("")
		.transform((value) =>
			value
				.split(separator)
				.map((part) => part.trim())
				.filter((part) => part !== ""),
		);

const frontmatter = z
	.object({
		id: z.string().max(SUPPORT_LIMITS.articleIdMax).regex(SUPPORT_ARTICLE_ID),
		title: plainLine(3, SUPPORT_LIMITS.titleMax),
		topic: z.string().refine(isSupportTopic, "is not a topic"),
		keywords: listOf(","),
		questions: listOf("|"),
		commands: listOf(","),
		related: listOf(","),
		featured: z.enum(["true", "false"]).default("false"),
	})
	.strict();

export interface Article {
	entry: SupportEntry;
	/** Command names and article ids this one points at, checked once every entry is known. */
	commands: string[];
	related: string[];
}

type ArticleResult = { ok: true; article: Article } | { ok: false; file: string; reason: string };

export function parseArticle(file: string, source: string): ArticleResult {
	const match = FRONTMATTER.exec(source.replace(/\r\n/g, "\n"));
	if (match === null) return { ok: false, file, reason: "has no frontmatter" };

	const [, head = "", body = ""] = match;
	const fields = Object.fromEntries(
		head.split("\n").flatMap((line) => {
			const at = line.indexOf(":");
			return at === -1 ? [] : [[line.slice(0, at).trim(), line.slice(at + 1).trim()]];
		}),
	);

	const parsed = frontmatter.safeParse(fields);
	if (!parsed.success) {
		return { ok: false, file, reason: parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ") };
	}
	if (`${parsed.data.id}.md` !== file) return { ok: false, file, reason: "id does not match the file name" };

	const text = body.trim();
	if (text === "" || text.length > SUPPORT_LIMITS.bodyMax)
		return { ok: false, file, reason: "body is empty or too long" };

	const unknown = unknownFacts(text);
	if (unknown.length > 0) return { ok: false, file, reason: `names facts that do not exist: ${unknown.join(", ")}` };

	const { id, title, topic, keywords, questions, commands, related, featured } = parsed.data;
	return {
		ok: true,
		article: {
			entry: {
				id,
				title,
				topic,
				keywords,
				questions,
				body: text,
				featured: featured === "true",
				kind: "article",
				links: [],
			},
			commands,
			related,
		},
	};
}

export function loadArticles(directory = assetPath("support")): ArticleResult[] {
	return readdirSync(directory)
		.filter((file) => file.endsWith(".md"))
		.sort()
		.map((file) => parseArticle(file, readFileSync(join(directory, file), "utf8")));
}

function permissionList(permissions: PermissionResolvable[] | undefined, ar: boolean): string[] {
	if (permissions === undefined || permissions.length === 0) return [];
	return new PermissionsBitField(permissions)
		.toArray()
		.map((name) => `**${ar ? permissionName("ar", name) : humanisePermission(name)}**`);
}

function joinWords(words: string[], ar: boolean): string {
	if (ar) return new Intl.ListFormat("ar").format(words);
	return words.length < 2 ? words.join("") : `${words.slice(0, -1).join(", ")} and ${words.at(-1) ?? ""}`;
}

function usage(path: string, options: readonly CommandOption[]): string {
	const parts = options.map((option) => (option.required === true ? `<${option.name}>` : `[${option.name}]`));
	return `\`${[path, ...parts].join(" ")}\``;
}

function optionLine(command: string, option: CommandOption, ar: boolean): string {
	const description = ar ? arabicDescription(option.description, command, undefined, option.name) : option.description;
	const choices =
		option.choices === undefined || option.choices.length === 0
			? ""
			: ` ${ar ? "اختر من" : "One of"} ${joinWords(
					option.choices.map((choice) => `\`${choice.name}\``),
					ar,
				)}.`;

	return `- **${option.name}**${option.required === true ? (ar ? " (إلزامي)" : " (required)") : ""}: ${description}${choices}`;
}

/** A reference page per command, written from the same metadata Discord is given, so it cannot drift from the bot. */
export function commandReference(command: Command, ar = false): string {
	const subcommands = command.subcommands ?? [];
	const options = command.options ?? [];
	const lines = [
		ar ? arabicDescription(command.description, command.name) : command.description,
		"",
		ar ? "### طريقة الاستخدام" : "### How to use it",
	];

	if (subcommands.length === 0) {
		lines.push(usage(`/${command.name}`, options));
		if (options.length > 0) lines.push("", ...options.map((option) => optionLine(command.name, option, ar)));
	} else {
		lines.push(
			...subcommands.map((sub) => {
				const extra = permissionList(sub.permissions, ar);
				const needs = extra.length === 0 ? "" : ` ${ar ? "الصلاحيات المطلوبة:" : "Needs"} ${joinWords(extra, ar)}.`;
				const description = ar ? arabicDescription(sub.description, command.name, sub.name) : sub.description;
				return `- ${usage(`/${command.name} ${sub.name}`, sub.options ?? [])}: ${description}${needs}`;
			}),
		);
	}

	const aliases = [...(command.aliases ?? []), ...subcommands.flatMap((sub) => sub.aliases ?? [])];
	const alsoAs =
		aliases.length === 0
			? ""
			: `${ar ? "، أو " : ", or "}${joinWords(
					aliases.map((alias) => `\`{prefix}${alias}\``),
					ar,
				)}`;
	const notes = [
		`- ${ar ? "يمكنك استخدام الأمر مع البادئة أيضًا:" : "Works as a prefix command too:"} \`{prefix}${command.name}\`${alsoAs}.`,
	];

	const yours = permissionList(command.permissions, ar);
	if (yours.length > 0) notes.push(`- ${ar ? "تحتاج إلى" : "You need"} ${joinWords(yours, ar)}.`);
	const bots = permissionList(command.botPermissions, ar);
	if (bots.length > 0) notes.push(`- ${ar ? "يحتاج البوت إلى" : "The bot needs"} ${joinWords(bots, ar)}.`);
	if (command.guildOnly === true)
		notes.push(ar ? "- يعمل داخل الخوادم فقط." : "- Only works in a server, not in direct messages.");
	if (command.cooldown !== undefined)
		notes.push(
			ar
				? `- انتظر ${durationIn("ar", command.cooldown)} قبل استخدامه مجددًا.`
				: `- Wait ${formatDurationLong(command.cooldown)} between uses.`,
		);

	lines.push(
		"",
		ar ? "### ملاحظات" : "### Good to know",
		...notes,
		"",
		ar
			? "> يرمز `<>` إلى الخيار الإلزامي و`[]` إلى الخيار الاختياري."
			: "> In the usage above, `<>` means required and `[]` means optional.",
	);
	return lines.join("\n");
}

export function commandEntries(commands: Iterable<Command>, ar = false): SupportEntry[] {
	return [...commands]
		.filter((command) => command.ownerOnly !== true && !HIDDEN_CATEGORIES.includes(command.category))
		.sort((left, right) => left.name.localeCompare(right.name))
		.map((command) => {
			const subcommands = command.subcommands ?? [];
			const aliases = [...(command.aliases ?? []), ...subcommands.flatMap((sub) => sub.aliases ?? [])];

			return {
				id: `command-${command.name}`,
				title: ar ? `الأمر /${command.name}` : `The /${command.name} command`,
				topic: "commands" as const,
				keywords: [
					command.name,
					...command.name.split("-"),
					command.category,
					...aliases,
					...subcommands.map((sub) => sub.name),
				],
				questions: ar
					? [
							arabicDescription(command.description, command.name),
							...subcommands.map((sub) => arabicDescription(sub.description, command.name, sub.name)),
						]
					: [command.description, ...subcommands.map((sub) => sub.description)],
				body: commandReference(command, ar),
				featured: false,
				kind: "command" as const,
				links: [],
			};
		});
}

interface LinkProblem {
	article: string;
	missing: string;
}

/** Joins each guide to its command pages and back, and names any link that points at nothing. */
export function linkEntries(
	articles: readonly Article[],
	commands: readonly SupportEntry[],
): { entries: SupportEntry[]; problems: LinkProblem[] } {
	const known = new Set([...articles.map((article) => article.entry.id), ...commands.map((entry) => entry.id)]);
	const guides = new Map<string, string[]>();
	const problems: LinkProblem[] = [];

	const linked = articles.map(({ entry, commands: names, related }) => {
		const targets = [...names.map((name) => `command-${name}`), ...related];
		for (const target of targets) {
			if (!known.has(target)) problems.push({ article: entry.id, missing: target });
		}
		for (const name of names) guides.set(`command-${name}`, [...(guides.get(`command-${name}`) ?? []), entry.id]);

		return {
			...entry,
			links: [...related, ...names.map((name) => `command-${name}`)].filter((target) => known.has(target)),
		};
	});

	return {
		entries: [...linked, ...commands.map((entry) => ({ ...entry, links: guides.get(entry.id) ?? [] }))],
		problems,
	};
}

export function fillPlaceholders(text: string, context: SupportContext, ar = false): string {
	// Functions rather than strings, so a `$&` in a server's prefix is not read as a replacement pattern.
	return fillFacts(text, ar)
		.replaceAll("{bot}", () => context.bot)
		.replaceAll("{prefix}", () => context.prefix)
		.replaceAll("{repository}", () => context.repository);
}
