import { type EmbedBuilder, type Guild, type GuildMember, type User } from "discord.js";
import { type BotLanguage } from "@config/languages";
import { botCopy, strings } from "@config/strings";
import { theme } from "@config/theme";
import { asMember, type CommandInput } from "@core/command";
import { UserFacingError } from "@core/errors";
import { durationIn, readerLanguage } from "@core/language";
import { embed } from "@lib/discord/embeds.util";
import { formatDurationLong } from "@lib/format/format.util";
import { DEFAULT_REASON } from "@lib/moderation/moderation.constants";
import { type MemberBlock } from "@testify/shared";

/** Why this moderator may not act on this target, as a code, or null; every surface asks here. */
export function moderationBlock(moderator: GuildMember, target: GuildMember, botId?: string): MemberBlock | null {
	const guild = target.guild;

	if (target.id === moderator.id) return "you";
	// The id is passed rather than read off `members.me`, which is null when the bot's own member is uncached.
	if (target.id === (botId ?? guild.members.me?.id)) return "bot";
	if (target.id === guild.ownerId) return "owner";

	if (moderator.id !== guild.ownerId && moderator.roles.highest.position <= target.roles.highest.position) {
		return "outranked";
	}

	const me = guild.members.me;
	if (me && me.roles.highest.position <= target.roles.highest.position) return "botOutranked";

	return null;
}

const BLOCK_TEXT: Record<MemberBlock, string> = {
	you: strings.moderation.selfTarget,
	bot: strings.moderation.botTarget,
	owner: "You cannot moderate the server owner.",
	outranked: strings.moderation.hierarchyUser,
	botOutranked: strings.moderation.hierarchyBot,
	notMember: "Only somebody in this server can moderate its members.",
};

const ARABIC_BLOCK_TEXT: Record<MemberBlock, string> = {
	you: "لا يمكنك استخدام هذا الأمر على نفسك.",
	bot: "لا يمكنك استخدام هذا الأمر على البوت.",
	owner: "لا يمكنك اتخاذ هذا الإجراء بحق مالك الخادم.",
	outranked: "يجب أن يكون أعلى أدوارك أعلى من أعلى أدوار العضو.",
	botOutranked: "يجب أن يكون أعلى أدوار البوت أعلى من أعلى أدوار العضو.",
	notMember: "يجب أن تكون عضوًا في الخادم لتتمكن من الإشراف على أعضائه.",
};

export function blockText(block: MemberBlock, language?: BotLanguage): string {
	return (language === "ar" ? ARABIC_BLOCK_TEXT : BLOCK_TEXT)[block];
}

export function moderationProblem(moderator: GuildMember, target: GuildMember, botId?: string): string | null {
	const block = moderationBlock(moderator, target, botId);
	return block === null ? null : BLOCK_TEXT[block];
}

export function assertModeratable(ctx: CommandInput, target: GuildMember, override?: BotLanguage): void {
	const block = moderationBlock(asMember(ctx), target, ctx.client.user?.id);
	if (block !== null) throw new UserFacingError(blockText(block, readerLanguage(ctx, override)));
}

/** Best-effort DM to the target. */
export async function notifyTarget(user: User, builder: EmbedBuilder): Promise<boolean> {
	try {
		await user.send({ embeds: [builder] });
		return true;
	} catch {
		return false;
	}
}

export function actionEmbed(options: {
	action: string;
	emoji: string;
	guild: Guild;
	target: User;
	moderator: User;
	reason: string;
	extra?: { name: string; value: string; inline?: boolean }[];
	language?: BotLanguage;
}): EmbedBuilder {
	const ar = options.language === "ar";
	return embed({
		category: "moderation",
		title: `${options.emoji} ${options.action}`,
		fields: [
			{ name: ar ? "المستخدم" : "User", value: `${options.target} (\`${options.target.id}\`)`, inline: true },
			{ name: ar ? "المشرف" : "Moderator", value: `${options.moderator}`, inline: true },
			{
				name: ar ? "السبب" : "Reason",
				value: ar && options.reason === DEFAULT_REASON ? "لم يُذكر سبب" : options.reason,
			},
			...(options.extra ?? []),
		],
		thumbnail: options.target.displayAvatarURL(),
		footer: options.guild.name,
	});
}

export function notificationField(notified: boolean, language?: BotLanguage) {
	if (language === "ar") return { name: "أُرسل إشعار", value: notified ? "نعم" : "لا", inline: true };
	return { name: "Notified", value: notified ? "Yes" : "No", inline: true };
}

/** What `/mute` and the Time out action answer with. */
export function timedOutEmbed(options: {
	guild: Guild;
	target: User;
	moderator: User;
	reason: string;
	durationMs: number;
	notified: boolean;
	language?: BotLanguage;
}): EmbedBuilder {
	const ar = options.language === "ar";
	return actionEmbed({
		action: ar ? "تم تقييد العضو مؤقتًا" : "Member timed out",
		...(options.language === undefined ? {} : { language: options.language }),
		emoji: theme.emoji.moderation,
		guild: options.guild,
		target: options.target,
		moderator: options.moderator,
		reason: options.reason,
		extra: [
			{
				name: ar ? "المدة" : "Duration",
				value: ar ? durationIn("ar", options.durationMs) : formatDurationLong(options.durationMs),
				inline: true,
			},
			notificationField(options.notified, options.language),
		],
	});
}

export function dmEmbed(options: {
	action: string;
	emoji: string;
	guild: Guild;
	moderator: Pick<User, "username">;
	reason: string;
	extra?: { name: string; value: string; inline?: boolean }[];
}): EmbedBuilder {
	return embed({
		category: "moderation",
		title: botCopy(`${options.emoji} You were ${options.action}`, `${options.emoji} ${options.action}`),
		fields: [
			{ name: botCopy("Server", "الخادم"), value: options.guild.name, inline: true },
			{ name: botCopy("Moderator", "المشرف"), value: options.moderator.username, inline: true },
			{
				name: botCopy("Reason", "السبب"),
				value: options.reason === DEFAULT_REASON ? botCopy(DEFAULT_REASON, "لم يُذكر سبب") : options.reason,
			},
			...(options.extra ?? []),
		],
		footer: options.guild.name,
	});
}
