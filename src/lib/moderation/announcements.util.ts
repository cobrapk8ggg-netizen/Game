import {
	type Guild,
	type GuildMember,
	type GuildTextBasedChannel,
	type MessageCreateOptions,
	PermissionFlagsBits,
} from "discord.js";
import { botCopy } from "@config/strings";
import { UserFacingError } from "@core/errors";
import { embed } from "@lib/discord/embeds.util";
import { type AnnouncementMentions, type AnnouncementStyle } from "@testify/shared";

/** A message posted as the bot, from `/announce` or the dashboard: the one place that decides who it pings. */

export interface Announcement {
	style: AnnouncementStyle;
	title?: string | undefined;
	message: string;
	colour?: `#${string}` | undefined;
	mentions: AnnouncementMentions;
	by: { name: string; avatarUrl: string | null };
}

const TOKEN: Record<Exclude<AnnouncementMentions, "none">, string> = { everyone: "@everyone", here: "@here" };

/** Pinging everyone through the bot asks what Discord would ask of the person, and needs the bot to have it too. */
export function mentionProblem(
	channel: GuildTextBasedChannel,
	guild: Guild,
	reader: GuildMember | undefined,
	mentions: AnnouncementMentions,
): string | null {
	if (mentions === "none") return null;
	if (reader !== undefined && !channel.permissionsFor(reader).has(PermissionFlagsBits.MentionEveryone)) {
		return botCopy(
			"You need the Mention Everyone permission in that channel to ping everybody.",
			"تحتاج إلى صلاحية الإشارة إلى الجميع في القناة لإرسال إشعار لكل الأعضاء.",
		);
	}
	const me = guild.members.me;
	if (me === null || !channel.permissionsFor(me).has(PermissionFlagsBits.MentionEveryone)) {
		return botCopy(
			"I need the Mention Everyone permission in that channel to ping everybody.",
			"أحتاج إلى صلاحية الإشارة إلى الجميع في القناة لإرسال إشعار لكل الأعضاء.",
		);
	}
	return null;
}

/** Only the ping it was asked for: a role or a member named in the text is shown, never pinged. */
export function announcementMessage(announcement: Announcement): MessageCreateOptions {
	const ping = announcement.mentions === "none" ? null : TOKEN[announcement.mentions];
	const allowedMentions = ping === null ? { parse: [] } : { parse: ["everyone" as const] };

	if (announcement.style === "text") {
		return {
			content: ping === null ? announcement.message : `${ping}\n${announcement.message}`,
			allowedMentions,
		};
	}

	return {
		...(ping === null ? {} : { content: ping }),
		embeds: [
			embed({
				colour: announcement.colour ?? "#7289da",
				title: announcement.title ?? botCopy("Announcement", "إعلان"),
				description: announcement.message,
				footer: botCopy(`Posted by ${announcement.by.name}`, `نشره ${announcement.by.name}`),
				...(announcement.by.avatarUrl === null ? {} : { footerIcon: announcement.by.avatarUrl }),
			}),
		],
		allowedMentions,
	};
}

export function sendableChannel(guild: Guild, channelId: string): GuildTextBasedChannel {
	const channel = guild.channels.cache.get(channelId);
	if (channel?.isTextBased() !== true || !channel.isSendable()) {
		throw new UserFacingError(
			botCopy("Pick a text channel I can send messages in.", "اختر قناة نصية يمكنني إرسال الرسائل إليها."),
		);
	}
	return channel;
}
