import { DiscordAPIError, RESTJSONErrorCodes } from "discord.js";
import { botCopy } from "@config/strings";
import { type TestifyClient } from "@core/client";
import { UserFacingError } from "@core/errors";
import { durationIn } from "@core/language";
import { countReminders, createReminder, type StoredReminder } from "@database/repositories/reminderRepository";
import { parseDuration } from "@lib/format/duration.util";
import { formatDurationLong } from "@lib/format/format.util";
import { deliveredText } from "@lib/reminders/reminderPanel.util";
import { REMINDER_LIMITS } from "@lib/reminders/reminders.constants";
import { sanitiseText } from "@testify/shared";

/** How far ahead a reminder is due, refused with advice rather than guessed at. */
export function reminderDelay(input: string): number {
	const delay = parseDuration(input);

	if (delay === null)
		throw new UserFacingError(
			botCopy(
				"Say when as a length of time, such as `10m`, `2h` or `3d`.",
				"أدخل مدة مثل `10m` أو `2h` أو `3d` لتحديد موعد التذكير.",
			),
		);
	if (delay < REMINDER_LIMITS.minMs) {
		throw new UserFacingError(
			botCopy(
				`A reminder has to be at least ${formatDurationLong(REMINDER_LIMITS.minMs)} away.`,
				`الحد الأدنى للمدة قبل التذكير: ${durationIn("ar", REMINDER_LIMITS.minMs)}.`,
			),
		);
	}
	if (delay > REMINDER_LIMITS.maxMs) {
		throw new UserFacingError(
			botCopy(
				`A reminder can be at most ${formatDurationLong(REMINDER_LIMITS.maxMs)} away.`,
				`الحد الأقصى للمدة قبل التذكير: ${durationIn("ar", REMINDER_LIMITS.maxMs)}.`,
			),
		);
	}

	return delay;
}

export function reminderText(input: string): string {
	const value = sanitiseText(input);

	if (value === "") throw new UserFacingError(botCopy("Say what to remind you of.", "اكتب نص التذكير."));
	if (value.length > REMINDER_LIMITS.maxText) {
		throw new UserFacingError(
			botCopy(
				`Keep a reminder under ${String(REMINDER_LIMITS.maxText)} characters.`,
				`الحد الأقصى لطول نص التذكير ${String(REMINDER_LIMITS.maxText)} حرفًا.`,
			),
		);
	}

	return value;
}

export async function setReminder(request: {
	userId: string;
	guildId: string | null;
	channelId: string | null;
	when: string;
	about: string;
	now?: Date;
}): Promise<StoredReminder> {
	const delay = reminderDelay(request.when);
	const text = reminderText(request.about);

	if ((await countReminders(request.userId)) >= REMINDER_LIMITS.maxActive) {
		throw new UserFacingError(
			botCopy(
				`You already have ${String(REMINDER_LIMITS.maxActive)} reminders. Cancel one with \`/remind list\` first.`,
				`لديك ${String(REMINDER_LIMITS.maxActive)} تذكيرًا بالفعل. ألغِ أحدها أولًا من \`/remind list\`.`,
			),
		);
	}

	const inServer = request.guildId !== null && request.channelId !== null;
	return createReminder({
		userId: request.userId,
		guildId: request.guildId,
		channelId: inServer ? request.channelId : null,
		text,
		dueAt: new Date((request.now ?? new Date()).getTime() + delay),
		deliver: inServer ? "channel" : "dm",
	});
}

/** Discord's answers that mean this route will never work for this person, as opposed to failing for now. */
const NEVER = new Set<number>([
	RESTJSONErrorCodes.CannotSendMessagesToThisUser,
	RESTJSONErrorCodes.UnknownUser,
	RESTJSONErrorCodes.UnknownChannel,
	RESTJSONErrorCodes.MissingAccess,
	RESTJSONErrorCodes.MissingPermissions,
]);

function isFinal(error: unknown): boolean {
	return error instanceof DiscordAPIError && typeof error.code === "number" && NEVER.has(error.code);
}

/** A ping where it was set, falling back to a DM when that channel or that member is gone; null when neither works. */
export async function deliverReminder(
	client: TestifyClient,
	reminder: StoredReminder,
): Promise<"channel" | "dm" | null> {
	if (reminder.deliver === "channel" && reminder.guildId !== null && reminder.channelId !== null) {
		const guild = client.guilds.cache.get(reminder.guildId);
		const stillHere = await guild?.members.fetch(reminder.userId).catch(() => null);
		const channel = stillHere ? await guild?.channels.fetch(reminder.channelId).catch(() => null) : null;

		if (channel?.isSendable() === true) {
			try {
				await channel.send({
					content: deliveredText(reminder, "channel"),
					allowedMentions: { users: [reminder.userId] },
				});
				return "channel";
			} catch (error) {
				if (!isFinal(error)) throw error;
			}
		}
	}

	try {
		const user = await client.users.fetch(reminder.userId);
		await user.send({ content: deliveredText(reminder, "dm"), allowedMentions: { parse: [] } });
		return "dm";
	} catch (error) {
		if (isFinal(error)) return null;
		throw error;
	}
}
