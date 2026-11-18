import { botCopy } from "@config/strings";
import { UserFacingError } from "@core/errors";
import { loopModeName } from "@lib/music/music.constants";
import { type LoopMode } from "@lib/music/music.types";
import { requireVolumeControl } from "@lib/music/musicActions.util";
import { currentTrack, shuffleUpcoming } from "@lib/music/musicQueue.util";
import { type MusicSession } from "@lib/music/musicSession.util";

/** The player's controls, each returning the line the panel shows, so `/music` and the buttons answer alike. */

export function pausePlayer(session: MusicSession): string {
	if (!session.pause()) throw new UserFacingError(botCopy("Nothing is playing.", "لا يُشغَّل أي مقطع الآن."));
	return botCopy("Paused.", "توقّف التشغيل مؤقتًا.");
}

export function resumePlayer(session: MusicSession): string {
	if (!session.resume()) throw new UserFacingError(botCopy("Nothing is paused.", "لا يوجد تشغيل متوقف مؤقتًا."));
	return botCopy("Resumed.", "استؤنف التشغيل.");
}

export function skipTrack(session: MusicSession): string {
	const track = currentTrack(session.queue);
	if (track === null) throw new UserFacingError(botCopy("Nothing is playing.", "لا يُشغَّل أي مقطع الآن."));

	session.skip();
	return botCopy(`Skipped **${track.title}**.`, `تخطّيتُ **${track.title}**.`);
}

export function stopPlayer(session: MusicSession): string {
	session.stop();
	return botCopy("Stopped.", "توقّف التشغيل.");
}

export function loopPlayer(session: MusicSession, mode: LoopMode): string {
	session.setLoop(mode);
	return botCopy(`Loop set to **${mode}**.`, `التكرار: **${loopModeName(mode)}**.`);
}

export function shufflePlayer(session: MusicSession): string {
	session.queue = shuffleUpcoming(session.queue);
	return botCopy("Shuffled the rest of the queue.", "غيّرتُ ترتيب المقاطع المتبقية عشوائيًا.");
}

export function setPlayerVolume(session: MusicSession, percent: number): string {
	requireVolumeControl(session);
	const volume = session.setVolume(percent);
	return botCopy(
		`Volume set to **${String(volume)}%**. It takes a moment to take effect.`,
		`ضبطتُ مستوى الصوت على **${String(volume)}٪**. يسري التغيير بعد لحظات.`,
	);
}
