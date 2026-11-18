import { randomInt } from "node:crypto";
import { botCopy } from "@config/strings";
import { defineCommand, type CommandInput, type Subcommand } from "@core/command";
import { embed, reply } from "@lib/discord";
import { progressBar } from "@lib/format";

interface Meter {
	name: string;
	label: string;
	arabic: string;
	emoji: string;
	description: string;
}

const METERS: Meter[] = [
	{ name: "gay", label: "gay", arabic: "الميول", emoji: "🌈", description: "Shows how gay someone is." },
	{ name: "sus", label: "sus", arabic: "الاشتباه", emoji: "🤨", description: "Shows how sus someone is." },
	{ name: "stupid", label: "stupid", arabic: "الغباء", emoji: "🤓", description: "Shows how stupid someone is." },
	{
		name: "simp",
		label: "of a simp",
		arabic: "التملّق",
		emoji: "🥺",
		description: "Shows how much of a simp someone is.",
	},
	{ name: "drunk", label: "drunk", arabic: "السُّكر", emoji: "🍺", description: "Shows how drunk someone is." },
	{ name: "high", label: "high", arabic: "الانتشاء", emoji: "🍁", description: "Shows how high someone is." },
	{ name: "smart", label: "smart", arabic: "الذكاء", emoji: "🧠", description: "Shows someone's IQ." },
];

async function renderMeter(interaction: CommandInput, meter: Meter): Promise<void> {
	const target = interaction.options.getUser("user") ?? interaction.user;

	if (meter.name === "smart") {
		const iq = randomInt(2, 201);
		const verdict =
			iq >= 120
				? botCopy("a genius 🧠", "نتيجة عبقرية 🧠")
				: iq <= 50
					? botCopy("still learning 📚", "في طور التعلّم 📚")
					: botCopy("perfectly average", "نتيجة متوسطة");
		await reply(interaction, {
			embeds: [
				embed({
					category: "fun",
					title: botCopy(
						`${meter.emoji} How smart is ${target.username}?`,
						`${meter.emoji} اختبار الذكاء الترفيهي: ${target.username}`,
					),
					description: botCopy(
						`${target} has an IQ of **${iq}** — ${verdict}.`,
						`النتيجة العشوائية لـ ${target}: **${iq}** · ${verdict}.`,
					),
				}),
			],
		});
		return;
	}

	const percentage = randomInt(0, 101);
	await reply(interaction, {
		embeds: [
			embed({
				category: "fun",
				title: botCopy(
					`${meter.emoji} How ${meter.label} is ${target.username}?`,
					`${meter.emoji} مقياس ${meter.arabic} الترفيهي: ${target.username}`,
				),
				description: botCopy(
					`${target} is **${percentage}%** ${meter.label}.\n${progressBar(percentage, 100)}`,
					`النسبة العشوائية لـ ${target}: **${percentage}%**.\n${progressBar(percentage, 100)}`,
				),
			}),
		],
	});
}

const subcommands: Subcommand[] = METERS.map((meter) => ({
	name: meter.name,
	description: meter.description,
	options: [{ name: "user", description: "The user to measure.", type: "user" }],
	run: (interaction) => renderMeter(interaction, meter),
}));

export default defineCommand({
	name: "how",
	description: "Calculates how much of something you are. Results are definitely accurate.",
	category: "fun",
	subcommands,
	cooldown: 3_000,

	async run(interaction) {
		const requested = interaction.options.getSubcommand();
		const meter = METERS.find((candidate) => candidate.name === requested) ?? METERS[0]!;
		await renderMeter(interaction, meter);
	},
});
