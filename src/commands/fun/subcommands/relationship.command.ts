import { createHash } from "node:crypto";
import { botCopy } from "@config/strings";
import { defineCommand } from "@core/command";
import { UserFacingError } from "@core/errors";
import { embed, reply } from "@lib/discord";
import { progressBar } from "@lib/format";

function compatibility(firstId: string, secondId: string): number {
	const key = [firstId, secondId].sort().join(":");
	const digest = createHash("sha256").update(key).digest();
	return digest[0]! % 101;
}

function verdict(score: number): string {
	if (score >= 90) return botCopy("A perfect match. 💞", "توافق تام! حتى البوت صفّگ لكم. 💞");
	if (score >= 70) return botCopy("There is real potential here. 💖", "بينكما توافق واعد. 💖");
	if (score >= 50) return botCopy("Could work with some effort. 💗", "قد تنجح العلاقة بشيء من التفاهم. 💗");
	if (score >= 30) return botCopy("It would be complicated. 💔", "قد يكون التفاهم صعبًا. 💔");
	return botCopy("Best left as friends. 🙃", "الصداقة خيار جميل أيضًا. 🙃");
}

export default defineCommand({
	name: "relationship",
	description: "Checks the compatibility between two people.",
	category: "fun",
	guildOnly: true,
	cooldown: 5_000,
	options: [
		{ name: "first", description: "The first person.", type: "user", required: true },
		{ name: "second", description: "The second person. Defaults to you.", type: "user" },
	],

	async run(interaction) {
		const first = interaction.options.getUser("first", true);
		const second = interaction.options.getUser("second") ?? interaction.user;

		if (first.id === second.id) throw new UserFacingError(botCopy("Pick two different people.", "اختر شخصين مختلفين."));

		const score = compatibility(first.id, second.id);

		await reply(interaction, {
			embeds: [
				embed({
					category: "fun",
					title: botCopy("💘 Compatibility check", "💘 مقياس التوافق الترفيهي"),
					description: [
						`**${first.displayName}** 💞 **${second.displayName}**`,
						"",
						`${progressBar(score, 100)} **${score}%**`,
						"",
						verdict(score),
					].join("\n"),
					thumbnail: first.displayAvatarURL(),
				}),
			],
		});
	},
});
