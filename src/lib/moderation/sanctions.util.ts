import { type Guild, type GuildMember, type User } from "discord.js";
import { DAY_MS } from "@config/constants";
import { botCopy, strings } from "@config/strings";
import { theme } from "@config/theme";
import { type TestifyClient } from "@core/client";
import { UserFacingError } from "@core/errors";
import { durationIn } from "@core/language";
import { deactivateSoftban, getActiveSoftban } from "@database/repositories/moderationRepository";
import { appealLink } from "@lib/appeals/appealLink.util";
import { formatDurationLong } from "@lib/format/format.util";
import { recordCase } from "@lib/moderation/caseActions.util";
import { dmEmbed, notifyTarget } from "@lib/moderation/moderationActions.util";

/** Kicking, banning and timing out, shared by the commands and the dashboard so each checks, notifies and records the same way. */

interface Sanctioned {
	notified: boolean;
}

export interface Moderator {
	id: string;
	name: string;
}

export function moderatorOf(user: { id: string; username: string }): Moderator {
	return { id: user.id, name: user.username };
}

/** Discord's ceiling on a timeout. */
const MAX_TIMEOUT_MS = 28 * DAY_MS;

/** The DM goes first, because once they are out of the server the bot can no longer reach them. */
export async function kickMember(
	guild: Guild,
	member: GuildMember,
	moderator: Moderator,
	reason: string,
): Promise<Sanctioned> {
	if (!member.kickable) throw new UserFacingError(strings.moderation.notModeratable);

	const notified = await notifyTarget(
		member.user,
		dmEmbed({
			action: botCopy(`kicked from ${guild.name}`, `طُردت من خادم ${guild.name}`),
			emoji: theme.emoji.moderation,
			guild,
			moderator: { username: moderator.name },
			reason,
		}),
	);

	await member.kick(`${moderator.name}: ${reason}`);
	await recordCase(guild, { action: "kick", user: member.user, moderator, reason });

	return { notified };
}

/** Works on somebody who has already left, which is the one case a kick cannot cover. */
export async function banUser(
	guild: Guild,
	user: User,
	member: GuildMember | null,
	moderator: Moderator,
	reason: string,
	deleteDays = 0,
): Promise<Sanctioned> {
	if (member !== null && !member.bannable) throw new UserFacingError(strings.moderation.notModeratable);

	const existing = await guild.bans.fetch(user.id).catch(() => null);
	if (existing !== null)
		throw new UserFacingError(
			botCopy(`${user.username} is already banned.`, `سبق حظر ${user.username} في هذا الخادم.`),
		);

	const appeal = member === null ? null : await appealLink(guild.client as TestifyClient, guild.id);
	const notified =
		member === null
			? false
			: await notifyTarget(
					user,
					dmEmbed({
						action: botCopy(`banned from ${guild.name}`, `حُظرت من خادم ${guild.name}`),
						emoji: theme.emoji.moderation,
						guild,
						moderator: { username: moderator.name },
						reason,
						...(appeal === null
							? {}
							: {
									extra: [
										{
											name: botCopy("Appeal", "طلب رفع الحظر"),
											value: botCopy(
												`Sign in at ${appeal} to ask for the ban to be lifted.`,
												`سجّل الدخول عبر ${appeal} لتقديم طلب رفع الحظر.`,
											),
										},
									],
								}),
					}),
				);

	await guild.members.ban(user.id, {
		reason: `${moderator.name}: ${reason}`,
		deleteMessageSeconds: deleteDays * 86_400,
	});
	await recordCase(guild, { action: "ban", user, moderator, reason });

	return { notified };
}

/** The user the ban was on, which a lookup by id is the only way to name once they are gone. */
export async function unbanUser(guild: Guild, userId: string, moderator: Moderator, reason: string): Promise<User> {
	const ban = await guild.bans.fetch(userId).catch(() => null);
	if (ban === null)
		throw new UserFacingError(botCopy("That user is not banned in this server.", "هذا المستخدم غير محظور في الخادم."));

	await guild.bans.remove(userId, `${moderator.name}: ${reason}`);
	await recordCase(guild, { action: "unban", user: ban.user, moderator, reason });

	return ban.user;
}

export async function timeoutMember(
	guild: Guild,
	member: GuildMember,
	moderator: Moderator,
	durationMs: number,
	reason: string,
): Promise<Sanctioned> {
	if (durationMs <= 0)
		throw new UserFacingError(
			botCopy(
				"That duration is not valid. Try something like `10m`, `2h` or `3d`.",
				"المدة غير صالحة. جرّب صيغة مثل `10m` أو `2h` أو `3d`.",
			),
		);
	if (durationMs > MAX_TIMEOUT_MS)
		throw new UserFacingError(
			botCopy(
				"Discord only allows timeouts of up to 28 days.",
				"يحدّد Discord مدة التقييد المؤقت بما لا يتجاوز ثمانية وعشرين يومًا.",
			),
		);
	if (!member.moderatable) throw new UserFacingError(strings.moderation.notModeratable);

	const notified = await notifyTarget(
		member.user,
		dmEmbed({
			action: botCopy(`timed out in ${guild.name}`, `فُرض عليك تقييد مؤقت في خادم ${guild.name}`),
			emoji: theme.emoji.moderation,
			guild,
			moderator: { username: moderator.name },
			reason,
			extra: [
				{
					name: botCopy("Duration", "المدة"),
					value: botCopy(formatDurationLong(durationMs), durationIn("ar", durationMs)),
					inline: true,
				},
			],
		}),
	);

	await member.timeout(durationMs, `${moderator.name}: ${reason}`);
	await recordCase(guild, { action: "timeout", user: member.user, moderator, reason, durationMs });

	return { notified };
}

export async function removeTimeout(
	guild: Guild,
	member: GuildMember,
	moderator: Moderator,
	reason: string,
): Promise<Sanctioned> {
	if (member.communicationDisabledUntilTimestamp === null) {
		throw new UserFacingError(
			botCopy(
				`${member.user.username} is not currently timed out.`,
				`لا يخضع ${member.user.username} لتقييد مؤقت حاليًا.`,
			),
		);
	}
	if (!member.moderatable) throw new UserFacingError(strings.moderation.notModeratable);

	await member.timeout(null, `${moderator.name}: ${reason}`);
	const notified = await notifyTarget(
		member.user,
		dmEmbed({
			action: botCopy(`untimed out in ${guild.name}`, `رُفع عنك التقييد المؤقت في خادم ${guild.name}`),
			emoji: theme.emoji.success,
			guild,
			moderator: { username: moderator.name },
			reason,
		}),
	);
	await recordCase(guild, { action: "untimeout", user: member.user, moderator, reason });

	return { notified };
}

/** Lifts a softban early: the Discord ban first, because the record is what the sweep job reads. */
export async function revokeSoftban(guild: Guild, userId: string, by: Moderator): Promise<boolean> {
	if ((await getActiveSoftban(guild.id, userId)) === null) return false;

	const ban = await guild.bans.fetch(userId).catch(() => null);
	await guild.bans.remove(userId, `Softban lifted early by ${by.name}`).catch(() => null);
	const lifted = await deactivateSoftban(guild.id, userId);

	if (ban !== null)
		await recordCase(guild, { action: "unban", user: ban.user, moderator: by, reason: "Softban lifted early" });
	return lifted;
}
