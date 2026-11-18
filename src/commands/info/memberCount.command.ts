import QuickChart from "quickchart-js";
import { botCopy } from "@config/strings";
import { defineCommand } from "@core/command";
import { ServiceError, UserFacingError } from "@core/errors";
import { embed, reply } from "@lib/discord";
import { formatNumber } from "@lib/format";
import { readMemberCounts } from "@lib/info";

export default defineCommand({
	name: "member-count",
	description: "Charts the member breakdown for this server.",
	category: "info",
	private: true,
	guildOnly: true,
	cooldown: 10_000,
	options: [
		{
			name: "chart-type",
			description: "How to display the chart.",
			type: "string",
			choices: [
				{ name: "bar", value: "bar" },
				{ name: "pie", value: "pie" },
				{ name: "doughnut", value: "doughnut" },
			],
		},
	],

	async run(interaction) {
		const guild = interaction.guild;
		if (!guild)
			throw new UserFacingError(
				botCopy("This command only works inside a server.", "يعمل هذا الأمر داخل الخوادم فقط."),
			);

		await interaction.deferReply();

		const chartType = interaction.options.getString("chart-type") ?? "bar";
		const { total, people, bots, joinedDay, joinedWeek } = await readMemberCounts(guild);

		const chart = new QuickChart()
			.setConfig({
				type: chartType,
				data: {
					labels: [
						botCopy("Total", "الإجمالي"),
						botCopy("People", "الأعضاء"),
						botCopy("Bots", "البوتات"),
						botCopy("Joined 24h", "المنضمون خلال 24 ساعة"),
						botCopy("Joined 7d", "المنضمون خلال 7 أيام"),
					],
					datasets: [
						{
							label: botCopy("Members", "عدد الأعضاء"),
							data: [total, people, bots, joinedDay, joinedWeek],
							backgroundColor: ["#36a2eb", "#ffce56", "#ff6384", "#cc65fe", "#66ff99"],
						},
					],
				},
				options: { plugins: { title: { display: true, text: guild.name } } },
			})
			.setWidth(600)
			.setHeight(340)
			.setBackgroundColor("#151515");

		let url: string;
		try {
			url = await chart.getShortUrl();
		} catch (error) {
			throw new ServiceError("quickchart", error);
		}

		await reply(interaction, {
			embeds: [
				embed({
					category: "info",
					title: botCopy(`Member count for ${guild.name}`, `عدد الأعضاء في ${guild.name}`),
					description: [
						botCopy(`**Total** ${formatNumber(total)}`, `**الإجمالي** ${formatNumber(total)}`),
						botCopy(`**People** ${formatNumber(people)}`, `**الأعضاء** ${formatNumber(people)}`),
						botCopy(`**Bots** ${formatNumber(bots)}`, `**البوتات** ${formatNumber(bots)}`),
						botCopy(
							`**Joined in the last 24h** ${formatNumber(joinedDay)}`,
							`**المنضمون خلال آخر 24 ساعة** ${formatNumber(joinedDay)}`,
						),
						botCopy(
							`**Joined in the last 7 days** ${formatNumber(joinedWeek)}`,
							`**المنضمون خلال آخر 7 أيام** ${formatNumber(joinedWeek)}`,
						),
					].join("\n"),
					image: url,
				}),
			],
		});
	},
});
