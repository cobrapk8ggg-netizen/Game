import { randomInt } from "node:crypto";
import { botCopy, usesArabicCopy } from "@config/strings";
import { defineCommand, inTextChannel } from "@core/command";
import { embed, reply } from "@lib/discord";

const SENTENCES = [
	"The quick brown fox jumps over the lazy dog near the riverbank",
	"Typing quickly is far easier than typing accurately under pressure",
	"A well written command is worth a thousand lines of clever code",
	"Every bug you fix today is a support ticket you never receive",
	"Consistency in a codebase beats brilliance in any single file",
	"Reading code carefully is the fastest way to write it correctly",
];

const ARABIC_SENTENCES = [
	"قفز الثعلب البني السريع فوق الكلب الكسول قرب ضفة النهر",
	"الكتابة بسرعة أسهل بكثير من الكتابة بدقة تحت الضغط",
	"أمر واحد مكتوب بعناية خير من ألف سطر معقد",
	"كل خطأ تصلحه اليوم يوفر عليك تذكرة دعم غدا",
	"اتساق الشيفرة كلها أهم من براعة ملف واحد منها",
	"قراءة الشيفرة بتأن أسرع سبيل إلى كتابتها كتابة صحيحة",
];

/** Zero-width spaces stop a copy-paste from matching the prompt exactly. */
function obfuscate(sentence: string): string {
	return usesArabicCopy() ? sentence.replaceAll(" ", " \u200b") : sentence.split("").join("\u200b");
}

export default defineCommand({
	name: "fast-type",
	description: "Race to type a sentence correctly.",
	category: "games",
	guildOnly: true,
	cooldown: 15_000,

	async run(interaction) {
		const channel = inTextChannel(interaction);
		const sentences = usesArabicCopy() ? ARABIC_SENTENCES : SENTENCES;
		const sentence = sentences[randomInt(sentences.length)]!;

		await reply(interaction, {
			embeds: [
				embed({
					category: "games",
					title: botCopy("Fast type", "سباق الكتابة"),
					description: botCopy(
						`Type this sentence exactly. You have 60 seconds.\n\n> ${obfuscate(sentence)}`,
						`اكتب هذه الجملة كما تظهر. أمامك ستون ثانية.\n\n> ${obfuscate(sentence)}`,
					),
				}),
			],
		});

		const startedAt = Date.now();
		const collected = await channel
			.awaitMessages({
				filter: (message) => message.content.trim().toLowerCase() === sentence.toLowerCase(),
				max: 1,
				time: 60_000,
			})
			.catch(() => null);

		const winner = collected?.first();

		if (!winner) {
			await interaction.followUp({
				embeds: [
					embed({
						category: "games",
						title: botCopy("Time is up", "انتهى الوقت"),
						description: botCopy("Nobody managed it.", "لم ينجح أحد في كتابة الجملة."),
					}),
				],
			});
			return;
		}

		const seconds = (Date.now() - startedAt) / 1_000;
		const wpm = Math.round((sentence.split(" ").length / seconds) * 60);

		await interaction.followUp({
			embeds: [
				embed({
					category: "games",
					title: botCopy("We have a winner", "لدينا فائز"),
					description: botCopy(
						`${winner.author} finished in **${seconds.toFixed(2)}s** \u2014 about **${wpm} WPM**.`,
						`عاشت إيدك يا ${winner.author}! أكملت الجملة في **${seconds.toFixed(2)} ث**، بسرعة تقارب **${wpm} كلمة في الدقيقة**.`,
					),
				}),
			],
		});
	},
});
