import { PermissionsBitField } from "discord.js";
import {
	AFK,
	DAY_MS,
	DEFAULT_PREFIX,
	ECONOMY,
	ECONOMY_COOLDOWNS,
	HOUR_MS,
	LEVELLING,
	MINUTE_MS,
	TICKET,
} from "@config/constants";
import { durationIn, permissionName } from "@core/language";
import { ANSWER_EVERY_MS } from "@lib/autoResponders/autoResponders.util";
import { CASINO_TIMING } from "@lib/casino/casino.constants";
import { COINFLIP_RETURN, DICE_RETURNS } from "@lib/casino/chance.util";
import { HILO_EDGE, HILO_MAX_MULTIPLIER } from "@lib/casino/hilo.util";
import { SLOT_PAYTABLE, slotsReturnToPlayer } from "@lib/casino/slots.util";
import { formatDurationLong, formatNumber, humanisePermission } from "@lib/format/format.util";
import { POLL_LIMITS } from "@lib/polls/polls.constants";
import { REMINDER_LIMITS } from "@lib/reminders/reminders.constants";
import { SCHEDULE_TIMING } from "@lib/scheduledMessages/scheduledMessages.constants";
import { MAKE_PAUSE_MS } from "@lib/tempVoice/tempVoice.constants";
import {
	AUTO_RESPONDER_LIMITS,
	BIRTHDAY_LIMITS,
	DIRECTORY_LIMITS,
	GIVEAWAY_LIMITS,
	INVITE_PERMISSIONS,
	LEVEL_LIMITS,
	LOTTERY_LIMITS,
	RAID_LIMITS,
	ROLE_MENU_LIMITS,
	SCHEDULE_LIMITS,
	SETTINGS_LIMITS,
	SHOP_ROLE_LIMITS,
	STARBOARD_LIMITS,
	STICKY_LIMITS,
	TEMP_VOICE_LIMITS,
	TREASURE_DEFAULTS,
	TREASURE_LIMITS,
	WELCOME_LIMITS,
} from "@testify/shared";

const DURATIONS = {
	"economy.heistJoin": ECONOMY.heistJoinWindowMs,
	"cooldown.daily": ECONOMY_COOLDOWNS.daily,
	"cooldown.work": ECONOMY_COOLDOWNS.work,
	"cooldown.rob": ECONOMY_COOLDOWNS.rob,
	"cooldown.heist": ECONOMY_COOLDOWNS.heist,
	"cooldown.beg": ECONOMY_COOLDOWNS.beg,
	"casino.handIdle": CASINO_TIMING.handIdleMs,
	"levelling.xpCooldown": LEVELLING.messageCooldownMs,
	"giveaway.minDuration": GIVEAWAY_LIMITS.minDurationMs,
	"giveaway.maxDuration": GIVEAWAY_LIMITS.maxDurationMs,
	"reminder.min": REMINDER_LIMITS.minMs,
	"reminder.max": REMINDER_LIMITS.maxMs,
	"tempVoice.makePause": MAKE_PAUSE_MS,
	"treasure.cooldown": TREASURE_DEFAULTS.cooldownMs,
	"ticket.closeDelay": TICKET.closeDelayMs,
	"poll.defaultDuration": POLL_LIMITS.defaultHours * HOUR_MS,
	"poll.maxDuration": POLL_LIMITS.maxHours * HOUR_MS,
	"afk.keep": AFK.keepDays * DAY_MS,
	"afk.noticeEvery": AFK.noticeEveryMs,
	"autoResponder.pause": ANSWER_EVERY_MS,
	"schedule.lateBy": SCHEDULE_TIMING.lateByMs,
	"schedule.maxAhead": SCHEDULE_LIMITS.maxAheadDays * DAY_MS,
	"raid.maxAccountAge": RAID_LIMITS.maxAccountAgeMinutes * MINUTE_MS,
	"raid.alertEvery": RAID_LIMITS.alertEveryMinutes * MINUTE_MS,
};

/** Every number an article quotes, read from the code, so an article cannot state a limit the bot no longer has. */
export const FACTS: Readonly<Record<string, string>> = {
	"prefix.default": DEFAULT_PREFIX,
	"prefix.maxLength": formatNumber(SETTINGS_LIMITS.maxPrefix),
	"invite.permissions": new PermissionsBitField(BigInt(INVITE_PERMISSIONS))
		.toArray()
		.map((name) => humanisePermission(name))
		.join(", "),

	"economy.startingWallet": formatNumber(ECONOMY.startingWallet),
	"economy.dailyBase": formatNumber(ECONOMY.dailyBase),
	"economy.dailyStreakBonus": formatNumber(ECONOMY.dailyStreakBonus),
	"economy.dailyStreakCap": formatNumber(ECONOMY.dailyStreakCap),
	"economy.dailyMax": formatNumber(ECONOMY.dailyBase + ECONOMY.dailyStreakCap * ECONOMY.dailyStreakBonus),
	"economy.workMin": formatNumber(ECONOMY.workMinPay),
	"economy.workMax": formatNumber(ECONOMY.workMaxPay),
	"economy.begMax": formatNumber(ECONOMY.begMax),
	"economy.robChance": `${String(Math.round(ECONOMY.robSuccessChance * 100))}%`,
	"economy.robFine": `${String(Math.round(ECONOMY.robFinePercent * 100))}%`,
	"economy.robMinWallet": formatNumber(ECONOMY.robMinTargetWallet),
	"economy.heistMin": formatNumber(ECONOMY.heistMinPlayers),
	"economy.heistMax": formatNumber(ECONOMY.heistMaxPlayers),
	"economy.heistJoin": formatDurationLong(DURATIONS["economy.heistJoin"]),
	"economy.inventoryMax": formatNumber(ECONOMY.maxInventorySize),
	"economy.shopRolesMax": formatNumber(SHOP_ROLE_LIMITS.max),

	"cooldown.daily": formatDurationLong(DURATIONS["cooldown.daily"]),
	"cooldown.work": formatDurationLong(DURATIONS["cooldown.work"]),
	"cooldown.rob": formatDurationLong(DURATIONS["cooldown.rob"]),
	"cooldown.heist": formatDurationLong(DURATIONS["cooldown.heist"]),
	"cooldown.beg": formatDurationLong(DURATIONS["cooldown.beg"]),

	"casino.slotsReturn": `${(slotsReturnToPlayer() * 100).toFixed(1)}%`,
	"casino.slotsTop": `${formatNumber(SLOT_PAYTABLE.diamond)}×`,
	"casino.coinflipReturn": `${String(COINFLIP_RETURN)}×`,
	"casino.diceSeven": `${String(DICE_RETURNS.seven)}×`,
	"casino.hiloCut": `${String(Math.round((1 - HILO_EDGE) * 100))}%`,
	"casino.hiloCap": `${formatNumber(HILO_MAX_MULTIPLIER)}×`,
	"casino.handIdle": formatDurationLong(DURATIONS["casino.handIdle"]),

	"levelling.xpMin": formatNumber(LEVELLING.xpPerMessageMin),
	"levelling.xpMax": formatNumber(LEVELLING.xpPerMessageMax),
	"levelling.xpCooldown": formatDurationLong(DURATIONS["levelling.xpCooldown"]),
	"levelling.xpForLevel1": formatNumber(LEVELLING.xpForLevel(1)),
	"levelling.xpForLevel5": formatNumber(LEVELLING.xpForLevel(5)),
	"levelling.xpForLevel10": formatNumber(LEVELLING.xpForLevel(10)),
	"levelling.maxBoosts": formatNumber(LEVEL_LIMITS.maxBoosts),
	"levelling.maxMultiplier": formatNumber(LEVEL_LIMITS.maxMultiplier),
	"levelling.maxRewards": formatNumber(LEVEL_LIMITS.maxRewards),
	"levelling.maxRewardLevel": formatNumber(LEVEL_LIMITS.maxRewardLevel),
	"levelling.maxIgnoredChannels": formatNumber(LEVEL_LIMITS.maxIgnoredChannels),
	"levelling.maxIgnoredRoles": formatNumber(LEVEL_LIMITS.maxIgnoredRoles),

	"welcome.maxMessage": formatNumber(WELCOME_LIMITS.maxMessage),
	"welcome.maxBackgroundMb": `${String(WELCOME_LIMITS.maxBackgroundBytes / (1024 * 1024))} MB`,

	"sticky.minCap": formatNumber(STICKY_LIMITS.minCap),
	"sticky.maxCap": formatNumber(STICKY_LIMITS.maxCap),
	"sticky.maxPerServer": formatNumber(STICKY_LIMITS.maxPerGuild),

	"giveaway.maxWinners": formatNumber(GIVEAWAY_LIMITS.maxWinners),
	"giveaway.minDuration": formatDurationLong(DURATIONS["giveaway.minDuration"]),
	"giveaway.maxDuration": formatDurationLong(DURATIONS["giveaway.maxDuration"]),

	"lottery.maxWinners": formatNumber(LOTTERY_LIMITS.maxWinners),

	"reminder.min": formatDurationLong(DURATIONS["reminder.min"]),
	"reminder.max": formatDurationLong(DURATIONS["reminder.max"]),
	"reminder.maxActive": formatNumber(REMINDER_LIMITS.maxActive),

	"roleMenu.maxPerServer": formatNumber(ROLE_MENU_LIMITS.maxPerGuild),
	"roleMenu.maxRoles": formatNumber(ROLE_MENU_LIMITS.maxRoles),

	"starboard.minStars": formatNumber(STARBOARD_LIMITS.minThreshold),
	"starboard.maxStars": formatNumber(STARBOARD_LIMITS.maxThreshold),
	"starboard.defaultStars": formatNumber(STARBOARD_LIMITS.defaultThreshold),

	"tempVoice.maxPeople": formatNumber(TEMP_VOICE_LIMITS.maxUserLimit),
	"tempVoice.makePause": formatDurationLong(DURATIONS["tempVoice.makePause"]),

	"treasure.minMessages": formatNumber(TREASURE_DEFAULTS.minMessages),
	"treasure.maxMessages": formatNumber(TREASURE_DEFAULTS.maxMessages),
	"treasure.minAmount": formatNumber(TREASURE_DEFAULTS.minAmount),
	"treasure.maxAmount": formatNumber(TREASURE_DEFAULTS.maxAmount),
	"treasure.cooldown": formatDurationLong(DURATIONS["treasure.cooldown"]),
	"treasure.maxAmountLimit": formatNumber(TREASURE_LIMITS.maxAmount),

	"ticket.closeDelay": formatDurationLong(DURATIONS["ticket.closeDelay"]),

	"poll.minAnswers": formatNumber(POLL_LIMITS.minAnswers),
	"poll.maxAnswers": formatNumber(POLL_LIMITS.maxAnswers),
	"poll.defaultDuration": formatDurationLong(DURATIONS["poll.defaultDuration"]),
	"poll.maxDuration": formatDurationLong(DURATIONS["poll.maxDuration"]),

	"afk.maxNote": formatNumber(AFK.maxNote),
	"afk.keep": formatDurationLong(DURATIONS["afk.keep"]),
	"afk.noticeEvery": formatDurationLong(DURATIONS["afk.noticeEvery"]),

	"autoResponder.maxPerServer": formatNumber(AUTO_RESPONDER_LIMITS.maxPerGuild),
	"autoResponder.pause": formatDurationLong(DURATIONS["autoResponder.pause"]),

	"schedule.maxPerServer": formatNumber(SCHEDULE_LIMITS.maxPerGuild),
	"schedule.lateBy": formatDurationLong(DURATIONS["schedule.lateBy"]),
	"schedule.maxAhead": formatDurationLong(DURATIONS["schedule.maxAhead"]),

	"birthday.maxMessage": formatNumber(BIRTHDAY_LIMITS.maxMessage),

	"raid.maxAccountAge": formatDurationLong(DURATIONS["raid.maxAccountAge"]),
	"raid.alertEvery": formatDurationLong(DURATIONS["raid.alertEvery"]),

	"directory.maxBatch": formatNumber(DIRECTORY_LIMITS.maxBatch),
};

const FACT = /\{fact:([a-zA-Z0-9.]+)\}/g;

export function unknownFacts(text: string): string[] {
	return [...text.matchAll(FACT)].map((match) => match[1] ?? "").filter((key) => FACTS[key] === undefined);
}

function arabicFact(key: string): string | undefined {
	const duration = Object.hasOwn(DURATIONS, key) ? DURATIONS[key as keyof typeof DURATIONS] : undefined;
	if (duration !== undefined) return durationIn("ar", duration);
	if (key === "invite.permissions") {
		const names = new PermissionsBitField(BigInt(INVITE_PERMISSIONS))
			.toArray()
			.map((name) => permissionName("ar", name));
		return new Intl.ListFormat("ar").format(names);
	}
	if (key === "welcome.maxBackgroundMb") return `${String(WELCOME_LIMITS.maxBackgroundBytes / (1024 * 1024))} ميغابايت`;
	return FACTS[key];
}

export function fillFacts(text: string, ar = false): string {
	return text.replace(FACT, (whole, key: string) => (ar ? arabicFact(key) : FACTS[key]) ?? whole);
}
