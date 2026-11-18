import { randomInt } from "node:crypto";
import { botCopy } from "@config/strings";
import { defineCommand } from "@core/command";
import { embed, reply } from "@lib/discord";

export default defineCommand({
	name: "iq",
	description: "Measures someone's totally scientific IQ.",
	category: "fun",
	cooldown: 3_000,
	options: [{ name: "user", description: "Whose IQ to measure. Defaults to you.", type: "user" }],

	async run(interaction) {
		const target = interaction.options.getUser("user") ?? interaction.user;
		const iq = randomInt(2, 201);
		const verdict =
			iq >= 120
				? botCopy("A genius. 🧠", "هذا الرقم يحتاج كرسيًّا خاصًّا في المختبر! 🧠")
				: iq <= 50
					? botCopy("Keep learning and growing. 📚", "تعلّم شيئًا جديدًا كل يوم. 📚")
					: botCopy("Comfortably average.", "نتيجة متوسطة على هذا المقياس الترفيهي.");

		await reply(interaction, {
			embeds: [
				embed({
					category: "fun",
					title: botCopy("IQ test", "اختبار الذكاء الترفيهي"),
					description: botCopy(
						`${target}'s IQ is **${iq}**.\n${verdict}`,
						`النتيجة العشوائية لـ ${target}: **${iq}**.\n${verdict}`,
					),
					thumbnail: target.displayAvatarURL(),
					footer: botCopy(`Requested by ${interaction.user.username}`, `بطلب من ${interaction.user.username}`),
				}),
			],
		});
	},
});
