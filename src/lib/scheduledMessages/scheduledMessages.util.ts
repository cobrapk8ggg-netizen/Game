import { DAY_MS, WEEK_MS } from "@config/constants";
import { botCopy } from "@config/strings";
import { SCHEDULE_REPEATS, type ScheduleRepeat } from "@testify/shared";

/** When a scheduled message posts next, in plain arithmetic so every case is a test rather than a wait. */

export const REPEAT_LABELS: Record<ScheduleRepeat, string> = {
	once: "Once",
	daily: "Every day",
	weekly: "Every week",
};

const REPEAT_LABELS_AR: Record<ScheduleRepeat, string> = {
	once: "مرة واحدة",
	daily: "كل يوم",
	weekly: "كل أسبوع",
};

export function repeatLabel(repeat: ScheduleRepeat): string {
	return botCopy(REPEAT_LABELS[repeat], REPEAT_LABELS_AR[repeat]);
}

const EVERY: Record<Exclude<ScheduleRepeat, "once">, number> = { daily: DAY_MS, weekly: WEEK_MS };

/** The first time after `now` on the post's own rhythm, so posts missed while the bot was away are not sent in a burst. */
export function nextAfter(at: Date, repeat: ScheduleRepeat, now: Date): Date | null {
	if (repeat === "once") return null;

	const step = EVERY[repeat];
	const behind = now.getTime() - at.getTime();
	const steps = behind < 0 ? 1 : Math.floor(behind / step) + 1;
	return new Date(at.getTime() + steps * step);
}

/** The panel's Change button walks through the three in turn. */
export function nextRepeat(repeat: ScheduleRepeat): ScheduleRepeat {
	return SCHEDULE_REPEATS[(SCHEDULE_REPEATS.indexOf(repeat) + 1) % SCHEDULE_REPEATS.length] ?? "once";
}
